/* tslint:disable */
/// <reference types="../typings" />

import { minify } from 'terser';
import TerserPlugin from 'terser-webpack-plugin';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import HtmlPlugin from 'html-webpack-plugin';
import CleanPlugin from 'clean-webpack-plugin';
import { smartStrategy as smartMerge } from 'webpack-merge';
import { loader as MiniCssExtractLoader } from 'mini-css-extract-plugin';
import baseConfig from './base.config';
import webpack from 'webpack';

const config: webpack.Configuration = smartMerge({
  plugins: 'prepend',
})(baseConfig, {
  mode: 'production',
  optimization: {
    splitChunks: {
      name: false,
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          chunks: 'all',
        },
      },
    },
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        extractComments: true,
      }),
      new OptimizeCssAssetsPlugin(),
    ],
  },
  module: {
    rules: [
      {
        test: /\.s?[ac]ss$/,
        use: [
          MiniCssExtractLoader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [
                require('postcss-preset-env')(),
                require('autoprefixer')(),
              ],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              includePaths: ['./node_modules'],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanPlugin(),
    new HtmlPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortAttributes: true,
        sortClassName: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: (code) => minify(code).code,
      },
      hash: true,
      inject: 'head',
      template: '!!@piuccio/ejs-compiled-loader!./src/index.ejs',
    }),
  ],
});

export default config;
