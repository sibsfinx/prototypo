const Promise = require('bluebird'); // Bluebird promise are way better than native,
const fs = Promise.promisifyAll(require('fs')); // We just want promise seriously

const gulp = require('gulp');
const pipeline = Promise.promisify(require('stream').pipeline);

// webpack Dep
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

// CSS Dep
const sass = require('gulp-sass')(require('sass'));
const cssnano = require('gulp-cssnano');

// Utils
const del = require('del');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const filter = require('gulp-filter');
const autoprefixer = require('gulp-autoprefixer');
const PluginError = require('plugin-error');
const log = require('fancy-log');

// Tests
const nightwatch = require('gulp-nightwatch');

gulp.task('images', (done) => {
	gulp.src(['./app/images/*.*', './app/images/**/*.*'])
		.pipe(gulp.dest('./dist/assets/images/'));
	gulp.src('./app/fonts/*.*')
		.pipe(gulp.dest('./dist/assets/fonts/'));
	gulp.src('./node_modules/tutorial-content/content/**/*.{png,gif,jpg,svg,mp4,webm}')
		.pipe(gulp.dest('./dist/assets/images/academy/courses/'));
	done();
});

gulp.task('cp-john-fell', () => gulp
	.src('./node_modules/john-fell.ptf/dist/font.json')
	.pipe(gulp.dest('./dist/templates/john-fell.ptf')));

gulp.task('cp-venus', () => gulp
	.src('./node_modules/venus.ptf/dist/font.json')
	.pipe(gulp.dest('./dist/templates/venus.ptf')));

gulp.task('cp-elzevir', () => gulp
	.src('./node_modules/elzevir.ptf/dist/font.json')
	.pipe(gulp.dest('./dist/templates/elzevir.ptf')));

gulp.task('cp-gfnt', () => gulp
	.src('./node_modules/gfnt.ptf/dist/font.json')
	.pipe(gulp.dest('./dist/templates/gfnt.ptf')));

gulp.task('cp-antique', () => gulp
	.src('./node_modules/antique.ptf/dist/font.json')
	.pipe(gulp.dest('./dist/templates/antique.ptf')));

gulp.task('cp-genese', gulp.series(
	'cp-john-fell',
	'cp-venus',
	'cp-elzevir',
	'cp-gfnt',
	'cp-antique'
));

gulp.task('cp-static', (done) => {
	gulp.src(['./app/index.html', './app/iframe.html', './app/robots.txt', './app/favicon.ico', './app/404.html'])
		.pipe(gulp.dest('./dist/'));
	done();
});

gulp.task('css-vendor', (done) => {
	// This is a bit hackish but right now i don't care
	gulp.src(['./node_modules/normalize.css/normalize.css',
		'./node_modules/please-wait/build/please-wait.css'])
		.pipe(concat('vendor.css'))
		.pipe(gulp.dest('./dist/assets/'));
	done();
});


