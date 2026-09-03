import {mkdtempSync, rmSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';
import {describe, it, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {
	listTemplates,
	getControls,
	createFamily,
	listFamilies,
	getVariantValues,
	setParam,
} from '../../mcp/lib.mjs';

describe('prototypo MCP handlers', () => {
	let dbPath;
	let dir;

	before(() => {
		dir = mkdtempSync(join(tmpdir(), 'prototypo-mcp-'));
		dbPath = join(dir, 'db.json');
	});

	after(() => {
		rmSync(dir, {recursive: true, force: true});
	});

	it('lists the five library templates', () => {
		const templates = listTemplates();
		assert.equal(templates.length, 5);
		assert.ok(templates.every((t) => t.templateName.endsWith('.ptf')));
		assert.ok(templates.some((t) => t.name === 'Prototypo Grotesk'));
	});

	it('reads Width and Slant controls from Grotesk', () => {
		const {parameters} = getControls('venus.ptf');
		const width = parameters.find((p) => p.name === 'width');
		const slant = parameters.find((p) => p.name === 'slant');
		assert.equal(width.label, 'Width');
		assert.equal(width.init, 1);
		assert.equal(slant.label, 'Slant');
		assert.equal(slant.init, 0);
	});

	it('creates a family and updates a param', () => {
		const {family, variant} = createFamily(
			{name: 'TuneMe', templateName: 'venus.ptf'},
			dbPath,
		);
		assert.equal(family.name, 'TuneMe');
		assert.equal(family.template, 'venus.ptf');
		assert.equal(variant.values.width, 1);
		assert.equal(variant.values.slant, 0);

		const families = listFamilies(dbPath);
		assert.equal(families.length, 1);
		assert.equal(families[0].name, 'TuneMe');

		const updated = setParam(
			{variantId: variant.id, name: 'width', value: 1.21},
			dbPath,
		);
		assert.equal(updated.values.width, 1.21);
		assert.equal(getVariantValues(variant.id, dbPath).values.slant, 0);
	});

	it('rejects unknown templates', () => {
		assert.throws(
			() => createFamily({name: 'x', templateName: 'nope.ptf'}, dbPath),
			/Unknown templateName/,
		);
		assert.throws(
			() => getControls('../../../tmp/proto-traversal-poc'),
			/Unknown templateName/,
		);
	});

	it('rejects unknown params', () => {
		const {variant} = createFamily(
			{name: 'ParamGuard', templateName: 'venus.ptf'},
			dbPath,
		);
		assert.throws(
			() =>
				setParam(
					{variantId: variant.id, name: 'notARealParam', value: 99},
					dbPath,
				),
			/Unknown param/,
		);
		assert.equal(getVariantValues(variant.id, dbPath).values.notARealParam, undefined);
	});
});
