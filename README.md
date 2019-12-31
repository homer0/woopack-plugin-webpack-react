# projext plugin for React on webpack

[![Travis](https://img.shields.io/travis/homer0/projext-plugin-webpack-react.svg?style=flat-square)](https://travis-ci.org/homer0/projext-plugin-webpack-react)
[![Coveralls github](https://img.shields.io/coveralls/github/homer0/projext-plugin-webpack-react.svg?style=flat-square)](https://coveralls.io/github/homer0/projext-plugin-webpack-react?branch=master)
[![David](https://img.shields.io/david/homer0/projext-plugin-webpack-react.svg?style=flat-square)](https://david-dm.org/homer0/projext-plugin-webpack-react)
[![David](https://img.shields.io/david/dev/homer0/projext-plugin-webpack-react.svg?style=flat-square)](https://david-dm.org/homer0/projext-plugin-webpack-react)

Allows you to bundle a [React](https://reactjs.org/) project with [projext](https://yarnpkg.com/en/package/projext) using the [webpack](https://webpack.js.org) [build engine](https://yarnpkg.com/en/package/projext-plugin-webpack).

## Introduction

[projext](https://yarnpkg.com/en/package/projext) allows you to configure a project without adding specific settings for a module bundler, then you can decide which build engine to use. This plugin is meant to be used when you are bundling a [React](https://reactjs.org/) and you are using the [webpack](https://webpack.js.org) [build engine](https://yarnpkg.com/en/package/projext-plugin-webpack).

It adds the required presets to the [Babel](https://babeljs.io) configuration in order to add support for [`JSX`](https://facebook.github.io/jsx/) code. It also takes care of modifying the webpack settings to implement the [`react-hot-loader`](https://yarnpkg.com/en/package/react-hot-loader) with both, the dev server and an [Express](https://expressjs.com)/[Jimpex](https://yarnpkg.com/en/package/jimpex) target.

## Information

| -            | -                                                                                      |
|--------------|----------------------------------------------------------------------------------------|
| Package      | projext-plugin-webpack-react.                                                          |
| Description  | Allows you to bundle a React project with projext using the webpack build engine.      |
| Node Version | >= v10.13.0                                                                            |

## Usage

1. You first need the build engine, so install [`projext-plugin-webpack`](https://yarnpkg.com/en/package/projext-plugin-webpack).
2. Add a new setting to your target named `framework` and set its value to `react`.
4. Done

Now, when your target gets builded, the plugin will check if the target is using webpack and if the framework is React, then it will make the necessary changes to bundle the `JSX` code.

### Server side rendering

> Server side rendering (SSR) is when you render your application on the server (backend) as a string, serve it on the browser and then you app runs in order to add all the JS magic.

Let's say you have a `backend` target with your Node server code, and a `frontend` target with your React code, and you want to require your `frontend` code on the `backend` in order to use `ReactDOM.renderToString(...)`:

For your `backend` target you'll have to define its `framework` property to `react`, so the plugin can include the JSX loader, and then make sure you included the `frontend` target on the `includeTargets` setting:

```js
module.exports = {
  targets: {
    backend: {
      type: 'node',
      framework: 'react',
      includeTargets: ['frontend'],
    },
  },
};
```

> `includeTargets` is a default setting provided by project. It tells the build engine that the files from the specified target(s) should also be transpiled/processed.

Done, now you can `require`/`import` files from your `frontend` target on the `backend` target and everything will work.

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

This plugin adds the [`react`](https://yarnpkg.com/en/package/@babel/preset-react) preset for JSX support, and if hot reload is enabled, the [`react-hot-loader/babel`](https://yarnpkg.com/en/package/react-hot-loader) plugin.

If hot reload is enabled, the plugin also disables the `module` feature from the [`env`](https://yarnpkg.com/en/package/@babel/preset-env) preset.

### External dependencies

When bundling your targets, the plugin will check if the target is for Node or if it is a browser library and automatically exclude the React packages so they don't end up on your build.

## Development

### Yarn/NPM Tasks

| Task                     | Description                         |
|--------------------------|-------------------------------------|
| `yarn test`              | Run the project unit tests.         |
| `yarn run lint`          | Lint the modified files.            |
| `yarn run lint:full`     | Lint the project code.              |
| `yarn run docs`          | Generate the project documentation. |

### Testing

I use [Jest](https://facebook.github.io/jest/) with [Jest-Ex](https://yarnpkg.com/en/package/jest-ex) to test the project. The configuration file is on `./.jestrc`, the tests and mocks are on `./tests` and the script that runs it is on `./utils/scripts/test`.

### Linting

I use [ESlint](http://eslint.org) to validate all our JS code. The configuration file for the project code is on `./.eslintrc` and for the tests on `./tests/.eslintrc` (which inherits from the one on the root), there's also an `./.eslintignore` to ignore some files on the process, and the script that runs it is on `./utils/scripts/lint`.

### Documentation

I use [ESDoc](http://esdoc.org) to generate HTML documentation for the project. The configuration file is on `./.esdocrc` and the script that runs it is on `./utils/scripts/docs`.