gulp.task('css-app', (done) => {
	gulp.src('./app/styles/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(concat('app.css'))
		.pipe(autoprefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('./dist/assets/'))
		.pipe(filter('**/*.css'));
	done();
});

gulp.task('clean', (done) => {
	del.sync(['dist']);
	done();
});

gulp.task('build', gulp.series('clean', gulp.parallel('images', 'cp-genese', 'cp-static'), (callback) => {
	// run webpack
	const webpackConfig = process.env.NODE_ENV === 'production' ? require('./prod.config') : require('./dev.config');
	const prototypoConfig = Object.create(webpackConfig);

	webpack(
		prototypoConfig,
		(err, stats) => {
			if (err) throw new PluginError('webpack', err);
			log('[webpack]', stats.toString({
			// output options
			}));
			callback();
		}
	);
}));

gulp.task('clean:dll', (cb) => {
	del.sync(['dll']);
});

gulp.task('webpack:dll', (callback) => {
	const dllWebpackConfig = require('./dll.config.js');
	const prototypoConfig = Object.create(dllWebpackConfig);

	webpack(prototypoConfig, (err, stats) => {
		if (err) return new PluginError('webpack', err);

		log('[webpack]', stats.toString({
		}));

		callback();
	});
});

gulp.task('prod:dll', (callback) => {
	const dllWebpackConfig = require('./dll-prod.config.js');
	const prototypoConfig = Object.create(dllWebpackConfig);

	webpack(prototypoConfig, (err, stats) => {
		if (err) return new PluginError('webpack', err);

		log('[webpack]', stats.toString({
		}));

		callback();
	});
});

gulp.task('watch-font', () => gulp.watch(['./node_modules/john-fell.ptf/dist/font.json', './node_modules/venus.ptf/dist/font.json', './node_modules/elzevir.ptf/dist/font.json', './node_modules/gfnt.ptf/dist/font.json', './node_modules/antique.ptf/dist/font.json'], gulp.series('cp-genese')));

gulp.task('watch-prototypojs', () => gulp.watch(['./node_modules/prototypo.js/dist/prototypo.js', './node_modules/prototypo-canvas/src/worker.js'], gulp.series('cp-prototypo.js')));

gulp.task('serve', gulp.series('clean', gulp.parallel('images', 'cp-genese', 'cp-static', 'watch-font', 'watch-prototypojs', 'webpack:dll'), (callback) => {
	const webpackConfig	= require('./local.config.js');
	// Start a webpack-dev-server
	const prototypoConfig = Object.create(webpackConfig);
	const compiler = webpack(prototypoConfig);

	new WebpackDevServer(compiler, {
		publicPath: webpackConfig.output.publicPath,
		hot: true,
		contentBase: 'dist/',
		watchOptions: {
			aggregateTimeout: 300,
			ignored: /node_modules/,
			poll: 1000,
		},
	}).listen(9000, '0.0.0.0', (err) => {
		if (err) throw new PluginError('webpack-dev-server', err);
		// Server listening
		log('[webpack-dev-server]', 'http://localhost:9000/webpack-dev-server/index.html');

		// keep the server alive or continue?
		callback();
	});
}));

gulp.task('serve:perf', gulp.series('clean', gulp.parallel('images', 'cp-genese', 'cp-static', 'watch-font', 'watch-prototypojs', 'webpack:dll'), (callback) => {
	const webpackConfig	= require('./prod.config.js');
	// Start a webpack-dev-server
	const prototypoConfig = Object.create(webpackConfig);
	const compiler = webpack(prototypoConfig);

	new WebpackDevServer(compiler, {
		publicPath: webpackConfig.output.publicPath,
		hot: true,
		contentBase: 'dist/',
		watchOptions: {
			aggregateTimeout: 300,
			ignored: /node_modules/,
			poll: 1000,
		},
	}).listen(9000, '0.0.0.0', (err) => {
		if (err) throw new PluginError('webpack-dev-server', err);
		// Server listening
		log('[webpack-dev-server]', 'http://localhost:9000/webpack-dev-server/index.html');

		// keep the server alive or continue?
		callback();
	});
}));

gulp.task('debug', gulp.series('clean', gulp.parallel('images', 'cp-genese', 'cp-static', 'webpack:dll'), (callback) => {
	const webpackConfig	= require('./debug.config.js');
	// Start a webpack-dev-server
	const prototypoConfig = Object.create(webpackConfig);

	prototypoConfig.debug = true;
	const compiler = webpack(prototypoConfig);

	new WebpackDevServer(compiler, {
		publicPath: webpackConfig.output.publicPath,
		hot: true,
		contentBase: 'dist/',
		watchOptions: {
			aggregateTimeout: 300,
			poll: 1000,
		},
	}).listen(9000, '0.0.0.0', (err) => {
		if (err) throw new PluginError('webpack-dev-server', err);
		// Server listening
		log('[webpack-dev-server]', 'http://localhost:9000/webpack-dev-server/index.html');

		// keep the server alive or continue?
	});
}));

gulp.task('test', callback => gulp.src('')
	.pipe(nightwatch({
		cliArgs: {
			env: 'default,chrome_win8,chrome_win7,firefox_win7,chrome_mac,firefox_mac',
		},
	})));

gulp.task('test:basic', callback => gulp.src('')
	.pipe(nightwatch()));
