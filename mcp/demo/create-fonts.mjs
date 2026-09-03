#!/usr/bin/env node
import '../register-app.mjs';
import {rmSync, existsSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import {
	createFamily,
	setParams,
	setAlternate,
	exportOtf,
	describeOpenTypeSupport,
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

const DISPLAY_ALTS = [
	{unicode: 97, glyphName: 'a_alt'},
	{unicode: 116, glyphName: 't_alt'},
	{unicode: 121, glyphName: 'y_alt'},
	{unicode: 49, glyphName: 'one_alt'},
	{unicode: 53, glyphName: 'five_alt'},
	{unicode: 81, glyphName: 'Q_alt'},
];

function applyAlts(variantId, wanted) {
	const available = listAlternates('antique.ptf');
	const applied = [];
	for (const item of wanted) {
		const row = available.find((alt) => alt.unicode === item.unicode);
		if (!row || !row.glyphs.some((g) => g.name === item.glyphName)) {
			continue;
		}
		setAlternate({variantId, unicode: item.unicode, glyphName: item.glyphName}, dbPath);
		applied.push(item);
	}
	return applied;
}

const display = createFamily(
	{name: 'Poster Display', templateName: 'antique.ptf'},
	dbPath,
);
setParams({
	variantId: display.variant.id,
	values: {
		width: 1.16,
		thickness: 92,
		_contrast: -1.22,
		aperture: 1.18,
		spacing: -0.18,
		xHeight: 640,
		opticThickness: 1.08,
		curviness: 0.72,
	},
}, dbPath);
const displayAlts = applyAlts(display.variant.id, DISPLAY_ALTS);

const text = createFamily(
	{name: 'Reader Text', templateName: 'gfnt.ptf'},
	dbPath,
);
setParams({
	variantId: text.variant.id,
	values: {
		width: 1.02,
		thickness: 70,
		_contrast: -0.72,
		aperture: 1.08,
		spacing: 0.14,
		xHeight: 500,
		serifWidth: 48,
		serifHeight: 42,
		opticThickness: 0.96,
	},
}, dbPath);

const displayOt = describeOpenTypeSupport('antique.ptf');
const textOt = describeOpenTypeSupport('gfnt.ptf');

const displayFile = await exportOtf({
	variantId: display.variant.id,
	outPath: join(fontsDir, 'PosterDisplay-Regular.otf'),
}, dbPath);
const textFile = await exportOtf({
	variantId: text.variant.id,
	outPath: join(fontsDir, 'ReaderText-Regular.otf'),
}, dbPath);

console.log(JSON.stringify({
	dbPath,
	display: {
		familyId: display.family.id,
		variantId: display.variant.id,
		alts: displayAlts,
		opentype: displayOt,
		export: displayFile,
	},
	text: {
		familyId: text.family.id,
		variantId: text.variant.id,
		opentype: textOt,
		export: textFile,
	},
	html: join(repoRoot, 'mcp/demo/index.html'),
}, null, 2));
