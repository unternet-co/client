import { Resource } from '../../src';

const resources: Resource[] = [
  {
    protocol: 'function',
    actions: {
      get_weather: {
        description: 'Gets the local weather.',
        params_schema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'A location search string, e.g. "London"',
            },
          },
          required: ['location'],
        },
      },
    },
  },
  {
    protocol: 'filesystem',
    actions: {
      load_file: {
        description: 'Loads a file from the local file system.',
        params_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File system path to a file.',
            },
          },
          required: ['path'],
        },
      },
    },
  },
];

export default resources;
