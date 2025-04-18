import { ActionDirective } from './actions';
import { createProtocolHandlers, Protocol, ProtocolHandler } from './protocols';

/**
 * Dispatchers pass on the action directives to their associated
 * protocol handler based on the protocol used in the directive URI.
 */
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
    const scheme = protocol.replace(':', '');
    console.log('scheme', scheme);

    if (!scheme) {
      throw new Error(
        `The protocol handler for '${scheme}' has not been registered.`
      );
    }

    return this.handlers[scheme](directive);
  }
}
