const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

/**
 * Common webpack configuration shared between dev and prod.
 * Keep this file free of environment-specific behavior.
 */
module.exports = {
  entry: "./src/index.ts",
  output: {
    filename: "bundle.[contenthash].js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "",
    assetModuleFilename: "assets/[name][ext]",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpe?g|gif|webp|hdr|svg)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/i,
        type: "asset/source",
      },
      {
        test: /\.tpl\.html$/i,
        type: "asset/source",
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "src/assets", to: "assets" }],
    }),
    new HtmlWebpackPlugin({
      title: "Solar System",
      template: "./src/index.html",
    }),
    new CleanWebpackPlugin(),
  ],
};
