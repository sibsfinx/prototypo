import {defineConfig, devices} from '@playwright/test';
import {defineBddConfig} from 'playwright-bdd';

const testDir = defineBddConfig({
	features: 'features/**/*.feature',
	steps: 'features/steps/**/*.js',
	outputDir: '.features-gen',
});

const chrome = devices['Desktop Chrome'];
const isCi = Boolean(process.env.CI);
const baseURL = 'http://localhost:9000';

export default defineConfig({
	testDir,
	timeout: isCi ? 240_000 : 180_000,
	expect: {timeout: isCi ? 60_000 : 30_000},
	fullyParallel: false,
	workers: 1,
	retries: isCi ? 1 : 0,
	reporter: isCi
		? [['github'], ['html', {open: 'never', outputFolder: 'playwright-report'}]]
		: [['list']],
	use: {
		...chrome,
		baseURL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		viewport: {width: 1600, height: 1200},
		userAgent: chrome.userAgent,
		isMobile: false,
		hasTouch: false,
	},
	projects: [
		{
			name: 'chromium',
			use: {browserName: 'chromium'},
		},
	],
	webServer: {
		command: 'pnpm start',
		url: baseURL,
		reuseExistingServer: !isCi,
		timeout: 180_000,
		stdout: 'pipe',
		stderr: 'pipe',
	},
});
