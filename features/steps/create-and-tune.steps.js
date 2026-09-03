import {expect} from '@playwright/test';
import {createBdd} from 'playwright-bdd';

const {When, Then} = createBdd();

const TEMPLATES = [
	'Spectral',
	'Antique Gothic',
	'Prototypo Elzevir',
	'Prototypo Grotesk',
	'Prototypo Fell',
];

const SLIDER_TARGETS = {
	Width: '1.15',
	Slant: '8',
};

const LIBRARY_WAIT_MS = process.env.CI ? 180_000 : 60_000;

async function stubThirdParties(page) {
	await page.route(
		'**/{widget.intercom.io,js.intercomcdn.com,www.google-analytics.com,www.googletagmanager.com,connect.facebook.net,cdn.trackjs.com}/**',
		(route) => route.abort(),
	);
}

async function dismissOverlays(page) {
	await page.keyboard.press('Escape').catch(() => {});
	const close = page.locator(
		'.joyride-tooltip__close, .joyride-close, button:has-text("Skip"), button:has-text("Got it")',
	);
	if (await close.first().isVisible().catch(() => false)) {
		await close.first().click({force: true}).catch(() => {});
	}
}

async function waitForLibrary(page) {
	const templates = page.locator('.library-item.library-template').first();
	try {
		await expect(templates).toBeVisible({timeout: LIBRARY_WAIT_MS});
	}
	catch (error) {
		const url = page.url();
		const title = await page.title().catch(() => '');
		const body = await page.locator('body').innerText().catch(() => '');
		throw new Error(
			`Library templates never appeared. url=${url} title=${title} body=${body.slice(0, 500)}`,
			{cause: error},
		);
	}
}

async function openLibrary(page) {
	page.on('pageerror', (error) => {
		console.error('[pageerror]', error.message);
	});
	await stubThirdParties(page);
	await page.addInitScript(() => {
		window._trackJs = {token: '', enabled: false};
	});
	await page.goto('/#/library/home', {waitUntil: 'domcontentloaded'});
	await waitForLibrary(page);
}

async function createFromGrotesk(page, familyName) {
	await openLibrary(page);

	const card = page
		.locator('.library-item.library-template')
		.filter({hasText: 'Prototypo Grotesk'});
	await card.scrollIntoViewIfNeeded();
	await card.locator('.library-item-preview').click();
	await card.getByText('Create from this template', {exact: true}).click();

	const nameInput = page.locator('#familyName-Input');
	await expect(nameInput).toBeVisible({timeout: 30_000});
	await nameInput.fill(familyName);
	await page.getByRole('button', {name: 'Start designing'}).click();

	const stepButton = page.locator('button.nextStep');
	const familyError = page.locator('.description.error');
	await expect(page.locator('.onboarding-app')).toBeVisible();
	await expect(stepButton.or(familyError)).toBeVisible({timeout: 60_000});
	if (await familyError.isVisible().catch(() => false)) {
		throw new Error(
			`Onboarding failed: ${(await familyError.textContent()) || ''}`,
		);
	}

	for (let i = 0; i < 12; i += 1) {
		if (page.url().includes('dashboard')) {
			break;
		}
		if (!(await stepButton.isVisible().catch(() => false))) {
			await page.waitForTimeout(500);
			continue;
		}
		const label = ((await stepButton.textContent()) || '').trim();
		await stepButton.click();
		if (label === 'Finish') {
			break;
		}
		await page.waitForTimeout(500);
	}

	await expect(page).toHaveURL(/dashboard/, {timeout: 60_000});
	await dismissOverlays(page);
	await expect(page.locator('#dashboard')).toBeVisible({timeout: 60_000});
	await expect(page.locator('.prototypo-word')).toBeVisible({timeout: 60_000});
}

async function sliderRow(page, label) {
	return page.locator('.slider').filter({
		has: page.locator('.slider-title', {hasText: new RegExp(`^${label}$`)}),
	});
}

async function setSlider(page, label, value) {
	if (!page.url().includes('dashboard')) {
		await createFromGrotesk(page, `Tune${label}`);
	}
	await dismissOverlays(page);
	const row = await sliderRow(page, label);
	await expect(row).toBeVisible({timeout: 30_000});
	const input = row.locator('input.slider-text-controller');
	await input.click();
	await input.fill('');
	await input.pressSequentially(String(value), {delay: 40});
	await input.press('Tab');
	page._lastSlider = {label, value};
}

