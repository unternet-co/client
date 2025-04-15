import { ActionDirective, Protocol } from '../../src';

const protocols: Protocol[] = [
  {
    scheme: 'function',
    handler: (directive: ActionDirective) => {
      if (directive.actionId === 'get_weather') {
        return {
          high: '65F',
          low: '55F',
          summary:
            'Partly cloudy with a chance of light rain in the afternoon.',
        };
      }
    },
  },
];

export { protocols };
