import {
  Process,
  ProcessContainer,
  ProcessRuntime,
  type ProcessSnapshot,
} from '@unternet/kernel';
import { Notifier } from '../common/notifier';
import { DatabaseService } from '../storage/database-service';
import { Workspace } from './workspace-model';

export interface ProcessRecord extends ProcessSnapshot {
  workspaceId: string;
}

export class ProcessModel {
  private processDatabase: DatabaseService<ProcessRecord['pid'], ProcessRecord>;
  private runtime: ProcessRuntime;
  private notifier = new Notifier();
  readonly subscribe = this.notifier.subscribe;

  get processes() {
    return this.runtime.processes;
  }

  constructor(
    processDatabase: DatabaseService<ProcessRecord['pid'], ProcessRecord>,
    runtime: ProcessRuntime
  ) {
    this.processDatabase = processDatabase;
    this.runtime = runtime;
    this.loadAll();
  }

  async loadAll() {
    const snapshots = await this.processDatabase.all();
    for (const p of snapshots) this.runtime.hydrate(p);
  }

  get(pid: ProcessContainer['pid']) {
    return this.runtime.find(pid);
  }

  delete(pid: ProcessContainer['pid']) {
    this.processDatabase.delete(pid);
  }

  async deleteWhere(opts: { workspaceId: Workspace['id'] }) {
    this.processDatabase.deleteWhere({ workspaceId: opts.workspaceId });
  }

  create(process: Process, workspaceId: Workspace['id']) {
    const container = this.runtime.spawn(process);
    const snapshot = container.serialize();
    this.processDatabase.create({
      workspaceId,
      ...snapshot,
    });
    return container;
  }
}

export { ProcessSnapshot };
