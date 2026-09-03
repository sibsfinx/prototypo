import _difference from 'lodash/difference';
import _get from 'lodash/get';
import _uniq from 'lodash/uniq';
import _reduce from 'lodash/reduce';
import _find from 'lodash/find';
import _keys from 'lodash/keys';

interface FormulaDefinition {
	_parameters?: string[];
	_operation: string | (() => unknown);
	_dependencies: string[];
}

interface ExpandOperation {
	action: 'expand';
	cursor: string;
}

type OperationOrderEntry = string | ExpandOperation;

interface GlyphLike {
	name: {value: string};
	getFromXPath(xpath: string): Formula & {
		expandedTo?: unknown;
		solveOperationOrder(
			glyph: GlyphLike,
			operationOrder: OperationOrderEntry[],
		): OperationOrderEntry[];
	};
}

type FormulaOperation = (
	contours: Record<string, unknown>,
	anchors: unknown,
	parentAnchors: unknown,
	utils: unknown,
	...paramValues: number[]
) => unknown;

export default class Formula {
	cursor: string;

	dependencies: string[];

	operation: FormulaOperation;

	parameters: string[];

	analyzing: boolean;

	constructor(formula: FormulaDefinition, cursor: string) {
		this.cursor = cursor;
		this.dependencies = formula._dependencies;
		/* eslint-disable no-new-func */
		const operationSource =
			(typeof formula._operation === 'string'
			&& formula._operation.indexOf('return ') === -1
				? 'return '
				: '')
				// The operation might be wrapped in a function (e.g. multi-
				// line code for debugging purpose). In this case, return
				// must be explicit
				+ formula._operation
					.toString()
					// [\s\S] need to be used instead of . because
					// javascript doesn't have a dotall flag (s)
					.replace(/^function\s*\(\)\s*\{([\s\S]*?)\}$/, '$1')
					.trim();

		this.operation = new Function(
			...['contours', 'anchors', 'parentAnchors', 'Utils']
				.concat(formula._parameters || [])
				.concat(operationSource),
		) as FormulaOperation;
		/* eslint-enable no-new-func */
		this.parameters = formula._parameters || [];
		this.analyzing = false;
	}

	analyzeDependency(glyph: GlyphLike, graph: string[] = []): void {
		graph.push(this.cursor);
		if (this.analyzing) {
			throw new Error(`There is a circular dependency for glyph ${
				glyph.name.value
			} following the subsequent graph:
${graph.join(' => ')}
`);
		}

		this.analyzing = true;
		this.dependencies.forEach((dependency) => {
			try {
				if (dependency.indexOf('parentAnchors') === -1) {
					const formula = glyph.getFromXPath(dependency);

					formula.analyzeDependency(glyph, graph);
				}
			}
			catch (e) {
				const message = e instanceof Error ? e.message : String(e);

				throw new Error(`There was an error while checking glyph ${glyph.name.value} dependencies for cursor: ${dependency}.
					${message}`);
			}
			graph.pop();
		});
		this.analyzing = false;
	}

	getResult(
		parameters: Record<string, unknown>,
		contours: Record<string, unknown>,
		anchors: unknown,
		parentAnchors: unknown,
		utils: unknown,
	): unknown {
		/* #if dev */
		const missingParam = _difference(this.parameters, _keys(parameters));

		if (missingParam.length > 0) {
			console.error(`parameters are missing: ${missingParam}`); // eslint-disable-line no-console
		}
		/* #end */
		const args: unknown[] = [contours, anchors, parentAnchors, utils];

		for (let i = 0; i < this.parameters.length; i++) {
			const name = this.parameters[i];
			const value = parameters[name];

			args.push(typeof value === 'number' && !Number.isNaN(value) ? value : 0);
		}

		const result = this.operation.apply(
			this,
			args as Parameters<FormulaOperation>,
		);

		if (typeof result === 'number' && isNaN(result)) {
			/* eslint-disable no-console */
			console.error(`Operation returned NaN
operation is:
${this.operation.toString()}
parameters value are:
${this.parameters.map(name => `${name}: ${parameters[name]}`)}
cursor used are:
${this.dependencies.map(name => `${name}: ${_get(contours, name)}`)}`);
			/* eslint-enable no-console */
		}

		return result;
	}

