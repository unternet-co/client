import {
  Process,
  ProcessConstructor,
  ProcessContainer,
  ProcessRuntime,
  ProcessSnapshot,
} from '@unternet/kernel';

export interface ProcessRecord extends ProcessSnapshot {
  workspaceId: string;
}

export class ProcessService {
  constructor(private readonly runtime: ProcessRuntime) {}

  getProcess(pid: ProcessContainer['pid']) {
    return this.runtime.find(pid);
  }
}
