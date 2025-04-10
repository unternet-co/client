import { ActionDirective, Protocol } from '@unternet/kernel';

const unternetProtocols: Array<Protocol> = [
  {
    scheme: 'unternet',
    handler: (directive: ActionDirective) => {
      if (directive.actionId === 'search') {
        return "The answer to the question is '42'";
      }
    },
  },
];

export { unternetProtocols };
