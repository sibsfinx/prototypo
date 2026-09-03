import {mkdirSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {dirname, resolve as resolvePath} from 'path';
import FontPrecursor from '../app/scripts/prototypo.js/precursor/FontPrecursor.js';
import {fontToSfntTable} from '../app/scripts/opentype/font.js';
import {REPO_ROOT, loadFontJson, resolveTemplate} from './lib.mjs';

const precursorCache = new Map();

const getfsSelection = (weight, italic) =>
	(weight > 500 ? 0b0000000000100000 : 0b0000000001000000)
	| (italic ? 0b0000000000000001 : 0b0000000000000000);

export function defaultSubset(fontJson) {
	const unicodes = new Set();
	for (const glyph of Object.values(fontJson.glyphs || {})) {
		const unicode = Number(glyph.unicode);
		if (!Number.isFinite(unicode) || unicode <= 0) {
			continue;
		}
		if (unicode <= 255 || (unicode >= 0x2010 && unicode <= 0x2026)) {
			unicodes.add(String(unicode));
		}
	}
	return [...unicodes].sort((a, b) => Number(a) - Number(b));
}

export function getPrecursor(templateName) {
	resolveTemplate(templateName);
	if (!precursorCache.has(templateName)) {
		precursorCache.set(templateName, new FontPrecursor(loadFontJson(templateName)));
	}
	return precursorCache.get(templateName);
}

export function buildOtf({
	templateName,
	values = {},
	familyName,
	styleName = 'Regular',
	weight = 400,
	width = 'normal',
	italic = false,
	subset,
}) {
	const fontJson = loadFontJson(templateName);
	const precursor = getPrecursor(templateName);
	const constructed = precursor.constructFont(
		{...values},
		subset || defaultSubset(fontJson),
	);

	const buffer = fontToSfntTable({
		...constructed,
		fontFamily: {en: familyName},
		fontSubfamily: {en: styleName},
		postScriptName: {},
		unitsPerEm: 1024,
		usWeightClass: weight,
		usWidthClass: width,
		manufacturer: 'Prototypo',
		manufacturerURL: 'https://prototypo.io/',
		designer: '',
		designerURL: '',
		fsSelection: getfsSelection(weight, italic),
	});

	return {buffer, glyphCount: constructed.glyphs.length};
}

export function writeOtfFile(buffer, outPath) {
	const abs = resolvePath(outPath);
	const allowedRoots = [REPO_ROOT, tmpdir()];
	if (process.env.PROTOTYPO_EXPORT_DIR) {
		allowedRoots.push(resolvePath(process.env.PROTOTYPO_EXPORT_DIR));
	}
	const allowed = allowedRoots.some(
		(root) => abs === root || abs.startsWith(`${root}/`),
	);
	if (!allowed) {
		throw new Error(`Refusing to write outside the repo: ${outPath}`);
	}
	mkdirSync(dirname(abs), {recursive: true});
	writeFileSync(abs, Buffer.from(buffer));
	return abs;
}
