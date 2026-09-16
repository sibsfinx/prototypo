#!/usr/bin/env node
import '../register-app.mjs';
import {rmSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import JSZip from 'jszip';
import {
	createFamily,
	setParams,
	setAlternate,
	exportOtf,
	listAlternates,
} from '../lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../..');
const fontsDir = join(__dirname, 'fonts');
const dbPath = join(__dirname, 'prototypo-demo-db.json');

process.env.PROTOTYPO_DB_PATH = dbPath;
if (existsSync(dbPath)) {
	rmSync(dbPath);
}
mkdirSync(fontsDir, {recursive: true});
for (const stale of ['PosterDisplay-Regular.otf', 'ReaderText-Regular.otf']) {
	const stalePath = join(fontsDir, stale);
	if (existsSync(stalePath)) {
		rmSync(stalePath);
	}
}

const OBALA_ALTS = [
	{unicode: 81, glyphName: 'Q_alt'},
];

function applyAlts(variantId, templateName, wanted) {
	const available = listAlternates(templateName);
	const applied = [];
	for (const item of wanted) {
		const row = available.find((alt) => alt.unicode === item.unicode);
		if (!row || !row.glyphs.some((g) => g.name === item.glyphName)) {
			continue;
		}
		setAlternate(
			{variantId, unicode: item.unicode, glyphName: item.glyphName},
			dbPath,
		);
		applied.push(item);
	}
	return applied;
}

const OBALA_SHARED = {
	width: 1.06,
	xHeight: 575,
	capDelta: 195,
	ascender: 175,
	descender: -145,
	crossbar: 0.98,
	diacriticHeight: 70,
	overshoot: 12,
	opticThickness: 1.03,
	aperture: 1.08,
	apertureTop: 1.02,
	apertureBottom: 1.12,
	curviness: 0.52,
	serifWidth: 0.1,
	serifHeight: 0.001,
};

const KEJ_SHARED = {
	width: 1,
	xHeight: 515,
	capDelta: 235,
	ascender: 240,
	descender: -185,
	crossbar: 1,
	diacriticHeight: 78,
	overshoot: 10,
	opticThickness: 0.95,
	aperture: 1.1,
	apertureTop: 1.04,
	apertureBottom: 1.14,
	curviness: 0.62,
	serifWidth: 0.1,
	serifHeight: 0.001,
};

const cuts = [
	{
		file: 'Obala-Black.otf',
		familyName: 'Obala',
		styleName: 'Black',
		templateName: 'venus.ptf',
		weight: 900,
		width: 'semi_expanded',
		alts: OBALA_ALTS,
		values: {
			...OBALA_SHARED,
			thickness: 146,
			_contrast: -1.08,
			_contrastExtremity: -0.92,
			spacing: -0.05,
			aperture: 1.12,
			apertureBottom: 1.16,
		},
	},
	{
		file: 'Obala-Bold.otf',
		familyName: 'Obala',
		styleName: 'Bold',
		templateName: 'venus.ptf',
		weight: 700,
		width: 'semi_expanded',
		alts: OBALA_ALTS,
		values: {
			...OBALA_SHARED,
			thickness: 128,
			_contrast: -0.92,
			_contrastExtremity: -0.85,
			spacing: 0,
			aperture: 1.12,
		},
	},
	{
		file: 'Kej-Regular.otf',
		familyName: 'Kej',
		styleName: 'Regular',
		templateName: 'venus.ptf',
		weight: 400,
		width: 'medium',
		alts: [],
		values: {
			...KEJ_SHARED,
			thickness: 92,
			_contrast: -0.65,
			_contrastExtremity: -0.72,
			spacing: 0.08,
		},
	},
	{
		file: 'Kej-Medium.otf',
		familyName: 'Kej',
		styleName: 'Medium',
		templateName: 'venus.ptf',
		weight: 500,
		width: 'medium',
		alts: [],
		values: {
			...KEJ_SHARED,
			thickness: 108,
			_contrast: -0.68,
			_contrastExtremity: -0.75,
			spacing: 0.04,
			width: 1.01,
		},
	},
];

const exported = [];

for (const cut of cuts) {
	const created = createFamily(
		{name: `${cut.familyName} ${cut.styleName}`, templateName: cut.templateName},
		dbPath,
	);
	setParams({variantId: created.variant.id, values: cut.values}, dbPath);
	const alts = applyAlts(created.variant.id, cut.templateName, cut.alts);
	const file = await exportOtf(
		{
			variantId: created.variant.id,
			outPath: join(fontsDir, cut.file),
			familyName: cut.familyName,
			styleName: cut.styleName,
			weight: cut.weight,
			width: cut.width,
		},
		dbPath,
	);
	exported.push({...file, alts, file: cut.file});
}

const zip = new JSZip();
for (const item of exported) {
	zip.file(item.file, readFileSync(item.path));
}
writeFileSync(
	join(fontsDir, 'skoljka-typefaces.zip'),
	await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}),
);

console.log(
	JSON.stringify(
		{
			dbPath,
			html: join(repoRoot, 'mcp/demo/index.html'),
			zip: join(fontsDir, 'skoljka-typefaces.zip'),
			exported,
		},
		null,
		2,
	),
);
