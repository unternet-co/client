import { Protocol, ProtocolRecord } from './types.js';

export class Dispatcher {
  protocols: ProtocolRecord = {};

  constructor(protocols?: ProtocolRecord) {
    this.protocols = protocols || {};
    if (!protocols) console.warn('No protocols provided to Dispatcher');
  }

  addProtocol(protocol: Protocol) {
    this.protocols[protocol.scheme] = protocol;
  }

  removeProtocol(protocol: Protocol | string) {
    if (typeof protocol === 'string') {
      delete this.protocols[protocol];
    } else {
      delete this.protocols[protocol.scheme];
    }
  }
}
