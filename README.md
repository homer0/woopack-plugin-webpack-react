# projext plugin for React on webpack

Allows you to bundle a [React](https://reactjs.org/) project with [projext](https://yarnpkg.com/en/package/projext) using the [webpack](https://webpack.js.org) [build engine](https://yarnpkg.com/en/package/projext-plugin-webpack).

## Introduction

[projext](https://yarnpkg.com/en/package/projext) allows you to configure a project without adding specific settings for a module bundler, then you can decide which build engine to use. This plugin is meant to be used when you are bundling a [React](https://reactjs.org/) and you are using the [webpack](https://webpack.js.org) [build engine](https://yarnpkg.com/en/package/projext-plugin-webpack).

It adds the required presets to the [`babel-loader`](https://yarnpkg.com/en/package/babel-loader) configuration in order to handle [`JSX`](https://facebook.github.io/jsx/) code. It also takes care of modifying the webpack settings in order to implement the [`react-hot-loader`](https://yarnpkg.com/en/package/react-hot-loader) with both, the dev server and an [Express](https://expressjs.com)/[Jimpex](https://yarnpkg.com/en/package/jimpex) target.

## Information

| -            | -                                                                                      |
|--------------|----------------------------------------------------------------------------------------|
| Package      | projext-plugin-webpack-react.                                                          |
| Description  | Allows you to bundle a React project with projext using the webpack build engine.      |
| Node Version | >= v6.10.0                                                                             |

## Usage

1. You first need the build engine, so install [`projext-plugin-webpack`](https://yarnpkg.com/en/package/projext-plugin-webpack).
2. If you changed it, set your target `engine` setting to `webpack`.
3. Add a new setting to your target named `framework` and set its value to `react`.
4. Done

Now, when your target gets builded, the plugin will check if the target is using webpack and if the framework is React, then it will make the necessary changes to bundle the `JSX` code.

### Hot loader

> If you don't know what hot reload is, you should probably watch [Dan Abramov's talk on Hot Reloading with Time Travel](https://www.youtube.com/watch?v=xsSnOQynTHs).

To enable this feature, you just need to set the target `hot` setting to `true`:

```js
module.exports = {
  targets: {
    myTarget: {
      type: 'browser',
      framework: 'react',
      hot: true,
    },
  },
};
```

And that's all there is, if you are running the target by itself, it will configure the hot loader settings for the webpack dev server; and if you are using a Node target, the configuration will be made for the hot middleware.

> If you don't know how to implement the middlewares on your Express/Jimpex app, you can check [the `projext-plugin-webpack` documentation for it](https://homer0.github.io/projext-plugin-webpack/#middleware-implementation).

### Babel

This plugin only adds a new loader when hot reload is enabled, but leaving that aside, the only thing it does is modify the [Babel](https://babeljs.io) configuration in order to add the required changes:

- Presets: `react`
- Plugins: `react-hot-loader/babel`
- It disables the `modules` feature on the `env` preset.


So, if for some reason you are overwriting the configuration projext generates, instead of making sure you add those requirements, you should consider if you really need this plugin: The only advantage it can provide is the auto-configuration of the hot reload (which is kind of tricky :P), but if you are not using hot reload, you could just add the `react` preset when you overwrite the Babel configuration that would be all.

## Development

Before doing anything, install the repository hooks:

```bash
# You can either use npm or yarn, it doesn't matter
npm run install-hooks
```

### NPM/Yarn Tasks

| Task                    | Description                         |
|-------------------------|-------------------------------------|
| `npm run install-hooks` | Install the GIT repository hooks.   |
| `npm test`              | Run the project unit tests.         |
| `npm run lint`          | Lint the modified files.            |
| `npm run lint:full`     | Lint the project code.              |
| `npm run docs`          | Generate the project documentation. |

### Testing

I use [Jest](https://facebook.github.io/jest/) with [Jest-Ex](https://yarnpkg.com/en/package/jest-ex) to test the project. The configuration file is on `./.jestrc`, the tests and mocks are on `./tests` and the script that runs it is on `./utils/scripts/test`.

### Linting

I use [ESlint](http://eslint.org) to validate all our JS code. The configuration file for the project code is on `./.eslintrc` and for the tests on `./tests/.eslintrc` (which inherits from the one on the root), there's also an `./.eslintignore` to ignore some files on the process, and the script that runs it is on `./utils/scripts/lint`.

### Documentation

I use [ESDoc](http://esdoc.org) to generate HTML documentation for the project. The configuration file is on `./.esdocrc` and the script that runs it is on `./utils/scripts/docs`.
