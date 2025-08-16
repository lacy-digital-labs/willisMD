const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/renderer/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.js'
  },
  target: 'web', // Use web target instead of electron-renderer to avoid automatic externals
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'nosources-source-map', // CSP-compatible source maps
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'esbuild-loader',
          options: {
            loader: 'jsx',
            target: 'es2015'
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": false,
      "crypto": false,
      "stream": false,
      "util": false,
      "global": false
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
    new webpack.BannerPlugin({
      banner: 'var global = globalThis;',
      raw: true
    })
  ],
  devServer: {
    port: 8080,
    hot: false, // Disable hot reloading to avoid events dependency
    historyApiFallback: true,
    liveReload: true // Use live reload instead
  }
};