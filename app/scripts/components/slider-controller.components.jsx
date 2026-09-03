import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

export default class SliderController extends React.PureComponent {
	constructor(props) {
		super(props);

		this.state = {
			tracking: false,
		};

		this.valueAtClientX = this.valueAtClientX.bind(this);
		this.handleDown = this.handleDown.bind(this);
		this.handleUp = this.handleUp.bind(this);
		this.handleMove = this.handleMove.bind(this);
		this.handleSelectstart = this.handleSelectstart.bind(this);
	}

	componentWillMount() {
		document.addEventListener('mouseup', this.handleUp);
		window.addEventListener('mousemove', this.handleMove);
		document.addEventListener('selectstart', this.handleSelectstart);
	}

	componentWillUnmount() {
		document.removeEventListener('mouseup', this.handleUp);
		window.removeEventListener('mousemove', this.handleMove);
		document.removeEventListener('selectstart', this.handleSelectstart);
	}

	valueAtClientX(clientX) {
		const {min, max} = this.props;

		if (!this.node) {
			return min;
		}

		const rect = this.node.getBoundingClientRect();
		const width = rect.width || 1;
		const ratio = (clientX - rect.left) / width;

		return Math.min(Math.max(ratio * (max - min) + min, min), max);
	}

	handleDown(e) {
		const {label, name, disabled, changeParam} = this.props;

		if (disabled || !this.node) {
			return;
		}

		this.tracking = true;
		this.setState({tracking: true});
		const newX = e.clientX;
		const newValue = this.valueAtClientX(newX);

		this.liveValue = newValue;
		changeParam({value: newValue, name, label});
		this.currentX = newX;

		e.stopPropagation();
	}

	handleUp(e) {
		if (!this.tracking && !this.state.tracking) {
			return;
		}

		const {name, label, changeParam} = this.props;
		const value
			= this.liveValue !== undefined ? this.liveValue : this.props.value;

		this.tracking = false;
		this.setState({tracking: false});
		changeParam({value, name, label, force: true});

		e.stopPropagation();
	}

	handleMove(e) {
		if (!this.tracking && !this.state.tracking) {
			return;
		}

		const {min, max, name, changeParam} = this.props;
		const rect = this.node.getBoundingClientRect();
		const newX = e.clientX;
		let newValue;

		if (newX >= rect.left && newX <= rect.right) {
			newValue = this.valueAtClientX(newX);
		}
		else {
			newValue = newX < rect.left ? min : max;
		}

		this.liveValue = newValue;
		changeParam({value: newValue, name});
		this.currentX = newX;
	}

	// This prevents preview text to be selected whil using the sliders
	handleSelectstart(e) {
		if (this.tracking || this.state.tracking) {
			e.preventDefault();
		}
	}

	render() {
		const {min, max, value, className} = this.props;
		const ratio = 96.0;

		const minAdvised
			= typeof this.props.minAdvised === 'number' ? this.props.minAdvised : min;
		const maxAdvised
			= typeof this.props.maxAdvised === 'number' ? this.props.maxAdvised : max;

		const translateX
			= ((max - Math.min(Math.max(value, min), max)) / (max - min)) * ratio;

		const transform = {
			transform: `translateX(-${translateX}%)`,
		};

		const sliderClasses = classNames('slider-controller', className);
		const classes = classNames({
			'slider-controller-bg': true,
			'is-not-advised': value < minAdvised || value > maxAdvised,
		});

		return (
			<div
				className={sliderClasses}
				ref={(node) => {
					this.node = node;
				}}
				onMouseDown={this.handleDown}
			>
				<div className={classes} style={transform}>
					<div className="slider-controller-handle" />
				</div>
			</div>
		);
	}
}

SliderController.defaultProps = {
	disabled: false,
	min: 0,
	max: 100,
	className: '',
};

SliderController.propTypes = {
	disabled: PropTypes.bool,
	min: PropTypes.number,
	max: PropTypes.number,
	minAdvised: PropTypes.number,
	maxAdvised: PropTypes.number,
	className: PropTypes.string,
};
