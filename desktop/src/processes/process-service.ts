import { Process, ProcessContainer, ProcessRuntime } from '@unternet/kernel';
import { DatabaseService } from '../storage/database-service';
import { ProcessRecord } from './types';
import { Notifier } from '../common/notifier';

export class ProcessService {
  private readonly notifier = new Notifier();
  readonly subscribe = this.notifier.subscribe;

  constructor(
    private readonly processDatabase: DatabaseService<string, ProcessRecord>,
    private readonly runtime: ProcessRuntime
  ) {}

  async load() {
    const processRecords = await this.processDatabase.all();
    for (const record of processRecords) {
      this.runtime.hydrate(record);
    }
  }

  spawn(process: Process) {
    const container = this.runtime.spawn(process);
    this.processDatabase.add(container.snapshot);
    container.on('processchanged', () => {
      this.processDatabase.update(container.pid, container.snapshot);
    });
    return container;
  }

  get(pid: ProcessContainer['pid']) {
    return this.runtime.find(pid);
  }

  close(pid: ProcessContainer['pid']) {
    const container = this.runtime.find(pid);
    if (!container) {
      throw new Error(`Process with pid ${pid} not found`);
    }
    this.runtime.kill(pid);
    this.processDatabase.delete(pid);
  }
}