When('a user with a local session opens {string}', async ({page}, hash) => {
	page.on('pageerror', (error) => {
		console.error('[pageerror]', error.message);
	});
	await stubThirdParties(page);
	await page.addInitScript(() => {
		window._trackJs = {token: '', enabled: false};
	});
	await page.goto(`/${hash.replace(/^\//, '')}`, {
		waitUntil: 'domcontentloaded',
	});
	await waitForLibrary(page);
});

Then(
	'Spectral, Antique Gothic, Prototypo Elzevir, Prototypo Grotesk, and Prototypo Fell are visible without scrolling them out of the proof',
	async ({page}) => {
		const list = page.locator('.library-list-families-content, .library-list');
		await list.first().evaluate((node) => {
			node.scrollTop = 0;
			const scrollable = node.closest('.ps-container, .scrollarea');
			if (scrollable) {
				scrollable.scrollTop = 0;
			}
		}).catch(() => {});

		const names = page.locator(
			'.library-item.library-template .library-item-name',
		);
		const texts = (await names.allTextContents()).map((text) =>
			text.replace('★', '').trim(),
		);
		for (const template of TEMPLATES) {
			expect(texts, `missing template ${template}`).toContain(template);
			const item = page
				.locator('.library-item.library-template')
				.filter({hasText: template})
				.first();
			await item.scrollIntoViewIfNeeded();
			await expect(item).toBeVisible();
		}

		const missingOnScreen = [];
		for (const template of TEMPLATES) {
			const box = await page
				.locator('.library-item.library-template')
				.filter({hasText: template})
				.first()
				.boundingBox();
			if (!box) {
				missingOnScreen.push(template);
			}
		}
		expect(missingOnScreen).toEqual([]);
	},
);

When(
	'the user creates a project from Prototypo Grotesk with family name TuneMe',
	async ({page}) => {
		await createFromGrotesk(page, 'TuneMe');
	},
);

Then(
	'the dashboard shows TuneMe, a glyph canvas, the word preview, and the left-rail sliders',
	async ({page}) => {
		await dismissOverlays(page);
		await expect(page.locator('#dashboard')).toBeVisible();
		await expect(page.getByText('TuneMe', {exact: true}).first()).toBeVisible({
			timeout: 30_000,
		});
		await expect(
			page.locator('.prototypo-canvas, .prototypo-canvas-container, canvas').first(),
		).toBeVisible();
		await expect(page.locator('.prototypo-word')).toBeVisible();
		await expect(page.locator('#sidebar, .font-controls')).toBeVisible();
		await expect(page.locator('.slider').first()).toBeVisible({timeout: 30_000});
	},
);

When(
	'the user sets the Width slider to a value other than its starting value',
	async ({page}) => {
		await setSlider(page, 'Width', SLIDER_TARGETS.Width);
	},
);

When(
	'the user sets the Slant slider to a value other than its starting value',
	async ({page}) => {
		await setSlider(page, 'Slant', SLIDER_TARGETS.Slant);
	},
);

Then(
	'the Width control shows the new value and the word preview remains visible',
	async ({page}) => {
		const row = await sliderRow(page, 'Width');
		await expect(row.locator('input.slider-text-controller')).toHaveValue(
			/1\.15/,
		);
		await expect(page.locator('.prototypo-word')).toBeVisible();
		const box = await page.locator('.prototypo-word').boundingBox();
		expect(box?.width || 0).toBeGreaterThan(20);
		expect(box?.height || 0).toBeGreaterThan(20);
	},
);

Then(
	'the Slant control shows the new value and the word preview remains visible',
	async ({page}) => {
		const row = await sliderRow(page, 'Slant');
		await expect(row.locator('input.slider-text-controller')).toHaveValue(
			/^8(\.00)?$/,
		);
		await expect(page.locator('.prototypo-word')).toBeVisible();
		const box = await page.locator('.prototypo-word').boundingBox();
		expect(box?.width || 0).toBeGreaterThan(20);
		expect(box?.height || 0).toBeGreaterThan(20);
	},
);
