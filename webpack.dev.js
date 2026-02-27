const path = require("path");
const { merge } = require("webpack-merge");
const Dotenv = require("dotenv-webpack");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              implementation: require("sass"),
              api: "modern",
            },
          },
        ],
      },
    ],
  },
  plugins: [
    // Prefer .env.dev when present (fallback: .env)
    new Dotenv({ path: path.resolve(__dirname, ".env.dev"), safe: false }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: true,
    port: 9000,
    open: true,
    historyApiFallback: true,
    hot: true,
    client: {
      overlay: true,
    },
  },
});
