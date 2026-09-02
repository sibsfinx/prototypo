import gql from 'graphql-tag';

const STORAGE_KEY = 'prototypo-local-db';

export const LOCAL_TOKEN = 'local-prototypo-token';

function now() {
	return new Date().toISOString();
}

function uid(prefix = 'id') {
	return `${prefix}_${Date.now().toString(36)}_${Math.random()
		.toString(36)
		.slice(2, 10)}`;
}

function seedDb() {
	return {
		user: {
			id: 'local-user',
			email: 'local@prototypo.local',
			firstName: 'Local',
			lastName: 'Designer',
			stripe: null,
			manager: null,
			appValues: {},
			firstContactMade: true,
			academyProgress: {},
			academyCompleted: false,
			libraryAccessToken: 'local-library-token',
			libraryIds: [],
			favouriteIds: [],
			fontInUses: [],
			hostedDomains: [],
		},
		families: {},
		variants: {},
		abstractedFonts: {},
		presets: [],
	};
}

function loadDb() {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);

		if (raw) {
			return JSON.parse(raw);
		}
	}
	catch (err) {
		console.warn('Failed to read local Prototypo DB, reseeding', err);
	}

	const db = seedDb();

	saveDb(db);
	return db;
}

function saveDb(db) {
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function valueFromAST(node, variables = {}) {
	if (!node) {
		return undefined;
	}

	switch (node.kind) {
	case 'Variable':
		return variables[node.name.value];
	case 'IntValue':
		return parseInt(node.value, 10);
	case 'FloatValue':
		return parseFloat(node.value);
	case 'StringValue':
		return node.value;
	case 'BooleanValue':
		return node.value;
	case 'NullValue':
		return null;
	case 'EnumValue':
		return node.value;
	case 'ListValue':
		return node.values.map(value => valueFromAST(value, variables));
	case 'ObjectValue': {
		const obj = {};

		node.fields.forEach((field) => {
			obj[field.name.value] = valueFromAST(field.value, variables);
		});
		return obj;
	}
	default:
		return undefined;
	}
}

function getArgs(field, variables) {
	const args = {};

	(field.arguments || []).forEach((arg) => {
		args[arg.name.value] = valueFromAST(arg.value, variables);
	});
	return args;
}

function getOperation(query) {
	return (query.definitions || []).find(
		definition => definition.kind === 'OperationDefinition',
	);
}

function hydrateAbstracted(db, abstracted) {
	if (!abstracted) {
		return null;
	}

	return {
		...abstracted,
		__typename: 'AbstractedFont',
		preset: abstracted.presetId
			? db.presets.find(preset => preset.id === abstracted.presetId) || {
				id: abstracted.presetId,
			  }
			: null,
		variant: abstracted.variantId
			? hydrateVariant(db, db.variants[abstracted.variantId])
			: null,
	};
}

function hydrateVariant(db, variant) {
	if (!variant) {
		return null;
	}

	const family = db.families[variant.familyId];

	return {
		...variant,
		__typename: 'Variant',
		family: family
			? {
				id: family.id,
				name: family.name,
				template: family.template,
				__typename: 'Family',
			  }
			: null,
		abstractedFont: variant.abstractedFontId
			? hydrateAbstracted(db, db.abstractedFonts[variant.abstractedFontId])
			: null,
	};
}

function hydrateFamily(db, family) {
	if (!family) {
		return null;
	}

	const variants = (family.variantIds || [])
		.map(id => hydrateVariant(db, db.variants[id]))
		.filter(Boolean);

	return {
		...family,
		__typename: 'Family',
		variants,
		from: family.fromId
			? hydrateAbstracted(db, db.abstractedFonts[family.fromId])
			: null,
		_variantsMeta: {count: variants.length},
		_variantsmeta: {count: variants.length},
	};
}

function hydrateUser(db) {
	const {user} = db;
	const library = (user.libraryIds || [])
		.map(id => hydrateFamily(db, db.families[id]))
		.filter(Boolean);

	return {
		...user,
		__typename: 'User',
		library,
		libraryMeta: {count: library.length},
		_libraryMeta: {count: library.length},
		favourites: (user.favouriteIds || [])
			.map(id => hydrateAbstracted(db, db.abstractedFonts[id]))
			.filter(Boolean),
		manager: null,
		values: user.appValues,
		academyProgress: user.academyProgress || {},
		academyCompleted: !!user.academyCompleted,
	};
}

function createVariantRecord(db, familyId, input = {}) {
	const id = uid('variant');
	const variant = {
		id,
		familyId,
		name: input.name || 'Regular',
		values: input.values || {},
		width: input.width || 'normal',
		weight: input.weight || 400,
		italic: !!input.italic,
		updatedAt: now(),
		abstractedFontId: input.abstractedFontId || null,
	};

	db.variants[id] = variant;
	return variant;
}

function createFamilyRecord(db, args = {}) {
	const id = uid('family');
	const family = {
		id,
		name: args.name,
		template: args.template,
		ownerId: args.ownerId || db.user.id,
		designer: args.designer || '',
		designerUrl: args.designerUrl || '',
		foundry: args.foundry || 'Prototypo',
		foundryUrl: args.foundryUrl || 'https://prototypo.io/',
		tags: args.tags || [],
		fromId: args.fromId || args.abstractedFontId || null,
		variantIds: [],
		updatedAt: now(),
	};

	const nestedVariants
		= args.variants && args.variants.length
			? args.variants
			: [{name: 'Regular', width: 'normal', weight: 400, italic: false}];

	nestedVariants.forEach((input) => {
		const variant = createVariantRecord(db, id, input);

		family.variantIds.push(variant.id);
	});

	db.families[id] = family;
	if (!db.user.libraryIds.includes(id)) {
		db.user.libraryIds.push(id);
	}

	return family;
}

function matchesFilter(item, filter) {
	if (!filter) {
		return true;
	}

	return Object.keys(filter).every((key) => {
		const expected = filter[key];

		if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
			return matchesFilter(item[key] || {}, expected);
		}

		return item[key] === expected;
	});
}

