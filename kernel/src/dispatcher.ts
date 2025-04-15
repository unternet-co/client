import { ActionResponse, Protocol, ProtocolHandler } from './types';
import { createProtocolHandlers } from './utils';

export class Dispatcher {
  handlers: Record<string, ProtocolHandler> = {};

  constructor(protocols?: Array<Protocol>) {
    this.handlers = createProtocolHandlers(protocols);
    if (!protocols) console.warn('No protocols provided to Dispatcher');
  }

  addProtocol(protocol: Protocol) {
    this.handlers[protocol.scheme] = protocol.handler;
  }

  removeProtocol(protocol: Protocol | string) {
    if (typeof protocol === 'string') {
      delete this.handlers[protocol];
    } else {
      delete this.handlers[protocol.scheme];
    }
  }

  async dispatch(response: ActionResponse) {
    const protocol = this.handlers[response.protocol];

    if (!protocol) {
      throw new Error(
        `The provided protocol scheme '${response.protocol}' has not been registered.`
      );
    }
    console.log('dispatching');
    return this.handlers[response.protocol](response);
  }
}
