import gql from 'graphql-tag';

const STORAGE_KEY = 'prototypo-local-db';

export const LOCAL_TOKEN = 'local-prototypo-token';

interface Preset {
	id: string;
	[key: string]: unknown;
}

interface AbstractedFont {
	id: string;
	type?: string;
	name?: string;
	template?: string | null;
	variantId?: string | null;
	presetId?: string | null;
	updatedAt?: string;
	[key: string]: unknown;
}

interface Variant {
	id: string;
	familyId: string;
	name: string;
	values: Record<string, unknown>;
	width: string;
	weight: number;
	italic: boolean;
	updatedAt: string;
	abstractedFontId: string | null;
	[key: string]: unknown;
}

interface Family {
	id: string;
	name: string;
	template: string;
	ownerId: string;
	designer: string;
	designerUrl: string;
	foundry: string;
	foundryUrl: string;
	tags: string[];
	fromId: string | null;
	variantIds: string[];
	updatedAt: string;
	[key: string]: unknown;
}

interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	stripe: null;
	manager: null;
	appValues: Record<string, unknown>;
	firstContactMade: boolean;
	academyProgress: Record<string, unknown>;
	academyCompleted: boolean;
	libraryAccessToken: string;
	libraryIds: string[];
	favouriteIds: string[];
	fontInUses: unknown[];
	hostedDomains: unknown[];
	[key: string]: unknown;
}

interface LocalDb {
	user: User;
	families: Record<string, Family>;
	variants: Record<string, Variant>;
	abstractedFonts: Record<string, AbstractedFont>;
	presets: Preset[];
}

interface GraphQLValueNode {
	kind: string;
	name?: {value: string};
	value?: string | number | boolean;
	values?: GraphQLValueNode[];
	fields?: Array<{name: {value: string}; value: GraphQLValueNode}>;
}

interface GraphQLArgument {
	name: {value: string};
	value: GraphQLValueNode;
}

interface GraphQLField {
	kind: string;
	name: {value: string};
	alias?: {value: string};
	arguments?: GraphQLArgument[];
}

interface GraphQLOperationDefinition {
	kind: 'OperationDefinition';
	selectionSet: {
		selections: GraphQLField[];
	};
}

interface GraphQLDocument {
	definitions: Array<GraphQLOperationDefinition | {kind: string}>;
}

type ResolverArgs = Record<string, unknown>;
type ResolverResult = unknown;
type RootResolver = (
	_parent: unknown,
	args: ResolverArgs,
) => ResolverResult;

function now(): string {
	return new Date().toISOString();
}

function uid(prefix = 'id'): string {
	return `${prefix}_${Date.now().toString(36)}_${Math.random()
		.toString(36)
		.slice(2, 10)}`;
}

function seedDb(): LocalDb {
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

function loadDb(): LocalDb {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);

		if (raw) {
			return JSON.parse(raw) as LocalDb;
		}
	}
	catch (err) {
		console.warn('Failed to read local Prototypo DB, reseeding', err);
	}

	const db = seedDb();

	saveDb(db);
	return db;
}

