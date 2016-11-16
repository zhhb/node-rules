// Karma configuration
const webpackConf = require('./config/webpack.test.js');
module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'chai'],
        // ... normal karma configuration
        files: [
            // all files ending in "_test"
            { pattern: 'test/*.spec.js', watched: false },
            { pattern: 'test/**/*.spec.js', watched: false }
            // each file acts as entry point for the webpack configuration
        ],

        webpack: webpackConf,
        webpackMiddleware: {
            // webpack-dev-middleware configuration
            // i. e.
            stats: 'errors-only'
        },

        preprocessors: {
            // add webpack as preprocessor
            'test/*.spec.js': ['webpack', 'sourcemap'],
            'test/**/*.spec.js': ['webpack', 'sourcemap']
        },
        reporters: ['mocha'],
        plugins: [
            'karma-webpack',
            'karma-sourcemap-loader',
            'karma-mocha',
            'karma-chai',
            'karma-mocha-reporter',
            'karma-phantomjs-launcher'
        ],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['PhantomJS'],
        singleRun: true,
        concurrency: Infinity,
    });
};
