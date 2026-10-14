#!/usr/bin/env node
// Logo cuts for the "54" seafood restaurant mark, plus outlined SVG logos.
import '../register-app.mjs';
import {mkdirSync, readFileSync, writeFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import JSZip from 'jszip';
import opentype from 'opentype.js';

// export.mjs pulls in app/scripts, so it must load after the loader hook.
const {buildOtf, writeOtfFile} = await import('../export.mjs');
const {getControls} = await import('../lib.mjs');

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(__dirname, 'fonts');
const logosDir = join(__dirname, 'logos');
mkdirSync(fontsDir, {recursive: true});
mkdirSync(logosDir, {recursive: true});

const MARK = '54';

const PALETTE = {
	navy: '#0b2a3c',
	foam: '#e6efec',
	sand: '#f3ebdd',
	coral: '#d9472b',
	teal: '#1d5c63',
};

const cuts = [
	{
		key: 'ultra-bold',
		file: 'Sidro-Black.otf',
		familyName: 'Sidro',
		styleName: 'Black',
		templateName: 'venus.ptf',
		weight: 900,
		width: 'expanded',
		colors: {ink: PALETTE.coral, paper: PALETTE.sand},
		values: {
			thickness: 160,
			width: 1.5,
			opticThickness: 1.1,
			aperture: 1.2,
			apertureBottom: 1.25,
			curviness: 0.55,
			crossbar: 0.9,
			spacing: -0.05,
		},
	},
	{
		key: 'ultra-contrast',
		file: 'Plima-Contrast.otf',
		familyName: 'Plima',
		styleName: 'Contrast',
		templateName: 'venus.ptf',
		weight: 800,
		width: 'medium',
		colors: {ink: PALETTE.navy, paper: PALETTE.foam},
		values: {
			thickness: 180,
			width: 1.1,
			_contrast: -0.15,
			_contrastExtremity: -0.2,
		},
	},
	{
		key: 'elegant',
		file: 'Biser-Light.otf',
		familyName: 'Biser',
		styleName: 'Light',
		templateName: 'elzevir.ptf',
		weight: 300,
		width: 'medium',
		colors: {ink: PALETTE.sand, paper: PALETTE.navy},
		values: {
			thickness: 42,
			width: 1,
			_contrast: -0.3,
			_contrastExtremity: -0.35,
			serifBall: 1.3,
			spacing: 0.15,
		},
	},
];

// Taller, still-solid figures (xHeight + capDelta ~1030 vs ~750 default),
// including humanist sans built by stripping serifs off calligraphic skeletons.
const TALL = {xHeight: 650, capDelta: 380};
const HUMANIST_GROTESK = {
	aperture: 1.6,
	apertureTop: 1.3,
	apertureBottom: 1.5,
	curviness: 0.8,
};
const NO_SERIFS = {serifWidth: 0.05, serifHeight: 0.001, spurHeight: 0};

const tallCuts = [
	{
		key: 'tall-grotesk',
		file: 'Jarbol-Black.otf',
		familyName: 'Jarbol',
		styleName: 'Black',
		templateName: 'venus.ptf',
		weight: 900,
		width: 'medium',
		colors: {ink: PALETTE.navy, paper: PALETTE.sand},
		values: {
			...TALL,
			thickness: 150,
			width: 1.12,
			opticThickness: 1.1,
			aperture: 1.3,
			apertureBottom: 1.35,
			curviness: 0.55,
			crossbar: 0.92,
			spacing: -0.05,
		},
	},
	{
		key: 'tall-humanist-grotesk',
		file: 'Val-Black.otf',
		familyName: 'Val',
		styleName: 'Black',
		templateName: 'venus.ptf',
		weight: 900,
		width: 'medium',
		colors: {ink: PALETTE.sand, paper: PALETTE.teal},
		values: {
			...TALL,
			...HUMANIST_GROTESK,
			thickness: 155,
			width: 1.1,
			_contrast: -0.7,
			_contrastExtremity: -0.75,
			spacing: -0.03,
		},
	},
	{
		key: 'tall-humanist-grotesk-contrast',
		file: 'Val-Contrast.otf',
		familyName: 'Val',
		styleName: 'Contrast',
		templateName: 'venus.ptf',
		weight: 950,
		width: 'medium',
		colors: {ink: PALETTE.coral, paper: PALETTE.foam},
		values: {
			...TALL,
			...HUMANIST_GROTESK,
			thickness: 170,
			width: 1.1,
			_contrast: -0.4,
			_contrastExtremity: -0.45,
		},
	},
	{
		key: 'tall-humanist-spectral',
		file: 'Udica-Black.otf',
		familyName: 'Udica',
		styleName: 'Black',
		templateName: 'gfnt.ptf',
		weight: 900,
		width: 'medium',
		colors: {ink: PALETTE.foam, paper: PALETTE.navy},
		values: {
			...TALL,
			...NO_SERIFS,
			thickness: 160,
			width: 1.1,
			_contrast: -0.7,
			aperture: 1.2,
		},
	},
	{
		key: 'tall-humanist-fell',
		file: 'Mreza-Bold.otf',
		familyName: 'Mreza',
		styleName: 'Bold',
		templateName: 'john-fell.ptf',
		weight: 700,
		width: 'medium',
		colors: {ink: PALETTE.teal, paper: PALETTE.sand},
		values: {
			xHeight: 620,
			capDelta: 350,
			thickness: 150,
			width: 1.1,
			_contrast: -0.7,
			serifWidth: 0.001,
			serifHeight: 0,
			serifCurve: 0,
		},
	},
	{
		key: 'tall-serif',
		file: 'Luka-Black.otf',
		familyName: 'Luka',
		styleName: 'Black',
		templateName: 'gfnt.ptf',
		weight: 900,
		width: 'medium',
		colors: {ink: PALETTE.navy, paper: PALETTE.foam},
		values: {
			...TALL,
			thickness: 165,
			width: 1.08,
			_contrast: -0.5,
			serifWidth: 45,
			serifHeight: 20,
		},
	},
];

function controlInits(templateName) {
	return Object.fromEntries(
		getControls(templateName).parameters.map((p) => [p.name, p.init]),
	);
}

function logoSvg(font, {ink, paper}, {size = 1000, pad = 0.2} = {}) {
	const path = font.getPath(MARK, 0, 0, 1000);
	const box = path.getBoundingBox();
	const w = box.x2 - box.x1;
	const h = box.y2 - box.y1;
	const scale = (size * (1 - 2 * pad)) / Math.max(w, h);
	const tx = (size - w * scale) / 2 - box.x1 * scale;
	const ty = (size - h * scale) / 2 - box.y1 * scale;
	const d = path.toPathData(2);
	const bg = paper ? `<rect width="${size}" height="${size}" fill="${paper}"/>` : '';
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${bg}<path transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(5)})" fill="${ink}" d="${d}"/></svg>\n`;
}

const zip = new JSZip();
const out = [];
for (const cut of [...cuts, ...tallCuts]) {
	const {buffer, glyphCount} = buildOtf({
		templateName: cut.templateName,
		values: {...controlInits(cut.templateName), ...cut.values},
		familyName: cut.familyName,
		styleName: cut.styleName,
		weight: cut.weight,
		width: cut.width,
	});
	const fontPath = writeOtfFile(buffer, join(fontsDir, cut.file));
	zip.file(cut.file, readFileSync(fontPath));

	const font = opentype.parse(new Uint8Array(buffer).buffer);
	const base = `54-${cut.key}`;
	writeFileSync(join(logosDir, `${base}.svg`), logoSvg(font, cut.colors));
	writeFileSync(
		join(logosDir, `${base}-mono.svg`),
		logoSvg(font, {ink: PALETTE.navy, paper: null}),
	);
	out.push({key: cut.key, font: fontPath, glyphCount, logos: [`${base}.svg`, `${base}-mono.svg`]});
}

const zipPath = join(fontsDir, '54-logo-typefaces.zip');
writeFileSync(
	zipPath,
	await zip.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'}),
);

console.log(JSON.stringify({zip: zipPath, logosDir, cuts: out}, null, 2));
