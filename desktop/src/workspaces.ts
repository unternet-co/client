import { Notifier } from './common/notifier';
import { DatabaseService } from './storage/database-service';
import { ulid } from 'ulid';
import { KernelMessage } from '@unternet/kernel';
import { Message, MessageRecord } from './messages';
import { DisposableGroup } from './common/disposable';
import { ProcessModel } from './processes';
import { ConfigModel } from './config';
import { DEFAULT_WORKSPACE_NAME } from './constants';

/**
 * Workspaces, as persisted to the database
 */
export interface WorkspaceRecord {
  id: string;
  title: string;
  created: number;
  accessed: number;
  modified: number;
  // Messages with an id less than this will be inactive
  archiveUpToId?: string;
}

/**
 * Workspaces as enriched in-memory objects.
 */
export interface Workspace extends WorkspaceRecord {
  activeMessages: Message[] | null;
  inactiveMessages: Message[] | null;
  scrollPosition: number | null;
  // If true, archived messages will be visible
  showArchived: boolean;
}

export interface WorkspaceNotification {
  workspaceId: WorkspaceRecord['id'];
  type?: 'delete';
}

export class WorkspaceModel {
  public activeWorkspaceId: string | null = null;
  private configModel: ConfigModel;
  private workspaces = new Map<Workspace['id'], Workspace>();
  private workspaceDatabase: DatabaseService<string, WorkspaceRecord>;
  private messageDatabase: DatabaseService<string, MessageRecord>;
  private processModel: ProcessModel;
  private disposables = new DisposableGroup();
  private notifier = new Notifier<WorkspaceNotification>();
  readonly subscribe = this.notifier.subscribe;

  subscribeToWorkspace(
    workspaceId: WorkspaceRecord['id'],
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
    workspaceDatabase: DatabaseService<string, WorkspaceRecord>,
    messageDatabase: DatabaseService<string, MessageRecord>,
    processModel: ProcessModel,
    configModel: ConfigModel
  ) {
    this.workspaceDatabase = workspaceDatabase;
    this.messageDatabase = messageDatabase;
    this.processModel = processModel;
    this.configModel = configModel;
    this.load();
  }

  /**
   * Loads the active workspace, or creates one if none are available.
   */
  async load() {
    const workspaceRecords = await this.workspaceDatabase.all();

    if (!workspaceRecords.length) {
      this.create(DEFAULT_WORKSPACE_NAME);
    }

    for (const record of workspaceRecords) {
      const workspace = await this.hydrate(record);
      this.workspaces.set(workspace.id, workspace);
      this.notifier.notify({ workspaceId: record.id });
    }

    // Restore activeWorkspaceId (if saved previously)
    let activeWorkspaceId: Workspace['id'];
    const storedId = this.configModel.get('activeWorkspaceId');
    if (storedId && this.workspaces.has(storedId)) {
      activeWorkspaceId = storedId;
    } else if (!this.activeWorkspaceId && this.workspaces.size > 0) {
      activeWorkspaceId = Array.from(this.workspaces.keys())[0];
    } else {
      throw new Error(`No workspaces exist!`);
    }

    // Load the messages & update
    this.activate(activeWorkspaceId);
    this.notifier.notify({ workspaceId: this.activeWorkspaceId });
  }

  /**
   * Activates a given workspace. This loads all the active messages into memory.
   */
  async activate(id: WorkspaceRecord['id']): Promise<void> {
    if (id === this.activeWorkspace?.id) return;
    this.activeWorkspaceId = id;
    this.notifier.notify({ workspaceId: id });
  }

  all(): WorkspaceRecord[] {
    return Array.from(this.workspaces.values());
  }

  get(id?: WorkspaceRecord['id']): Workspace {
    id = id || this.activeWorkspaceId;
    const workspace = this.workspaces.get(id);
    if (!workspace) throw new Error(`No workspace with ID '${id}'`);
    return workspace;
  }

  get activeWorkspace() {
    return this.workspaces.get(this.activeWorkspaceId);
  }

  setTitle(title: string, id?: WorkspaceRecord['id']) {
    const workspace = this.get(id);
    workspace.title = title;
    this.workspaceDatabase.update(id, { title });
    this.notifier.notify({ workspaceId: id });
  }

