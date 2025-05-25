import { Process, ProcessContainer, ProcessRuntime } from '@unternet/kernel';
import { DatabaseService } from '../storage/database-service';
import { ProcessRecord } from './types';
import { Notifier } from '../common/notifier';
import { WorkspaceService } from '../workspaces/workspace-service';
import { WorkspaceModel } from '../workspaces/workspace-model';
import { Disposable } from '../common/disposable';

interface RemoveProcessNotification {
  type: 'remove-process';
  pid: ProcessContainer['pid'];
}

type ProcessServiceNotification = RemoveProcessNotification;

export class ProcessService {
  private workspaceSubscription = new Disposable();
  private readonly notifier = new Notifier<ProcessServiceNotification>();
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
    return container;
  }

  get(pid: ProcessContainer['pid']) {
    return this.runtime.find(pid);
  }
}
