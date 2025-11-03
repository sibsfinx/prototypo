import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				plugins: ['react-hot-loader/babel'],
			},
		}),
	],
	root: 'app',
	publicDir: '../public',
	build: {
		outDir: '../dist',
		emptyOutDir: true,
		sourcemap: true,
		rollupOptions: {
			input: {
				main: path.resolve(__dirname, 'app/index.html'),
				iframe: path.resolve(__dirname, 'app/iframe.html'),
			},
		},
	},
	resolve: {
		extensions: ['.js', '.jsx', '.json'],
		alias: {
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
	},
	optimizeDeps: {
		exclude: ['levelup'],
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
		'process.env.TESTING_FONT': JSON.stringify(process.env.TESTING_FONT || false),
		'process.env.MERGE': JSON.stringify(process.env.MERGE || false),
	},
});