function saveDb(db: LocalDb): void {
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function valueFromAST(
	node: GraphQLValueNode | undefined,
	variables: Record<string, unknown> = {},
): unknown {
	if (!node) {
		return undefined;
	}

	switch (node.kind) {
	case 'Variable':
		return variables[node.name?.value ?? ''];
	case 'IntValue':
		return parseInt(String(node.value), 10);
	case 'FloatValue':
		return parseFloat(String(node.value));
	case 'StringValue':
		return node.value;
	case 'BooleanValue':
		return node.value;
	case 'NullValue':
		return null;
	case 'EnumValue':
		return node.value;
	case 'ListValue':
		return (node.values || []).map(value => valueFromAST(value, variables));
	case 'ObjectValue': {
		const obj: Record<string, unknown> = {};

		(node.fields || []).forEach((field) => {
			obj[field.name.value] = valueFromAST(field.value, variables);
		});
		return obj;
	}
	default:
		return undefined;
	}
}

function getArgs(
	field: GraphQLField,
	variables: Record<string, unknown>,
): ResolverArgs {
	const args: ResolverArgs = {};

	(field.arguments || []).forEach((arg) => {
		args[arg.name.value] = valueFromAST(arg.value, variables);
	});
	return args;
}

function getOperation(query: GraphQLDocument): GraphQLOperationDefinition | undefined {
	return query.definitions.find(
		(definition): definition is GraphQLOperationDefinition =>
			definition.kind === 'OperationDefinition',
	);
}

function hydrateAbstracted(
	db: LocalDb,
	abstracted: AbstractedFont | null | undefined,
): Record<string, unknown> | null {
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

function hydrateVariant(
	db: LocalDb,
	variant: Variant | null | undefined,
): Record<string, unknown> | null {
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

function hydrateFamily(
	db: LocalDb,
	family: Family | null | undefined,
): Record<string, unknown> | null {
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

function hydrateUser(db: LocalDb): Record<string, unknown> {
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

interface VariantInput {
	name?: string;
	values?: Record<string, unknown>;
	width?: string;
	weight?: number;
	italic?: boolean;
	abstractedFontId?: string | null;
}

function createVariantRecord(
	db: LocalDb,
	familyId: string,
	input: VariantInput = {},
): Variant {
	const id = uid('variant');
	const variant: Variant = {
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

interface FamilyInput extends ResolverArgs {
	name?: string;
	template?: string;
	ownerId?: string;
	designer?: string;
	designerUrl?: string;
	foundry?: string;
	foundryUrl?: string;
	tags?: string[];
	fromId?: string | null;
	abstractedFontId?: string | null;
	variants?: VariantInput[];
}

function createFamilyRecord(db: LocalDb, args: FamilyInput = {}): Family {
	const id = uid('family');
	const family: Family = {
		id,
		name: args.name || '',
		template: args.template || '',
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

function matchesFilter(
	item: Record<string, unknown>,
	filter: Record<string, unknown> | undefined,
): boolean {
	if (!filter) {
		return true;
	}

	return Object.keys(filter).every((key) => {
		const expected = filter[key];
		const itemValue = item[key];

		if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
			return matchesFilter(
				(itemValue as Record<string, unknown>) || {},
				expected as Record<string, unknown>,
			);
		}

		return itemValue === expected;
	});
}

const rootResolvers: Record<string, RootResolver> = {
	user() {
		return hydrateUser(loadDb());
	},
	Variant(_parent, args) {
		const db = loadDb();

		return hydrateVariant(db, db.variants[args.id as string]);
	},
	allPresets(_parent, args) {
		const db = loadDb();

		return db.presets.filter(preset =>
			matchesFilter(preset, args.filter as Record<string, unknown>),
		);
	},
	allAbstractedFonts(_parent, args) {
		const db = loadDb();
		const fonts = Object.values(db.abstractedFonts);

		return fonts
			.filter(font =>
				matchesFilter(
					font,
					(args.filter || args.where) as Record<string, unknown>,
				),
			)
			.map(font => hydrateAbstracted(db, font));
	},
	createFamily(_parent, args) {
		const db = loadDb();
		const family = createFamilyRecord(db, args as FamilyInput);

		saveDb(db);
		return hydrateFamily(db, family);
	},
	createVariant(_parent, args) {
		const db = loadDb();
		const family = db.families[args.familyId as string];

		if (!family) {
			throw new Error('Family not found');
		}

		const variant = createVariantRecord(db, family.id, args as VariantInput);

		family.variantIds.push(variant.id);
		family.updatedAt = now();
		saveDb(db);
		return hydrateVariant(db, variant);
	},
	updateVariant(_parent, args) {
		const db = loadDb();
		const variant = db.variants[args.id as string];

		if (!variant) {
			throw new Error('Variant not found');
		}

		Object.keys(args).forEach((key) => {
			if (key !== 'id' && args[key] !== undefined) {
				(variant as Record<string, unknown>)[key] = args[key];
			}
		});
		variant.updatedAt = now();
		saveDb(db);
		return hydrateVariant(db, variant);
	},
	updateFamily(_parent, args) {
		const db = loadDb();
		const family = db.families[args.id as string];

		if (!family) {
			throw new Error('Family not found');
		}

		Object.keys(args).forEach((key) => {
			if (key !== 'id' && args[key] !== undefined) {
				(family as Record<string, unknown>)[key] = args[key];
			}
		});
		family.updatedAt = now();
		saveDb(db);
		return hydrateFamily(db, family);
	},
	deleteVariant(_parent, args) {
		const db = loadDb();
		const variant = db.variants[args.id as string];

		if (!variant) {
			return {id: args.id};
		}

		const family = db.families[variant.familyId];

		if (family) {
			family.variantIds = family.variantIds.filter(id => id !== args.id);
		}
		delete db.variants[args.id as string];
		saveDb(db);
		return {id: args.id};
	},
	deleteFamily(_parent, args) {
		const db = loadDb();
		const family = db.families[args.id as string];

		if (family) {
			(family.variantIds || []).forEach((id) => {
				delete db.variants[id];
			});
			delete db.families[args.id as string];
			db.user.libraryIds = db.user.libraryIds.filter(id => id !== args.id);
			saveDb(db);
		}

		return {id: args.id};
	},
	updateUser(_parent, args) {
		const db = loadDb();

		Object.keys(args).forEach((key) => {
			if (key === 'id') {
				return;
			}
			if (key === 'appValues' || key === 'values') {
				db.user.appValues = args[key] as Record<string, unknown>;
				return;
			}
			(db.user as Record<string, unknown>)[key] = args[key];
		});
		saveDb(db);
		return hydrateUser(db);
	},
	createAbstractedFont(_parent, args) {
		const db = loadDb();
		const abstracted: AbstractedFont = {
			id: uid('abs'),
			type: args.type as string | undefined,
			name: args.name as string | undefined,
			template: (args.template as string | null | undefined) || null,
			variantId: (args.variantId as string | null | undefined) || null,
			presetId: (args.presetId as string | null | undefined) || null,
			updatedAt: now(),
		};

		db.abstractedFonts[abstracted.id] = abstracted;
		((args.usersIds as string[] | undefined) || []).forEach(() => {
			if (!db.user.favouriteIds.includes(abstracted.id)) {
				db.user.favouriteIds.push(abstracted.id);
			}
		});
		saveDb(db);
		return hydrateAbstracted(db, abstracted);
	},
	addToUserOnAbstractedFont(_parent, args) {
		const db = loadDb();
		const abstracted = db.abstractedFonts[args.favouritesAbstractedFontId as string];

		if (abstracted && !db.user.favouriteIds.includes(abstracted.id)) {
			db.user.favouriteIds.push(abstracted.id);
			saveDb(db);
		}

		return {
			favouritesAbstractedFont: hydrateAbstracted(db, abstracted),
		};
	},
	removeFromUserOnAbstractedFont(_parent, args) {
		const db = loadDb();
		const abstractedId = args.favouritesAbstractedFontId as string;

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

export function executeLocalQuery(
	queryDoc: string | GraphQLDocument,
	variables: Record<string, unknown> = {},
): Record<string, unknown> {
	const query
		= typeof queryDoc === 'string'
			? (gql(queryDoc) as unknown as GraphQLDocument)
			: queryDoc;
	const operation = getOperation(query);

	if (!operation) {
		return {};
	}

	const data: Record<string, unknown> = {};

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

export function ensureLocalSession(): void {
	if (!window.localStorage.getItem('graphcoolToken')) {
		window.localStorage.setItem('graphcoolToken', LOCAL_TOKEN);
	}

	loadDb();
}
