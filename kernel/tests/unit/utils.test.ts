import { readFile } from 'node:fs/promises';
import mime from 'mime-types';

import { describe, expect, it } from '#tests/tooling';
import { createInteraction, fileMessage } from '#src/utils.ts';

describe('Utils', () => {
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

  /**
   * fileMessage
   */
  describe('fileMessage', () => {
    it('creates a TextPart for a file with a text encoding', () => {
      const text = '📝';

      const file = {
        data: new TextEncoder().encode(text),
        mimeType: 'text/markdown; charset=UTF-8',
      };

      const part = fileMessage(file);
      expect(part.type).toBe('text');
      expect('text' in part && part.text).toBe(text);
    });

    it('creates an ImagePart for an image file', async () => {
      const imgPath = '../desktop/src/electron/app-icons/client-icon-macOS.png';
      const imgBuffer = await readFile(imgPath);
      const imgBytes = new Uint8Array(imgBuffer);

      const file = {
        data: imgBytes,
        mimeType: mime.lookup(imgPath),
      };

      const part = fileMessage(file);
      expect(part.type).toBe('image');
      expect('image' in part && part.image).toBe(imgBytes);
    });

    it('creates a FilePart for other types of files', async () => {
      const filePath = '../node_modules/.bin/esbuild';
      const fileBuffer = await readFile(filePath);
      const fileBytes = new Uint8Array(fileBuffer);

      const file = {
        data: fileBytes,
        mimeType: mime.lookup(filePath) || undefined,
      };

      const part = fileMessage(file);
      expect(part.type).toBe('file');
      expect('data' in part && part.data).toBe(fileBytes);
    });
  });
});
