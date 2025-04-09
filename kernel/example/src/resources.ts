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
];

export default resources;
