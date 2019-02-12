/**
 * It updates targets Babel configuration in order to add support for JSX and hot reload.
 */
class ProjextReactPlugin {
  /**
   * Class constructor.
   */
  constructor() {
    /**
     * The name of the reducer event the service will listen for in order to exclude React packages
     * from the bundle when the target is for Node or it's a browser library.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._externalSettingsEventName = 'webpack-externals-configuration';
    /**
     * The list of React packages that should never end up on the bundle. For browser targets,
     * this is only added if the target is also a library.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._externalModules = [
      'react',
      'react-dom',
      'react-dom/server',
    ];
    /**
     * The name of the reducer event the service will listen for in order to add support for JSX
     * and HMR.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._babelConfigurationEvent = 'babel-configuration';
    /**
     * The name of the Babel preset required to add support for React's JSX.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._babelPreset = '@babel/preset-react';
    /**
     * The name of the plugin required for HMR.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._babelHotPlugin = 'react-hot-loader/babel';
    /**
     * The name of the reducer event the service will listen for in order to update a target entry
     * settings when the target implements HMR.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._targetEntriesEvent = 'webpack-browser-development-configuration';
    /**
     * The name of the required entry in order to enable HMR.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._hotEntry = 'react-hot-loader/patch';
    /**
     * The required value a target `framework` setting needs to have in order for the service to
     * take action.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._frameworkProperty = 'react';
  }
  /**
   * This is the method called when the plugin is loaded by projext. It setups all the listeners
   * for the events the plugin needs to intercept in order to add support for JSX.
   * It also listens for the event that defines the external dependencies, because if the
   * target type is Node or is a library, it should include the React packages as externals.
   * @param {Projext} app The projext main container.
   */
  register(app) {
    // Get the `events` service to listen for the events.
    const events = app.get('events');
    // Get the `babelHelper` to send to the method that updates the Babel configuration.
    const babelHelper = app.get('babelHelper');
    // Add the listener for the event that updates the Babel configuration.
    events.on(this._babelConfigurationEvent, (configuration, target) => (
      this._updateBabelConfiguration(configuration, target, babelHelper)
    ));
    // Add the listener for the event that updates the target entries.
    events.on(this._targetEntriesEvent, (config, params) => (
      this._updateTargetEntry(config, params.target)
    ));
    // Add the listener for the event that updates the external dependencies.
    events.on(this._externalSettingsEventName, (externals, params) => (
      this._updateExternals(externals, params.target)
    ));
  }
  /**
   * This method gets called when projext reduces a target Babel configuration. The method will
   * validate the target settings and add the Babel plugins needed for JSX and HMR.
   * @param {Object}      currentConfiguration The current Babel configuration for the target.
   * @param {Target}      target               The target information.
   * @param {BabelHelper} babelHelper          To update the target configuration and add the
   *                                           required preset and plugin.
   * @return {Object} The updated configuration.
   * @access protected
   * @ignore
   */
  _updateBabelConfiguration(currentConfiguration, target, babelHelper) {
    let updatedConfiguration;
    if (target.framework === this._frameworkProperty) {
      updatedConfiguration = babelHelper.addPreset(currentConfiguration, this._babelPreset);
      if (target.hot) {
        updatedConfiguration = babelHelper.addPlugin(updatedConfiguration, this._babelHotPlugin);
        updatedConfiguration = babelHelper.disableEnvPresetModules(updatedConfiguration);
      }
    } else {
      updatedConfiguration = currentConfiguration;
    }

    return updatedConfiguration;
  }
  /**
   * This method gets called when projext reduces a target configuration for Wepack. It validates
   * the target settings and if HMR is enabled, it updates the `entry` setting with the required
   * changes for the React Hot Loader.
   * @param {Object} currentConfiguration The current configuration for the target.
   * @param {Target} target               The target information.
   * @return {Object} The updated configuration.
   * @access protected
   * @ignore
   */
  _updateTargetEntry(currentConfiguration, target) {
    let updatedConfiguration;
    // If the target `framework` and `hot` have the required values...
    if (target.framework === this._frameworkProperty && target.hot) {
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
        entries.splice(polyfillIndex + 1, 0, this._hotEntry);
      } else {
        // ...push the required entry as the first item.
        entries.unshift(this._hotEntry);
      }
    } else {
      // ...otherwise, just set to return the received configuration.
      updatedConfiguration = currentConfiguration;
    }

    return updatedConfiguration;
  }
  /**
   * This method gets called when the webpack plugin reduces the list of modules that should be
   * handled as external dependencies. The method validates the target settings and if it's a
   * Node target or a browser library, it pushes the React packages to the list.
   * @param {Object} currentExternals A dictionary of external dependencies with the format
   *                                  webpack uses: `{ 'module': 'commonjs module'}`.
   * @param {Target} target           The target information.
   * @return {Object} The updated externals dictionary.
   * @access protected
   * @ignore
   */
  _updateExternals(currentExternals, target) {
    let updatedExternals;
    if (
      target.framework === this._frameworkProperty &&
      (target.is.node || target.library)
    ) {
      updatedExternals = Object.assign({}, currentExternals);
      this._externalModules.forEach((name) => {
        updatedExternals[name] = `commonjs ${name}`;
      });
    } else {
      updatedExternals = currentExternals;
    }

    return updatedExternals;
  }
}

module.exports = ProjextReactPlugin;
