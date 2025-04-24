import { Notifier } from './common/notifier';
import { DatabaseService } from './storage/database-service';
import { ulid } from 'ulid';
import { KernelMessage } from '@unternet/kernel';
import { Message, MessageRecord } from './messages';
import { DisposableGroup } from './common/disposable';
import { ProcessModel } from './processes';

export interface Workspace {
  id: string;
  title: string;
  created: number;
  accessed: number;
  modified: number;
}

export interface WorkspaceNotification {
  workspaceId: Workspace['id'];
  type?: 'delete';
}

export class WorkspaceModel {
  private workspaces = new Map<Workspace['id'], Workspace>();
  private messages = new Map<Workspace['id'], Message[]>();
  private workspaceDatabase: DatabaseService<string, Workspace>;
  private messageDatabase: DatabaseService<string, MessageRecord>;
  private processModel: ProcessModel;
  private notifier = new Notifier<WorkspaceNotification>();
  readonly subscribe = this.notifier.subscribe;
  private disposables = new DisposableGroup();

  subscribeToWorkspace(
    workspaceId: Workspace['id'],
    subscriber: (notification: WorkspaceNotification) => void
  ) {
    function workspaceSubscriber(notification?: WorkspaceNotification) {
      if (notification && notification.workspaceId === workspaceId) {
        subscriber(notification);
      }
    }

    const disposable = this.subscribe(workspaceSubscriber);
    this.disposables.add(disposable);
    return disposable;
  }

  constructor(
    workspaceDatabase: DatabaseService<string, Workspace>,
    messageDatabase: DatabaseService<string, MessageRecord>,
    processModel: ProcessModel
  ) {
    this.workspaceDatabase = workspaceDatabase;
    this.messageDatabase = messageDatabase;
    this.processModel = processModel;
    this.load();
  }

  async load() {
    const workspaceRecords = await this.workspaceDatabase.all();
    for (const record of workspaceRecords) {
      this.workspaces.set(record.id, record);
      this.notifier.notify({ workspaceId: record.id });
    }
  }

  all(): Workspace[] {
    let workspaces: Workspace[] = [];
    for (const workspace of this.workspaces.values()) {
      workspaces.push(workspace);
    }
    return workspaces;
  }

  get(id: Workspace['id']): Workspace | undefined {
    return this.workspaces.get(id);
  }

  setTitle(id: Workspace['id'], title: string) {
    const workspace = this.workspaces.get(id);
    if (workspace) {
      workspace.title = title;
      this.workspaceDatabase.update(id, { title });
      this.notifier.notify({ workspaceId: id });
    }
  }

  async activate(id: Workspace['id']): Promise<void> {
    const workspace = this.workspaces.get(id);

    if (workspace) {
      workspace.accessed = Date.now();
      this.workspaceDatabase.update(id, {
        accessed: workspace.accessed,
      });
    }

    const records = await this.messageDatabase.where({
      workspaceId: id,
    });

    const messages: Message[] = records.map(this.hydrateMessage.bind(this));
    this.messages.set(id, messages);
    this.notifier.notify({ workspaceId: id });
  }

  deactivate(id: Workspace['id']): void {
    this.messages.delete(id);
  }

  create() {
    const now = Date.now();
    const workspace = {
      id: ulid(),
      title: 'New workspace',
      created: now,
      accessed: now,
      modified: now,
    };

    this.workspaces.set(workspace.id, workspace);
    this.messages.set(workspace.id, new Array<MessageRecord>());
    this.workspaceDatabase.create(workspace);
    this.notifier.notify();
    return workspace;
  }

  delete(id: Workspace['id']) {
    this.workspaces.delete(id);
    this.messages.delete(id);
    this.workspaceDatabase.delete(id);
    this.messageDatabase.deleteWhere({ workspaceId: id });
    this.notifier.notify({ workspaceId: id, type: 'delete' });
  }

  addMessage(workspaceId: Workspace['id'], message: KernelMessage) {
    const msg: Message = {
      ...message,
      workspaceId,
    };

    this.messages.get(workspaceId).push(msg);
    const record = this.serializeMessage(msg);
    this.messageDatabase.create(record);
    this.updateModified(workspaceId);
    this.notifier.notify({ workspaceId });

    return message.id;
  }

  updateMessage(
    messageId: MessageRecord['id'],
    updates: Partial<MessageRecord>
  ) {
    const message = this.getMessage(messageId);
    Object.assign(message, updates);
    this.messageDatabase.update(messageId, message);
    this.updateModified(message.workspaceId);
    this.notifier.notify({ workspaceId: message.workspaceId });
  }

  getMessage(id: MessageRecord['id']): Message {
    for (const messages of this.messages.values()) {
      const message = messages.find((m: MessageRecord) => m.id === id);
      if (message) return message;
    }
    throw new Error('No interaction with this ID!');
  }

  allMessages(workspaceId: Workspace['id']): Message[] {
    return this.messages.get(workspaceId) || [];
  }

  updateModified(id: Workspace['id']): void {
    const workspace = this.workspaces.get(id);
    if (workspace) {
      workspace.modified = Date.now();
      this.workspaceDatabase.update(id, { modified: workspace.modified });
      this.notifier.notify({ workspaceId: id });
    }
  }

  serializeMessage(message: Message): MessageRecord {
    if (message.type === 'action') {
      const { process, ...rest } = message;
      return {
        ...rest,
        pid: process.pid,
      };
    }
    return message;
  }

  hydrateMessage(record: MessageRecord): Message {
    if (record.type === 'action' && record.pid) {
      const { pid, ...rest } = record;
      return {
        ...rest,
        process: this.processModel.get(record.pid),
      };
    }
    return record;
  }
}
