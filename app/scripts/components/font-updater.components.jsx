import deepEqual from 'lodash/isEqual';
import _uniq from 'lodash/uniq';
import React from 'react';
import PropTypes from 'prop-types';
import HoodieApi from '../services/hoodie.services.js';

import FontMediator from '../prototypo.js/mediator/FontMediator';

class FontUpdater extends React.Component {
	constructor(props) {
		super(props);

		this.fontMediatorInstance = null;
		this.retryTimer = null;
		this.ensureMediator = this.ensureMediator.bind(this);
	}

	componentDidMount() {
		this.ensureMediator();
	}

	componentWillUnmount() {
		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
			this.retryTimer = null;
		}
	}

	ensureMediator() {
		try {
			this.fontMediatorInstance = FontMediator.instance();
		}
		catch (error) {
			this.fontMediatorInstance = null;
		}

		const ready
			= this.fontMediatorInstance
			&& typeof this.fontMediatorInstance.templateIsReady === 'function'
			&& this.fontMediatorInstance.templateIsReady(this.props.template);

		if (!ready && !this.retryTimer) {
			this.retryTimer = setTimeout(() => {
				this.retryTimer = null;
				this.ensureMediator();
				this.forceUpdate();
			}, 250);
		}

		return ready ? this.fontMediatorInstance : null;
	}

	shouldComponentUpdate(nextProps) {
		const subset = _uniq(this.props.subset.split('')).join('');
		const nextSubset = _uniq(nextProps.subset.split('')).join('');

		return !(
			nextProps.family === this.props.family
			&& nextProps.variant === this.props.variant
			&& nextProps.name === this.props.name
			&& nextProps.template === this.props.template
			&& nextSubset === subset
			&& nextProps.glyph === this.props.glyph
			&& deepEqual(nextProps.values, this.props.values)
		);
	}

	render() {
		const {template, name, subset, glyph, values, family, variant} = this.props;
		const mediator = this.ensureMediator();

		if (!mediator) {
			return false;
		}

		const subsetCodes = _uniq(subset.split('')).map(letter =>
			letter.charCodeAt(0),
		);

		try {
			mediator.setupInfo({
				family,
				style: variant,
				template,
				email: HoodieApi.instance && HoodieApi.instance.email,
			});

			mediator.getFont(name, template, values, subsetCodes, glyph);
		}
		catch (error) {
			console.error('FontUpdater skipped getFont', error);
		}

		return false;
	}
}

FontUpdater.propTypes = {
	family: PropTypes.string,
	variant: PropTypes.string,
	name: PropTypes.string.isRequired,
	template: PropTypes.string.isRequired,
	values: PropTypes.object.isRequired,
	subset: PropTypes.string.isRequired,
	glyph: PropTypes.string.isRequired,
};

FontUpdater.defaultProps = {
	family: 'Prototypo Font',
	variant: 'Regular',
};

export default FontUpdater;
