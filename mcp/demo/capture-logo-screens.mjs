#!/usr/bin/env node
import {createServer} from 'http';
import {readFileSync, existsSync, mkdirSync, copyFileSync} from 'fs';
import {join, dirname, extname} from 'path';
import {fileURLToPath} from 'url';
import {chromium} from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const artifactShots = '/opt/cursor/artifacts/screenshots';
const artifactLogos = '/opt/cursor/artifacts/logos';
const demoLogos = join(__dirname, 'images/logos');

mkdirSync(artifactShots, {recursive: true});
mkdirSync(artifactLogos, {recursive: true});
mkdirSync(demoLogos, {recursive: true});

const mime = {
	'.html': 'text/html; charset=utf-8',
	'.otf': 'font/otf',
	'.css': 'text/css',
	'.js': 'text/javascript',
};

const server = createServer((req, res) => {
	const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
	const filePath = join(root, urlPath === '/' ? 'logo.html' : urlPath);
	if (!filePath.startsWith(root) || !existsSync(filePath)) {
		res.writeHead(404);
		res.end('not found');
		return;
	}
	res.writeHead(200, {'Content-Type': mime[extname(filePath)] || 'application/octet-stream'});
	res.end(readFileSync(filePath));
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const {port} = server.address();
const base = `http://127.0.0.1:${port}`;

const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: {width: 1440, height: 900},
	deviceScaleFactor: 2,
});

await page.goto(`${base}/logo.html`, {waitUntil: 'networkidle'});
await page.addStyleTag({content: 'body.capture .rail { display: none !important; }'});
await page.evaluate(() => document.body.classList.add('capture'));
// Wait for webfonts
await page.evaluate(async () => {
	await document.fonts.ready;
	await new Promise((r) => setTimeout(r, 400));
});

const cuts = [
	{id: 'ultra-bold', shot: 'skoljka-logo-54-ultra-bold.png', logo: '54-ultra-bold.png'},
	{id: 'humanist', shot: 'skoljka-logo-54-humanist.png', logo: '54-humanist.png'},
	{id: 'ultra-contrast', shot: 'skoljka-logo-54-ultra-contrast.png', logo: '54-ultra-contrast.png'},
	{id: 'fell-contrast', shot: 'skoljka-logo-54-fell-contrast.png', logo: '54-fell-contrast.png'},
	{id: 'elegant', shot: 'skoljka-logo-54-elegant.png', logo: '54-elegant.png'},
];

const results = [];
for (const cut of cuts) {
	const el = page.locator(`#${cut.id}`);
	await el.scrollIntoViewIfNeeded();
	await page.waitForTimeout(200);
	const shotPath = join(artifactShots, cut.shot);
	await el.screenshot({path: shotPath, type: 'png'});
	copyFileSync(shotPath, join(demoLogos, cut.shot));

	// Transparent-ish logo crop of the mark alone on its plate bg
	const mark = el.locator('.mark');
	const logoPath = join(artifactLogos, cut.logo);
	await mark.screenshot({path: logoPath, type: 'png'});
	copyFileSync(logoPath, join(demoLogos, cut.logo));

	results.push({cut: cut.id, screenshot: shotPath, logo: logoPath});
}

// Full page overview (all three stacked)
const overview = join(artifactShots, 'skoljka-logo-54-overview.png');
await page.screenshot({path: overview, fullPage: true, type: 'png'});
copyFileSync(overview, join(demoLogos, 'skoljka-logo-54-overview.png'));

await browser.close();
server.close();
console.log(JSON.stringify({results, overview}, null, 2));
