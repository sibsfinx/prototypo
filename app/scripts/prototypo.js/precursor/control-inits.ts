interface ControlParameter {
	name: string;
	init: unknown;
}

interface ControlGroup {
	parameters?: ControlParameter[];
}

export function controlInitsFromControls(
	controls: ControlGroup[] = [],
): Record<string, unknown> {
	const inits: Record<string, unknown> = {};

	(controls || []).forEach((group) => {
		(group.parameters || []).forEach((param) => {
			inits[param.name] = param.init;
		});
	});

	return inits;
}
