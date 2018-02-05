class WoopackReactPlugin {
  constructor() {
    this.rulesEventsNames = [
      'webpack-js-rules-configuration-for-node',
      'webpack-js-rules-configuration-for-browser',
    ];

    this.targetEventName = 'webpack-browser-development-configuration';

    this.frameworkProperty = 'react';
    this.presetName = 'react';
    this.hotPluginName = 'react-hot-loader/babel';
    this.hotEntry = 'react-hot-loader/patch';
    this.babelLoaderName = 'babel-loader';
  }

  register(app) {
    const events = app.get('events');
    this.rulesEventsNames.forEach((eventName) => {
      events.on(eventName, (rules, params) => this.updateRules(rules, params.target));
    });
    events.on(
      this.targetEventName,
      (config, params) => this.updateTargetConfiguration(config, params.target)
    );
  }

  updateRules(currentRules, target) {
    let updatedRules;
    if (target.framework === this.frameworkProperty) {
      updatedRules = currentRules.slice();
      const [baseJSRule] = updatedRules;
      const babelLoaderIndex = this._findBabelLoaderIndex(baseJSRule.use);
      if (babelLoaderIndex > -1) {
        baseJSRule.use[babelLoaderIndex] = this._updateBabelLoader(
          baseJSRule.use[babelLoaderIndex],
          target.hot
        );
      }
    } else {
      updatedRules = currentRules;
    }

    return currentRules;
  }

  updateTargetConfiguration(currentConfiguration, target) {
    let updatedConfiguration;
    if (target.framework === this.frameworkProperty && target.hot) {
      updatedConfiguration = Object.assign({}, currentConfiguration);
      updatedConfiguration.output.publicPath = '/';
      const [entryName] = Object.keys(updatedConfiguration.entry);
      const entries = updatedConfiguration.entry[entryName];
      const polyfillIndex = entries.indexOf('babel-polyfill');
      if (polyfillIndex > -1) {
        entries.splice(polyfillIndex + 1, 0, this.hotEntry);
      } else {
        entries.unshift(this.hotEntry);
      }
    } else {
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

  _updateBabelLoader(babelLoader, hot) {
    let updatedLoader;
    /**
     * If the loader is a `string` or it doesn't have an `options` property, then the project uses
     * an external `.babelrc`, so it won't be updated.
     */
    if (typeof babelLoader !== 'string' && babelLoader.options) {
      updatedLoader = Object.assign({}, babelLoader);
      // Access the loader options.
      const { options } = updatedLoader;
      if (!options.presets) {
        options.presets = [];
      }

      options.presets.push([this.presetName]);
      if (hot) {
        if (!options.plugins) {
          options.plugins = [];
        }

        options.plugins.push([this.hotPluginName]);
        const envPresetIndex = options.presets.findIndex((preset) => {
          const [presetName] = preset;
          return presetName === 'env';
        });

        if (envPresetIndex > -1) {
          const [, envPresetOptions] = options.presets[envPresetIndex];
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
