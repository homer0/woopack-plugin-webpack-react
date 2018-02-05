jest.unmock('/src/index');

require('jasmine-expect');

const WoopackReactPlugin = require('/src/plugin');
const plugin = require('/src/index');

describe('plugin:woopackReact', () => {
  it('should call the `register` method of the plugin main class', () => {
    // Given
    const app = 'woopackApp';
    // When
    plugin(app);
    // Then
    expect(WoopackReactPlugin).toHaveBeenCalledTimes(1);
    expect(WoopackReactPlugin.mock.instances.length).toBe(1);
    expect(WoopackReactPlugin.mock.instances[0].register).toHaveBeenCalledTimes(1);
    expect(WoopackReactPlugin.mock.instances[0].register).toHaveBeenCalledWith(app);
  });
});
