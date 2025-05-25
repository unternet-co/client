import { resource } from '@unternet/kernel';
import iconSrc from './icon-128x128.png';

export const web = resource({
  uri: 'builtin:web',
  name: 'Web',
  description: 'Open web pages.',
  icons: [{ src: iconSrc }],
  actions: {
    open: {
      description: 'Open a web page from a URL.',
      params_schema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
          },
        },
        required: ['url'],
      },
    },
  },
});

export const builtinResources = [web];

// const search = resource({
//   uri: 'builtin:search',
//   name: 'Search',
//   description: 'Search the web',
//   icons: [
//     {
//       src: iconSrc,
//     },
//   ],
//   actions: {
//     search: {
//       description:
//         'Search the entire web for information, from a set of keywords.',
//       params_schema: {
//         type: 'object',
//         properties: {
//           q: {
//             type: 'string',
//             description: 'A search query',
//           },
//         },
//         required: ['q'],
//       },
//     },
//     open: {
//       description: 'Show a particular web page, inline in the conversation.',
//       params_schema: {
//         type: 'object',
//         properties: {
//           url: {
//             type: 'string',
//             description: 'The URL of the site to open.',
//           },
//         },
//         required: ['url'],
//       },
//     },
//   },
// });

// export default search;