const rootResolvers = {
	user() {
		return hydrateUser(loadDb());
	},
	Variant(_, args) {
		const db = loadDb();

		return hydrateVariant(db, db.variants[args.id]);
	},
	allPresets(_, args) {
		const db = loadDb();

		return db.presets.filter(preset => matchesFilter(preset, args.filter));
	},
	allAbstractedFonts(_, args) {
		const db = loadDb();
		const fonts = Object.values(db.abstractedFonts);

		return fonts
			.filter(font => matchesFilter(font, args.filter || args.where))
			.map(font => hydrateAbstracted(db, font));
	},
	createFamily(_, args) {
		const db = loadDb();
		const family = createFamilyRecord(db, args);

		saveDb(db);
		return hydrateFamily(db, family);
	},
	createVariant(_, args) {
		const db = loadDb();
		const family = db.families[args.familyId];

		if (!family) {
			throw new Error('Family not found');
		}

		const variant = createVariantRecord(db, family.id, args);

		family.variantIds.push(variant.id);
		family.updatedAt = now();
		saveDb(db);
		return hydrateVariant(db, variant);
	},
	updateVariant(_, args) {
		const db = loadDb();
		const variant = db.variants[args.id];

		if (!variant) {
			throw new Error('Variant not found');
		}

		Object.keys(args).forEach((key) => {
			if (key !== 'id' && args[key] !== undefined) {
				variant[key] = args[key];
			}
		});
		variant.updatedAt = now();
		saveDb(db);
		return hydrateVariant(db, variant);
	},
	updateFamily(_, args) {
		const db = loadDb();
		const family = db.families[args.id];

		if (!family) {
			throw new Error('Family not found');
		}

		Object.keys(args).forEach((key) => {
			if (key !== 'id' && args[key] !== undefined) {
				family[key] = args[key];
			}
		});
		family.updatedAt = now();
		saveDb(db);
		return hydrateFamily(db, family);
	},
	deleteVariant(_, args) {
		const db = loadDb();
		const variant = db.variants[args.id];

		if (!variant) {
			return {id: args.id};
		}

		const family = db.families[variant.familyId];

		if (family) {
			family.variantIds = family.variantIds.filter(id => id !== args.id);
		}
		delete db.variants[args.id];
		saveDb(db);
		return {id: args.id};
	},
	deleteFamily(_, args) {
		const db = loadDb();
		const family = db.families[args.id];

		if (family) {
			(family.variantIds || []).forEach((id) => {
				delete db.variants[id];
			});
			delete db.families[args.id];
			db.user.libraryIds = db.user.libraryIds.filter(id => id !== args.id);
			saveDb(db);
		}

		return {id: args.id};
	},
	updateUser(_, args) {
		const db = loadDb();

		Object.keys(args).forEach((key) => {
			if (key === 'id') {
				return;
			}
			if (key === 'appValues' || key === 'values') {
				db.user.appValues = args[key];
				return;
			}
			db.user[key] = args[key];
		});
		saveDb(db);
		return hydrateUser(db);
	},
	createAbstractedFont(_, args) {
		const db = loadDb();
		const abstracted = {
			id: uid('abs'),
			type: args.type,
			name: args.name,
			template: args.template || null,
			variantId: args.variantId || null,
			presetId: args.presetId || null,
			updatedAt: now(),
		};

		db.abstractedFonts[abstracted.id] = abstracted;
		(args.usersIds || []).forEach(() => {
			if (!db.user.favouriteIds.includes(abstracted.id)) {
				db.user.favouriteIds.push(abstracted.id);
			}
		});
		saveDb(db);
		return hydrateAbstracted(db, abstracted);
	},
	addToUserOnAbstractedFont(_, args) {
		const db = loadDb();
		const abstracted = db.abstractedFonts[args.favouritesAbstractedFontId];

		if (abstracted && !db.user.favouriteIds.includes(abstracted.id)) {
			db.user.favouriteIds.push(abstracted.id);
			saveDb(db);
		}

		return {
			favouritesAbstractedFont: hydrateAbstracted(db, abstracted),
		};
	},
	removeFromUserOnAbstractedFont(_, args) {
		const db = loadDb();
		const abstractedId = args.favouritesAbstractedFontId;

		db.user.favouriteIds = db.user.favouriteIds.filter(
			id => id !== abstractedId,
		);
		saveDb(db);
		return {
			favouritesAbstractedFont: {id: abstractedId},
		};
	},
	authenticateEmailUser() {
		return {token: LOCAL_TOKEN};
	},
	signupEmailUser() {
		const db = loadDb();

		return {id: db.user.id};
	},
};

export function executeLocalQuery(queryDoc, variables = {}) {
	const query = typeof queryDoc === 'string' ? gql(queryDoc) : queryDoc;
	const operation = getOperation(query);

	if (!operation) {
		return {};
	}

	const data = {};

	operation.selectionSet.selections.forEach((field) => {
		if (field.kind !== 'Field') {
			return;
		}

		const name = field.name.value;
		const alias = field.alias ? field.alias.value : name;
		const resolver = rootResolvers[name];

		if (!resolver) {
			console.warn(`[local-api] No resolver for GraphQL field "${name}"`);
			data[alias] = name.startsWith('all') ? [] : null;
			return;
		}

		data[alias] = resolver(name, getArgs(field, variables));
	});

	return data;
}

export function ensureLocalSession() {
	if (!window.localStorage.getItem('graphcoolToken')) {
		window.localStorage.setItem('graphcoolToken', LOCAL_TOKEN);
	}

	loadDb();
}
