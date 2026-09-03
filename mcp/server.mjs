#!/usr/bin/env node
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {
	listTemplates,
	getControls,
	createFamily,
	listFamilies,
	getVariantValues,
	setParam,
	defaultDbPath,
} from './lib.mjs';

function text(payload) {
	return {
		content: [{type: 'text', text: JSON.stringify(payload, null, 2)}],
	};
}

function fail(error) {
	return {
		isError: true,
		content: [{type: 'text', text: error.message || String(error)}],
	};
}

const dbPath = defaultDbPath();

const server = new McpServer({
	name: 'prototypo',
	version: '1.0.0',
});

server.tool('list_templates', 'List parametric base fonts (Spectral, Grotesk, …)', {}, async () =>
	text(listTemplates()),
);

server.tool(
	'get_controls',
	'Slider definitions for a template (Width, Slant, …)',
	{templateName: z.string()},
	async ({templateName}) => {
		try {
			return text(getControls(templateName));
		}
		catch (error) {
			return fail(error);
		}
	},
);

server.tool(
	'create_family',
	'Create a family from a template and seed Regular values from control inits',
	{
		name: z.string(),
		templateName: z.string(),
	},
	async ({name, templateName}) => {
		try {
			return text(createFamily({name, templateName}, dbPath));
		}
		catch (error) {
			return fail(error);
		}
	},
);

server.tool('list_families', 'List families in the Node-side local DB file', {}, async () =>
	text(listFamilies(dbPath)),
);

server.tool(
	'get_variant_values',
	'Read stored slider values for a variant',
	{variantId: z.string()},
	async ({variantId}) => {
		try {
			return text(getVariantValues(variantId, dbPath));
		}
		catch (error) {
			return fail(error);
		}
	},
);

server.tool(
	'set_param',
	'Set one parametric slider on a variant (e.g. width, slant)',
	{
		variantId: z.string(),
		name: z.string(),
		value: z.number(),
	},
	async ({variantId, name, value}) => {
		try {
			return text(setParam({variantId, name, value}, dbPath));
		}
		catch (error) {
			return fail(error);
		}
	},
);

const transport = new StdioServerTransport();
await server.connect(transport);
