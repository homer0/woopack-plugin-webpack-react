/**
 * This service is in charge of modifying a target Babel and entry settings in order to build
 * React code. It also manages the settings related to the React Hot Loader.
 */
class WoopackReactPlugin {
  /**
   * Class constructor.
   * @ignore
   */
  constructor() {
    /**
     * A list of reducer events the service will listen for in order to intercept rules
     * configurations and update them.
     * @type {Array}
     */
    this.rulesEventsNames = [
      'webpack-js-rules-configuration-for-node',
      'webpack-js-rules-configuration-for-browser',
    ];
    /**
     * The name of the reducer event the service will listen for and use to update a target entry
     * settings if the target `hot` property is `true`.
     * @type {string}
     */
    this.targetEventName = 'webpack-browser-development-configuration';
    /**
     * The required value a target `framework` setting needs to have in order for the service to
     * take action.
     * @type {string}
     */
    this.frameworkProperty = 'react';
    /**
     * The name of the Babel preset the service will insert into the targets configurations.
     * @type {string}
     */
    this.presetName = 'react';
    /**
     * The name of the Babel plugin the service will insert into the targets configurations if
     * the target `hot` property is `true`
     * @type {string}
     */
    this.hotPluginName = 'react-hot-loader/babel';
    /**
     * The name of the entry the service will insert into the target if the target `hot` property
     * is `true`.
     * @type {string}
     */
    this.hotEntry = 'react-hot-loader/patch';
    /**
     * The name of the loader with the Babel configurations.
     * @type {string}
     */
    this.babelLoaderName = 'babel-loader';
  }
  /**
   * This is the method called when the plugin is loaded by Woopack. It just gets the events service
   * and registers the listeners for the reducer events that handles JS rules and target
   * configuration.
   * @param {Woopack} app The Woopack main container.
   */
  register(app) {
    const events = app.get('events');
    // Add the listeners for the rules.
    this.rulesEventsNames.forEach((eventName) => {
      events.on(eventName, (rules, params) => this.updateRules(rules, params.target));
    });
    // Add the listener for the target.
    events.on(
      this.targetEventName,
      (config, params) => this.updateTargetConfiguration(config, params.target)
    );
  }
  /**
   * This method gets called when Woopack reduces the JS rules of a target. It validates the target
   * settings and makes the necessary modifications to the Babel loader configuration.
   * @param {Array}  currentRules The list of JS rules for the Webpack configuration.
   * @param {Target} target       The target information.
   * @return {Array} The updated list of rules.
   */
  updateRules(currentRules, target) {
    let updatedRules;
    // If the target `framework` setting is the right one...
    if (target.framework === this.frameworkProperty) {
      // ...copy the list of rules.
      updatedRules = currentRules.slice();
      // Get the first rule of the list (there's usually only one).
      const [baseJSRule] = updatedRules;
      // Get the index of the Babel loader.
      const babelLoaderIndex = this._findBabelLoaderIndex(baseJSRule.use);
      // If the Babel loader is preset...
      if (babelLoaderIndex > -1) {
        // ...replace it with an updated version.
        baseJSRule.use[babelLoaderIndex] = this._updateBabelLoader(
          baseJSRule.use[babelLoaderIndex],
          target.hot
        );
      }
    } else {
      // ...otherwise, just set to return the received rules.
      updatedRules = currentRules;
    }

    return currentRules;
  }
  /**
   * This method gets called when Woopack reduces a target configuration for Wepack. It validates
   * the target settings and if HMR is enabled, it updates the `entry` setting with the required
   * changes for the React Hot Loader.
   * @param {Object} currentConfiguration The current configuration for the target.
   * @param {Target} target               The target information.
   * @return {Object} The updated configuration.
   */
  updateTargetConfiguration(currentConfiguration, target) {
    let updatedConfiguration;
    // If the target `framework` and `hot` have the required values...
    if (target.framework === this.frameworkProperty && target.hot) {
      // Copy the configuration.
      updatedConfiguration = Object.assign({}, currentConfiguration);
      // Update the `publicPath`, required by the loader.
      updatedConfiguration.output.publicPath = '/';
      // Get target entry name.
      const [entryName] = Object.keys(updatedConfiguration.entry);
      // Get the list of entries for the target.
      const entries = updatedConfiguration.entry[entryName];
      // Check if the `babel-polyfill` is present, since it always needs to be first.
      const polyfillIndex = entries.indexOf('babel-polyfill');
      // If the `babel-polyfill` is present...
      if (polyfillIndex > -1) {
        // ...push the required entry after it.
        entries.splice(polyfillIndex + 1, 0, this.hotEntry);
      } else {
        // ...push the required entry as the first item.
        entries.unshift(this.hotEntry);
      }
    } else {
      // ...otherwise, just set to return the received configuration.
      updatedConfiguration = currentConfiguration;
    }

    return updatedConfiguration;
  }
  /**
   * Finds the index of the Babel loader on a list of loaders.
   * @param {Array} loaders The list of loaders.
   * @return {number}
   * @ignore
   * @access protected
   */
  _findBabelLoaderIndex(loaders) {
    return loaders.findIndex((loader) => {
      const isString = typeof loader === 'string';
      return (isString && loader === this.babelLoaderName) ||
        (!isString && loader.loader === this.babelLoaderName);
    });
  }
  /**
   * Updates an existing Babel loader configuration with the required presets and plugins to work
   * with React code.
   * The method will only modify the loader if is not on a string format and has an `options`
   * object.
   * @param {Object|string} babelLoader The loader to update.
   * @param {boolean}       hot         Whether or not the target will run with HMR. This will
   *                                    make the method disable the `modules` feature as is a
   *                                    requirement of the React Hot Loader for it to be `false`.
   * @return {Object|string}
   * @ignore
   * @access protected
   */
  _updateBabelLoader(babelLoader, hot) {
    let updatedLoader;
    /**
     * If the loader is a `string` or it doesn't have an `options` property, then the project uses
     * an external `.babelrc`, so it won't be updated.
     */
    if (typeof babelLoader !== 'string' && babelLoader.options) {
      // Copy the loader reference.
      updatedLoader = Object.assign({}, babelLoader);
      // Access the loader options.
      const { options } = updatedLoader;
      // If it doesn't have a presets list, create it.
      if (!options.presets) {
        options.presets = [];
      }
      // Push the required preset.
      options.presets.push([this.presetName]);
      // If the target will run with HMR...
      if (hot) {
        // If it doesn't have a plugins list, create it.
        if (!options.plugins) {
          options.plugins = [];
        }
        // Push the required plugin.
        options.plugins.push([this.hotPluginName]);
        // Get the index of the `env` preset, in order to disable `modules`.
        const envPresetIndex = options.presets.findIndex((preset) => {
          const [presetName] = preset;
          return presetName === 'env';
        });
        // If the `env` preset is present...
        if (envPresetIndex > -1) {
          // Get the `env` preset options.
          const [, envPresetOptions] = options.presets[envPresetIndex];
          // Disable `modules`.
          envPresetOptions.modules = false;
        }
      }
    } else {
      updatedLoader = babelLoader;
    }

    return updatedLoader;
  }
}

module.exports = WoopackReactPlugin;
