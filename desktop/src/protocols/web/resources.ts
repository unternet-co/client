import { Resource } from '@unternet/kernel';
import iconSrc from './icon-128x128.png';

const unternetResources = new Array<Resource>();

const builtin = new Resource({
  uri: 'web:',
  name: 'Web',
  description:
    'Take general actions on the web, and specific web pages, relating to parsing content, conducting searches, etc.',
  icons: [
    {
      src: iconSrc,
    },
  ],
  actions: {
    search: {
      description:
        'Search the entire web for information, from a set of keywords.',
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

export default [builtin];
