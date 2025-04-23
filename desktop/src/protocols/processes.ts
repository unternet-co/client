import { Process } from '@unternet/kernel';

interface ProcessRecord {
  pid: string;
}

export class ProcessModel {
  private processes: Map<string, Process>;

  add(process: Process) {
    this.processes.set(process.pid, process);
  }

  get(pid: string) {
    return this.processes.get(pid);
  }

  remove(pid: string) {
    this.processes.delete(pid);
  }
}
