#!/usr/bin/env node
/**
 * Logo optical sizes for Školjka.
 * Round 3: readable logo marks — tall, solid, distinct poles.
 * No fused spacing, no broken alts, no extreme contrast that collapses counters.
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

/** Shared logo proportions: tall, solid, counters open, digits don't collide */
const LOGO = {
	xHeight: 640,
	capDelta: 120,
	ascender: 110,
	descender: -100,
	crossbar: 1,
	diacriticHeight: 55,
	overshoot: 10,
	curviness: 0.58,
	width: 0.96,
	spacing: 0.04,
	opticThickness: 1,
	aperture: 1.05,
	apertureTop: 1,
	apertureBottom: 1.08,
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
		file: 'SkoljkaLogo-UltraBold.otf',
		familyName: 'Skoljka Logo',
		styleName: 'UltraBold',
		templateName: 'venus.ptf',
		weight: 900,
		width: 'semi_condensed',
		alts: [],
		values: {
			...LOGO,
			thickness: 150,
			_contrast: -0.22,
			_contrastExtremity: -0.28,
			width: 1,
			spacing: 0.04,
			opticThickness: 1.02,
			curviness: 0.5,
			aperture: 1.1,
			apertureTop: 1.04,
			apertureBottom: 1.14,
			serifWidth: 0.1,
			serifHeight: 0.001,
		},
	},
	{
		// Grotesk with open apertures — Antique's 5 stays broken at logo size
		file: 'SkoljkaLogo-Humanist.otf',
		familyName: 'Skoljka Logo',
		styleName: 'Humanist',
		templateName: 'venus.ptf',
		weight: 600,
		width: 'medium',
		alts: [],
		values: {
			...LOGO,
			thickness: 118,
			_contrast: -0.48,
			_contrastExtremity: -0.55,
			width: 1.02,
			spacing: 0.08,
			curviness: 0.72,
			aperture: 1.24,
			apertureTop: 1.14,
			apertureBottom: 1.3,
			opticThickness: 0.98,
			serifWidth: 0.1,
			serifHeight: 0.001,
		},
	},
	{
		file: 'SkoljkaLogo-UltraContrast.otf',
		familyName: 'Skoljka Logo',
		styleName: 'UltraContrast',
		templateName: 'gfnt.ptf',
		weight: 700,
		width: 'medium',
		alts: [],
		values: {
			...LOGO,
			thickness: 112,
			_contrast: -1.1,
			_contrastExtremity: -1.05,
			width: 0.94,
			spacing: 0.08,
			curviness: 0.52,
			serifWidth: 14,
			serifHeight: 8,
			spurHeight: 0.4,
			serifTerminal: 0,
		},
	},
	{
		file: 'SkoljkaLogo-FellContrast.otf',
		familyName: 'Skoljka Logo',
		styleName: 'FellContrast',
		templateName: 'john-fell.ptf',
		weight: 700,
		width: 'medium',
		alts: [],
		values: {
			...LOGO,
			thickness: 102,
			_contrast: -0.82,
			width: 0.96,
			spacing: 0.08,
			opticThickness: 1,
			aperture: 1.08,
			curviness: 0.5,
			serifWidth: 22,
			serifHeight: 14,
		},
	},
	{
		// Spectral light — Elzevir's 4 apex stays torn even with serifs off
		file: 'SkoljkaLogo-Elegant.otf',
		familyName: 'Skoljka Logo',
		styleName: 'Elegant',
		templateName: 'gfnt.ptf',
		weight: 400,
		width: 'medium',
		alts: [],
		values: {
			...LOGO,
			thickness: 74,
			_contrast: -0.88,
			_contrastExtremity: -0.9,
			width: 0.98,
			spacing: 0.12,
			opticThickness: 0.96,
			aperture: 1.14,
			apertureTop: 1.06,
			apertureBottom: 1.18,
			curviness: 0.55,
			serifWidth: 12,
			serifHeight: 6,
			spurHeight: 0.3,
			serifTerminal: 0,
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
