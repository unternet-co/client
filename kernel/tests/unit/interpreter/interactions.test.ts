import { describe, expect, it } from '#tests/tooling';
import { createInteraction } from '#src/interpreter/interactions.ts';

describe('Interpreter | Interactions', () => {
  /**
   * createInteraction
   */
  describe('createInteraction', (ctx) => {
    const text = 'Testing';

    it('handles string input', () => {
      const interaction = createInteraction(text);
      expect(interaction.input.text).toEqual(text);
    });

    it('handles text inputs', () => {
      const data = new Uint8Array([1, 2, 3]);
      const interaction = createInteraction({
        text,
        files: [{ data }],
      });

      expect(interaction.input.text).toEqual(text);
      expect(interaction.input.files?.length).toBe(1);
      expect(interaction.input.files?.[0]?.data).toBe(data);
    });
  });
});
