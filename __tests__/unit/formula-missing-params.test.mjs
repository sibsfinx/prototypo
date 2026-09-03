import {test} from 'node:test';
import assert from 'node:assert/strict';
import Formula from '../../app/scripts/prototypo.js/precursor/Formula.js';

function makeFormula() {
	return new Formula(
		{
			_parameters: ['thickness', 'slant'],
			_operation: 'thickness + slant',
			_dependencies: [],
		},
		'test.cursor',
	);
}

test('missing Formula params evaluate as zero', () => {
	const formula = makeFormula();

	assert.equal(formula.getResult({}), 0);
});

test('NaN Formula params evaluate as zero', () => {
	const formula = makeFormula();

	assert.equal(formula.getResult({thickness: Number.NaN, slant: 5}), 5);
});

test('numeric Formula params are used as given', () => {
	const formula = makeFormula();

	assert.equal(formula.getResult({thickness: 10, slant: 2}), 12);
});
