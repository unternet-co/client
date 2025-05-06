import {
  ProcessContainer,
  ProcessRuntime,
  type SerializedProcess,
} from '@unternet/kernel';
import { Notifier } from './common/notifier';
import { DatabaseService } from './storage/database-service';

export class ProcessModel {
  private processDatabase: DatabaseService<
    SerializedProcess['pid'],
    SerializedProcess
  >;
  private runtime: ProcessRuntime;
  private notifier = new Notifier();
  readonly subscribe = this.notifier.subscribe;

  constructor(
    processDatabase: DatabaseService<
      SerializedProcess['pid'],
      SerializedProcess
    >,
    runtime: ProcessRuntime
  ) {
    this.processDatabase = processDatabase;
    this.runtime = runtime;
    this.runtime.on('processcreated', this.save.bind(this));
    this.load();
  }

  async load() {
    const serializedProcesses = await this.processDatabase.all();
    for (const p of serializedProcesses) {
      this.runtime.instantiateProcess(p);
    }
  }

  get(pid: ProcessContainer['pid']) {
    console.log(this.runtime.processes);
    return this.runtime.getProcess(pid);
  }

  save(process: ProcessContainer) {
    this.processDatabase.put(process.serialize());
  }
}

export { SerializedProcess };
