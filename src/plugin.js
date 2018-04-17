/**
 * This service is in charge of modifying a target Babel and entry settings in order to build
 * React code. It also manages the settings related to the React Hot Loader.
 */
class ProjextReactPlugin {
  /**
   * Class constructor.
   * @ignore
   */
  constructor() {
    /**
     * The name of the reducer event the service will listen in order to intercept the rules for
     * JS files and update them.
     * @type {string}
     */
    this.jsRulesEvent = 'webpack-js-rules-configuration';
    /**
     * The name of the reducer event the service will listen in order to intercept the rules for
     * SCSS files and update them.
     * @type {string}
     */
    this.scssRulesEvent = 'webpack-scss-rules-configuration';
    /**
     * The name of the reducer event the service will listen in order to intercept the rules for
     * fonts files, and if the target implements SSR, update them.
     * @type {string}
     */
    this.fontsRulesEvent = 'webpack-fonts-rules-configuration';
    /**
     * The name of the reducer event the service will listen in order to intercept the rules for
     * images files, and if the target implements SSR, update them.
     * @type {string}
     */
    this.imagesRulesEvent = 'webpack-images-rules-configuration';
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
     * The default values for the options a target can use to customize how the plugin works.
     * @type {Object}
     * @property {Array} ssr A list of other targets being used for SSR (Server Side Rendering) and
     *                       which paths should be included by processing the JSX.
     */
    this.frameworkOptions = {
      ssr: [],
    };
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
   * This is the method called when the plugin is loaded by projext. It just gets the events service
   * and registers the listeners for the reducer events that handle the JS rules, fonts rules,
   * images rules and target configuration.
   * @param {Projext} app The projext main container.
   */
  register(app) {
    const events = app.get('events');
    // Add the listener for the JS files rules event.
    events.on(this.jsRulesEvent, (rules, params) => (
      this.updateJSRules(rules, params.target, app.get('targets'))
    ));
    // Add the listener for the SCSS files rules event.
    events.on(this.scssRulesEvent, (rules, params) => (
      this.updateStylesRules(rules, params.target, app.get('targets'))
    ));
    // Add the listener for the font files rules event.
    events.on(this.fontsRulesEvent, (rules, params) => (
      this.updateFontsRules(rules, params.target, app.get('targets'))
    ));
    // Add the listener for the font files rules event.
    events.on(this.imagesRulesEvent, (rules, params) => (
      this.updateImagesRules(rules, params.target, app.get('targets'))
    ));
    // Add the listener for the target configuration event.
    events.on(
      this.targetEventName,
      (config, params) => this.updateTargetConfiguration(config, params.target)
    );
  }
  /**
   * This method gets called when projext reduces the JS rules of a target. It validates the target
   * settings and makes the necessary modifications to the Babel loader configuration.
   * @param {Array}   currentRules The list of JS rules for the webpack configuration.
   * @param {Target}  target       The target information.
   * @param {Targets} targets      The targets service, to get the information of targets the
   *                               one being processed may need for SSR.
   * @return {Array} The updated list of rules.
   */
  updateJSRules(currentRules, target, targets) {
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
        // ...get the framework options for the target.
        const options = this._getTargetOptions(target);
        // Push the paths for SSR targets
        baseJSRule.include.push(...options.ssr.map((name) => {
          const targetInfo = targets.getTarget(name);
          return new RegExp(targetInfo.folders.source);
        }));

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

    // Return the updated rules
    return currentRules;
  }
  /**
   * This method gets called when projext reduces the SCSS rules of a target. It validates the
   * target settings, and if the target implements SSR, it adds the `include` setting on the rule
   * for the SSR targets directories.
   * @param {Array}   currentRules The list of fonts rules for the webpack configuration.
   * @param {Target}  target       The target information.
   * @param {Targets} targets      The targets service, to get the SSR targets information.
   * @return {Array} The updated list of rules.
   */
  updateStylesRules(currentRules, target, targets) {
    let updatedRules;
    // If the target `framework` setting is the right one...
    if (target.framework === this.frameworkProperty) {
      // ...copy the list of rules.
      updatedRules = currentRules.slice();
      // Get the first rule of the list (there's usually only one).
      const [mainRule] = updatedRules;
      // Get the target framework options.
      const options = this._getTargetOptions(target);
      // If the `include` option is a list, keep it like that, otherwise, convert it into a list.
      const include = Array.isArray(mainRule.include) ?
        mainRule.include :
        [mainRule.include];

      // Loop all the possible SSR targets and add their paths to the `include` option.
      include.push(...options.ssr.map((name) => (
        new RegExp(targets.getTarget(name).folders.source)
      )));

      // Overwrite the rule `include` option.
      mainRule.include = include;
    } else {
      // ...otherwise, just set to return the received rules.
      updatedRules = currentRules;
    }

    // Return the updated rules.
    return updatedRules;
  }
  /**
   * This method gets called when projext reduces the fonts files rules of a target. It validates
   * the target settings, and if the target implements SSR, it adds the `include` setting on
   * the SVG rule for the SSR targets directories.
   * @param {Array}   currentRules The list of fonts rules for the webpack configuration.
   * @param {Target}  target       The target information.
   * @param {Targets} targets      The targets service, to get the SSR targets information.
   * @return {Array} The updated list of rules.
   */
  updateFontsRules(currentRules, target, targets) {
    let updatedRules;
    // If the target `framework` setting is the right one...
    if (target.framework === this.frameworkProperty) {
      // ...copy the list of rules.
      updatedRules = currentRules.slice();
      // Find the loader used for SVG files.
      const svgLoader = updatedRules.find((rule) => '.svg'.match(rule.test));
      // If the loader was found...
      if (svgLoader) {
        // ...get the target framework options.
        const options = this._getTargetOptions(target);
        // If the `include` option is a list, keep it like that, otherwise, convert it into a list.
        const include = Array.isArray(svgLoader.include) ?
          svgLoader.include :
          [svgLoader.include];

        // Loop all the possible SSR targets and add their _"fonts path"_ to the `include` option.
        include.push(...options.ssr.map((name) => (
          this._getTargetFontsRegExp(targets.getTarget(name))
        )));

        // Overwrite the SVG loder `include` option.
        svgLoader.include = include;
      }
    } else {
      // ...otherwise, just set to return the received rules.
      updatedRules = currentRules;
    }

    // Return the updated rules.
    return updatedRules;
  }
  /**
   * This method gets called when projext reduces the images files rules of a target. It validates
   * the target settings, and if the target implements SSR, it adds the `exclude` setting on
   * the SVG rule for the SSR targets fonts directories.
   * @param {Array}   currentRules The list of fonts rules for the webpack configuration.
   * @param {Target}  target       The target information.
   * @param {Targets} targets      The targets service, to get the SSR targets information.
   * @return {Array} The updated list of rules.
   */
  updateImagesRules(currentRules, target, targets) {
    let updatedRules;
    // If the target `framework` setting is the right one...
    if (target.framework === this.frameworkProperty) {
      // ...copy the list of rules.
      updatedRules = currentRules.slice();
      // Find the loader used for SVG files.
      const svgLoader = updatedRules.find((rule) => '.svg'.match(rule.test));
      // If the loader was found...
      if (svgLoader) {
        // ...get the target framework options.
        const options = this._getTargetOptions(target);
        // If the `exclude` option is a list, keep it like that, otherwise, convert it into a list.
        const exclude = Array.isArray(svgLoader.exclude) ?
          svgLoader.exclude :
          [svgLoader.exclude];

        // Loop all the possible SSR targets and add their _"fonts path"_ to the `exclude` option.
        exclude.push(...options.ssr.map((name) => (
          this._getTargetFontsRegExp(targets.getTarget(name))
        )));

        // Overwrite the SVG loder `exclude` option.
        svgLoader.exclude = exclude;
      }
    } else {
      // ...otherwise, just set to return the received rules.
      updatedRules = currentRules;
    }

    // Return the updated rules.
    return updatedRules;
  }
  /**
   * This method gets called when projext reduces a target configuration for Wepack. It validates
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
   * Merge the default framework options with the overwrites the target may have, and return the
   * dictionary with the _"final options"_, ready to use.
   * @param {Target} target The target information.
   * @return {Object}
   * @ignore
   * @access protected
   */
  _getTargetOptions(target) {
    return Object.assign(
      {},
      this.frameworkOptions,
      target.frameworkOptions || {}
    );
  }
  /**
   * Gets the RegExp for a fonts folder inside a given target source directory. This is used on
   * the fonts SVG loader to `include` the files and on the images SVG loader to `exclude` them,
   * that way SVG files inside a folder that matches the RegExp get handled as fonts and if they
   * don't match it, they get handled as images.
   * @param {Target} target The target information.
   * @return {RegExp}
   * @ignore
   * @access protected
   */
  _getTargetFontsRegExp(target) {
    return new RegExp(`${target.paths.source}/(?:.*?/)?fonts/.*?`, 'i');
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

module.exports = ProjextReactPlugin;
