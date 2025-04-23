import { ActionDirective } from './actions';
import { Process, ProcessConstructor } from './processes';

export type ProtocolHandlerResult = Process | any;

export abstract class Protocol {
  scheme: string | string[];
  private processRegistry? = new Map<string, ProcessConstructor>();

  handleAction(
    directive: ActionDirective
  ): ProtocolHandlerResult | Promise<ProtocolHandlerResult> {
    return {
      error: 'Action handler not defined.',
    };
  }

  registerProcess?(constructor: ProcessConstructor, tag?: string) {
    if (typeof constructor.hydrate !== 'function') {
      throw new Error('All processes must implement static hydrate().');
    }

    if (!tag) tag = 'default';
    constructor.tag = tag;
    this.processRegistry.set(tag, constructor);
  }

  getProcessConstructor?(tag?: string): ProcessConstructor | undefined {
    return this.processRegistry.get(tag || 'default');
  }
}
