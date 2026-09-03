import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'fs';
import {homedir} from 'os';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(__dirname, '..');

export const TEMPLATES = [
	{name: 'Spectral', familyName: 'Spectral', templateName: 'gfnt.ptf'},
	{
		name: 'Antique Gothic',
		familyName: 'Antique Gothic',
		templateName: 'antique.ptf',
	},
	{
		name: 'Prototypo Elzevir',
		familyName: 'Prototypo Elzevir',
		templateName: 'elzevir.ptf',
	},
	{
		name: 'Prototypo Grotesk',
		familyName: 'Prototypo Grotesk',
		templateName: 'venus.ptf',
	},
	{
		name: 'Prototypo Fell',
		familyName: 'Prototypo Fell',
		templateName: 'john-fell.ptf',
	},
];

export function defaultDbPath() {
	return (
		process.env.PROTOTYPO_DB_PATH
		|| join(homedir(), '.prototypo', 'prototypo-local-db.json')
	);
}

function now() {
	return new Date().toISOString();
}

function uid(prefix = 'id') {
	return `${prefix}_${Date.now().toString(36)}_${Math.random()
		.toString(36)
		.slice(2, 10)}`;
}

export function seedDb() {
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

export function loadDb(dbPath = defaultDbPath()) {
	try {
		if (existsSync(dbPath)) {
			return JSON.parse(readFileSync(dbPath, 'utf8'));
		}
	}
	catch (error) {
		console.error('[prototypo-mcp] failed to read db', error);
	}
	const db = seedDb();
	saveDb(db, dbPath);
	return db;
}

export function saveDb(db, dbPath = defaultDbPath()) {
	mkdirSync(dirname(dbPath), {recursive: true});
	writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export function resolveTemplate(templateName) {
	const meta = TEMPLATES.find((t) => t.templateName === templateName);
	if (!meta) {
		throw new Error(`Unknown templateName: ${templateName}`);
	}
	return meta;
}

export function fontJsonPath(templateName) {
	resolveTemplate(templateName);
	return join(REPO_ROOT, 'node_modules', templateName, 'dist', 'font.json');
}

export function loadFontJson(templateName) {
	const path = fontJsonPath(templateName);
	if (!existsSync(path)) {
		throw new Error(`Template ${templateName} not found at ${path}`);
	}
	return JSON.parse(readFileSync(path, 'utf8'));
}

export function controlInits(controls = []) {
	const inits = {};
	for (const group of controls) {
		for (const param of group.parameters || []) {
			inits[param.name] = param.init;
		}
	}
	return inits;
}

export function listTemplates() {
	return TEMPLATES.map((t) => ({
		...t,
		available: existsSync(fontJsonPath(t.templateName)),
	}));
}

export function getControls(templateName) {
	resolveTemplate(templateName);
	const json = loadFontJson(templateName);
	const parameters = [];
	for (const group of json.controls || []) {
		for (const param of group.parameters || []) {
			parameters.push({
				group: group.label,
				name: param.name,
				label: param.label,
				init: param.init,
				min: param.min,
				max: param.max,
				minAdvised: param.minAdvised,
				maxAdvised: param.maxAdvised,
			});
		}
	}
	return {
		templateName,
		familyName: json.fontinfo && json.fontinfo.familyName,
		parameters,
	};
}

export function createFamily({name, templateName}, dbPath = defaultDbPath()) {
	if (!name) {
		throw new Error('name is required');
	}
	resolveTemplate(templateName);
	const font = loadFontJson(templateName);
	const values = controlInits(font.controls);
	const db = loadDb(dbPath);
	const familyId = uid('family');
	const variantId = uid('variant');
	const family = {
		id: familyId,
		name,
		template: templateName,
		ownerId: db.user.id,
		designer: '',
		designerUrl: '',
		foundry: 'Prototypo',
		foundryUrl: 'https://prototypo.io/',
		tags: [],
		fromId: null,
		variantIds: [variantId],
		updatedAt: now(),
	};
	const variant = {
		id: variantId,
		familyId,
		name: 'Regular',
		values,
		width: 'normal',
		weight: 400,
		italic: false,
		updatedAt: now(),
		abstractedFontId: null,
	};
	db.families[familyId] = family;
	db.variants[variantId] = variant;
	if (!db.user.libraryIds.includes(familyId)) {
		db.user.libraryIds.push(familyId);
	}
	saveDb(db, dbPath);
	return {family, variant};
}

export function listFamilies(dbPath = defaultDbPath()) {
	const db = loadDb(dbPath);
	return (db.user.libraryIds || [])
		.map((id) => db.families[id])
		.filter(Boolean)
		.map((family) => ({
			id: family.id,
			name: family.name,
			template: family.template,
			variants: (family.variantIds || []).map((vid) => {
				const variant = db.variants[vid];
				return variant
					? {id: variant.id, name: variant.name}
					: {id: vid};
			}),
		}));
}

export function getVariantValues(variantId, dbPath = defaultDbPath()) {
	const db = loadDb(dbPath);
	const variant = db.variants[variantId];
	if (!variant) {
		throw new Error(`Variant not found: ${variantId}`);
	}
	return {
		id: variant.id,
		familyId: variant.familyId,
		name: variant.name,
		values: variant.values || {},
	};
}

export function setParam(
	{variantId, name, value},
	dbPath = defaultDbPath(),
) {
	if (!name) {
		throw new Error('name is required');
	}
	const db = loadDb(dbPath);
	const variant = db.variants[variantId];
	if (!variant) {
		throw new Error(`Variant not found: ${variantId}`);
	}
	const family = db.families[variant.familyId];
	if (!family) {
		throw new Error(`Family not found: ${variant.familyId}`);
	}
	const known = controlInits(loadFontJson(family.template).controls);
	if (!(name in known)) {
		throw new Error(`Unknown param: ${name}`);
	}
	variant.values = {...(variant.values || {}), [name]: value};
	variant.updatedAt = now();
	saveDb(db, dbPath);
	return getVariantValues(variantId, dbPath);
}

export function setParams({variantId, values}, dbPath = defaultDbPath()) {
	if (!values || typeof values !== 'object') {
		throw new Error('values is required');
	}
	for (const [name, value] of Object.entries(values)) {
		setParam({variantId, name, value}, dbPath);
	}
	return getVariantValues(variantId, dbPath);
}

export function listAlternates(templateName) {
	resolveTemplate(templateName);
	const json = loadFontJson(templateName);
	const byUnicode = new Map();
	for (const glyph of Object.values(json.glyphs || {})) {
		const unicode = Number(glyph.unicode);
		if (!Number.isFinite(unicode) || unicode <= 0 || !glyph.name) {
			continue;
		}
		const list = byUnicode.get(unicode) || [];
		list.push(glyph.name);
		byUnicode.set(unicode, list);
	}

	return [...byUnicode.entries()]
		.filter(([, names]) => names.length > 1)
		.map(([unicode, names]) => {
			const unique = [...new Set(names)];
			const defaultName = unique.find((name) => !name.includes('alt')) || unique[0];
			return {
				unicode,
				char: String.fromCodePoint(unicode),
				defaultName,
				glyphs: unique.map((name) => ({
					name,
					isDefault: name === defaultName,
				})),
			};
		});
}

export function setAlternate(
	{variantId, unicode, glyphName},
	dbPath = defaultDbPath(),
) {
	if (!glyphName) {
		throw new Error('glyphName is required');
	}
	const code = Number(unicode);
	if (!Number.isFinite(code)) {
		throw new Error('unicode is required');
	}
	const db = loadDb(dbPath);
	const variant = db.variants[variantId];
	if (!variant) {
		throw new Error(`Variant not found: ${variantId}`);
	}
	const family = db.families[variant.familyId];
	if (!family) {
		throw new Error(`Family not found: ${variant.familyId}`);
	}
	const json = loadFontJson(family.template);
	const match = Object.values(json.glyphs || {}).find(
		(glyph) => glyph.name === glyphName && Number(glyph.unicode) === code,
	);
	if (!match) {
		throw new Error(
			`Glyph ${glyphName} is not an alternate for unicode ${code}`,
		);
	}
	const altList = {...((variant.values && variant.values.altList) || {})};
	altList[String(code)] = glyphName;
	variant.values = {...(variant.values || {}), altList};
	variant.updatedAt = now();
	saveDb(db, dbPath);
	return getVariantValues(variantId, dbPath);
}

export function describeOpenTypeSupport(templateName) {
	const alternates = listAlternates(templateName);
	return {
		templateName,
		gsub: false,
		gposKerning: false,
		standardLigatures: false,
		discretionaryLigatures: false,
		stylisticSets: false,
		smallCaps: false,
		figureSets: false,
		variableFont: false,
		alternates: {
			mechanism: 'baked altList, not OpenType salt/ssXX',
			count: alternates.length,
			examples: alternates.slice(0, 12).map((item) => ({
				char: item.char,
				glyphs: item.glyphs.map((g) => g.name),
			})),
		},
		note:
			'Exported OTFs are CFF (OTTO) with cmap/hmtx only. CSS font-feature-settings liga/dlig/calt/ss01 will not change glyphs. Pick alternates with set_alternate before export_otf.',
	};
}

function slug(value) {
	return String(value || 'font')
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^A-Za-z0-9._-]/g, '');
}

export async function exportOtf(
	{variantId, outPath},
	dbPath = defaultDbPath(),
) {
	const db = loadDb(dbPath);
	const variant = db.variants[variantId];
	if (!variant) {
		throw new Error(`Variant not found: ${variantId}`);
	}
	const family = db.families[variant.familyId];
	if (!family) {
		throw new Error(`Family not found: ${variant.familyId}`);
	}
	const {buildOtf, writeOtfFile} = await import('./export.mjs');
	const {buffer, glyphCount} = buildOtf({
		templateName: family.template,
		values: variant.values || {},
		familyName: family.name,
		styleName: variant.name || 'Regular',
		weight: variant.weight || 400,
		width: variant.width || 'normal',
		italic: Boolean(variant.italic),
	});
	const dest
		= outPath
		|| join(
			REPO_ROOT,
			'mcp/demo/fonts',
			`${slug(family.name)}-${slug(variant.name || 'Regular')}.otf`,
		);
	const path = writeOtfFile(buffer, dest);
	return {
		path,
		bytes: buffer.byteLength,
		glyphCount,
		familyName: family.name,
		styleName: variant.name || 'Regular',
		templateName: family.template,
		altList: (variant.values && variant.values.altList) || {},
	};
}
