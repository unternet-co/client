import { ulid } from 'ulid';
import { ActionMap, ResourceIcon } from './resources';
import { ActionProposal } from './actions';
import { ProcessRuntime } from '.';

// These are properties that all processes are expected to implement
// ...but they're optional because this is the web after all. Do what you want.
export interface ProcessMetadata {
  title?: string;
  icons?: ResourceIcon[];
  actions?: ActionMap;
}

// This is what a ProcessContainer will save & rehydrate from.
// The inner process just sees & savees what's inside 'state'
export interface ProcessSnapshot extends ProcessMetadata {
  pid: string;
  source: string;
  tag: string;
  state: any;
}

// Helper to detail the static properties of a Process class definition, when we pass around
// the constructor.
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
export abstract class Process implements ProcessMetadata {
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

export interface ProcessInstantiationOpts {
  pid?: string;
}

/**
 * ProcessContainer is the system-level object that wraps a Process, and manages things we want to protect like the URI, tag (used when a protocol has multiple processes), states, etc.
 */
export class ProcessContainer {
  readonly protocol = 'process';
  readonly pid: string;
  readonly source: string;
  readonly tag: string;
  private runtime?: ProcessRuntime;
  private processConstructor: ProcessConstructor;
  private process: Process;
  private _snapshot: string | null;
  private metadata: ProcessMetadata = {};
  readonly createdAt = Date.now();
  discardable: boolean = true;
  status: RuntimeStatus = 'running';

  set snapshot(data: ProcessSnapshot) {
    this._snapshot = JSON.stringify(data);
  }
  get snapshot(): ProcessSnapshot {
    return JSON.parse(this._snapshot) as ProcessSnapshot;
  }
  get uri() {
    return `process:${this.pid}`;
  }
  get title() {
    return this.process?.title || this.metadata.title;
  }
  get icons() {
    return this.process?.icons || this.metadata.icons;
  }
  get actions() {
    return this.process?.actions || this.metadata.actions;
  }

  constructor(
    runtime: ProcessRuntime,
    process: Process,
    opts: Partial<ProcessContainer>
  ) {
    this.runtime = runtime;
    this.pid = opts.pid ?? ulid();
    this.tag = process.tag;
    this.source = process.source;
    this.processConstructor = process.constructor as ProcessConstructor;
    this.process = process;
  }

  suspend() {
    this.runtime.suspend(this.pid);
  }

  resume() {
    this.runtime.resume(this.pid);
  }

  updateMetadata() {
    this.metadata.title = this.process?.title;
    this.metadata.icons = this.process?.icons;
    this.metadata.actions = this.process?.actions;
  }

  describe() {
    if (!this.process) return '';
    const process = this.process as any;
    if (typeof process.describe === 'function') {
      return process.describe();
    } else return '';
  }

  mount(el: HTMLElement) {
    this.process?.mount(el);
  }

  unmount() {
    this.process?.unmount();
  }

  renderText() {
    this.process?.renderText();
  }

  // Used in the suspension process
  disconnect() {
    this.unmount();
    this.process = null;
  }

  saveSnapshot() {
    this.snapshot = this.serialize();
  }

  loadSnapshot() {
    this.process = this.processConstructor.hydrate(this.snapshot);
    this.snapshot = null;
  }

  serialize(): ProcessSnapshot {
    return {
      pid: this.pid,
      source: this.source,
      tag: this.tag,
      title: this.title,
      icons: this.icons,
      actions: this.actions,
      state: this.process ? this.process.serialize() : this,
    };
  }
}
