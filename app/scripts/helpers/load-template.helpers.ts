export async function loadTemplateJson(
	templateName: string,
): Promise<Record<string, unknown>> {
	const response = await fetch(`/templates/${templateName}/font.json`);

	if (!response.ok) {
		throw new Error(`Template ${templateName} not found (${response.status})`);
	}

	return response.json() as Promise<Record<string, unknown>>;
}
