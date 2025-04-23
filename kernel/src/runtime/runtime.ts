import { ActionDirective } from './actions';
import { Protocol } from './protocols';
import { Process, ProcessContainer, SerializedProcess } from './processes';

interface ActionResponse {
  process?: ProcessContainer;
  content?: any;
}

export class ProcessRuntime {
  protocols = new Map<string, Protocol>();
  processes = new Map<string, ProcessContainer>();

  constructor(protocols?: Array<Protocol>) {
    for (const protocol of protocols) {
      this.registerProtocol(protocol);
    }
    if (!protocols) console.warn('No protocols provided to Dispatcher');
  }

  registerProtocol(protocol: Protocol) {
    if (typeof protocol.scheme === 'string') {
      if (protocol.scheme === 'process')
        throw new Error("'process' is a reserved protocol scheme.");
      this.protocols[protocol.scheme] = protocol;
    } else {
      for (const scheme of protocol.scheme) {
        this.protocols[scheme] = protocol;
      }
    }
  }

  deregisterProtocol(scheme: string | string[]) {
    if (typeof scheme === 'string') {
      delete this.protocols[scheme];
    } else {
      for (const sch of scheme) {
        delete this.protocols[sch];
      }
    }
  }

  instantiateProcess(serializedProcess: SerializedProcess) {
    const protocol = this.protocols.get(serializedProcess.source);
    if (!protocol) {
      throw new Error(
        `Tried to instantiate process ${serializedProcess.pid} with source protocol '${serializedProcess.source}, but that protocol hasn't been registered.`
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

  async dispatch(directive: ActionDirective): Promise<ActionResponse> {
    const [scheme, ...restParts] = directive.uri.split(':');
    const rest = restParts.join();

    if (scheme === 'process' && this.protocols.has(rest)) {
      // TODO: Do something with scheme
      throw new Error('Process calling not implemented yet!');
    } else {
      if (!(scheme in this.protocols)) {
        throw new Error(
          `The protocol handler for '${scheme}' has not been registered.`
        );
      }
    }

    console.log();

    const result = await this.protocols[scheme].handleAction(directive);

    if (result instanceof Process) {
      const process = new ProcessContainer(scheme, result);
      this.processes.set(process.pid, process);
      return { process };
    }

    return { content: result };
  }
}
