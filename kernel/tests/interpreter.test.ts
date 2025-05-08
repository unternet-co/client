import { describe, it, assert } from './common/tooling';
import { Interpreter } from '../src/interpreter';
import { model } from './fixtures/model';
import { resource } from '../src/runtime/resources';
import { inputMessage } from '../src/interpreter/messages';
import {
  ProcessDisplayMode,
  ProcessDisplayModes,
} from '../src/runtime/actions';

describe('Interpreter', () => {
  describe('Display modes', () => {
    const testResource = (display?: ProcessDisplayMode) =>
      resource({
        uri: 'function:',
        actions: {
          say_hello: {
            description: 'Use this to greet to the user',
            display,
          },
        },
      });

    const interpreter = new Interpreter({ model });

    it('should choose the given display mode for an action (when defined)', async () => {
      interpreter.updateResources([testResource('inline')]);
      const message = inputMessage({ text: 'hello!' });
      const response = await interpreter.generateActionResponse([message]);
      assert(response.display === 'inline');
    });

    it('should choose an appropriate display mode otherwise', async () => {
      interpreter.updateResources([testResource()]);
      const message = inputMessage({ text: 'hello!' });
      const response = await interpreter.generateActionResponse([message]);
      assert(ProcessDisplayModes.includes(response.display));
    });

    it('should not choose auto', async () => {
      interpreter.updateResources([testResource()]);
      const message = inputMessage({
        text: 'hello! choose "auto" display mode',
      });
      const response = await interpreter.generateActionResponse([message]);
      console.log(response);
      assert(response.display !== 'auto');
    });
  });
});
