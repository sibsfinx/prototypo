#!/usr/bin/env node
/**
 * Packs the five parametric base fonts (CoffeeScript sources + compiled
 * font.json + build scripts + library preview SVGs) into
 * artifacts/base-font-sources.zip
 */
import {mkdirSync, cpSync, writeFileSync, existsSync, readdirSync, statSync, rmSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import {spawnSync} from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const TEMPLATES = [
	{
		libraryName: 'Spectral',
		npm: 'gfnt.ptf',
		github: 'https://github.com/byte-foundry/spectral.ptf',
		branch: 'feat/simplified-parameters',
		sha: '4a09f9eab1e5fe54b2057761a2ef621de602de55',
		license: 'SIL Open Font License 1.1 (Production Type)',
	},
	{
		libraryName: 'Antique Gothic',
		npm: 'antique.ptf',
		github: 'https://github.com/byte-foundry/antique.ptf',
		branch: 'feat/simplified-parameters',
		sha: 'e9e8ede4fc96a8bc76f599e315c4508cfb8a97cb',
		license: 'CC0 1.0',
		srcFamilyName: 'French Antique',
	},
	{
		libraryName: 'Prototypo Elzevir',
		npm: 'elzevir.ptf',
		github: 'https://github.com/byte-foundry/elzevir.ptf',
		branch: 'feat/simplified-parameters',
		sha: '8f443fde29f396f75eba29e77dd3ddc1a6f98a74',
		license: 'CC0 1.0',
	},
	{
		libraryName: 'Prototypo Grotesk',
		npm: 'venus.ptf',
		github: 'https://github.com/byte-foundry/venus.ptf',
		branch: 'feat/simplified-params',
		sha: 'beca948c3859a5f9e7857394dfd0f4c45911a6ac',
		license: 'CC0 1.0',
	},
	{
		libraryName: 'Prototypo Fell',
		npm: 'john-fell.ptf',
		github: 'https://github.com/byte-foundry/john-fell.ptf',
		branch: 'feat/simplified-parameters',
		sha: 'c0b830bf5e29325e56e56b142d871c725c25b501',
		license: 'CC0 1.0',
		srcFamilyName: 'Prototypo John Fell',
	},
];

const HOW_TO_EDIT = `HOW TO EDIT THE BASE FONTS
===========================

There are no .otf / .ttf / .woff / .ufo / .glyphs files for these bases.
They are parametric typefaces (.ptf). Outlines are cubic beziers only after
the editor evaluates formulas at runtime.

What the library shows
----------------------
Library name            npm package     GitHub repo                         templateName
Spectral                gfnt.ptf        byte-foundry/spectral.ptf           gfnt.ptf
Antique Gothic          antique.ptf     byte-foundry/antique.ptf            antique.ptf
Prototypo Elzevir       elzevir.ptf     byte-foundry/elzevir.ptf            elzevir.ptf
Prototypo Grotesk       venus.ptf       byte-foundry/venus.ptf              venus.ptf
Prototypo Fell          john-fell.ptf   byte-foundry/john-fell.ptf          john-fell.ptf

Pinned in prototypo/package.json on the feat/simplified-parameters
(or feat/simplified-params for Grotesk) branches. SHAs are in MANIFEST.txt.

Where the real source lives
---------------------------
Each package:

  src/info.coffee          family name, glyph-order, tags
  src/controls.coffee      left-rail sliders (Width, Slant, thickness, …)
  src/lib.coffee           derived params (capHeight = xHeight + capDelta, …)
  src/presets.coffee       named preset value sets
  src/glyphs/**/*.coffee   one file per glyph / component / diacritic
  src/images/*.svg         alternate-glyph thumbnails (Antique only)

  dist/font.json           compiled payload the editor actually loads
  dist/font_free.json      A–Z / a–z subset
  gulpfile.js              CoffeeScript -> JSON build
  jsufonify.js             merges coffee modules into one JSUfon/JSON font
  operationalyzer.js       wraps expressions as {_operation, _parameters}
  bakeOpOrder.js           precomputes solving order for the precursor

Glyph coffee is the bezier source. Example (Grotesk A):

  src/glyphs/uppercases/A_cap.coffee

  contours:               skeleton paths (not final cubic outlines)
    nodes:
      x, y                parametric expressions (width, thickness, …)
      dirIn / dirOut      handle angles in radians
      type: 'smooth'|'line'
      expand:             stroke the skeleton into two outlines
        width, angle, distr

Components (serifs, diacritics) are separate coffee files referenced from
the parent glyph. There is no FontLab / Glyphs.app source in these repos.

Build a package after editing
-----------------------------
From inside a cloned .ptf repo (Node 10-era gulp stack: coffee, gulp-concat):

  npm install
  npx gulp build          # writes dist/font.json

The gulp pipeline is:

  src/**/*.coffee
    -> coffee (bare)
    -> operationalyzer   (xHeight + 10  becomes  {_operation: "xHeight + 10", …})
    -> concat
    -> jsufonify
    -> bakeOpOrder
    -> dist/font.json

Load it in this Prototypo fork
------------------------------
1. Fast local swap (no publish):

     cp path/to/your.ptf/dist/font.json \\
        node_modules/<npm>/dist/font.json
     pnpm start

   scripts/copy-templates.mjs copies
   node_modules/<npm>/dist/font.json -> public/templates/<npm>/font.json
   on every start. The app fetches /templates/<name>/font.json.

2. Lasting change: bump the GitHub ref in package.json, pnpm install,
   then start. templateName in
   app/scripts/stores/creation.stores.jsx must stay in sync with the
   folder name under public/templates/.

3. Editing only sliders / inits: src/controls.coffee then rebuild.
   The dashboard reads controls[].parameters[].init from font.json.

4. Editing a glyph outline: the matching file under src/glyphs/, then
   rebuild. Do not hand-edit dist/font.json unless you accept losing
   the coffee source of truth.

Runtime (how beziers appear on the canvas)
------------------------------------------
app/scripts/prototypo.js/precursor/FontPrecursor.js loads font.json.
Glyph.js / Path.js / ExpandingNode.js evaluate the operations, expand
skeleton nodes, and emit cubic bezier contours. That step is not stored
on disk.

What this zip is not
--------------------
- Not a UFO or Glyphs source.
- Not the user's saved families (those live in localStorage
  prototypo-local-db).
- Not generated OTF exports (File > export in the editor).

Licenses
--------
Spectral: SIL OFL 1.1 (Production Type) — see Spectral__gfnt.ptf/LICENSE
Others: CC0 1.0 — see each package LICENSE
`;

function walkFiles(dir, acc = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const st = statSync(p);
		if (st.isDirectory()) {
			walkFiles(p, acc);
		}
		else {
			acc.push(p);
		}
	}
	return acc;
}

