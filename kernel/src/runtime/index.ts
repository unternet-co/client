import { ActionProposal } from './actions';
import { Protocol } from './protocols';
import { Process, ProcessContainer, ProcessSnapshot } from './processes';
import mitt from 'mitt';
import { listener } from '../shared/utils';
import { actionResultResponse, ActionResultResponse } from '../response-types';
import { ProcessInstantiationOpts } from './processes';

// Must remain a "type" else typescript is sad
type RuntimeEvents = {
  processcreated: ProcessContainer;
  processremoved: ProcessContainer['pid'];
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
  snapshots = new Map<string, string>();
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

  /* === Protocols === */

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

  /* === Action dispatching === */

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

    if (process instanceof Process) {
      const container = this.registerProcess(process);
      return actionResultResponse({ process: container });
    }

    return actionResultResponse({ content: result });
  }

  /* === Process management === */

  spawn(process: Process) {
    const container = this.registerProcess(process);
    this.emitter.emit('processcreated', container);
  }

  hydrate(ProcessSnapshot: ProcessSnapshot) {
    const protocol = this.protocols.get(ProcessSnapshot.source);
    if (!protocol) {
      throw new Error(
        `Tried to instantiate process ${ProcessSnapshot.pid} with source protocol '${ProcessSnapshot.source}', but that protocol hasn't been registered.`
      );
    }

    const processConstructor = protocol.getProcessConstructor(
      ProcessSnapshot.tag
    );
    if (!processConstructor) {
      throw new Error(
        `Tried to instantiate process ${ProcessSnapshot.pid} with source protocol '${ProcessSnapshot.source}, but no process tag matches "${ProcessSnapshot.tag}".`
      );
    }

    const process = processConstructor.hydrate(ProcessSnapshot.state);
    this.registerProcess(process);
  }

  get runningProcesses(): Array<ProcessContainer> {
    return Array.from(this.processes.values()).filter(
      (process) => process.status === 'running'
    );
  }

  suspend(pid: ProcessContainer['pid']) {
    const process = this.processes.get(pid);
    if (!process.discardable || process.status !== 'running') return;
    process.saveSnapshot();
    process.disconnect();
    process.status = 'suspended';
  }

  resume(pid: ProcessContainer['pid']) {
    const process = this.processes.get(pid);
    if (process.status === 'running') return;
    if (process.status !== 'suspended') {
      throw new Error('Tried to resume a process with an invalid status.');
    }

    process.loadSnapshot();
    process.status = 'running';
  }

  find(pid: ProcessContainer['pid']) {
    return this.processes.get(pid);
  }

  // Private, because we only want to expose spawning or hydrating
  private registerProcess(
    process: Process,
    opts: ProcessInstantiationOpts = {}
  ) {
    const container = new ProcessContainer(this, process, opts);
    this.processes.set(container.pid, container);
    this.pruneProcesses();
    return container;
  }

  private pruneProcesses() {
    if (!this.processLimit) return;

    const numRunningProcesses = this.runningProcesses.length;
    let numExcessProcesses = numRunningProcesses - this.processLimit;

    for (const runningProcess of this.runningProcesses) {
      if (numExcessProcesses <= 0) break;
      console.log('suspending', runningProcess.pid);
      this.suspend(runningProcess.pid);
      numExcessProcesses--;
    }
  }
}
