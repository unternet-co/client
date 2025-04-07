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
        const mimeType = fileMimeType(filename);

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
        textParts: p.startsWith('--') ? acc.textParts : [...acc.textParts, p],
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
        const dirFiles = readDir(resolvedPath, opts);

        return {
          ...acc,
          files: [...acc.files, ...dirFiles],
        };
      }

      return {
        ...acc,
        textParts: p.startsWith('--') ? acc.textParts : [...acc.textParts, p],
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

function readDir(
  path: string,
  opts: {
    ignoreDotFiles: boolean;
    recursive: boolean;
  }
) {
  const dirFiles = nodeFs.readdirSync(path, {
    withFileTypes: true,
    recursive: false,
  });

  return dirFiles.reduce(
    (
      acc: Array<{
        data: Uint8Array;
        filename: string;
        mimeType: string;
      }>,
      f
    ) => {
      if (opts.ignoreDotFiles && f.name.startsWith('.')) return acc;

      const mimeType = fileMimeType(f.name);
      const childPath = nodePath.join(f.parentPath, f.name);

      if (f.isDirectory() && opts.recursive) {
        if (['.cargo', '.git', 'node_modules'].includes(f.name)) return acc;

        const nested = readDir(childPath, opts);
        return [...acc, ...nested];
      }

      let data;

      try {
        if (f.isFile()) data = nodeFs.readFileSync(childPath);
      } catch (error) {
        console.error(chalk.red(error));
      }

      if (!data) return acc;

      return [
        ...acc,
        { data: new Uint8Array(data), filename: f.name, mimeType },
      ];
    },
    []
  );
}

/* COMMON */

export function fileMimeType(name: string) {
  if (name.endsWith('.ts')) return 'text/plain';
  return mime.lookup(name) || undefined;
}