  setScrollPosition(position: number, id?: WorkspaceRecord['id']) {
    const workspace = this.get(id);
    workspace.scrollPosition = position;
    this.notifier.notify({ workspaceId: id });
  }

  archiveMessages(workspaceId?: WorkspaceRecord['id']) {
    const workspace = this.get(workspaceId);
    if (workspace.activeMessages.length) {
      workspace.archiveUpToId = workspace.activeMessages.at(-1).id;
      workspace.inactiveMessages = [
        ...workspace.inactiveMessages,
        ...workspace.activeMessages,
      ];
      workspace.activeMessages = [];
      this.workspaceDatabase.update(workspace.id, {
        archiveUpToId: workspace.archiveUpToId,
      });
      this.notifier.notify({ workspaceId: workspace.id });
    }
  }

  // TODO: Turn this into something that loads the last x archived messages
  // (and otherwise we shouldn't load them)
  setArchiveVisibility(visible: boolean, id?: WorkspaceRecord['id']) {
    const workspace = this.get(id);
    workspace.showArchived = visible;
    this.notifier.notify({ workspaceId: id });
  }

  create(title?: string): Workspace {
    // Create workspace record & add to database
    const now = Date.now();
    const record: WorkspaceRecord = {
      id: ulid(),
      title: title ?? 'Untitled',
      created: now,
      accessed: now,
      modified: now,
    };
    this.workspaceDatabase.create(record);

    // Create workspace
    const workspace = {
      ...record,
      activeMessages: [],
      inactiveMessages: [],
      showArchived: false,
      scrollPosition: null,
    };
    this.workspaces.set(workspace.id, workspace);
    this.activate(workspace.id);
    return workspace;
  }

  // TODO: At some point, we will only want inactive messages in memory when the user requests them
  async hydrate(record: WorkspaceRecord) {
    const activeMessages = [];
    const inactiveMessages = [];

    // Get all message records, hydrate them & add to appropriate bucket (active vs. inactive)
    const messageRecords = await this.messageDatabase.where({
      workspaceId: record.id,
    });
    for (const messageRecord of messageRecords) {
      const message = this.hydrateMessage(messageRecord);
      if (!record.archiveUpToId || message.id > messageRecord.archiveUpToId) {
        activeMessages.push(message);
      } else {
        inactiveMessages.push(message);
      }
    }

    return {
      ...record,
      activeMessages,
      inactiveMessages,
      showArchived: false,
      scrollPosition: null,
    };
  }

  delete(id: WorkspaceRecord['id']) {
    this.workspaces.delete(id);
    this.workspaceDatabase.delete(id);
    this.messageDatabase.deleteWhere({ workspaceId: id });
    if (this.workspaces.size) {
      const lastWorkspace = [...this.workspaces.values()].pop();
      this.activate(lastWorkspace.id);
    } else {
      this.create();
    }
    this.notifier.notify({ workspaceId: id, type: 'delete' });
  }

  updateModified(id: WorkspaceRecord['id']): void {
    const workspace: WorkspaceRecord = this.workspaces.get(id);
    workspace.modified = Date.now();
    this.workspaceDatabase.update(id, { modified: workspace.modified });
    this.notifier.notify({ workspaceId: id });
  }

  updateAccessed(id: WorkspaceRecord['id']): void {
    const workspace = this.workspaces.get(id);
    workspace.accessed = Date.now();
    this.workspaceDatabase.update(id, {
      accessed: workspace.accessed,
    });
  }

  /* MESSAGES */

  addMessage(workspaceId: WorkspaceRecord['id'], message: KernelMessage) {
    const msg: Message = {
      ...message,
      workspaceId,
    };
    this.workspaces.get(workspaceId).activeMessages.push(msg);

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
    // TODO: Probably replace this with a message model for reliability, so caching can't affect this
    const sortedWorkspaces = Array.from(this.workspaces.values()).sort(
      (a, b) => b.accessed - a.accessed
    );

    // Sort through all workspaces, with active messages first
    // Then sort through all workspaces, with inactive messages

    for (const workspace of sortedWorkspaces) {
      for (const msg of workspace.activeMessages) {
        if (msg.id === id) return msg;
      }
    }

    for (const workspace of sortedWorkspaces) {
      for (const msg of workspace.inactiveMessages) {
        if (msg.id === id) return msg;
      }
    }

    throw new Error('No message with this ID!');
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
