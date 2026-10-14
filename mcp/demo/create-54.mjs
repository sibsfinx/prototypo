#!/usr/bin/env node
// Three logo cuts for the "54" seafood restaurant mark, plus outlined SVG logos.
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
for (const cut of cuts) {
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
