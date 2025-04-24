import { ActionProposal } from './actions';
import { Process, ProcessConstructor } from './processes';

export type ProtocolHandlerResult = Process | any;

/**
 * Protocols determine how an `ActionDirective` is executed.
 *
 * This goes hand in hand with `Resource`s.
 * Each protocol has a unique `scheme`.
 *
 * {@link ActionDirective}
 * {@link Resource}
 */
export abstract class Protocol {
  scheme: string | string[];
  private processRegistry? = new Map<string, ProcessConstructor>();

  handleAction(
    action: ActionProposal
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
    constructor.source =
      typeof this.scheme === 'string' ? this.scheme : this.scheme[0];
    this.processRegistry.set(tag, constructor);
  }

  getProcessConstructor?(tag?: string): ProcessConstructor | undefined {
    return this.processRegistry.get(tag || 'default');
  }
}
