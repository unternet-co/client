import { ActionDirective, Protocol } from '../../src';

const protocols: Protocol[] = [
  {
    scheme: 'function',
    handleAction: (directive: ActionDirective) => {
      if (directive.actionId === 'get_weather') {
        const content = {
          high: '65F',
          low: '55F',
          summary:
            'Partly cloudy with a chance of light rain in the afternoon.',
        };
        return { content };
      } else if (directive.actionId === 'check_traffic') {
        const content = {
          conditions: 'Traffic is clear',
          additionalWaitTime: 0,
        };
        return { content };
      }
    },
  },
];

export { protocols };
