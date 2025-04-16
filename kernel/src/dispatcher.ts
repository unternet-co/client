import {
  ActionDirective,
  ActionResponse,
  Protocol,
  ProtocolHandler,
} from './types';
import { createProtocolHandlers } from './utils';

/**
 * Dispatches actions using protocols.
 */
export class Dispatcher {
  handlers: Record<string, ProtocolHandler> = {};

  constructor(protocols?: Array<Protocol>) {
    this.handlers = createProtocolHandlers(protocols);
    if (!protocols) console.warn('No protocols provided to Dispatcher');
  }

  /**
   * Enable a protocol to be utilised by an action directive.
   *
   * @param protocol
   */
  addProtocol(protocol: Protocol) {
    this.handlers[protocol.scheme] = protocol.handler;
  }

  /**
   * Stop a protocol from being utilised by the dispatched actions.
   *
   * @param protocol
   */
  removeProtocol(protocol: Protocol | string) {
    if (typeof protocol === 'string') {
      delete this.handlers[protocol];
    } else {
      delete this.handlers[protocol.scheme];
    }
  }

  /**
   * Dispatch an action.
   *
   * @param directive The instruction of how to consume a specific action.
   * @returns The result of the performed action.
   */
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
