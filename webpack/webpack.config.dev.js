const merge = require('webpack-merge');
const WebpackBar = require('webpackbar');
const AutoRefreshPlugin = require('./AutoRefreshPlugin');

const common = require('./webpack.common.config');

const plugins = [
  new WebpackBar({ name: 'Jira Helper' }),
  new AutoRefreshPlugin([
    {
      name: 'content',
      events: [{ name: 'refresh_background', timeout: 50 }],
    },
  ]),
];

module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  plugins,
  watch: true,
});
