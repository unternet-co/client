import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import chalk from 'chalk';
import mime from 'mime-types';
import parseShell from 'shell-quote/parse';
import untildify from 'untildify';

import { Interaction } from '../../src';

export function fileInteraction(userInput: string): Interaction {
  const [possiblyQuotedPath, ...textParts] =
    userInput.replace(/^\/file /, '').match(/"[^"]+"|'[^']+'|\S+/g) ?? [];
  const [path] = parseShell(possiblyQuotedPath);
  const text = textParts.join(' ');

  const resolvedPath = untildify(path);
  const filename = nodePath.basename(resolvedPath);
  const mimeType = mime.lookup(filename) || undefined;

  let data;

  try {
    data = nodeFs.readFileSync(resolvedPath);
  } catch (error) {
    console.error(chalk.red(error));
  }

  return {
    input: {
      text,
      files: data ? [{ data, filename, mimeType }] : [],
    },
    outputs: [],
  };
}
