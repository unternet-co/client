import { ActionProposal } from './actions';
import { Protocol } from './protocols';
import { Process, ProcessContainer, ProcessSnapshot } from './processes';
import mitt from 'mitt';
import { listener } from '../shared/utils';
import {
  actionResultResponse,
  ActionResultResponse,
} from '../shared/responses';
import { ProcessInstantiationOpts } from './processes';

// Must remain a "type" else typescript is sad
type RuntimeEvents = {
  processcreated: ProcessContainer;
  processremoved: ProcessContainer['pid'];
  processchanged: { pid: ProcessContainer['pid'] };
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

  async dispatch(proposal: ActionProposal): Promise<ActionResultResponse> {
    const [scheme, ...restParts] = proposal.uri.split(':');
    console.log(scheme, restParts, this.processes);
    const rest = restParts.join();

    if (scheme === 'process' && this.processes.has(rest)) {
      const process = this.processes.get(rest);
      await process.handleAction(proposal);
      return actionResultResponse({
        content: 'Action successful, see process.',
      });
    } else {
      if (!this.protocols.has(scheme)) {
        throw new Error(
          `The protocol handler for '${scheme}' has not been registered.`
        );
      }
    }

    console.log(
      'Dispatching action:',
      scheme,
      proposal,
      this.protocols.get(scheme)
    );
    const result = await this.protocols.get(scheme).handleAction(proposal);

    if (result instanceof Process) {
      const process = result as Process;
      return actionResultResponse({ process, content: process.describe });
    } else {
      return actionResultResponse({ content: result });
    }
  }

  /* === Process management === */

  spawn(process: Process) {
    // TODO: Consider modifying this so all processes start by providing a snapshot instead of live class?
    const container = ProcessContainer.fromImpl(this, process);
    container.on('processchanged', (e) =>
      this.emitter.emit('processchanged', e)
    );
    this.processes.set(container.pid, container);
    this.pruneProcesses();
    this.emitter.emit('processcreated', container);
    return container;
  }

  hydrate(snapshot: ProcessSnapshot) {
    const protocol = this.protocols.get(snapshot.source);
    if (!protocol) {
      throw new Error(
        `Tried to instantiate process ${snapshot.pid} with source protocol '${snapshot.source}', but that protocol hasn't been registered.`
      );
    }

    const processConstructor = protocol.getProcessConstructor(snapshot.tag);
    if (!processConstructor) {
      throw new Error(
        `Tried to instantiate process ${snapshot.pid} with source protocol '${snapshot.source}, but no process tag matches "${snapshot.tag}".`
      );
    }

    // Note: this is in 'suspended' status
    const container = ProcessContainer.fromSnapshot(
      this,
      snapshot,
      processConstructor
    );
    this.processes.set(container.pid, container);
  }

  get runningProcesses(): Array<ProcessContainer> {
    return Array.from(this.processes.values()).filter(
      (process) => process.status === 'running'
    );
  }

  suspend(pid: ProcessContainer['pid']) {
    const process = this.processes.get(pid);
    process.onSuspend();
  }

  resume(pid: ProcessContainer['pid']) {
    const process = this.processes.get(pid);
    if (process.status === 'running') return;
    if (process.status !== 'suspended') {
      throw new Error('Tried to resume a process with an invalid status.');
    }

    process.onResume();
    console.log('resumed', process.pid);
    this.processes.delete(process.pid);
    this.processes.set(process.pid, process);
    this.pruneProcesses();
  }

  kill(pid: ProcessContainer['pid']) {
    const process = this.processes.get(pid);
    process.suspend();
    this.processes.delete(pid);
  }

  killall() {
    for (const pid of this.processes.keys()) this.kill(pid);
  }

  find(pid: ProcessContainer['pid']) {
    if (!this.processes.has(pid)) {
      throw new Error(`No process found for pid '${pid}'`);
    }
    return this.processes.get(pid);
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
