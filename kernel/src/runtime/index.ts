import { ActionDirective } from './actions';
import { Protocol } from './protocols';
import { Process, ProcessContainer, SerializedProcess } from './processes';
import mitt from 'mitt';
import { listener } from '../shared/utils';
import { ActionResultResponse } from '../response-types';

type RuntimeEvents = {
  processcreated: ProcessContainer;
};

/**
 * ProcessRuntime passes on the action directives to their associated
 * protocol handler based on the protocol used in the directive URI.
 *
 * It also manages & stores ongoing processes returned by the protocol
 * action handlers.
 */
export class ProcessRuntime {
  protocols = new Map<string, Protocol>();
  processes = new Map<string, ProcessContainer>();
  private emitter = mitt<RuntimeEvents>();
  readonly on = listener<RuntimeEvents>(this.emitter);

  constructor(protocols?: Array<Protocol>) {
    for (const protocol of protocols) {
      this.registerProtocol(protocol);
    }
    if (!protocols) console.warn('No protocols provided to Dispatcher');
  }

  registerProtocol(protocol: Protocol) {
    if (typeof protocol.scheme === 'string') {
      if (protocol.scheme === 'process') {
        throw new Error("'process' is a reserved protocol scheme.");
      }
      this.protocols.set(protocol.scheme, protocol);
    } else {
      for (const scheme of protocol.scheme) {
        this.protocols.set(scheme, protocol);
      }
    }
  }

  deregisterProtocol(scheme: string | string[]) {
    if (typeof scheme === 'string') {
      this.protocols.delete(scheme);
    } else {
      for (const sch of scheme) {
        this.protocols.delete(sch);
      }
    }
  }

  instantiateProcess(serializedProcess: SerializedProcess) {
    const protocol = this.protocols.get(serializedProcess.source);
    if (!protocol) {
      throw new Error(
        `Tried to instantiate process ${serializedProcess.pid} with source protocol '${serializedProcess.source}', but that protocol hasn't been registered.`
      );
    }

    const processConstructor = protocol.getProcessConstructor(
      serializedProcess.tag
    );
    if (!processConstructor) {
      throw new Error(
        `Tried to instantiate process ${serializedProcess.pid} with source protocol '${serializedProcess.source}, but no process tag matches "${serializedProcess.tag}".`
      );
    }

    const process = ProcessContainer.hydrate(
      serializedProcess,
      processConstructor
    );

    this.processes.set(serializedProcess.pid, process);
  }

  async dispatch(directive: ActionDirective): Promise<ActionResultResponse> {
    const [scheme, ...restParts] = directive.uri.split(':');
    const rest = restParts.join();

    if (scheme === 'process' && this.protocols.has(rest)) {
      // TODO: Do something with scheme
      throw new Error('Process calling not implemented yet!');
    } else {
      if (!this.protocols.has(scheme)) {
        throw new Error(
          `The protocol handler for '${scheme}' has not been registered.`
        );
      }
    }

    const result = await this.protocols.get(scheme).handleAction(directive);

    if (result instanceof Process) {
      const process = new ProcessContainer(result);
      this.processes.set(process.pid, process);
      this.emitter.emit('processcreated', process);
      return { process };
    }

    return { content: result };
  }

  getProcess(pid: ProcessContainer['pid']) {
    return this.processes.get(pid);
  }
}
