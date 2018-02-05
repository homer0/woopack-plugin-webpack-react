const WoopackReactPlugin = require('./plugin');
/**
 * This is the method called by Woopack when loading the plugin. It takes care of creating
 * a new instance of the plugin class and use it to register for the required events.
 * @param {Woopack} app The Woopack main container.
 * @ignore
 */
const loadPlugin = (app) => {
  const plugin = new WoopackReactPlugin();
  plugin.register(app);
};

module.exports = loadPlugin;
