import { ulid } from 'ulid';
import { ActionMap, ResourceIcon } from './resources';
import { ActionProposal } from './actions';

export interface SerializedProcess {
  pid: string;
  source: string;
  tag: string;
  state: any;
}

export interface ProcessConstructor {
  tag: string;
  source: string;
  hydrate(state: any): Process | undefined;
  new (state?: any): Process;
}

/**
 * A Process is an (optional) running instance of a resource. Not all resources will
 * have this, but any that involve ongoing background processes do. For example, a
 * WebSockets connection, or a running web applet.
 *
 * Processes are like resources, except they are designed to be extended & customized,
 * and they are uniquely identified with a `pid` instead of a URI.
 */
export abstract class Process {
  static tag: string;
  static source: string;
  tag: string;
  source: string;
  title?: string;
  icons?: ResourceIcon[];
  actions?: ActionMap;

  constructor() {
    const constructor = this.constructor as typeof Process;
    this.tag = constructor.tag;
    this.source = constructor.source;
  }

  /**
   * A descriptive string or object to be sent to the model.
   */
  abstract describe(): any;

  protected subscribers: Array<() => void> = [];
  onChange(callback: () => void): void {
    this.subscribers.push(callback);
  }
  protected notifyChange(): void {
    this.subscribers.forEach((cb) => cb());
  }

  mount(element: HTMLElement): void {}
  unmount(): void {}
  renderText(): string {
    return '';
  }

  handleAction(action: ActionProposal): any | Promise<any> {
    throw new Error('No action handler implemented.');
  }

  abstract serialize(): any;
  static hydrate(state: any): Process {
    throw new Error(
      "Static method 'hydrate' must be implemented in a derived Process class."
    );
  }
}

type RuntimeStatus = 'idle' | 'running' | 'suspended';

export interface ProcessMetadata {
  title?: string;
  icons?: ResourceIcon[];
  actions?: ActionMap;
}

/**
 * ProcessContainer is the system-level object that wraps a Process, and manages things we want to protect like the URI, tag (used when a protocol has multiple processes), states, etc.
 */
export class ProcessContainer {
  readonly protocol = 'process';
  readonly pid: string;
  readonly source: string;
  readonly tag: string;
  private processConstructor: ProcessConstructor;
  private process: Process;
  private snapshot: string | null;
  private metadata: ProcessMetadata = {};
  readonly createdAt = Date.now();
  discardable: boolean = true;
  status: RuntimeStatus = 'running';

  get uri() {
    return `process:${this.pid}`;
  }

  get title() {
    return this.process?.title || this.metadata.title;
  }

  get icons() {
    return this.process?.icons || this.metadata.icons;
  }

  constructor(process: Process) {
    this.pid = ulid();
    this.tag = process.tag;
    this.source = process.source;
    this.processConstructor = process.constructor as ProcessConstructor;
    this.process = process;
  }

  suspend() {
    if (!this.discardable || this.status !== 'running') return;

    this.snapshot = JSON.stringify(this.serialize());
    this.process.unmount();
    this.process = null;
    this.status = 'suspended';
  }

  resume() {
    if (this.status === 'running') return;
    if (this.status !== 'suspended') {
      throw new Error('Tried to resume a process with an invalid status.');
    }
    if (!this.snapshot) {
      throw new Error('Tried to resume a process with no snapshot.');
    }

    const state = JSON.parse(this.snapshot);
    this.process = this.processConstructor.hydrate(state);
    this.snapshot = null;
    this.status = 'running';
  }

  describe() {
    const process = this.process as any;
    if (typeof process.describe === 'function') {
      return process.describe();
    } else return '';
  }

  mount(el: HTMLElement) {
    this.process.mount(el);
  }

  unmount() {
    this.process.unmount();
  }

  renderText() {
    this.process.renderText();
  }

  static hydrate(
    serializedProcess: SerializedProcess,
    constructor: ProcessConstructor
  ) {
    const process = constructor.hydrate(serializedProcess.state);
    const containedProcess = new ProcessContainer(process);
    return containedProcess;
  }

  serialize(): SerializedProcess {
    return {
      pid: this.pid,
      source: this.source,
      tag: this.tag,
      state: this.process.serialize(),
    };
  }
}
