const WoopackReactPlugin = require('./plugin');

const loadPlugin = (app) => {
  const plugin = new WoopackReactPlugin();
  plugin.register(app);
};

module.exports = loadPlugin;
