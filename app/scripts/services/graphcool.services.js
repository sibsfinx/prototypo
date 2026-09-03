import {ApolloClient} from 'react-apollo';

import {ensureLocalSession, executeLocalQuery} from './local-api';

ensureLocalSession();

const networkInterface = {
	query(request) {
		try {
			const data = executeLocalQuery(request.query, request.variables || {});

			return Promise.resolve({data});
		}
		catch (error) {
			console.error('[local-api] GraphQL error', error);
			return Promise.resolve({
				data: null,
				errors: [{message: error.message}],
			});
		}
	},
};

const apolloClient = new ApolloClient({
	networkInterface,
	dataIdFromObject: object => object && object.id,
	connectToDevTools: true,
});

export const tmpUpload = async (file, name = 'font') => ({
	id: `local-file-${Date.now()}`,
	url: typeof file === 'string' ? file : URL.createObjectURL(file),
	name,
});

export default apolloClient;
