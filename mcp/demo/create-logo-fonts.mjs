#!/usr/bin/env node
/**
 * Logo optical sizes for Školjka seafood — not text faces.
 * Several bases, taller solid proportions, Anagrama wordmark energy.
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

/** Tall + solid logo DNA shared across sans bases */
const TALL_SOLID = {
	xHeight: 700,
	capDelta: 110,
	ascender: 100,
	descender: -95,
	crossbar: 1.02,
	diacriticHeight: 55,
	overshoot: 12,
};

const cuts = [
	{
		// Neo-grotesk stamp — Prototypo Grotesk
		file: 'SkoljkaLogo-UltraBold.otf',
		familyName: 'Skoljka Logo',
		styleName: 'UltraBold',
		templateName: 'venus.ptf',
		weight: 900,
		width: 'semi_condensed',
		values: {
			...TALL_SOLID,
			thickness: 150,
			_contrast: -0.38,
			_contrastExtremity: -0.45,
			width: 0.92,
			spacing: -0.02,
			opticThickness: 1.04,
			aperture: 1.02,
			apertureTop: 1.0,
			apertureBottom: 1.1,
			curviness: 0.4,
			serifWidth: 0.1,
			serifHeight: 0.001,
		},
	},
	{
		// Humanistic grotesque — Antique Gothic, tall + solid (low contrast)
		file: 'SkoljkaLogo-Humanist.otf',
		familyName: 'Skoljka Logo',
		styleName: 'Humanist',
		templateName: 'antique.ptf',
		weight: 800,
		width: 'semi_condensed',
		values: {
			...TALL_SOLID,
			xHeight: 740,
			capDelta: 80,
			thickness: 140,
			_contrast: -0.15,
			_contrastExtremity: -0.2,
			width: 0.86,
			spacing: 0.02,
			opticThickness: 1.0,
			aperture: 1.28,
			apertureTop: 1.18,
			apertureBottom: 1.34,
			curviness: 0.66,
			serifWidth: 0.05,
			serifHeight: 0.001,
		},
	},
	{
		// Ultra contrast didone — Spectral (new base vs prior Elzevir)
		file: 'SkoljkaLogo-UltraContrast.otf',
		familyName: 'Skoljka Logo',
		styleName: 'UltraContrast',
		templateName: 'gfnt.ptf',
		weight: 700,
		width: 'condensed',
		values: {
			xHeight: 640,
			capDelta: 150,
			ascender: 140,
			descender: -120,
			crossbar: 0.98,
			diacriticHeight: 65,
			overshoot: 8,
			thickness: 122,
			_contrast: -1.26,
			_contrastExtremity: -1.2,
			width: 0.86,
			spacing: 0,
			opticThickness: 1.08,
			aperture: 1.12,
			apertureTop: 1.04,
			apertureBottom: 1.16,
			curviness: 0.55,
			serifWidth: 48,
			serifHeight: 28,
		},
	},
	{
		// Old-style contrast alternate — John Fell
		file: 'SkoljkaLogo-FellContrast.otf',
		familyName: 'Skoljka Logo',
		styleName: 'FellContrast',
		templateName: 'john-fell.ptf',
		weight: 700,
		width: 'condensed',
		values: {
			xHeight: 660,
			capDelta: 160,
			ascender: 130,
			descender: -110,
			crossbar: 1,
			diacriticHeight: 60,
			overshoot: 8,
			thickness: 118,
			_contrast: -1.85,
			width: 0.9,
			spacing: 0.02,
			opticThickness: 1.1,
			aperture: 1.08,
			curviness: 0.5,
			serifWidth: 42,
			serifHeight: 14,
		},
	},
	{
		// Quiet elegant — Elzevir light, tall
		file: 'SkoljkaLogo-Elegant.otf',
		familyName: 'Skoljka Logo',
		styleName: 'Elegant',
		templateName: 'elzevir.ptf',
		weight: 300,
		width: 'semi_condensed',
		values: {
			xHeight: 680,
			capDelta: 130,
			ascender: 110,
			descender: -100,
			crossbar: 1,
			diacriticHeight: 60,
			overshoot: 10,
			thickness: 58,
			_contrast: -0.72,
			_contrastExtremity: -0.8,
			width: 0.9,
			spacing: 0.1,
			opticThickness: 0.94,
			aperture: 1.2,
			apertureTop: 1.12,
			apertureBottom: 1.26,
			curviness: 0.62,
			serifWidth: 36,
			serifHeight: 8,
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
	exported.push({
		...file,
		file: cut.file,
		styleName: cut.styleName,
		base: cut.templateName,
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
