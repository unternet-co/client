import { ulid } from 'ulid';
import { DatabaseService } from '../storage/database-service';
import { WorkspaceRecord } from './types';
import { DEFAULT_WORKSPACE_NAME } from '../constants';
import { WorkspaceModel } from './workspace-model';
import { ConfigService } from '../config/config-service';
import { Notifier } from '../common/notifier';
import { MessageService } from '../messages/message-service';
import { DisposableGroup } from '../common/disposable';

export type WorkspaceServiceNotification =
  | UpdateWorkspacesNotification
  | ActivateWorkspaceNotification;

interface UpdateWorkspacesNotification {
  type: 'update-workspaces';
  workspaces: WorkspaceRecord[];
}

interface ActivateWorkspaceNotification {
  type: 'activate-workspace';
  workspaceModel: WorkspaceModel;
}

export class WorkspaceService {
  private activeWorkspaceDisposables = new DisposableGroup();
  private workspaces = new Map<WorkspaceRecord['id'], WorkspaceRecord>();
  activeWorkspaceModel: WorkspaceModel | null = null;

  private notifier = new Notifier<WorkspaceServiceNotification>();
  readonly subscribe = this.notifier.subscribe;
  readonly onActivateWorkspace = this.notifier.when(
    (n) => n.type === 'activate-workspace'
  );
  readonly onUpdateWorkspaces = this.notifier.when(
    (n) => n.type === 'update-workspaces'
  );

  constructor(
    private readonly workspaceDatabase: DatabaseService<
      string,
      WorkspaceRecord
    >,
    private readonly messageService: MessageService,
    private readonly configService: ConfigService
  ) {}

  async load() {
    // Add workspaces from the db
    const workspaces = await this.workspaceDatabase.all();
    for (const ws of workspaces) {
      this.workspaces.set(ws.id, ws);
    }

    // If no workspaces, create a default one
    if (!workspaces.length) {
      await this.create(DEFAULT_WORKSPACE_NAME);
    }

    // Load & set the active workspace
    let activeWorkspaceId: WorkspaceRecord['id'];
    const storedId = this.configService.get('activeWorkspaceId');
    if (storedId && this.workspaces.has(storedId)) {
      activeWorkspaceId = storedId;
    } else {
      activeWorkspaceId = Array.from(this.workspaces.keys())[0];
    }

    this.activate(activeWorkspaceId);
  }

  getWorkspaces() {
    return Array.from(this.workspaces.values());
  }

  async create(title?: string): Promise<WorkspaceRecord> {
    const now = Date.now();
    const workspace: WorkspaceRecord = {
      id: ulid(),
      title: title ?? 'Untitled',
      created: now,
      accessed: now,
      modified: now,
    };

    await this.workspaceDatabase.add(workspace);
    this.workspaces.set(workspace.id, workspace);
    this.notifier.notify({
      type: 'update-workspaces',
      workspaces: this.getWorkspaces(),
    });

    this.activate(workspace.id);

    return workspace;
  }

  async activate(id: WorkspaceRecord['id']) {
    if (id === this.activeWorkspaceModel?.id) return;
    if (!this.workspaces.has(id)) throw new Error(`No workspace with ID ${id}`);

    this.activeWorkspaceDisposables.dispose();
    this.activeWorkspaceDisposables = new DisposableGroup();

    const messages = await this.messageService.fetchMessages(id);

    this.activeWorkspaceModel = new WorkspaceModel({
      ...this.workspaces.get(id),
      messages,
    });

    const serviceSubscription = this.messageService.subscribe((n) => {
      if (n.type === 'add-message') {
        this.activeWorkspaceModel.addMessage(n.message);
      } else if (n.type === 'update-message') {
        this.activeWorkspaceModel.updateMessage(n.patch);
      }
    });

    this.activeWorkspaceDisposables.add(serviceSubscription);

    this.configService.updateActiveWorkspaceId(id);
    this.notifier.notify({
      type: 'activate-workspace',
      workspaceModel: this.activeWorkspaceModel,
    });
  }

  // Complete this
  // Model is served and the service subscribes to its changes
  // and updates the db appropriately.
  // Also if any changes, the service updates the model.
  // Model has its own notification system.
  // Then add processes to this.

  // Goal is to
  // - chat can spawn a process
  // - process shows up in the main workspace view (just one for now)

  // I guess a file is just a suspended process?
}
