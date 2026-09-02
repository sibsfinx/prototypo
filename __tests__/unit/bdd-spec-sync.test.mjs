import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function specScenarios(markdown) {
	return [...markdown.matchAll(/^#### Scenario: (.+)$/gm)].map((match) =>
		match[1].trim(),
	);
}

function featureScenarios(feature) {
	return [...feature.matchAll(/^\s*Scenario(?: Outline)?: (.+)$/gm)].map(
		(match) => match[1].trim(),
	);
}

test('Gherkin features execute every user-visible create-and-tune scenario', () => {
	const spec = readFileSync(
		join(
			root,
			'openspec/changes/create-and-tune-font/specs/create-and-tune/spec.md',
		),
		'utf8',
	);
	const feature = readFileSync(
		join(root, 'features/create-and-tune.feature'),
		'utf8',
	);

	const inSpec = specScenarios(spec);
	const inFeature = featureScenarios(feature);
	const browserScenarios = inSpec.filter(
		(name) => name !== 'BDD suite covers create-and-tune',
	);

	assert.deepEqual(inFeature, browserScenarios);

	const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
	assert.equal(typeof pkg.scripts['test:bdd'], 'string');
	assert.match(pkg.scripts['test:bdd'], /bddgen|playwright/);

	const main = readFileSync(join(root, 'app/scripts/main.js'), 'utf8');
	assert.doesNotMatch(
		main,
		/await FontMediator\.init/,
		'Library boot must not wait on font workers; CI otherwise never paints templates',
	);
});
