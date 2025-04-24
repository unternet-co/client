import { ulid } from 'ulid';
import { ActionDirective } from './actions';
import { ActionMap } from './resources';

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
  tag: string;
  static source: string;
  source: string;
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

  handleAction(directive: ActionDirective): any | Promise<any> {
    throw new Error('No action handler implemented.');
  }

  abstract serialize(): any;
  static hydrate(state: any): Process {
    throw new Error(
      "Static method 'hydrate' must be implemented in a derived Process class."
    );
  }
}

export class ProcessContainer {
  readonly protocol = 'process';
  readonly pid: string;
  readonly source: string;
  readonly tag: string;
  private process: Process;
  readonly createdAt = Date.now();
  updatedAt = Date.now();
  state: any;
  get uri() {
    return `process:${this.pid}`;
  }

  constructor(process: Process) {
    this.pid = ulid();
    this.tag = process.tag;
    this.source = process.source;
    this.process = process;
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
    const process = new constructor(serializedProcess.state);
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