const staging = join(root, '.tmp', 'base-font-sources');
const artifacts = join(root, 'artifacts');
const zipPath = join(artifacts, 'base-font-sources.zip');

rmSync(staging, {recursive: true, force: true});
mkdirSync(staging, {recursive: true});
mkdirSync(artifacts, {recursive: true});

const manifestLines = [
	'Base font sources packed from the Prototypo checkout.',
	`Packed at: ${new Date().toISOString()}`,
	'',
	'No OTF/TTF/UFO/Glyphs sources exist. Editable source is CoffeeScript.',
	'',
];

for (const t of TEMPLATES) {
	const srcRoot = join(root, 'node_modules', t.npm);
	if (!existsSync(srcRoot)) {
		throw new Error(`Missing ${srcRoot}. Run pnpm install.`);
	}
	const folder = `${t.libraryName.replace(/ /g, '-')}__${t.npm}`;
	const dest = join(staging, folder);
	mkdirSync(dest, {recursive: true});

	const copyIf = (rel) => {
		const from = join(srcRoot, rel);
		if (existsSync(from)) {
			cpSync(from, join(dest, rel), {recursive: true});
		}
	};

	copyIf('src');
	copyIf('dist');
	copyIf('gulpfile.js');
	copyIf('jsufonify.js');
	copyIf('operationalyzer.js');
	copyIf('bakeOpOrder.js');
	copyIf('naive.js');
	copyIf('README.md');
	copyIf('LICENSE');
	copyIf('package.json');

	const coffee = walkFiles(join(dest, 'src')).filter((p) => p.endsWith('.coffee'));
	const glyphCoffee = coffee.filter((p) => p.includes(`${join('src', 'glyphs')}`));
	const distJson = existsSync(join(dest, 'dist'))
		? readdirSync(join(dest, 'dist')).filter((n) => n.endsWith('.json'))
		: [];

	manifestLines.push(`${t.libraryName}`);
	manifestLines.push(`  library label:     ${t.libraryName}`);
	if (t.srcFamilyName) {
		manifestLines.push(`  src familyName:    ${t.srcFamilyName}`);
	}
	manifestLines.push(`  npm / templateName:${t.npm}`);
	manifestLines.push(`  github:            ${t.github}/tree/${t.sha}`);
	manifestLines.push(`  branch:            ${t.branch}`);
	manifestLines.push(`  license:           ${t.license}`);
	manifestLines.push(`  coffee files:      ${coffee.length} (glyphs ${glyphCoffee.length})`);
	manifestLines.push(`  dist json:         ${distJson.join(', ')}`);
	manifestLines.push('');
}

const svgDest = join(staging, 'library-ui-svgs');
mkdirSync(svgDest, {recursive: true});
const imgDir = existsSync(join(root, 'public', 'images'))
	? join(root, 'public', 'images')
	: join(root, 'app', 'images');
for (const name of readdirSync(imgDir)) {
	if (
		/(preview|template-|sample)/.test(name)
		&& name.endsWith('.svg')
	) {
		cpSync(join(imgDir, name), join(svgDest, name));
	}
}

writeFileSync(join(staging, 'HOW_TO_EDIT.txt'), HOW_TO_EDIT);
writeFileSync(join(staging, 'MANIFEST.txt'), `${manifestLines.join('\n')}\n`);

rmSync(zipPath, {force: true});
const zipped = spawnSync(
	'zip',
	['-r', '-q', zipPath, '.'],
	{cwd: staging, stdio: 'inherit'},
);
if (zipped.status !== 0) {
	throw new Error('zip failed');
}

const zipStat = statSync(zipPath);
console.log(`Wrote ${zipPath} (${(zipStat.size / (1024 * 1024)).toFixed(1)} MB)`);
