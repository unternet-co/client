class Protocol {
  scheme: string;
}

type ProtocolMap = { [scheme: string]: Protocol };

export class Dispatcher {
  protocols: ProtocolMap = {};

  constructor(protocols?: ProtocolMap) {
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
