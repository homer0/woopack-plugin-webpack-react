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
    expect(sut.rulesEventsNames).toEqual([
      'webpack-js-rules-configuration-for-node',
      'webpack-js-rules-configuration-for-browser',
    ]);
    expect(sut.targetEventName).toBe('webpack-browser-development-configuration');
    expect(sut.frameworkProperty).toBe('react');
    expect(sut.presetName).toBe('react');
    expect(sut.hotPluginName).toBe('react-hot-loader/babel');
    expect(sut.hotEntry).toBe('react-hot-loader/patch');
    expect(sut.babelLoaderName).toBe('babel-loader');
  });

  it('should register the listeners for the Webpack plugin', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    let sut = null;
    const expectedEvents = [
      'webpack-js-rules-configuration-for-node',
      'webpack-js-rules-configuration-for-browser',
      'webpack-browser-development-configuration',
    ];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    // Then
    expect(app.get).toHaveBeenCalledTimes(1);
    expect(app.get).toHaveBeenCalledWith('events');
    expect(events.on).toHaveBeenCalledTimes(expectedEvents.length);
    expectedEvents.forEach((eventName) => {
      expect(events.on).toHaveBeenCalledWith(eventName, expect.any(Function));
    });
  });

  it('shouldn\'t modify the rules of a target with an unknown framework property', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      framework: 'angularjs',
    };
    const currentRules = [{
      test: /\.jsx?$/i,
      use: [
        'some-random-loader',
      ],
    }];
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('shouldn\'t modify the rules of a target that doesn\'t have a Babel loader', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      framework: 'react',
    };
    const currentRules = [{
      test: /\.jsx?$/i,
      use: [
        'some-random-loader',
      ],
    }];
    let sut = null;
    let reducer = null;
    let result = null;
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('shouldn\'t update the Babel config if the loader is set as a string', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      framework: 'react',
    };
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [
        'babel-loader',
      ],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: currentJSLoader.use,
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('should update the JS rules Babel options of a target', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      framework: 'react',
    };
    const currentBabelLoader = {
      loader: 'babel-loader',
      options: {},
    };
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [currentBabelLoader],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedBabelLoader = {
      loader: 'babel-loader',
      options: {
        presets: [['react']],
      },
    };
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: [expectedBabelLoader],
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('should update the JS rules Babel options of a target with HMR', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      framework: 'react',
      hot: true,
    };
    const currentBabelLoader = {
      loader: 'babel-loader',
      options: {},
    };
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [currentBabelLoader],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedBabelLoader = {
      loader: 'babel-loader',
      options: {
        presets: [['react']],
        plugins: [['react-hot-loader/babel']],
      },
    };
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: [expectedBabelLoader],
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('should update disable the `modules` setting on the Babel config for HMR', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      framework: 'react',
      hot: true,
    };
    const currentBabelLoader = {
      loader: 'babel-loader',
      options: {
        presets: [['env', {}]],
        plugins: [],
      },
    };
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [currentBabelLoader],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedBabelLoader = {
      loader: 'babel-loader',
      options: {
        presets: [['env', { modules: false }], ['react']],
        plugins: [['react-hot-loader/babel']],
      },
    };
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: [expectedBabelLoader],
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('shouldn\'t update the target entry if HMR is disabled', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      name: 'some-target',
      framework: 'react',
      hot: false,
    };
    const targetConfig = {
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
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(targetConfig, { target });
    // Then
    expect(result).toEqual(targetConfig);
  });

  it('should update the target entry if HMR is enabled', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      name: 'some-target',
      framework: 'react',
      hot: true,
    };
    const targetConfig = {
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
          ...targetConfig.entry[target.name],
        ],
      },
      output: {
        publicPath: '/',
      },
    };
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(targetConfig, { target });
    // Then
    expect(result).toEqual(expectedConfig);
  });

  it('should always add the HMR entry after the babel-polyfill', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      name: 'some-target',
      framework: 'react',
      hot: true,
    };
    const babelPolyfillEntry = 'babel-polyfill';
    const targetEntry = 'index.js';
    const targetConfig = {
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
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(targetConfig, { target });
    // Then
    expect(result).toEqual(expectedConfig);
  });
});
