var webpack = require('webpack');

module.exports = {
    entry: './index.js',
    resolve: {
        extensions: ['', '.js'],
        alias: ''
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                loaders: ['babel']
            }
        ]
    }
}
