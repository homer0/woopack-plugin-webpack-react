/**
 * It updates targets Babel configuration in order to add support for JSX and hot reload. And if
 * a target implements SSR, it takes care of including the paths to the other target(s) so their
 * files will be processed/transpiled.
 */
class ProjextReactPlugin {
  /**
   * Class constructor.
   */
  constructor() {
    /**
     * The name of the event triggered when the files rules of a target are created. This service
     * will listen for it, and if the target implements SSR, it will add the other target(s) to the
     * file rules.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._rulesEvent = 'target-file-rules';
    /**
     * The name of the reducer event the service will listen for in order to add support for JSX
     * and HMR.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._babelConfigurationEvent = 'babel-configuration';
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
     * The name of the reducer event the service will listen for in order to exclude React packages
     * from the bundle when the target is for Node or it's a browser library.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._externalSettingsEventName = 'webpack-externals-configuration';
    /**
     * The name of the reducer event the service will listen for in order to update a target entry
     * settings when the target implements HMR.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._targetEntriesEvent = 'webpack-browser-development-configuration';
    /**
     * The required value a target `framework` setting needs to have in order for the service to
     * take action.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._frameworkProperty = 'react';
    /**
     * The default values for the options a target can use to customize how the plugin works.
     * @type {Object}
     * @property {Array} ssr A list of other targets being used for SSR (Server Side Rendering) and
     *                       which paths should be included by processing the JSX.
     * @access protected
     * @ignore
     */
    this._frameworkOptions = {
      ssr: [],
    };
    /**
     * The name of the Babel preset required to add support for React's JSX.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._babelPreset = 'react';
    /**
     * The name of the plugin required for HMR.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._hotPlugin = 'react-hot-loader/babel';
    /**
     * The name of the required entry in order to enable HMR.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._hotEntry = 'react-hot-loader/patch';
  }
  /**
   * This is the method called when the plugin is loaded by projext. It just gets the events service
   * and registers the listeners for the reducer events that handle the JS rules, fonts rules,
   * images rules and target configuration.
   * @param {Projext} app The projext main container.
   */
  register(app) {
    // Get the `events` service to listen for the events.
    const events = app.get('events');
    // Get the `target` service to send to the method that needs to obtain information for SSR.
    const targets = app.get('targets');
    // Get the `babelHelper` to send to the method that updates the Babel configuration.
    const babelHelper = app.get('babelHelper');
    // Add the listener for the event that includes SSR paths.
    events.on(this._rulesEvent, (rules, target) => {
      this._updateTargetFileRules(rules, target, targets);
    });
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
   * This method gets called when projext creates the file rules for a target. The method validates
   * the target settings and, if needed, add the paths of another target for SSR.
   * @param {TargetFilesRules} rules   The file rules for the target.
   * @param {Target}           target  The target information.
   * @param {Targets}          targets The targets service, to get the information of targets
   *                                   the one being processed may need for SSR.
   * @access protected
   * @ignore
   */
  _updateTargetFileRules(rules, target, targets) {
    if (target.framework === this._frameworkProperty) {
      const options = this._getTargetOptions(target);
      options.ssr.forEach((name) => {
        const ssrTarget = targets.getTarget(name);
        rules.js.addTarget(ssrTarget);
        rules.scss.addTarget(ssrTarget);
        rules.fonts.common.addTarget(ssrTarget);
        rules.fonts.svg.addTarget(ssrTarget);
        rules.images.addTarget(ssrTarget);
      });
    }
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
        updatedConfiguration = babelHelper.addPlugin(updatedConfiguration, this._hotPlugin);
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
      this._frameworkOptions,
      target.frameworkOptions || {}
    );
  }
}

module.exports = ProjextReactPlugin;
