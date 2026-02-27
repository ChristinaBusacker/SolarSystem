const path = require("path");
const { merge } = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const Dotenv = require("dotenv-webpack");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  output: {
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.(scss|sass)$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: { sourceMap: false },
          },
          {
            loader: "sass-loader",
            options: {
              implementation: require("sass"),
            },
          },
        ],
      },
    ],
  },
  plugins: [
    // Prefer .env.prod when present (fallback: .env)
    new Dotenv({ path: path.resolve(__dirname, ".env.prod"), safe: false }),
    new MiniCssExtractPlugin({
      filename: "styles.[contenthash].css",
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
});
