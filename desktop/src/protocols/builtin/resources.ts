import { createResource } from '@unternet/kernel';
import iconSrc from './icon-128x128.png';

const web = createResource({
  uri: 'builtin:web',
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
    open: {
      description: 'Show a particular web page, inline in the conversation.',
      params_schema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL of the site to open.',
          },
        },
        required: ['url'],
      },
    },
  },
});

export default web;
