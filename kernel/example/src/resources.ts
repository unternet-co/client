import { Resource } from '../../src';

const functionResource = new Resource({
  uri: 'function:',
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
    check_traffic: {
      description: 'Checks traffic conditions en the route to a given location',
      params_schema: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            description: 'A location search string, e.g. "London"',
          },
        },
        required: ['destination'],
      },
    },
  },
});

export default [functionResource];
