import Unternet from '@unternet/sdk';
import { ActionDirective, Protocol } from '@unternet/kernel';
import { WebProcess } from '../web/web-process';

export class BuiltinProtocol extends Protocol {
  scheme = 'builtin';

  connection = new Unternet({
    apiKey: import.meta.env.APP_UNTERNET_API_KEY,
    isDev: import.meta.env.DEV,
  });

  async handleAction(directive: ActionDirective) {
    switch (directive.actionId) {
      case 'search':
        const results = await this.connection.lookup.query({
          q: directive.args.q,
        });
        return results;
      // case 'open':
      //   return new WebProcess({ url: directive.args.url });
      default:
        throw new Error(
          `Invalid actionID for directive. URI: ${directive.uri}, ID: ${directive.actionId}.`
        );
    }
  }
}

export const builtin = new BuiltinProtocol();
