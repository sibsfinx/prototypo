export function controlInitsFromControls(controls = []) {
	const inits = {};

	(controls || []).forEach((group) => {
		(group.parameters || []).forEach((param) => {
			inits[param.name] = param.init;
		});
	});

	return inits;
}
