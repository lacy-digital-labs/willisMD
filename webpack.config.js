const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/renderer/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: process.env.NODE_ENV === 'production' ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: process.env.NODE_ENV === 'production' ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
    clean: true
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
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // CodeMirror packages - largest dependency
        codemirror: {
          test: /[\\/]node_modules[\\/]@codemirror[\\/]/,
          name: 'codemirror',
          chunks: 'all',
          priority: 30
        },
        // Markdown processing
        markdown: {
          test: /[\\/]node_modules[\\/](marked|dompurify|markdownlint)[\\/]/,
          name: 'markdown',
          chunks: 'all',
          priority: 20
        },
        // React
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 10
        },
        // Other vendors
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 5
        }
      }
    },
    minimize: process.env.NODE_ENV === 'production',
    usedExports: true,
    sideEffects: false,
    moduleIds: 'deterministic',
    runtimeChunk: 'single'
  },
  performance: {
    maxEntrypointSize: 500000,
    maxAssetSize: 300000,
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false
  },
  devServer: {
    port: 8080,
    hot: false, // Disable hot reloading to avoid events dependency
    historyApiFallback: true,
    liveReload: true // Use live reload instead
  }
};