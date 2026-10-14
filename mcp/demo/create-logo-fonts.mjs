#!/usr/bin/env node
/**
 * Logo optical sizes for Školjka — tuned toward Studio 54 mark DNA:
 * geometric circular 5, massive blocky 4, shared crossbar, tight lockup,
 * high contrast, gold-on-navy specimen energy.
 */
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
	getControls,
} from '../lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dirname, 'fonts');
const dbPath = join(__dirname, 'prototypo-logo-db.json');

process.env.PROTOTYPO_DB_PATH = dbPath;
if (existsSync(dbPath)) {
	rmSync(dbPath);
}
mkdirSync(fontsDir, {recursive: true});

/** Studio 54 geometric lockup DNA — shared by every cut */
const S54 = {
	xHeight: 720,
	capDelta: 90,
	ascender: 85,
	descender: -80,
	crossbar: 1.12,
	diacriticHeight: 48,
	overshoot: 6,
	// circular bowls + sharp joins
	curviness: 0.98,
	// thick stems / thin bars (Studio 54 4 vs 5 energy)
	_contrast: -1.22,
	_contrastExtremity: -1.32,
	// condensed tall mark
	width: 0.76,
	// nest 5 into 4
	spacing: -0.14,
	opticThickness: 1.12,
	// tighter counters like the blocky 4
	aperture: 0.88,
	apertureTop: 0.82,
	apertureBottom: 0.95,
};

function filterParams(templateName, values) {
	const allowed = new Set(
		getControls(templateName).parameters.map((p) => p.name),
	);
	const out = {};
	for (const [k, v] of Object.entries(values)) {
		if (allowed.has(k)) {
			out[k] = v;
		}
	}
	return out;
}

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

const cuts = [
	{
		// Massive geometric stamp — closest to the gold 4 block
		file: 'SkoljkaLogo-UltraBold.otf',
		familyName: 'Skoljka Logo',
		styleName: 'UltraBold',
		templateName: 'venus.ptf',
		weight: 900,
		width: 'condensed',
		alts: [],
		values: {
			...S54,
			thickness: 172,
			_contrast: -1.12,
			_contrastExtremity: -1.22,
			width: 0.72,
			spacing: -0.18,
			opticThickness: 1.18,
			curviness: 1.25,
			aperture: 0.78,
			apertureTop: 0.72,
			apertureBottom: 0.88,
			crossbar: 1.18,
			serifWidth: 0.1,
			serifHeight: 0.001,
		},
	},
	{
		// Antique humanist skeleton + digit alts, same S54 geometry
		file: 'SkoljkaLogo-Humanist.otf',
		familyName: 'Skoljka Logo',
		styleName: 'Humanist',
		templateName: 'antique.ptf',
		weight: 800,
		width: 'condensed',
		alts: [
			{unicode: 53, glyphName: 'five_alt'},
			{unicode: 52, glyphName: 'four_alt'},
		],
		values: {
			...S54,
			xHeight: 740,
			thickness: 160,
			_contrast: -1.15,
			_contrastExtremity: -1.25,
			width: 0.7,
			spacing: -0.14,
			curviness: 1.3,
			aperture: 0.8,
			apertureTop: 0.74,
			apertureBottom: 0.9,
			crossbar: 1.16,
			serifWidth: 0.05,
			serifHeight: 0.001,
		},
	},
	{
		// Spectral — extreme contrast geometric
		file: 'SkoljkaLogo-UltraContrast.otf',
		familyName: 'Skoljka Logo',
		styleName: 'UltraContrast',
		templateName: 'gfnt.ptf',
		weight: 800,
		width: 'condensed',
		alts: [],
		values: {
			...S54,
			thickness: 148,
			_contrast: -1.28,
			_contrastExtremity: -1.4,
			width: 0.74,
			spacing: -0.1,
			curviness: 1.0,
			// kill serifs toward geometric mark
			serifWidth: 4,
			serifHeight: 2,
		},
	},
	{
		// Fell — deepest contrast range, still condensed lockup
		file: 'SkoljkaLogo-FellContrast.otf',
		familyName: 'Skoljka Logo',
		styleName: 'FellContrast',
		templateName: 'john-fell.ptf',
		weight: 800,
		width: 'condensed',
		alts: [],
		values: {
			...S54,
			thickness: 150,
			_contrast: -2.2,
			width: 0.78,
			spacing: -0.1,
			opticThickness: 1.2,
			aperture: 0.9,
			curviness: 0.9,
			serifWidth: 3,
			serifHeight: 2,
		},
	},
	{
		// Elegant — thinner Studio 54 (the circular 5 pole), still geometric
		file: 'SkoljkaLogo-Elegant.otf',
		familyName: 'Skoljka Logo',
		styleName: 'Elegant',
		templateName: 'elzevir.ptf',
		weight: 400,
		width: 'condensed',
		alts: [],
		values: {
			...S54,
			thickness: 78,
			_contrast: -1.18,
			_contrastExtremity: -1.28,
			width: 0.78,
			spacing: -0.06,
			opticThickness: 1.0,
			aperture: 0.95,
			apertureTop: 0.9,
			apertureBottom: 1.02,
			curviness: 1.05,
			serifWidth: 5,
			serifHeight: 2,
		},
	},
];

const exported = [];
for (const cut of cuts) {
	const created = createFamily(
		{name: `${cut.familyName} ${cut.styleName}`, templateName: cut.templateName},
		dbPath,
	);
	const values = filterParams(cut.templateName, cut.values);
	setParams({variantId: created.variant.id, values}, dbPath);
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
	exported.push({
		...file,
		file: cut.file,
		styleName: cut.styleName,
		base: cut.templateName,
		alts,
	});
}

const zip = new JSZip();
for (const item of exported) {
	zip.file(item.file, readFileSync(item.path));
}
const zipPath = join(fontsDir, 'skoljka-logo-typefaces.zip');
writeFileSync(
	zipPath,
	await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}),
);

console.log(
	JSON.stringify(
		{
			dbPath,
			zip: zipPath,
			specimen: join(__dirname, 'logo.html'),
			exported,
		},
		null,
		2,
	),
);
