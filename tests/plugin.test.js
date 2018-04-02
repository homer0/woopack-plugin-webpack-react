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
    expect(sut.jsRulesEvent).toBe('webpack-js-rules-configuration');
    expect(sut.fontsRulesEvent).toBe('webpack-fonts-rules-configuration');
    expect(sut.imagesRulesEvent).toBe('webpack-images-rules-configuration');
    expect(sut.targetEventName).toBe('webpack-browser-development-configuration');
    expect(sut.frameworkProperty).toBe('react');
    expect(sut.presetName).toBe('react');
    expect(sut.hotPluginName).toBe('react-hot-loader/babel');
    expect(sut.hotEntry).toBe('react-hot-loader/patch');
    expect(sut.babelLoaderName).toBe('babel-loader');
  });

  it('should register the listeners for the webpack plugin', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    let sut = null;
    const expectedEvents = [
      'webpack-js-rules-configuration',
      'webpack-fonts-rules-configuration',
      'webpack-images-rules-configuration',
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

  it('shouldn\'t modify the JS rules of a target with an unknown framework property', () => {
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

  it('shouldn\'t modify the JS rules of a target that doesn\'t have a Babel loader', () => {
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
      include: [],
    };
    const currentRules = [currentJSLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedLoaders = [Object.assign({}, currentJSLoader, {
      use: currentJSLoader.use,
      include: [],
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
      include: [],
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
      include: [],
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
      include: [],
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
      include: [],
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('should disable the `modules` setting on the Babel config for HMR', () => {
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
      include: [],
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
      include: [],
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('should include other targets paths if the target uses SSR', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const otherTarget = {
      name: 'other-target',
      folders: {
        source: 'src/other-target',
      },
    };
    const targets = {
      getTarget: jest.fn(() => otherTarget),
    };
    const appServices = {
      events,
      targets,
    };
    const app = {
      get: jest.fn((service) => appServices[service]),
    };
    const target = {
      framework: 'react',
      frameworkOptions: {
        ssr: [otherTarget.name],
      },
    };
    const currentBabelLoader = {
      loader: 'babel-loader',
      options: {},
    };
    const currentJSLoader = {
      test: /\.jsx?$/i,
      use: [currentBabelLoader],
      include: [],
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
      include: [
        new RegExp(otherTarget.folders.source),
      ],
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [[, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedLoaders);
  });

  it('shouldn\'t modify the fonts rules of a target with an unknown framework property', () => {
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
      test: /\.svg$/i,
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
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('shouldn\'t modify the fonts rules of a target that doesn\'t have framework options', () => {
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
      test: /\.svg$/i,
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
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('shouldn\'t modify the fonts rules of a target that doesn\'t implement SSR', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      framework: 'react',
      frameworkOptions: {
        ssr: [],
      },
    };
    const currentRules = [{
      test: /\.svg$/i,
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
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('shouldn\'t modify the fonts rules if there\'s no SVG loader', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      framework: 'react',
      frameworkOptions: {
        ssr: [],
      },
    };
    const currentRules = [{
      test: /\.not-svg$/i,
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
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('should update the fonts rules to include SSR targets', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const otherTarget = {
      name: 'other-target',
      paths: {
        source: 'src/other-target',
      },
    };
    const targets = {
      getTarget: jest.fn(() => otherTarget),
    };
    const appServices = {
      events,
      targets,
    };
    const app = {
      get: jest.fn((service) => appServices[service]),
    };
    const target = {
      framework: 'react',
      frameworkOptions: {
        ssr: [otherTarget.name],
      },
    };
    const currentLoader = {
      test: /\.svg$/i,
      include: /fonts/i,
    };
    const currentRules = [currentLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedRules = [Object.assign({}, currentLoader, {
      include: [
        currentLoader.include,
        new RegExp(`${otherTarget.paths.source}/(?:.*?/)?fonts/.*?`, 'i'),
      ],
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedRules);
  });

  it('should update the fonts rules even if it already includes an `include` setting', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const otherTarget = {
      name: 'other-target',
      paths: {
        source: 'src/other-target',
      },
    };
    const targets = {
      getTarget: jest.fn(() => otherTarget),
    };
    const appServices = {
      events,
      targets,
    };
    const app = {
      get: jest.fn((service) => appServices[service]),
    };
    const target = {
      framework: 'react',
      frameworkOptions: {
        ssr: [otherTarget.name],
      },
    };
    const currentLoader = {
      test: /\.svg$/i,
      include: [/fonts/i],
    };
    const currentRules = [currentLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedRules = [Object.assign({}, currentLoader, {
      include: [
        currentLoader.include[0],
        new RegExp(`${otherTarget.paths.source}/(?:.*?/)?fonts/.*?`, 'i'),
      ],
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedRules);
  });

  it('shouldn\'t modify the images rules of a target with an unknown framework property', () => {
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
      test: /\.svg$/i,
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
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('shouldn\'t modify the images rules of a target that doesn\'t have framework options', () => {
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
      test: /\.svg$/i,
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
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('shouldn\'t modify the images rules of a target that doesn\'t implement SSR', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      framework: 'react',
      frameworkOptions: {
        ssr: [],
      },
    };
    const currentRules = [{
      test: /\.svg$/i,
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
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('shouldn\'t modify the images rules if there\'s no SVG loader', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const app = {
      get: jest.fn(() => events),
    };
    const target = {
      framework: 'react',
      frameworkOptions: {
        ssr: [],
      },
    };
    const currentRules = [{
      test: /\.not-svg$/i,
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
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(currentRules);
  });

  it('should update the fonts rules to include SSR targets', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const otherTarget = {
      name: 'other-target',
      paths: {
        source: 'src/other-target',
      },
    };
    const targets = {
      getTarget: jest.fn(() => otherTarget),
    };
    const appServices = {
      events,
      targets,
    };
    const app = {
      get: jest.fn((service) => appServices[service]),
    };
    const target = {
      framework: 'react',
      frameworkOptions: {
        ssr: [otherTarget.name],
      },
    };
    const currentLoader = {
      test: /\.svg$/i,
      exclude: /fonts/i,
    };
    const currentRules = [currentLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedRules = [Object.assign({}, currentLoader, {
      exclude: [
        currentLoader.exclude,
        new RegExp(`${otherTarget.paths.source}/(?:.*?/)?fonts/.*?`, 'i'),
      ],
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedRules);
  });

  it('should update the images rules even if it already includes an `include` setting', () => {
    // Given
    const events = {
      on: jest.fn(),
    };
    const otherTarget = {
      name: 'other-target',
      paths: {
        source: 'src/other-target',
      },
    };
    const targets = {
      getTarget: jest.fn(() => otherTarget),
    };
    const appServices = {
      events,
      targets,
    };
    const app = {
      get: jest.fn((service) => appServices[service]),
    };
    const target = {
      framework: 'react',
      frameworkOptions: {
        ssr: [otherTarget.name],
      },
    };
    const currentLoader = {
      test: /\.svg$/i,
      exclude: [/fonts/i],
    };
    const currentRules = [currentLoader];
    let sut = null;
    let reducer = null;
    let result = null;
    const expectedRules = [Object.assign({}, currentLoader, {
      exclude: [
        currentLoader.exclude[0],
        new RegExp(`${otherTarget.paths.source}/(?:.*?/)?fonts/.*?`, 'i'),
      ],
    })];
    // When
    sut = new ProjextReactPlugin();
    sut.register(app);
    [,, [, reducer]] = events.on.mock.calls;
    result = reducer(currentRules, { target });
    // Then
    expect(result).toEqual(expectedRules);
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
    [,,, [, reducer]] = events.on.mock.calls;
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
    [,,, [, reducer]] = events.on.mock.calls;
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
    [,,, [, reducer]] = events.on.mock.calls;
    result = reducer(targetConfig, { target });
    // Then
    expect(result).toEqual(expectedConfig);
  });
});
