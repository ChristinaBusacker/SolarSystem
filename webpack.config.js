/**
 * Convenience entry point.
 * Allows running `webpack --config webpack.config.js --env production` if desired.
 */
module.exports = (env = {}) => {
  const isProd = Boolean(env.production) || process.env.NODE_ENV === "production";
  return isProd ? require("./webpack.prod") : require("./webpack.dev");
};
