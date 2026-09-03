import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'url';
import fs from 'fs';
import * as babel from '@babel/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const babelOptions = {
	presets: [
		['@babel/preset-flow', {all: true}],
		['@babel/preset-env', {modules: false}],
		'@babel/preset-react',
	],
	plugins: ['@babel/plugin-proposal-class-properties'],
};

function stripFlow(code, filename) {
	return babel.transformSync(code, {
		filename,
		presets: [
			['@babel/preset-flow', {all: true}],
			'@babel/preset-react',
		],
		plugins: ['@babel/plugin-proposal-class-properties'],
		babelrc: false,
		configFile: false,
		sourceMaps: true,
		compact: false,
	});
}

function flowEsbuildPlugin() {
	return {
		name: 'strip-flow-esbuild',
		setup(build) {
			build.onLoad({filter: /\/app\/.*\.(js|jsx)$/}, async (args) => {
				const source = await fs.promises.readFile(args.path, 'utf8');
				const result = stripFlow(source, args.path);

				return {
					contents: result.code,
					loader: args.path.endsWith('.jsx') ? 'jsx' : 'js',
				};
			});
		},
	};
}

const env = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	TESTING_FONT: process.env.TESTING_FONT || false,
	MERGE: process.env.MERGE || false,
	LIBRARY: process.env.LIBRARY || '',
	__SHOW_ACTION__: process.env.__SHOW_ACTION__ || '',
	__SHOW_RENDER__: process.env.__SHOW_RENDER__ || '',
};

export default defineConfig({
	plugins: [
		react({
			include: '**/*.{jsx,js}',
			jsxRuntime: 'classic',
			babel: babelOptions,
		}),
	],
	root: 'app',
	publicDir: '../public',
	build: {
		outDir: '../dist',
		emptyOutDir: true,
		sourcemap: true,
		rollupOptions: {
			input: path.resolve(__dirname, 'app/index.html'),
		},
	},
	resolve: {
		extensions: ['.js', '.jsx', '.json'],
		alias: {
			'please-wait': path.resolve(
				__dirname,
				'app/vendor/please-wait-wrapper.js',
			),
			'tutorial-content': path.resolve(
				__dirname,
				'app/vendor/tutorial-content-stub.js',
			),
			'lodash-es': 'lodash',
			'lodash.assign': 'lodash/assign',
			'lodash.camelcase': 'lodash/camelCase',
			'lodash.clone': 'lodash/clone',
			'lodash.clonedeep': 'lodash/cloneDeep',
			'lodash.cond': 'lodash/cond',
			'lodash.create': 'lodash/create',
			'lodash.debounce': 'lodash/debounce',
			'lodash.deburr': 'lodash/deburr',
			'lodash.defaultsdeep': 'lodash/defaultsDeep',
			'lodash.escape': 'lodash/escape',
			'lodash.flattendeep': 'lodash/flattenDeep',
			'lodash.isarguments': 'lodash/isArguments',
			'lodash.isarray': 'lodash/isArray',
			'lodash.isplainobject': 'lodash/isPlainObject',
			'lodash.isstring': 'lodash/isString',
			'lodash.keys': 'lodash/keys',
			'lodash.mapvalues': 'lodash/mapValues',
			'lodash.memoize': 'lodash/memoize',
			'lodash.merge': 'lodash/merge',
			'lodash.mergewith': 'lodash/mergeWith',
			'lodash.pick': 'lodash/pick',
			'lodash.restparam': 'lodash/rest',
			'lodash.some': 'lodash/some',
			'lodash.sortby': 'lodash/sortBy',
			'lodash.template': 'lodash/template',
			'lodash.templatesettings': 'lodash/templateSettings',
			'lodash.toarray': 'lodash/toArray',
			'lodash.uniq': 'lodash/uniq',
			'lodash.words': 'lodash/words',
		},
	},
	server: {
		port: 9000,
		host: '0.0.0.0',
		open: false,
		fs: {
			allow: [path.resolve(__dirname)],
		},
	},
	worker: {
		format: 'es',
		plugins: () => [
			react({
				include: '**/*.{jsx,js}',
				jsxRuntime: 'classic',
				babel: {
					presets: [
						['@babel/preset-flow', {all: true}],
						['@babel/preset-env', {modules: false}],
					],
					plugins: ['@babel/plugin-proposal-class-properties'],
				},
			}),
		],
	},
	optimizeDeps: {
		entries: ['index.html'],
		exclude: ['levelup', 'tutorial-content'],
		esbuildOptions: {
			loader: {
				'.js': 'jsx',
			},
			plugins: [flowEsbuildPlugin()],
		},
	},
	define: Object.fromEntries(
		Object.entries(env).map(([key, value]) => [
			`process.env.${key}`,
			JSON.stringify(value),
		]),
	),
});
