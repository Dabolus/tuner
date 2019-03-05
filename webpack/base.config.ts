/* tslint:disable */
/// <reference types="../typings" />

import { resolve } from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ScriptExtHtmlPlugin from 'script-ext-html-webpack-plugin';
import { InjectManifest as InjectManifestPlugin } from 'workbox-webpack-plugin';

const babelLoader = {
  loader: 'babel-loader',
  options: {
    cacheDirectory: true,
    presets: [
      ['@babel/env', {
        loose: true,
        useBuiltIns: 'usage',
        modules: false,
      }],
      '@babel/typescript',
    ],
    plugins: [
      ['@babel/transform-runtime', {
        corejs: 2,
        sourceType: 'unambiguous',
      }],
      ['@babel/proposal-class-properties', {
        loose: true,
      }],
      '@babel/syntax-dynamic-import',
    ],
  },
};

const config: webpack.Configuration = {
  cache: true,
  context: resolve(__dirname, '..'),
  entry: {
    app: './src/index',
  },
  output: {
    filename: 'scripts/[name].js',
    chunkFilename: 'scripts/[id].js',
    path: resolve(__dirname, '../build'),
    pathinfo: false,
    crossOriginLoading: 'anonymous',
    globalObject: 'self',
  },
  resolve: {
    extensions: ['.ts', '.js', '.scss', '.css', '.ejs'],
    modules: ['./src', 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.worker\.[tj]s$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'worker-loader',
          },
          babelLoader,
        ],
      },
      {
        test: /\.[tj]s$/,
        exclude: /(?:node_modules|\.worker\.[tj]s)/,
        use: babelLoader,
      },
    ],
  },
  plugins: [
    new CopyPlugin([
      // Assets
      {
        from: resolve(__dirname, '../src/assets'),
        to: '.',
      },
    ]),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].js',
      chunkFilename: 'styles/[id].js',
    }),
    new ScriptExtHtmlPlugin({
      defaultAttribute: 'defer',
    }),
    new InjectManifestPlugin({
      swSrc: resolve(__dirname, '../src/service-worker.js'),
      swDest: './service-worker.js',
      exclude: [/hot-update/, /images\/icons/, /browserconfig\.xml/, /robots\.txt/, /\.LICENSE$/],
    }),
  ],
};

export default config;
