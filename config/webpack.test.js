var webpackMerge = require('webpack-merge');
var commonConfig = require('./webpack.common.js');
var helpers = require('./helpers');

module.exports = webpackMerge(commonConfig, {
    devtool: 'inline-source-map',
    module: {
        loaders: [
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                loaders: ['babel']
            },
            {
                test: /\.js?$/,
                include: helpers.root('lib'),
                loader: 'babel-istanbul',
                query: {
                    cacheDirectory: true
                }
            }
        ]
    }
});
