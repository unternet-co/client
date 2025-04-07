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
];

export { protocols };
