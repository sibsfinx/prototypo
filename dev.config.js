const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const { merge } = require('webpack-merge');
const TerserPlugin = require('terser-webpack-plugin');

const base = require('./base.config');

module.exports = merge(base, {
	cache: true,
	mode: 'development',
	devtool: 'source-map',
	entry: {
		index: ['whatwg-fetch'],
	},
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				use: [
					{
						loader: 'babel-loader',

						options: {
							cacheDirectory: true,
						},
					},
					'if-loader',
				],
				include: [path.join(__dirname, 'app')],
			},
		],
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					sourceMap: true,
				},
			}),
		],
	},
	plugins: [
		new webpack.LoaderOptionsPlugin({
			options: {
				'if-loader': 'prod',
			},
		}),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('development'),
				TESTING_FONT: false,
			},
		}),
	],
	output: merge(base.output, {
		filename: '[name].bundle.js',
		chunkFilename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
	}),
});
