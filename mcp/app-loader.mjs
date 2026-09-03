import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import * as babel from '@babel/core';

function needsJsExtension(specifier) {
	if (
		specifier.endsWith('.js')
		|| specifier.endsWith('.json')
		|| specifier.endsWith('.mjs')
		|| specifier.endsWith('.ts')
	) {
		return false;
	}

	if (specifier.startsWith('lodash/')) {
		return true;
	}

	return specifier.startsWith('.') || specifier.startsWith('/');
}

export async function resolve(specifier, context, nextResolve) {
	if (needsJsExtension(specifier)) {
		try {
			return await nextResolve(`${specifier}.js`, context);
		}
		catch {
			return nextResolve(specifier, context);
		}
	}

	return nextResolve(specifier, context);
}

function shouldTransform(url) {
	return url.includes('/app/scripts/') && url.endsWith('.js');
}

export async function load(url, context, nextLoad) {
	if (!shouldTransform(url)) {
		return nextLoad(url, context);
	}

	const filename = fileURLToPath(url);
	const source = readFileSync(filename, 'utf8');
	const result = babel.transformSync(source, {
		filename,
		sourceType: 'module',
		babelrc: false,
		configFile: false,
		presets: [
			['@babel/preset-flow', {all: true}],
		],
		plugins: ['@babel/plugin-proposal-class-properties'],
	});

	return {
		format: 'module',
		source: result.code,
		shortCircuit: true,
	};
}
