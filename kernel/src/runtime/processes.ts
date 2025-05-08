import { ulid } from 'ulid';
import { ResourceIcon } from './resources';
import { ActionProposal, ActionDict } from './actions';
import { ProcessRuntime } from '.';

// These are properties that all processes are expected to implement
// ...but they're optional because this is the web after all. Do what you want.
export interface ProcessMetadata {
  title?: string;
  icons?: ResourceIcon[];
  actions?: ActionDict;
}

// This is what a ProcessContainer will save & rehydrate from.
// The inner process just sees & saves what's inside 'state'
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
  resume(state: any): Process;
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
  actions?: ActionDict;

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

  abstract get snapshot(): any;
  static resume(state: any): Process {
    throw new Error(
      "Static method 'resume' must be implemented in a derived Process class."
    );
  }
}

type RuntimeStatus = 'idle' | 'running' | 'suspended';

export interface ProcessInstantiationOpts {
  pid?: string;
  status?: RuntimeStatus;
}

/**
 * ProcessContainer is the system-level object that wraps a Process, and manages things we want to protect like the URI, tag (used when a protocol has multiple processes), states, etc.
 */
export class ProcessContainer {
  readonly protocol = 'process';
  private _pid: string;
  private _source: string;
  private _tag: string;
  private _snapshot: string | null;
  private runtime: ProcessRuntime;
  private processConstructor: ProcessConstructor;
  private process: Process;
  readonly createdAt = Date.now();
  discardable: boolean = true;
  status: RuntimeStatus = 'running';

  private set snapshot(data: ProcessSnapshot) {
    this._snapshot = JSON.stringify(data);
  }
  get snapshot(): ProcessSnapshot {
    if (this._snapshot) {
      return JSON.parse(this._snapshot);
    } else {
      return {
        pid: this._pid,
        tag: this._tag,
        source: this._source,
        state: null,
      };
    }
  }
  get uri() {
    return `process:${this.pid}`;
  }
  get title() {
    return this.process?.title || this.snapshot?.title;
  }
  get icons() {
    return this.process?.icons || this.snapshot?.icons;
  }
  get actions() {
    return this.process?.actions || this.snapshot?.actions;
  }
  get pid() {
    return this._pid;
  }
  get tag() {
    return this._tag;
  }
  get source() {
    return this._source;
  }

  constructor(runtime: ProcessRuntime) {
    this.runtime = runtime;
  }

  static fromImpl(runtime: ProcessRuntime, process: Process) {
    const container = new ProcessContainer(runtime);
    container._pid = ulid();
    container._tag = process.tag;
    container._source = process.source;
    container.processConstructor = process.constructor as ProcessConstructor;
    container.process = process;
    return container;
  }

  static fromSnapshot(
    runtime: ProcessRuntime,
    snapshot: ProcessSnapshot,
    constructor: ProcessConstructor
  ) {
    const container = new ProcessContainer(runtime);
    container.processConstructor = constructor;
    container._pid = snapshot.pid;
    container._tag = snapshot.tag;
    container._source = snapshot.source;
    container.snapshot = snapshot;
    container.status = 'suspended';
    return container;
  }

  suspend() {
    this.runtime.suspend(this.pid);
  }

  onSuspend() {
    if (!this.discardable || this.status !== 'running') return;
    this.snapshot = this.serialize();
    this.unmount();
    this.process = null;
    this.status = 'suspended';
  }

  resume() {
    this.runtime.resume(this.pid);
  }

  onResume() {
    this.process = this.processConstructor.resume(this.snapshot.state);
    console.log('icons', this.snapshot.icons);
    this.status = 'running';
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

  serialize(): ProcessSnapshot {
    return {
      pid: this.pid,
      source: this.source,
      tag: this.tag,
      title: this.title,
      icons: this.icons,
      actions: this.actions,
      state: this.process ? this.process.snapshot : this.snapshot,
    };
  }
}
