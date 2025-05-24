import { Notifier } from '../common/notifier';
import { DatabaseService } from '../storage/database-service';
import { ulid } from 'ulid';
import {
  KernelMessage,
  Process,
  ProcessContainer,
  ProcessRuntime,
} from '@unternet/kernel';
import { Message, MessageRecord } from '../messages/types';
import { DisposableGroup } from '../common/disposable';
import {
  Workspace,
  WorkspaceNotification,
  WorkspaceRecord,
} from '../workspaces/types';
import { DEFAULT_WORKSPACE_NAME, MAX_ACTIVE_MESSAGES } from '../constants';
import { ProcessRecord } from '../processes/process-service';
import { ConfigService } from '../config/config-service';

export class WorkspaceService {
  public activeWorkspaceId: string | null = null;
  private configService: ConfigService;
  private workspaces = new Map<Workspace['id'], Workspace>();
  private workspaceDatabase: DatabaseService<string, WorkspaceRecord>;
  private messageDatabase: DatabaseService<string, MessageRecord>;
  private runtime: ProcessRuntime;
  private processDatabase: DatabaseService<ProcessRecord['pid'], ProcessRecord>;
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

  get activeWorkspace() {
    return this.workspaces.get(this.activeWorkspaceId);
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
  }

  /**
   * Loads the active workspace, or creates one if none are available.
   */
  async load() {
    const workspaceRecords = await this.workspaceDatabase.all();

    if (!workspaceRecords.length) {
      await this.create(DEFAULT_WORKSPACE_NAME);
    }

    for (const record of workspaceRecords) {
      const workspace = await this.hydrate(record);
      this.workspaces.set(workspace.id, workspace);
      this.notifier.notify({ workspaceId: record.id });
    }

    // Restore activeWorkspaceId, or set to first available workspace
    let activeWorkspaceId: Workspace['id'];
    const storedId = this.configModel.get('activeWorkspaceId');

    if (storedId && this.workspaces.has(storedId)) {
      activeWorkspaceId = storedId;
    } else if (!this.activeWorkspaceId && this.workspaces.size > 0) {
      activeWorkspaceId = Array.from(this.workspaces.keys())[0];
    } else {
      activeWorkspaceId = this.activeWorkspaceId;
    }

    // Load the messages & update
    this.activate(activeWorkspaceId);
    this.notifier.notify({ workspaceId: this.activeWorkspaceId });
  }

  async activate(id: WorkspaceRecord['id']): Promise<void> {
    if (id === this.activeWorkspace?.id) return;
    this.activeWorkspaceId = id;
    this.notifier.notify({ workspaceId: id });
    this.configModel.updateActiveWorkspaceId(id);
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

  updateTitle(title: string, id?: WorkspaceRecord['id']) {
    const workspace = this.get(id);
    workspace.title = title;
    this.workspaceDatabase.update(workspace.id, { title });
    this.notifier.notify({ workspaceId: id });
  }

  async create(title?: string): Promise<Workspace> {
    // Create workspace record & add to database
    const now = Date.now();
    const record: WorkspaceRecord = {
      id: ulid(),
      title: title ?? 'Untitled',
      created: now,
      accessed: now,
      modified: now,
    };

    await this.workspaceDatabase.create(record);

    // Create workspace
    const workspace: Workspace = {
      ...record,
      messages: [],
      processes: [],
    };

    this.workspaces.set(workspace.id, workspace);
    await this.activate(workspace.id);

    return workspace;
  }

  async hydrate(record: WorkspaceRecord): Promise<Workspace> {
    const messageRecords = await this.messageDatabase.where({
      workspaceId: record.id,
    });

    return {
      ...record,
      messages: messageRecords.map(this.hydrateMessage.bind(this)),
      processes: null,
    };
  }

  delete(id: WorkspaceRecord['id']) {
    this.workspaces.delete(id);
    this.workspaceDatabase.delete(id);
    this.messageDatabase.deleteWhere({ workspaceId: id });
    this.processModel.deleteWhere({ workspaceId: id });
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
    const workspace = this.workspaces.get(workspaceId);
    workspace.messages.push(msg);

    const record = this.serializeMessage(msg);
    this.messageDatabase.create(record);

    this.updateModified(workspaceId);
    this.notifier.notify({
      workspaceId,
      type: 'addmessage',
      message: message,
    });

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
    this.notifier.notify({
      workspaceId: message.workspaceId,
      type: 'updatemessage',
      message,
    });
  }

  getMessage(id: MessageRecord['id']): Message {
    // TODO: Probably replace this with a message model for reliability, so caching can't affect this
    const sortedWorkspaces = Array.from(this.workspaces.values()).sort(
      (a, b) => b.accessed - a.accessed
    );

    // TODO: Later make this more efficient by searching only first x messages
    // in each workspace, then searching the rest if not found

    // Sort through all workspaces, with active messages first
    // Then sort through all workspaces, with inactive messages
    for (const workspace of sortedWorkspaces) {
      for (let i = workspace.messages.length; i >= 0; i--) {
        const msg = workspace.messages[i];
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

  /* PROCESSES */

  createProcess(process: Process, workspaceId?: WorkspaceRecord['id']) {
    const workspace = workspaceId
      ? this.workspaces.get(workspaceId)
      : this.activeWorkspace;
    this.processModel.create(process);
    workspace.processes.push(process);
    this.notifier.notify({ workspaceId, type: 'addmessage', message: process });
  }
}
