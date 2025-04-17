import { ActionDirective, Protocol, ProtocolHandler } from './types';
import { createProtocolHandlers } from './utils';

export class Dispatcher {
  handlers: Record<string, ProtocolHandler> = {};

  constructor(protocols?: Array<Protocol>) {
    this.handlers = createProtocolHandlers(protocols);
    if (!protocols) console.warn('No protocols provided to Dispatcher');
  }

  addProtocol(protocol: Protocol) {
    this.handlers[protocol.scheme] = protocol.handler.bind(protocol);
  }

  removeProtocol(protocol: Protocol | string) {
    if (typeof protocol === 'string') {
      delete this.handlers[protocol];
    } else {
      delete this.handlers[protocol.scheme];
    }
  }

  async dispatch(directive: ActionDirective) {
    const protocol = this.handlers[directive.protocol];

    if (!protocol) {
      throw new Error(
        `The provided protocol scheme '${directive.protocol}' has not been registered.`
      );
    }
    return this.handlers[directive.protocol](directive);
  }
}
