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
  // Scroll position of the workspace
  scrollPosition?: number;
  // If set, messages with an id less than this will be hidden by default.
  archivedMessageId?: string;
  // If set, archived messages will be visible by default.
  showArchivedMessages?: boolean;
}

export interface WorkspaceNotification {
  workspaceId: Workspace['id'];
  type?: 'delete';
}

export class WorkspaceModel {
  public activeWorkspaceId: string | null = null;
  private workspaces = new Map<Workspace['id'], Workspace>();
  private messages = new Map<Workspace['id'], Message[]>();
  private messageById = new Map<string, Message>();
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
    if (this.workspaces.size === 0) {
      const ws = this.create();
      this.setTitle('Default Workspace');
    }
    if (!this.activeWorkspaceId && this.workspaces.size > 0) {
      this.activeWorkspaceId = Array.from(this.workspaces.keys())[0];
      this.notifier.notify({ workspaceId: this.activeWorkspaceId });
    }
    const allInteractions = await this.messageDatabase.all();
    this.messages = new Map();
    for (const interaction of allInteractions) {
      if (!this.messages.has(interaction.workspaceId)) {
        this.messages.set(interaction.workspaceId, []);
      }
      this.messages.get(interaction.workspaceId)!.push(interaction);
      this.messageById.set(interaction.id, interaction);
    }
    // Notify for the active workspace after all data is loaded
    if (this.activeWorkspaceId) {
      this.notifier.notify({ workspaceId: this.activeWorkspaceId });
    }
  }

  all(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  get(id: Workspace['id']): Workspace | undefined {
    return this.workspaces.get(id);
  }

  setTitle(title: string, id?: Workspace['id']) {
    if (!id) {
      id = this.activeWorkspaceId;
    }
    const workspace = this.workspaces.get(id);
    if (workspace) {
      workspace.title = title;
      this.workspaceDatabase.update(id, { title });
      this.notifier.notify({ workspaceId: id });
    }
  }

  setScrollPosition(position: number, id?: Workspace['id']) {
    if (!id) {
      id = this.activeWorkspaceId;
    }

    const workspace = this.workspaces.get(id);
    if (workspace) {
      workspace.scrollPosition = position;
      this.workspaceDatabase.update(id, { scrollPosition: position });
      this.notifier.notify({ workspaceId: id });
    }
  }

  setArchivedMessageId(messageId?: string, id?: Workspace['id']) {
    if (!id) {
      id = this.activeWorkspaceId;
    }
    const workspace = this.workspaces.get(id);
    if (!workspace) return;

    if (!messageId) {
      const messages = this.allMessages(id);
      if (!messages.length) return;
      messageId = messages[messages.length - 1].id;
    }

    workspace.archivedMessageId = messageId;
    this.workspaceDatabase.update(id, { archivedMessageId: messageId });
    this.notifier.notify({ workspaceId: id });
  }

  setArchiveVisibility(visible: boolean, id?: Workspace['id']) {
    if (!id) {
      id = this.activeWorkspaceId;
    }
    const workspace = this.workspaces.get(id);
    if (!workspace) return;
    workspace.showArchivedMessages = visible;
    this.workspaceDatabase.update(id, {
      showArchivedMessages: workspace.showArchivedMessages,
    });
    this.notifier.notify({ workspaceId: id });
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
    const ws = this._createWorkspace();
    this.setActiveWorkspace(ws.id);
    return ws;
  }

  private _createWorkspace() {
    const now = Date.now();
    const workspace: Workspace = {
      id: ulid(),
      title: 'New workspace',
      created: now,
      accessed: now,
      modified: now,
    };

    this.workspaces.set(workspace.id, workspace);
    this.messages.set(workspace.id, new Array<MessageRecord>());
    this.workspaceDatabase.create(workspace);
    return workspace;
  }

  setActiveWorkspace(id: Workspace['id']) {
    if (this.activeWorkspaceId !== id && this.workspaces.has(id)) {
      this.activeWorkspaceId = id;
      this.notifier.notify({ workspaceId: id });
    }
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
    const workspace: Workspace = this.workspaces.get(id);
    if (workspace) {
      workspace.modified = Date.now();
      this.workspaceDatabase.update(id, { modified: workspace.modified });
      this.notifier.notify({ workspaceId: id });
    }
  }

  serializeMessage(message: Message): MessageRecord {
    if (message.type === 'action' && message.process) {
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
