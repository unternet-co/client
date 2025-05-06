import {
  ProcessContainer,
  ProcessRuntime,
  type ProcessSnapshot,
} from '@unternet/kernel';
import { Notifier } from './common/notifier';
import { DatabaseService } from './storage/database-service';

export class ProcessModel {
  private processDatabase: DatabaseService<
    ProcessSnapshot['pid'],
    ProcessSnapshot
  >;
  private runtime: ProcessRuntime;
  private notifier = new Notifier();
  readonly subscribe = this.notifier.subscribe;

  constructor(
    processDatabase: DatabaseService<ProcessSnapshot['pid'], ProcessSnapshot>,
    runtime: ProcessRuntime
  ) {
    this.processDatabase = processDatabase;
    this.runtime = runtime;
    this.runtime.on('processcreated', this.save.bind(this));
    this.runtime.on('processremoved', this.delete.bind(this));
    this.load();
  }

  async load() {
    const ProcessSnapshotes = await this.processDatabase.all();
    for (const p of ProcessSnapshotes) {
      this.runtime.hydrate(p);
    }
  }

  get(pid: ProcessContainer['pid']) {
    return this.runtime.find(pid);
  }

  delete(pid: ProcessContainer['pid']) {
    this.processDatabase.delete(pid);
  }

  save(process: ProcessContainer) {
    this.processDatabase.put(process.serialize());
  }
}

export { ProcessSnapshot };
