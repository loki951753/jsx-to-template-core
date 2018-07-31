const path = require('path');

const CleanPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const resolve = (subpath)=>path.resolve(__dirname, subpath);
const cssFilename = 'static/css/[name].[contenthash:8].css';
const dist = resolve('../build');

module.exports = {
    bail: true,
    devtool: 'source-map',
    entry: resolve('../src/index.js'),
    output: {
        path: dist,
        filename: 'static/js/[name].[chunkhash:8].js',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader'
                },
                include: resolve('../src')
            }, {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: ['css-loader']
                })
            }, {
                test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
                use: ['file-loader']
            }, {
                test: /\.(woff2?|ttf|eot|svg)?$/,
                use: ['file-loader']
            }
        ]
    },
    plugins: [
        new CleanPlugin(dist),

        new HtmlWebpackPlugin({
            inject: true,
            template: resolve('../public/index.html')
        }),

        new ExtractTextPlugin({
            filename: cssFilename,
        }),

        new ManifestPlugin({
            filename: 'asset-manifest.json'
        }),

        new JSX2TplPlugin({
            tplPath: path.resolve(__dirname, './index.html')
        }),

        new WebpackShellPlugin({
            onBuildEnd: [
                'cp -r ./build/static ../backend/public',
                'cp ./build/index.html ../backend/views'
            ]
        }),
    ]
};
