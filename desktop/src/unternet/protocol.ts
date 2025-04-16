import { ActionDirective, Protocol } from '@unternet/kernel';
import Unternet from '@unternet/sdk';

class UnternetProtocol implements Protocol {
  readonly scheme = 'unternet';
  connection = new Unternet({ isDev: import.meta.env.DEV });

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
