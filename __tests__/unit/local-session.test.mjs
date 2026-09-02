import {beforeEach, test} from 'node:test';
import assert from 'node:assert/strict';

const memory = new Map();

globalThis.window = {
	localStorage: {
		getItem(key) {
			return memory.has(key) ? memory.get(key) : null;
		},
		setItem(key, value) {
			memory.set(key, String(value));
		},
		removeItem(key) {
			memory.delete(key);
		},
	},
};

const {
	LOCAL_TOKEN,
	ensureLocalSession,
	executeLocalQuery,
} = await import('../../app/scripts/services/local-api.js');

beforeEach(() => {
	memory.clear();
});

test('ensureLocalSession writes the local token and seeds the DB', () => {
	ensureLocalSession();

	assert.equal(window.localStorage.getItem('graphcoolToken'), LOCAL_TOKEN);
	const db = JSON.parse(window.localStorage.getItem('prototypo-local-db'));
	assert.equal(db.user.id, 'local-user');
});

test('authenticateEmailUser returns the local token', () => {
	ensureLocalSession();
	const data = executeLocalQuery(
		'mutation { authenticateEmailUser { token } }',
	);

	assert.equal(data.authenticateEmailUser.token, LOCAL_TOKEN);
});

test('createFamily persists and shows up on user.library', () => {
	ensureLocalSession();
	executeLocalQuery(
		`mutation {
			createFamily(name: "SpecGrotesk", template: "venus.ptf") {
				id
				name
				template
			}
		}`,
	);

	const data = executeLocalQuery(
		`query {
			user {
				library {
					name
					template
				}
			}
		}`,
	);

	assert.equal(data.user.library.length, 1);
	assert.equal(data.user.library[0].name, 'SpecGrotesk');
	assert.equal(data.user.library[0].template, 'venus.ptf');
});
