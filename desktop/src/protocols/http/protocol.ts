import { ActionProposal, Protocol, resource, Resource } from '@unternet/kernel';
import { WebProcess } from './processes';
import { getMetadata } from '../../common/utils/http';
import { unternet } from '../../common/unternet';

export class WebProtocol extends Protocol {
  scheme = ['http', 'https'];
  searchEnabledResources: Array<string> = [];

  // TODO: Make this a standard part of the kernel
  static async createResource(url: string): Promise<Resource> {
    const metadata = await getMetadata(url);

    if (!metadata.actions) {
      metadata.actions = {
        __search__: {
          description: `Search within this website.`,
          display: 'snippet',
          params_schema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
                description: 'The search query.',
              },
            },
            required: ['q'],
          },
        },
      };
    }

    const webResource = resource({
      uri: url,
      ...metadata,
    });

    return webResource;
  }

  async handleAction(action: ActionProposal) {
    if (action.actionId === '__search__') {
      return await unternet.lookup.query({
        q: action.args.q,
        webpages: { sites: [action.uri] },
      });
    }
    const process = await WebProcess.create(action.uri);
    await process.handleAction(action);
    console.log('Handling action', action, process);
    if (action.display === 'snippet') return process.data;
    console.log('Returning process');
    return process;
  }
}

const webProtocol = new WebProtocol();
webProtocol.registerProcess(WebProcess);

export { webProtocol };
