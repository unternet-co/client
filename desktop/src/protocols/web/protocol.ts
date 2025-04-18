import Unternet from '@unternet/sdk';
import { ActionDirective, Protocol } from '@unternet/kernel';

class UnternetProtocol implements Protocol {
  readonly scheme = 'web';
  connection = new Unternet({
    apiKey: import.meta.env.APP_UNTERNET_API_KEY,
    isDev: import.meta.env.DEV,
  });

  async handler(directive: ActionDirective) {
    if (directive.actionId === 'search') {
      const results = await this.connection.lookup.query({
        q: directive.args.q,
      });
      console.log(results);
      return results;
    }
  }
}

export const unternetProtocol = new UnternetProtocol();
