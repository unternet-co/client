import { Process, ProcessContainer, ProcessRuntime } from '@unternet/kernel';
import { DatabaseService } from '../storage/database-service';
import { ProcessRecord } from './types';

export class ProcessService {
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

  async spawn(process: Process) {
    const container = this.runtime.spawn(process);
    await this.processDatabase.add(container.snapshot);
    return container;
  }

  getProcess(pid: ProcessContainer['pid']) {
    return this.runtime.find(pid);
  }
}
