import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import chalk from 'chalk';
import mime from 'mime-types';
import parseShell from 'shell-quote/parse';
import untildify from 'untildify';

import { Interaction } from '../../../src';

/**
 * Create or extend an interaction based on user input.
 */
export function interaction(
  userInput: string,
  interaction?: Interaction
): Interaction {
  const rawParts =
    userInput.replace(/^\/file /, '').match(/"[^"]+"|'[^']+'|\S+/g) ?? [];

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
        let files = acc.files;
        let kind;

        try {
          const stats = nodeFs.lstatSync(resolvedPath);
          kind = stats.isDirectory()
            ? 'directory'
            : stats.isFile()
              ? 'file'
              : undefined;
        } catch (err) {
          console.error(chalk.red(err));
        }

        switch (kind) {
          case 'directory':
            const dirFiles = readDir(resolvedPath, {
              ignoreDotFiles: true,
              recursive: true,
            });

            files = [...files, ...dirFiles];
            break;

          case 'file':
            const filename = nodePath.basename(resolvedPath);
            const mimeType = fileMimeType(filename);
            const data = nodeFs.readFileSync(resolvedPath);

            files = [
              ...files,
              { data: new Uint8Array(data), filename, mimeType },
            ];
            break;
        }

        return { ...acc, files };
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

  // Print files added to stdout
  if (files.length) console.log('');

  files.forEach((file) => {
    console.log(chalk.italic(`File added: '${file.filename}'`));
  });

  // Fin
  return {
    input: {
      text: textParts.length ? textParts.join(' ') : interaction?.input?.text,
      files: [...(interaction?.input?.files || []), ...files],
    },
    outputs: interaction?.outputs || [],
  };
}

/* 🛠️ */

function readDir(
  path: string,
  opts: {
    ignoreDotFiles: boolean;
    recursive: boolean;
  }
) {
  const dirFiles = nodeFs.readdirSync(path, {
    withFileTypes: true,
    recursive: true,
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

export function fileMimeType(name: string) {
  if (name.endsWith('.ts')) return 'text/plain';
  return mime.lookup(name) || undefined;
}
