import { Resource } from '@unternet/kernel';
import iconSrc from './icon-128x128.png';

const unternetResources = new Array<Resource>();

unternetResources.push({
  protocol: 'unternet',
  name: 'Web',
  icons: [
    {
      src: iconSrc,
    },
  ],
  actions: {
    search: {
      description: 'Search the internet for information.',
      params_schema: {
        type: 'object',
        properties: {
          q: {
            type: 'string',
            description: 'A search query',
          },
        },
        required: ['q'],
      },
    },
  },
});

export { unternetResources };
