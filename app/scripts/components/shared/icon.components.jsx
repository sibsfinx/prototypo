import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const iconModules = import.meta.glob('../../../images/icons/*.svg', {
	eager: true,
	query: '?url',
	import: 'default',
});

class Icon extends React.PureComponent {
	render() {
		const {name, className, ...rest} = this.props;
		const url = iconModules[`../../../images/icons/${name}.svg`];

		const classes = classnames('icon', className);

		return (
			<svg className={classes} {...rest}>
				<use xlinkHref={url} />
			</svg>
		);
	}
}

Icon.propTypes = {
	name: PropTypes.string.isRequired,
};

export default Icon;
