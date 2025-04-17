import { ActionDirective } from './actions';
import { createProtocolHandlers, Protocol, ProtocolHandler } from './protocols';

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
    const { protocol } = new URL(directive.uri);

    if (!protocol) {
      throw new Error(
        `The protocol handler for '${protocol}' has not been registered.`
      );
    }

    return this.handlers[protocol](directive);
  }
}
