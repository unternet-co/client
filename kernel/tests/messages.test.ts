import { readFile } from 'node:fs/promises';
import mime from 'mime-types';

import { describe, expect, it } from './common/tooling';
import {
  FileInput,
  inputMessage,
  toModelMessages,
} from '#src/interpreter/messages.ts';

describe('Interpreter | Messages', () => {
  /**
   * Files
   */
  describe('Files', () => {
    function contentPart(file: FileInput) {
      const [msg] = toModelMessages([inputMessage({ files: [file] })]);
      if (typeof msg.content === 'string')
        throw new Error('Did not expect msg.content to be a string');
      const part = msg.content[0];
      return part;
    }

    it('creates a TextPart for a file with a text encoding', () => {
      const text = '📝';

      const file = {
        data: new TextEncoder().encode(text),
        mimeType: 'text/markdown; charset=UTF-8',
      };

      const part = contentPart(file);
      expect(part.type).toBe('text');
      expect('text' in part && part.text).toBe(text);
    });

    it('creates an ImagePart for an image file', async () => {
      const imgPath = 'tests/fixtures/sample.png';
      const imgBuffer = await readFile(imgPath);
      const imgBytes = new Uint8Array(imgBuffer);

      const file = {
        data: imgBytes,
        mimeType: mime.lookup(imgPath),
      };

      const part = contentPart(file);
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

      const part = contentPart(file);
      expect(part.type).toBe('file');
      expect('data' in part && part.data).toBe(fileBytes);
    });
  });
});
