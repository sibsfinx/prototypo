#!/usr/bin/env node
/**
 * Logo optical sizes for Školjka seafood — not text faces.
 * Anagrama-leaning: Swiss precision, custom wordmark energy, three poles.
 */
import '../register-app.mjs';
import {rmSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import JSZip from 'jszip';
import {createFamily, setParams, exportOtf} from '../lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dirname, 'fonts');
const dbPath = join(__dirname, 'prototypo-logo-db.json');

process.env.PROTOTYPO_DB_PATH = dbPath;
if (existsSync(dbPath)) {
	rmSync(dbPath);
}
mkdirSync(fontsDir, {recursive: true});

/**
 * Shared logo optical DNA: high x-height for short marks ("54"),
 * capped descenders, no serifs on grotesk cuts.
 */
const LOGO_GROTESK = {
	xHeight: 620,
	capDelta: 140,
	ascender: 120,
	descender: -110,
	crossbar: 1,
	diacriticHeight: 60,
	overshoot: 14,
	serifWidth: 0.1,
	serifHeight: 0.001,
};

const LOGO_DIDONE = {
	xHeight: 560,
	capDelta: 180,
	ascender: 160,
	descender: -130,
	crossbar: 0.98,
	diacriticHeight: 70,
	overshoot: 10,
};

const cuts = [
	{
		// Massive stamp — Boom Bowl energy; counters kept open (peer review)
		file: 'SkoljkaLogo-UltraBold.otf',
		familyName: 'Skoljka Logo',
		styleName: 'UltraBold',
		templateName: 'venus.ptf',
		weight: 900,
		width: 'expanded',
		values: {
			...LOGO_GROTESK,
			thickness: 148,
			_contrast: -0.42,
			_contrastExtremity: -0.48,
			width: 1.12,
			spacing: -0.02,
			opticThickness: 1.02,
			aperture: 1.05,
			apertureTop: 1.02,
			apertureBottom: 1.14,
			curviness: 0.42,
		},
	},
	{
		// Hairline vs slab — Magno / Sofia hospitality contrast
		file: 'SkoljkaLogo-UltraContrast.otf',
		familyName: 'Skoljka Logo',
		styleName: 'UltraContrast',
		templateName: 'elzevir.ptf',
		weight: 700,
		width: 'medium',
		values: {
			...LOGO_DIDONE,
			thickness: 128,
			_contrast: -1.22,
			_contrastExtremity: -1.15,
			width: 0.94,
			spacing: 0,
			opticThickness: 1.05,
			aperture: 1.14,
			apertureTop: 1.06,
			apertureBottom: 1.18,
			curviness: 0.52,
			serifWidth: 52,
			serifHeight: 11,
			capDelta: 160,
			overshoot: 8,
		},
	},
	{
		// Pearl-light Swiss quiet — thickness 54 kept as logo cipher
		file: 'SkoljkaLogo-Elegant.otf',
		familyName: 'Skoljka Logo',
		styleName: 'Elegant',
		templateName: 'venus.ptf',
		weight: 300,
		width: 'semi_expanded',
		values: {
			...LOGO_GROTESK,
			xHeight: 580,
			capDelta: 170,
			thickness: 58,
			_contrast: -0.45,
			_contrastExtremity: -0.55,
			width: 1.06,
			spacing: 0.08,
			opticThickness: 0.95,
			aperture: 1.22,
			apertureTop: 1.14,
			apertureBottom: 1.28,
			curviness: 0.68,
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
	exported.push({...file, file: cut.file, styleName: cut.styleName});
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
