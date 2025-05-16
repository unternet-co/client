import { ActionProposal, Protocol, resource, Resource } from '@unternet/kernel';
import { WebProcess } from '../../http/processes';
import { getMetadata } from '../../../common/utils/http';

export class LocalAppletProtocol extends Protocol {
  scheme = ['applet+local'];
  searchEnabledResources: Array<string> = [];

  // TODO: Make this a standard part of the kernel
  static async createResource(url: string): Promise<Resource> {
    const metadata = await getMetadata(url);

    const webResource = resource({
      uri: url,
      ...metadata,
    });

    return webResource;
  }

  async handleAction(action: ActionProposal) {
    const process = await WebProcess.create(action.uri);
    await process.handleAction(action);
    console.log('📣 Handling action', action, process);
    if (action.display === 'snippet') return process.data;
    console.log('📣 Returning process');
    return process;
  }
}

const localAppletProtocol = new LocalAppletProtocol();
localAppletProtocol.registerProcess(WebProcess);

export { localAppletProtocol };
