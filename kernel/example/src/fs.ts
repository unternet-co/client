import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import chalk from 'chalk';
import mime from 'mime-types';
import parseShell from 'shell-quote/parse';
import untildify from 'untildify';

import { Interaction } from '../../src';

/* File input */

export function fileInteractions(
  userInput: string,
  interaction?: Interaction
): Interaction {
  const rawParts =
    userInput.replace(/^\/files? /, '').match(/"[^"]+"|'[^']+'|\S+/g) ?? [];

  const { files, textParts } = rawParts.reduce(
    (
      acc: {
        files: Array<{ data: Uint8Array; filename: string; mimeType: string }>;
        textParts: string[];
      },
      p: string
    ) => {
      const parsed_ = parseShell(p);
      const parsed = parsed_[0];

      if (
        typeof parsed === 'string' &&
        (parsed.startsWith('./') ||
          parsed.startsWith('~/') ||
          parsed.startsWith('/'))
      ) {
        const resolvedPath = untildify(parsed);
        const filename = nodePath.basename(resolvedPath);
        const mimeType = mime.lookup(filename) || undefined;

        let data;

        try {
          data = nodeFs.readFileSync(resolvedPath);
        } catch (error) {
          console.error(chalk.red(error));
        }

        return {
          ...acc,
          files: data
            ? [...acc.files, { data: new Uint8Array(data), filename, mimeType }]
            : acc.files,
        };
      }

      return {
        ...acc,
        textParts: [...acc.textParts, p],
      };
    },
    {
      files: [],
      textParts: [],
    }
  );

  return {
    input: {
      text: textParts.length ? textParts.join(' ') : interaction?.input?.text,
      files: [...(interaction?.input?.files || []), ...files],
    },
    outputs: interaction?.outputs || [],
  };
}

/* Folder input */

export function folderInteractions(
  userInput: string,
  opts: { ignoreDotFiles: boolean; recursive: boolean },
  interaction?: Interaction
): Interaction {
  const rawParts =
    userInput.replace(/^\/folders? /, '').match(/"[^"]+"|'[^']+'|\S+/g) ?? [];

  const { files, textParts } = rawParts.reduce(
    (
      acc: {
        files: Array<{ data: Uint8Array; filename: string; mimeType: string }>;
        textParts: string[];
      },
      p: string
    ) => {
      const parsed_ = parseShell(p);
      const parsed = parsed_[0];

      if (
        typeof parsed === 'string' &&
        (parsed.startsWith('./') ||
          parsed.startsWith('~/') ||
          parsed.startsWith('/'))
      ) {
        const resolvedPath = untildify(parsed);
        const dirFiles = nodeFs.readdirSync(resolvedPath, {
          withFileTypes: true,
          recursive: opts.recursive ?? false,
        });

        const respFiles = dirFiles.reduce(
          (
            acc: Array<{
              data: Uint8Array;
              filename: string;
              mimeType: string;
            }>,
            f
          ) => {
            if (opts.ignoreDotFiles && f.name.startsWith('.')) return acc;

            const mimeType = mime.lookup(f.name) || undefined;
            const path = nodePath.join(f.parentPath, f.name);

            let data;

            try {
              data = nodeFs.readFileSync(path);
            } catch (error) {
              console.error(chalk.red(error));
              return acc;
            }

            return [
              ...acc,
              { data: new Uint8Array(data), filename: f.name, mimeType },
            ];
          },
          []
        );

        return {
          ...acc,
          files: [...acc.files, ...respFiles],
        };
      }

      return {
        ...acc,
        textParts: [...acc.textParts, p],
      };
    },
    {
      files: [],
      textParts: [],
    }
  );

  return {
    input: {
      text: textParts.length ? textParts.join(' ') : interaction?.input?.text,
      files: [...(interaction?.input?.files || []), ...files],
    },
    outputs: interaction?.outputs || [],
  };
}
