function needsJsExtension(specifier) {
	if (specifier.endsWith('.js') || specifier.endsWith('.json') || specifier.endsWith('.mjs')) {
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
