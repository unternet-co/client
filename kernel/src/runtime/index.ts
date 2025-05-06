import { ActionProposal } from './actions';
import { Protocol } from './protocols';
import { Process, ProcessContainer, SerializedProcess } from './processes';
import mitt from 'mitt';
import { listener } from '../shared/utils';
import { actionResultResponse, ActionResultResponse } from '../response-types';

// Must remain a "type" else typescript is sad
type RuntimeEvents = {
  processcreated: ProcessContainer;
};

interface RuntimeConfig {
  processLimit?: number | null;
}

const defaultConfig: RuntimeConfig = {
  processLimit: 50,
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
  processLimit: number;
  private emitter = mitt<RuntimeEvents>();
  readonly on = listener<RuntimeEvents>(this.emitter);

  constructor(protocols: Array<Protocol>, config: RuntimeConfig = {}) {
    const mergedConfig = { ...defaultConfig, ...config };
    this.processLimit = mergedConfig.processLimit;

    for (const protocol of protocols) {
      this.registerProtocol(protocol);
    }
  }

  get runningProcesses(): Array<ProcessContainer> {
    return Array.from(this.processes.values()).filter(
      (process) => process.status === 'running'
    );
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

    this.addProcess(process);
  }

  async dispatch(directive: ActionProposal): Promise<ActionResultResponse> {
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
      this.addProcess(process);
      this.emitter.emit('processcreated', process);
      return actionResultResponse({ process });
    }

    return actionResultResponse({ content: result });
  }

  addProcess(process: ProcessContainer) {
    this.processes.set(process.pid, process);
    if (this.processLimit) this.suspendExcessProcesses();
  }

  suspendExcessProcesses() {
    const numRunningProcesses = this.runningProcesses.length;
    let numExcessProcesses = numRunningProcesses - this.processLimit;

    for (const runningProcess of this.runningProcesses) {
      if (numExcessProcesses <= 0) break;
      console.log('suspending', runningProcess.pid);
      this.suspendProcess(runningProcess);
      numExcessProcesses--;
    }
  }

  suspendProcess(process: ProcessContainer) {
    // TODO: Emit an event?
    process.suspend();
  }

  getProcess(pid: ProcessContainer['pid']) {
    return this.processes.get(pid);
  }
}
