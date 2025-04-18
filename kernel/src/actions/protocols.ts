import { ActionDirective } from './actions';

export interface Protocol {
  scheme: string;
  handler: ProtocolHandler;
}

export type ProtocolHandler = (
  directive: ActionDirective
) => any | Promise<any>;

export function createProtocolHandlers(protocols: Protocol[]) {
  const handlers: Record<string, ProtocolHandler> = {};
  for (const protocol of protocols) {
    handlers[protocol.scheme] = protocol.handler.bind(protocol);
  }
  return handlers;
}
