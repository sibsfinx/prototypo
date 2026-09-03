import React from 'react';
import Lifespan from 'lifespan';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import LocalClient from '../stores/local-client.stores.jsx';
import {prototypoStore} from '../stores/creation.stores.jsx';

import {ControlsTabs, ControlsTab} from './controls-tabs.components.jsx';
import {Sliders} from './sliders.components.jsx';
import SliderTooltip from './slider-tooltip.components.jsx';

const voidCurrentGroup = {};

export default class FontControls extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			tabControls: 'Func',
			currentGroup: {},
			parameters: [],
		};
	}

	async componentWillMount() {
		this.lifespan = new Lifespan();
		this.client = LocalClient.instance();

		const apply = (headJS) => {
			const data = headJS.d || headJS;

			this.setState({
				tabControls: data.fontTab || 'Func',
				credits: data.credits,
				parameters: data.fontParameters || [],
				typeface: data.variant,
				indivMode: data.indivMode,
				indivEdit: data.indivEditingParams,
				currentGroup: data.indivCurrentGroup || voidCurrentGroup,
				uiSliderTooltip: data.uiSliderTooltip,
				advancedMode: data.advancedMode,
			});
		};

		apply({
			fontTab: prototypoStore.get('fontTab'),
			credits: prototypoStore.get('credits'),
			fontParameters: prototypoStore.get('fontParameters'),
			variant: prototypoStore.get('variant'),
			indivMode: prototypoStore.get('indivMode'),
			indivEditingParams: prototypoStore.get('indivEditingParams'),
			indivCurrentGroup: prototypoStore.get('indivCurrentGroup'),
			uiSliderTooltip: prototypoStore.get('uiSliderTooltip'),
			advancedMode: prototypoStore.get('advancedMode'),
		});

		const snapshot = await this.client.fetch('/prototypoStore');

		apply(snapshot.head.toJS());

		this.client
			.getStore('/prototypoStore', this.lifespan)
			.onUpdate((head) => {
				apply(head.toJS());
			})
			.onDelete(() => {
				this.setState(undefined);
			});
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	render() {
		if (process.env.__SHOW_RENDER__) {
			console.log('[RENDER] font controls');
		}

		const hasSliderTooltip
			= this.state.uiSliderTooltip && this.state.uiSliderTooltip.display;
		let sliderTooltip;
		const transitionTimeout = 300;

		if (hasSliderTooltip) {
			sliderTooltip = (
				<SliderTooltip
					key={'slider-tooltip'}
					sliderName={this.state.uiSliderTooltip.sliderName}
				/>
			);
		}

		const tabs = this.state.parameters.map(group => (
			<ControlsTab iconId={group.label} name={group.label} key={group.label}>
				<Sliders
					params={group.parameters}
					credits={this.state.credits}
					indivMode={this.state.indivMode}
					indivEdit={this.state.indivEdit}
					currentGroup={this.state.currentGroup.name}
					advancedMode={this.state.advancedMode}
				/>
			</ControlsTab>
		));

		return (
			<div className="font-controls" id="sidebar">
				<ReactCSSTransitionGroup
					component="div"
					transitionName="slider-tooltip-animation"
					transitionEnterTimeout={transitionTimeout}
					transitionLeaveTimeout={transitionTimeout}
				>
					{sliderTooltip}
				</ReactCSSTransitionGroup>
				<ControlsTabs tab={this.state.tabControls}>{tabs}</ControlsTabs>
			</div>
		);
	}
}
