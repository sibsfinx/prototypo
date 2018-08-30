import React from 'react';
import {Link} from 'react-router';
import Lifespan from 'lifespan';
import {graphql, gql, compose} from 'react-apollo';
import {LibrarySidebarRight} from './library-sidebars.components';
import {tmpUpload} from '../../services/graphcool.services';
import LocalClient from '../../stores/local-client.stores';
import FontUpdater from '../font-updater.components';
import LibraryButton from './library-button.components';
import {
	libraryQuery,
	presetQuery,
	libraryUserQuery,
} from './library-main.components';

class LibraryHostingCreate extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hostedDomains: [],
			domain: '',
			autocompleteText: '',
			autocompleteSuggestions: [],
			addedFonts: [],
			errors: {
				domain: false,
				hostedFonts: false,
				hosting: false,
			},
			loading: false,
		};
		this.updateAutocompleteSuggestions = this.updateAutocompleteSuggestions.bind(
			this,
		);
		this.addSuggestion = this.addSuggestion.bind(this);
		this.hostFonts = this.hostFonts.bind(this);
		this.removeAddedFont = this.removeAddedFont.bind(this);
		this.checkIntegrity = this.checkIntegrity.bind(this);
		this.removeDuplicates = this.removeDuplicates.bind(this);
	}
	async componentWillMount() {
		this.client = LocalClient.instance();
		this.lifespan = new Lifespan();

		const prototypoStore = await this.client.fetch('/prototypoStore');

		this.client.getStore('/prototypoStore', this.lifespan).onUpdate((head) => {
			this.setState({
				buffers: head.toJS().d.hostingBuffers,
			});
		});
		this.setState({
			templateInfos: await prototypoStore.head.toJS().templateList,
			templatesData: await prototypoStore.head.toJS().templatesData,
		});
	}
	async componentDidUpdate(prevState) {
		if (
			prevState.buffers !== this.state.buffers
			&& this.state.status === 'generating'
		) {
			this.setState({status: 'uploading'});

			const urls = await Promise.all(
				this.state.buffers.map(async (buffer, index) =>
					tmpUpload(
						new Blob([new Uint8Array(buffer)]),
						`${this.state.addedFonts[index]} ${
							this.state.addedFonts[index].variant.name
						}`,
					),
				),
			);
			const abstractedFontCreated = this.state.addedFonts
				.filter(f => f.variant.abstractedFont && f.variant.abstractedFont.id)
				.map(f => f.variant.abstractedFont.id);
			const abstractedFontIds = await Promise.all(
				this.state.addedFonts
					.filter(
						f => !f.variant.abstractedFont || !f.variant.abstractedFont.id,
					)
					.map(async addedFont =>
						this.props.createAbstractedFont(
							addedFont.abstractedFontMeta.type,
							addedFont.abstractedFontMeta.type === 'VARIANT'
								? addedFont.variant.id
								: undefined,
							addedFont.abstractedFontMeta.template,
							addedFont.abstractedFontMeta.presetId,
							addedFont.abstractedFontMeta.name,
						),
					),
			);

			const allAbstractedFonts = [
				...abstractedFontCreated,
				...abstractedFontIds.map(af => af.data.createAbstractedFont.id),
			];

			const hostedFonts = await Promise.all(
				urls.map(({url}, index) =>
					this.props.hostFont(allAbstractedFonts[index], url),
				),
			);

			this.props
				.createHostedDomain(
					this.state.domain,
					hostedFonts.map(({data}) => data.hostFont.id),
				)
				.then(() => {
					this.props.router.push('/library/hosting');
					clearTimeout(this.state.hostingTimeout);
					this.setState({
						errors: {
							domain: false,
							hostedFonts: false,
							hosting: false,
						},
						hostingTimeout: undefined,
						loading: false,
					});
				});
			this.setState({status: 'hosting'});
		}
	}
	addSuggestion(suggestion, variant) {
		if (
			!this.state.addedFonts.find(
				f => f.id === `${suggestion.id}${variant.id}`,
			)
		) {
			let template;
			let values;
			let templateData;
			let preset;
			let family;
			let glyphs;
			let abstractedFontMeta;

			this.setState({
				errors: {
					domain: false,
					hostedFonts: false,
				},
			});

			switch (suggestion.type) {
			case 'TEMPLATE':
				templateData = this.state.templatesData.find(
					e => e.name === suggestion.templateName,
				);
				glyphs = templateData.glyphs;
				values = templateData.initValues;
				template = templateData.name;
				abstractedFontMeta = {
					type: 'TEMPLATE',
					familyId: undefined,
					template: templateData.name,
					presetId: undefined,
					name: suggestion.name,
				};
				break;
			case 'PRESET':
				preset
						= this.props.presets
						&& this.props.presets.find(p => p.id === suggestion.id);
				values = preset.baseValues;
				template = this.state.templateInfos.find(
					t => preset.template === t.templateName,
				).templateName;
				templateData = this.state.templatesData.find(
					e => e.name === preset.template,
				);
				glyphs = templateData.glyphs;
				abstractedFontMeta = {
					type: 'PRESET',
					familyId: undefined,
					template: undefined,
					presetId: suggestion.id,
					name: suggestion.name,
				};
				break;
			case 'VARIANT':
				family
						= this.props.families
						&& this.props.families.find(p => p.id === suggestion.id);
				templateData = this.state.templatesData.find(
					e => e.name === family.template,
				);
				glyphs = templateData.glyphs;
				values = {
					...templateData.initValues,
					...(typeof variant.values === 'object'
						? variant.values
						: JSON.parse(variant.values)),
				};
				template = this.state.templateInfos.find(
					t => t.templateName === family.template,
				).templateName;
				abstractedFontMeta = {
					type: 'VARIANT',
					familyId: suggestion.id,
					template: undefined,
					presetId: undefined,
					name: suggestion.name,
				};
				break;
			default:
				break;
			}

			this.checkIntegrity({
				...suggestion,
				id: `${suggestion.id}${variant.id}`,
				variant,
				template,
				values,
				glyphs,
				abstractedFontMeta,
			});
		}
	}
	checkIntegrity(font, af) {
		const addedFonts = af || this.state.addedFonts;
		const fontToAdd = font;

		fontToAdd.integrity = undefined;
		fontToAdd.integrityType = undefined;

		if (fontToAdd.type === 'VARIANT') {
			if (
				addedFonts.find(
					f =>
						f.type === 'VARIANT'
						&& f.name === fontToAdd.name
						&& f.abstractedFontMeta.familyId
							!== fontToAdd.abstractedFontMeta.familyId,
				)
			) {
				fontToAdd.integrity
					= 'A project with a similar name already exists in this website';
				fontToAdd.integrityType = 'familyName';
			}
			if (
				addedFonts.find(
					f =>
						f.type === 'VARIANT'
						&& f.abstractedFontMeta.familyId
							=== fontToAdd.abstractedFontMeta.familyId
						&& f.variant.width === fontToAdd.variant.width
						&& f.variant.weight === fontToAdd.variant.weight
						&& f.variant.italic === fontToAdd.variant.italic,
				)
			) {
				fontToAdd.integrity
					= 'A variant with the same metadatas is already added';
				fontToAdd.integrityType = 'metadata';
			}
		}
		this.setState({
			addedFonts: addedFonts.concat([
				{
					...fontToAdd,
				},
			]),
		});
	}

	removeAddedFont(addedFontId) {
		const {addedFonts} = this.state;

		addedFonts.splice(addedFonts.findIndex(f => f.id === addedFontId), 1);
		this.setState({addedFonts});
	}
	removeDuplicates(addedFont) {
		let {addedFonts} = this.state;

		switch (addedFont.integrityType) {
		case 'familyName':
			addedFonts = addedFonts.filter(
				f =>
					!(
						f.type === 'VARIANT'
							&& f.name === addedFont.name
							&& f.abstractedFontMeta.familyId
								!== addedFont.abstractedFontMeta.familyId
					),
			);
			break;
		case 'metadata':
			addedFonts = addedFonts.filter(
				f =>
					!(
						f.type === 'VARIANT'
							&& f.abstractedFontMeta.familyId
								=== addedFont.abstractedFontMeta.familyId
							&& f.variant.width === addedFont.variant.width
							&& f.variant.weight === addedFont.variant.weight
							&& f.variant.italic === addedFont.variant.italic
					),
			);
			break;
		default:
			break;
		}
		this.checkIntegrity(addedFont, addedFonts);
	}
	updateAutocompleteSuggestions(event) {
		this.setState({autocompleteText: event.target.value});
		const autocompleteSuggestions = [];
		const abstractedTemplates = this.props.abstractedTemplates;

		const templateFound
			= this.state.templateInfos
			&& this.state.templateInfos.filter(template =>
				template.familyName
					.toLowerCase()
					.includes(event.target.value.toLowerCase()),
			);

		templateFound
			&& templateFound.forEach(t =>
				autocompleteSuggestions.push({
					type: 'TEMPLATE',
					name: t.familyName,
					id: `template${t.familyName}`,
					templateName: t.templateName,
					presetId: undefined,
					familyId: undefined,
					template: t.templateName,
					variants: [
						{
							id: 'base',
							name: 'regular',
							weight: 500,
							italic: false,
							width: 'normal',
							abstractedFont: {
								id: abstractedTemplates.find(at => at.template === t.name).id,
							},
						},
					],
				}),
			);

		const presetFound
			= this.props.presets
			&& this.props.presets.filter(preset =>
				preset.variant.family.name
					.toLowerCase()
					.includes(event.target.value.toLowerCase()),
			);

		presetFound
			&& presetFound.forEach(p =>
				autocompleteSuggestions.push({
					type: 'PRESET',
					name: `${p.variant.family.name}`,
					id: p.id,
					presetId: p.id,
					familyId: undefined,
					template: undefined,
					variants: [
						{
							id: p.id,
							name: 'regular',
							weight: 500,
							italic: false,
							width: 'normal',
							abstractedFont: {
								id: p.abstractedFont && p.abstractedFont.id,
							},
						},
					],
				}),
			);

		const familyFound
			= this.props.families
			&& this.props.families.filter(family =>
				family.name.toLowerCase().includes(event.target.value.toLowerCase()),
			);

		familyFound
			&& familyFound.forEach(f =>
				autocompleteSuggestions.push({
					type: 'VARIANT',
					id: f.id,
					name: `${f.name}`,
					variants: f.variants,
				}),
			);

		const teamFound = [];

		this.props.subUsers
			&& this.props.subUsers.forEach((subUser) => {
				subUser.id !== this.props.user.id
					&& subUser.library.forEach((family) => {
						if (
							family.name
								.toLowerCase()
								.includes(event.target.value.toLowerCase())
						) {
							teamFound.push(family);
						}
					});
			});

		teamFound
			&& teamFound.forEach(f =>
				autocompleteSuggestions.push({
					type: 'VARIANT',
					name: `${f.name}`,
					variants: f.variants,
					presetId: undefined,
					familyId: f.id,
					template: undefined,
				}),
			);
		this.setState({
			autocompleteSuggestions:
				event.target.value.replace(/\s+/g, '') === ''
					? []
					: autocompleteSuggestions,
		});
	}

	hostFonts() {
		if (this.state.hostingTimeout) {
			return;
		}
		const domain = this.state.domain
			.replace('http://', '')
			.replace('https://', '')
			.split(/[/?#]/)[0]
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');

		this.setState({domain});
		const isUrl = /^([a-zA-Z0-9]+(([\-]?[a-zA-Z0-9]+)*\.)+)*[a-zA-Z]{2,}$/;

		if (!isUrl.test(domain)) {
			this.setState({
				errors: {
					domain: true,
					hostedFonts: false,
				},
			});
			return;
		}

		const timerId = setTimeout(() => {
			clearTimeout(this.state.hostingTimeout);
			this.setState({
				errors: {
					domain: false,
					hostedFonts: false,
					hosting: true,
				},
				loading: false,
				hostingTimeout: undefined,
			});
		}, 10000);

		this.setState({
			errors: {
				domain: false,
				hostedFonts: false,
			},
			loading: true,
			autocompleteText: '',
			autocompleteSuggestions: [],
			hostingTimeout: timerId,
		});

		const familyNames = [];
		const variantNames = [];
		const valueArray = [];
		const metadataArray = [];
		const templateArray = [];
		const glyphsArray = [];

		this.state.addedFonts.forEach((addedFont) => {
			familyNames.push(addedFont.name);
			variantNames.push(addedFont.variant.name);
			valueArray.push(addedFont.values);
			metadataArray.push({
				weight: addedFont.variant.weight,
				width: addedFont.variant.width,
				italic: !!addedFont.variant.italic,
			});
			templateArray.push(addedFont.template);
			glyphsArray.push(addedFont.glyphs);
		});
		try {
			this.setState({status: 'generating'});

			// generate the font
			this.client.dispatchAction('/host-from-library', {
				familyNames,
				variantNames,
				valueArray,
				metadataArray,
				templateArray,
				glyphsArray,
			});
		}
		catch (err) {
			console.log(err.message);
			clearTimeout(this.state.hostingTimeout);
			this.setState({
				errors: {
					domain: false,
					hostedFonts: false,
					hosting: true,
				},
				hostingTimeout: undefined,
			});
		}
	}

	render() {
		return (
			<div className="library-content-wrapper">
				<div className="library-see">
					<div className="library-hosting-plan">
						Free plan: 1000 views / month / website
					</div>
					<div className="library-hosting">
						<div className="library-see-title">Add a new website</div>
						<div className="library-hosting-form">
							<div className="library-hosting-form-elem">
								<label htmlFor="domain">
									Domain where your fonts will be displayed
								</label>
								<input
									type="url"
									id="domain"
									name="hosting_domain"
									placeholder="www.mysite.com"
									className={`library-hosting-form-elem-input-big ${
										this.state.errors.domain ? 'is-error' : ''
									}`}
									value={this.state.domain}
									onChange={(e) => {
										this.setState({
											domain: e.target.value,
											errors: {
												...this.state.errors,
												domain: false,
											},
										});
									}}
								/>
								{this.state.errors.domain && (
									<p className="library-hosting-form-elem-error">
										The domain you entered is incorrect. Please re-check it.
									</p>
								)}
							</div>
							<div className="library-hosting-form-elem">
								<label htmlFor="list">Hosted fonts</label>
								<div className="library-hosting-font-list">
									{this.state.addedFonts.length === 0 ? (
										<div>
											Add a font to your website using our autocomplete search
											input below!
										</div>
									) : (
										this.state.addedFonts.map(font => (
											<div className="hosted-font">
												<span
													style={{
														fontFamily: `preview${font.id}`,
													}}
												>
													{font.name} {font.variant.name} {font.variant.weight}{' '}
													{font.variant.width}{' '}
													{font.variant.italic ? 'italic' : 'normal'}
												</span>
												<div
													className="button-edit"
													onClick={() => {
														this.removeAddedFont(font.id);
													}}
												>
													Remove
												</div>
												{font.integrity && (
													<div
														className="button-edit"
														onClick={() => {
															this.removeDuplicates(font);
														}}
													>
														Use this version
													</div>
												)}
												<FontUpdater
													name={`preview${font.id}`}
													values={font.values}
													template={font.template}
													subset={`${font.name}${font.variant.name}${' '}${
														font.variant.weight
													}${font.variant.width}${
														font.variant.italic ? 'italic' : 'normal'
													}`}
													glyph="0"
												/>
												{font.integrity && (
													<p className="integrity-error">{font.integrity}</p>
												)}
											</div>
										))
									)}
									{this.state.errors.hostedFonts && (
										<p className="library-hosting-form-elem-error">
											Please add at least one font to your website.
										</p>
									)}
								</div>
							</div>
							<div className="library-hosting-form-elem">
								<input
									type="text"
									id="name"
									name="user_name"
									autoComplete="off"
									placeholder="Type your font name..."
									className={`${
										this.state.autocompleteSuggestions.length > 0
											? 'opened'
											: ''
									}`}
									value={this.state.autocompleteText}
									onChange={(e) => {
										this.updateAutocompleteSuggestions(e);
									}}
								/>
								{this.state.autocompleteSuggestions.length > 0 && (
									<div className="suggestions">
										{this.state.autocompleteSuggestions.map(suggestion => (
											<div className="suggestion">
												<div className="suggestion-family" onClick={() => {}}>
													{suggestion.name}
												</div>
												{suggestion.variants.map(variant => (
													<div
														className="suggestion-variant"
														onClick={() => {
															this.addSuggestion(suggestion, variant);
														}}
													>
														{suggestion.name} {variant.name} {variant.weight}{' '}
														{variant.width}{' '}
														{variant.italic ? 'italic' : 'normal'}
													</div>
												))}
											</div>
										))}
									</div>
								)}
							</div>
							<div className="library-hosting-form-elem">
								{this.state.errors.hosting && (
									<p className="library-hosting-form-elem-error">
										Something happenened while trying to host your fonts. Please
										retry or contact us using the in-app chat.
									</p>
								)}
								<LibraryButton
									name="Add website"
									floated
									disabled={
										this.state.addedFonts.length === 0
										|| this.state.domain === ''
									}
									error={this.state.errors.hosting}
									loading={this.state.loading}
									onClick={() => {
										if (
											this.state.addedFonts.length > 0
											&& this.state.domain !== ''
										) {
											this.hostFonts();
										}
									}}
								/>
							</div>
						</div>
					</div>
				</div>
				<LibrarySidebarRight>
					<LibraryButton
						name="Back to the list"
						bold
						full
						onClick={() => {
							this.props.router.push('/library/hosting');
						}}
					/>
				</LibrarySidebarRight>
			</div>
		);
	}
}

const hostVariantMutation = gql`
	mutation hostVariant($id: ID!, $tmpFileUrl: String!) {
		hostFont(id: $id, tmpFileUrl: $tmpFileUrl) {
			id
			url
			version
			createdAt
		}
	}
`;

const createHostedDomainMutation = gql`
	mutation createHostedDomain(
		$domain: String!
		$creatorId: ID!
		$hostedVariantsIds: [ID!]!
	) {
		createHostedDomain(
			domain: $domain
			creatorId: $creatorId
			hostedVariantsIds: $hostedVariantsIds
		) {
			id
			domain
			updatedAt
			hostedVariants {
				id
				url
				createdAt
				abstractedFont {
					id
				}
				version
			}
		}
	}
`;

const deleteAbstractedFontMutation = gql`
	mutation deleteAbstractedFont($id: ID!) {
		deleteAbstractedFont(id: $id) {
			id
		}
	}
`;

const createAbstractedFontMutation = gql`
	mutation createAbstractedFont(
		$type: FontType!
		$variantId: ID
		$template: String
		$presetId: ID
		$name: String!
	) {
		createAbstractedFont(
			type: $type
			variantId: $variantId
			template: $template
			presetId: $presetId
			name: $name
		) {
			id
		}
	}
`;

export default compose(
	graphql(hostVariantMutation, {
		props: ({mutate}) => ({
			hostFont: (id, tmpFileUrl) =>
				mutate({
					variables: {
						id,
						tmpFileUrl,
					},
				}),
		}),
	}),
	graphql(createHostedDomainMutation, {
		props: ({mutate, ownProps}) => ({
			createHostedDomain: (domain, hostedVariantsIds) =>
				mutate({
					variables: {
						domain,
						hostedVariantsIds,
						creatorId: ownProps.user.id,
					},
				}),
		}),
		options: {
			update: (store, {data: {createHostedDomain}}) => {
				const data = store.readQuery({query: libraryUserQuery});

				data.user.hostedDomains.push(createHostedDomain);
				store.writeQuery({
					query: libraryUserQuery,
					data,
				});
			},
		},
	}),
	graphql(createAbstractedFontMutation, {
		props: ({mutate}) => ({
			createAbstractedFont: (type, variantId, template, presetId, name) =>
				mutate({
					variables: {
						type,
						variantId,
						template,
						presetId,
						name,
					},
				}),
		}),
		options: {
			update: (store, {data: {createAbstractedFont}}) => {
				const dataLibrary = store.readQuery({query: libraryQuery});
				const dataPreset = store.readQuery({query: presetQuery});
				let variant;
				let preset;

				switch (createAbstractedFont.type) {
				case 'PRESET':
					preset = dataPreset.allPresets.find(
						p => p.id === createAbstractedFont.preset.id,
					);
					preset.abstractedFont = {id: createAbstractedFont.id};
					break;
				case 'VARIANT':
					variant = dataLibrary.user.library
						.find(f => f.id === createAbstractedFont.variant.family.id)
						.variants.find(v => v.id === createAbstractedFont.variant.id);

					variant.abstractedFont = {id: createAbstractedFont.id};
					break;
				default:
					break;
				}
				store.writeQuery({
					query: libraryQuery,
					data: dataLibrary,
				});
				store.writeQuery({
					query: presetQuery,
					data: dataPreset,
				});
			},
		},
	}),
)(LibraryHostingCreate);
