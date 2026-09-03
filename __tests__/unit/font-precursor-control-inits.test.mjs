import {test} from 'node:test';
import assert from 'node:assert/strict';
import {controlInitsFromControls} from '../../app/scripts/prototypo.js/precursor/control-inits.ts';

test('control inits are collected from template controls', () => {
	const inits = controlInitsFromControls([
		{
			parameters: [
				{name: 'thickness', init: 80},
				{name: 'slant', init: 0},
			],
		},
	]);

	assert.equal(inits.thickness, 80);
	assert.equal(inits.slant, 0);
});

test('missing controls yield an empty init map', () => {
	assert.deepEqual(controlInitsFromControls(), {});
	assert.deepEqual(controlInitsFromControls(undefined), {});
});
