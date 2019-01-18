const webpack = require("webpack");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpackBundleAnalyzer = require("webpack-bundle-analyzer");
// const CompressionPlugin = require('compression-webpack-plugin');

// Required, otherwise react-dom.development version would be included in the vendor bundle and would nearly double its size
process.env.NODE_ENV = "production";

module.exports = {
  mode: "production",
  target: "web",
  devtool: "source-map", // more info:https://webpack.github.io/docs/build-performance.html#sourcemaps and https://webpack.github.io/docs/configuration.html#devtool
  entry: {
    vendor: path.resolve(__dirname, 'src/vendor'), // __dirname is a node-defined variable
    main: path.resolve(__dirname, 'src/index')
  },
  output: {
    path: path.resolve(path.join(__dirname, "docs")), // Note: Physical files are only output by the production build task `npm run build`.
    publicPath: "/snake-basic/",
    filename: "[name].[contenthash].js" // name is the entry point defined above, contenthash is the generated hash (for cache busting - no need for webpack-md5-hash anymore)
  },
  // Webpack 4 removed the need for CommonsChunkPlugin (and DedupePlugin). Use optimization.splitChunks instead.
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all'
        }
      }
    }
  },
  plugins: [
    // Note that because the plugin does a direct text replacement, the value given to it must include actual quotes inside of the string itself.
    // Typically, this is done either with alternate quotes, such as '"production"', or by using JSON.stringify('production').
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV), // This global makes sure React is built in prod mode.
      "process.env.API_URL": JSON.stringify("http://localhost:3000") // Would set to prod API URL in real app
    }),
    new webpackBundleAnalyzer.BundleAnalyzerPlugin({ analyzerMode: "static" }), // Display bundle stats
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css"
    }),
    // Generate HTML file that contains references to generated bundles. See here for how this works: https://github.com/ampedandwired/html-webpack-plugin#basic-usage
    new HtmlWebpackPlugin({
      template: "src/index.html",
      minify: {
        // see https://github.com/kangax/html-minifier#options-quick-reference
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
      // Properties you define here are available in index.html
    }),
//    new CompressionPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, "src"),
        use: ["babel-loader", "eslint-loader"]
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: true
            }
          },
          {
            loader: "postcss-loader",
            options: {
              plugins: () => [require("cssnano"), require("autoprefixer")],
              sourceMap: true
            }
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/,
        use: {
          loader: "file-loader",
          options: {
            outputPath: "images",
          }
        }
      }
    ]
  }
};