	solveOperationOrder(
		glyph: GlyphLike,
		operationOrder: OperationOrderEntry[],
	): OperationOrderEntry[] {
		const result: OperationOrderEntry[] = [];
		const operationsToSolve = _difference(
			_uniq(this.dependencies),
			operationOrder as string[],
		) as string[];

		if (operationsToSolve.length > 0) {
			result.push(
				..._reduce(
					operationsToSolve,
					(acc: OperationOrderEntry[], xpath: string) => {
						const expandedIndex = xpath.indexOf('expandedTo');
						const processedOps = [...operationOrder, ...result, ...acc];

						// We don't have to compute dependcy on parentAnchors they are not
						// our responsability and should be provided by parent
						if (xpath.indexOf('parentAnchors') !== -1) {
							return acc;
						}

						if (xpath.match(/handle(Out|In)/)) {
							const contourPath = xpath
								.split('.')
								.slice(0, 2)
								.join('.');
							const contour = glyph.getFromXPath(contourPath);

							acc.push(
								...contour.solveOperationOrder(glyph, [...processedOps]),
							);
						}
						else if (expandedIndex !== -1) {
							/* eslint-disable no-negated-condition, max-depth */
							const base = xpath.substr(0, expandedIndex - 1);
							const node = glyph.getFromXPath(`${base}`);

							if (node.expandedTo) {
								if (process.env.TESTING_FONT === 'yes') {
									if (!glyph.getFromXPath(xpath)) {
										console.log(`${glyph.name.value} on cursor ${xpath}`); // eslint-disable-line no-console
									}
								}
								acc.push(
									...glyph
										.getFromXPath(xpath)
										.solveOperationOrder(glyph, [...processedOps]),
								);
							}
							else {
								if (process.env.TESTING_FONT === 'yes') {
									if (
										!glyph.getFromXPath(`${base}.expand.width`)
										|| !glyph.getFromXPath(`${base}.expand.distr`)
										|| !glyph.getFromXPath(`${base}.expand.angle`)
										|| !glyph.getFromXPath(`${base}.x`)
										|| !glyph.getFromXPath(`${base}.y`)
									) {
										console.log(`${glyph.name.value} on cursor ${base}`); // eslint-disable-line no-console
									}
								}
								const expandResult = glyph
									.getFromXPath(`${base}.expand.width`)
									.solveOperationOrder(glyph, processedOps);

								expandResult.push(
									...glyph
										.getFromXPath(`${base}.expand.distr`)
										.solveOperationOrder(glyph, [
											...processedOps,
											...expandResult,
										]),
								);
								expandResult.push(
									...glyph
										.getFromXPath(`${base}.expand.angle`)
										.solveOperationOrder(glyph, [
											...processedOps,
											...expandResult,
										]),
								);
								expandResult.push(
									...glyph
										.getFromXPath(`${base}.x`)
										.solveOperationOrder(glyph, [
											...processedOps,
											...expandResult,
										]),
								);
								expandResult.push(
									...glyph
										.getFromXPath(`${base}.y`)
										.solveOperationOrder(glyph, [
											...processedOps,
											...expandResult,
										]),
								);

								const opToAdd: ExpandOperation = {
									action: 'expand',
									cursor: base,
								};

								if (!_find([...processedOps, ...expandResult], opToAdd)) {
									expandResult.push(opToAdd);
								}

								acc.push(...expandResult);
							}
						}
						else {
							/* eslint-disable no-negated-condition, max-depth */
							acc.push(
								...glyph
									.getFromXPath(xpath)
									.solveOperationOrder(glyph, processedOps),
							);
						}

						return acc;
					},
					[],
				),
			);
		}

		if ([...operationOrder, ...result].indexOf(this.cursor) === -1) {
			result.push(this.cursor);
		}
		return result;
	}
}
