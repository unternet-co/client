import * as nodeFs from 'node:fs';
import untildify from 'untildify';

import { ActionDirective, Protocol } from '../../src';

const protocols: Protocol[] = [
  {
    scheme: 'function',
    handler: (directive: ActionDirective) => {
      if (directive.actionId === 'get_weather') {
        return "It's cloudy";
      }
    },
  },
  {
    scheme: 'filesystem',
    handler: (directive: ActionDirective) => {
      if (directive.actionId === 'load_file') {
        if (!directive.args?.path)
          throw new Error('I require a path to a file');

        // NOTE: Can we do promises here?
        const buffer = nodeFs.readFileSync(untildify(directive.args.path));

        return new Uint8Array(buffer);
      }
    },
  },
];

export { protocols };
