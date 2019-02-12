jest.unmock('/src/plugin');

require('jasmine-expect');

const ProjextReactPlugin = require('/src/plugin');

describe('plugin:projextReact/main', () => {
  it('should be instantiated', () => {
    // Given
    let sut = null;
    // When
    sut = new ProjextReactPlugin();
    // Then
    expect(sut).toBeInstanceOf(ProjextReactPlugin);
  });

  it('should register the listeners for the webpack plugin', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    let sut = null;
    const expectedEvents = [
      'babel-configuration',
      'webpack-externals-configuration',
      'webpack-browser-development-configuration',
    ];
    const expectedServices = Object.keys(services);
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    // Then
    expect(app.get).toHaveBeenCalledTimes(expectedServices.length);
    expectedServices.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
    expect(events.on).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((eventName) => {
      expect(events.on).toHaveBeenCalledWith(eventName, expect.any(Function));
    });
  });

  it('shouldn\'t update a target Babel configuration if the framework setting is invalid', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'angularjs',
    };
    const initialBabelConfiguration = 'current-babel-configuration';
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(initialBabelConfiguration, { target });
    // Then
    expect(result).toBe(initialBabelConfiguration);
  });

  it('should add the React preset to the Babel configuration', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = {
      addPreset: jest.fn((config, name) => Object.assign({}, config, { preset: name })),
    };
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'react',
    };
    const initialBabelConfiguration = {};
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedPreset = '@babel/preset-react';
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(initialBabelConfiguration, target);
    // Then
    expect(result).toEqual({
      preset: expectedPreset,
    });
    expect(babelHelper.addPreset).toHaveBeenCalledTimes(1);
    expect(babelHelper.addPreset).toHaveBeenCalledWith(initialBabelConfiguration, expectedPreset);
  });

  it('should add the React HMR plugin to the Babel configuration', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = {
      addPreset: jest.fn((config, name) => Object.assign({}, config, { preset: name })),
      addPlugin: jest.fn((config, name) => Object.assign({}, config, { plugin: name })),
      disableEnvPresetModules: jest.fn((config) => Object.assign({}, config, { modules: false })),
    };
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'react',
      hot: true,
    };
    const initialBabelConfiguration = {};
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedPreset = '@babel/preset-react';
    const expectedPlugin = 'react-hot-loader/babel';
    const expectedConfigWithPreset = {
      preset: expectedPreset,
    };
    const expectedConfigWithPlugin = Object.assign({}, expectedConfigWithPreset, {
      plugin: expectedPlugin,
    });
    const expectedFinalConfig = Object.assign({}, expectedConfigWithPlugin, {
      modules: false,
    });
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(initialBabelConfiguration, target);
    // Then
    expect(result).toEqual(expectedFinalConfig);
    expect(babelHelper.addPreset).toHaveBeenCalledTimes(1);
    expect(babelHelper.addPreset).toHaveBeenCalledWith(initialBabelConfiguration, expectedPreset);
    expect(babelHelper.addPlugin).toHaveBeenCalledTimes(1);
    expect(babelHelper.addPlugin).toHaveBeenCalledWith(expectedConfigWithPreset, expectedPlugin);
    expect(babelHelper.disableEnvPresetModules).toHaveBeenCalledTimes(1);
    expect(babelHelper.disableEnvPresetModules).toHaveBeenCalledWith(expectedConfigWithPlugin);
  });

  it('shouldn\'t update the target entry if HMR is disabled', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      name: 'some-target',
      framework: 'react',
      hot: false,
    };
    const webpackConfig = {
      entry: {
        [target.name]: ['index.js'],
      },
      output: {},
    };
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(webpackConfig, { target });
    // Then
    expect(result).toEqual(webpackConfig);
  });

  it('should update the target entry if HMR is enabled', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      name: 'some-target',
      framework: 'react',
      hot: true,
    };
    const webpackConfig = {
      entry: {
        [target.name]: ['index.js'],
      },
      output: {},
    };
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedConfig = {
      entry: {
        [target.name]: [
          'react-hot-loader/patch',
          ...webpackConfig.entry[target.name],
        ],
      },
      output: {
        publicPath: '/',
      },
    };
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(webpackConfig, { target });
    // Then
    expect(result).toEqual(expectedConfig);
  });

  it('should always add the HMR entry after the babel-polyfill', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      name: 'some-target',
      framework: 'react',
      hot: true,
    };
    const babelPolyfillEntry = 'babel-polyfill';
    const targetEntry = 'index.js';
    const webpackConfig = {
      entry: {
        [target.name]: [
          babelPolyfillEntry,
          targetEntry,
        ],
      },
      output: {},
    };
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedConfig = {
      entry: {
        [target.name]: [
          babelPolyfillEntry,
          'react-hot-loader/patch',
          targetEntry,
        ],
      },
      output: {
        publicPath: '/',
      },
    };
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(webpackConfig, { target });
    // Then
    expect(result).toEqual(expectedConfig);
  });

  it('shouldn\'t modify a target externals if the framework setting is invalid', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'angularjs',
    };
    const initialExternals = {};
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(initialExternals, { target });
    // Then
    expect(result).toEqual(initialExternals);
  });

  it('shouldn\'t modify a target externals if the target is a browser app', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'react',
      is: {
        node: false,
      },
    };
    const initialExternals = {};
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(initialExternals, { target });
    // Then
    expect(result).toEqual(initialExternals);
  });

  it('should include the React packages on the externals for a Node target', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'react',
      is: {
        node: true,
      },
    };
    const initialExternals = {
      'colors/safe': 'commonjs colors/safe',
    };
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(initialExternals, { target });
    // Then
    expect(result).toEqual(Object.assign({}, initialExternals, {
      react: 'commonjs react',
      'react-dom': 'commonjs react-dom',
      'react-dom/server': 'commonjs react-dom/server',
    }));
  });

  it('should include the React packages on the externals for a browser library target', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const babelHelper = 'babelHelper';
    const services = {
      events,
      babelHelper,
    };
    const app = {
      get: jest.fn((service) => services[service]),
    };
    const target = {
      framework: 'react',
      is: {
        node: false,
      },
      library: true,
    };
    const initialExternals = {
      'colors/safe': 'commonjs colors/safe',
    };
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(initialExternals, { target });
    // Then
    expect(result).toEqual(Object.assign({}, initialExternals, {
      react: 'commonjs react',
      'react-dom': 'commonjs react-dom',
      'react-dom/server': 'commonjs react-dom/server',
    }));
  });
});
