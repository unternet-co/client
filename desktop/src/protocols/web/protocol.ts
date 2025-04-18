import Unternet from '@unternet/sdk';
import { ActionDirective, Protocol } from '@unternet/kernel';

class UnternetProtocol implements Protocol {
  readonly scheme = 'web';

  connection = new Unternet({
    apiKey: import.meta.env.APP_UNTERNET_API_KEY,
    isDev: import.meta.env.DEV,
  });

  async handler(directive: ActionDirective) {
    switch (directive.actionId) {
      case 'search':
        const results = await this.connection.lookup.query({
          q: directive.args.q,
        });
        return results;
      case 'open':
        // Add a web page to interactions somehow?
        return 'Error: Could not open web page.';
    }
  }
}

export const unternetProtocol = new UnternetProtocol();
