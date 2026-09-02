import {defineConfig, devices} from '@playwright/test';
import {defineBddConfig} from 'playwright-bdd';

const testDir = defineBddConfig({
	features: 'features/**/*.feature',
	steps: 'features/steps/**/*.js',
	outputDir: '.features-gen',
});

export default defineConfig({
	testDir,
	timeout: 180_000,
	expect: {timeout: 30_000},
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI
		? [['github'], ['html', {open: 'never'}]]
		: [['list']],
	use: {
		baseURL: 'http://127.0.0.1:9000',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		viewport: {width: 1600, height: 1200},
		...devices['Desktop Chrome'],
	},
	projects: [
		{
			name: 'chromium',
			use: {browserName: 'chromium'},
		},
	],
	webServer: {
		command: 'pnpm start',
		url: 'http://127.0.0.1:9000',
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
		stdout: 'pipe',
		stderr: 'pipe',
	},
});
