import React from 'react';
import classNames from 'classnames';

export default class InputWithLabel extends React.PureComponent {
	constructor(props) {
		super(props);

		Object.defineProperty(this, 'inputValue', {get: this.getInputValue.bind(this)});
	}

	static defaultProps = {
		inputRef: () => { return; },
		onChange: () => { return; },
	};

	render() {
		const {
			onChange,
			error, warning, info,
			label, placeholder, inputValue, required,
			inputRef, children,
			...rest,
		} = this.props;

		const inputClass = classNames('input-with-label-input', {
			'is-error': error,
			'is-warning': warning,
		});

		const child = children || (
			<input {...rest}
				ref={(ref) => { this.input = this.input || ref; inputRef(ref); }}
				placeholder={placeholder}
				onChange={onChange}
			/>
		);

		return (
			<div className="input-with-label">
				<label className="input-with-label-label">
					{label}
					{info && <span className="input-with-label-label-info">{info}</span>}
					{required && <span className="input-with-label-label-required">*</span>}
				</label>
				{React.cloneElement(child, {
					className: inputClass,
					defaultValue: inputValue,
				})}
			</div>
		);
	}

	getInputValue() {
		if (this.props.children) {
			console.warn("You're trying to access to a value of a child you can access. Use a ref instead.");
		}
		return this.input ? this.input.value : undefined;
	}

	set inputValue(value) {
		return;
	}
}
