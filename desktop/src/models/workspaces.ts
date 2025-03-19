import { Notifier } from '../base/notifier';
import {
  Interaction,
  InteractionInput,
  InteractionOutput,
} from './interaction';
import { workspaceDatabase, DatabaseService } from '../services/db';
import {
  interactionDatabase,
  InteractionDatabaseService,
} from '../services/db';
import { ulid } from 'ulid';
import { DisposableGroup } from '../base/disposable';

export interface Workspace {
  id: string;
}

export interface WorkspaceNotification {
  workspaceId: Workspace['id'];
}

export class WorkspaceModel {
  readonly workspaces: { [id: Workspace['id']]: Workspace } = {};
  private interactions: Interaction[] = [];
  private activeWorkspaceId?: Workspace['id'];
  private notifier = new Notifier<WorkspaceNotification>();
  readonly subscribe = this.notifier.subscribe;
  private disposables = new DisposableGroup();

  constructor(
    public workspaceDatabase: DatabaseService<string, Workspace>,
    public interactionDatabase: InteractionDatabaseService
  ) {
    this.workspaceDatabase = workspaceDatabase;
    this.interactionDatabase = interactionDatabase;
    this.load();
  }

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

  async load() {
    this.interactions = await this.interactionDatabase.all();
    const workspaceRecords = await this.workspaceDatabase.all();
    for (const record of workspaceRecords) {
      this.workspaces[record.id] = record;
      this.notifier.notify({ workspaceId: record.id });
    }
  }

  getActiveWorkspace() {
    if (this.activeWorkspaceId) return this.workspaces[this.activeWorkspaceId];
  }

  setActive(id: Workspace['id']) {
    this.activeWorkspaceId = id;
  }

  create() {
    const workspace = {
      id: ulid(),
      title: 'New workspace',
    };

    this.workspaces[workspace.id] = workspace;
    this.workspaceDatabase.create(workspace);
    this.notifier.notify();
    return workspace;
  }

  delete(id: Workspace['id']) {
    delete this.workspaces[id];
    this.interactions = this.interactions.filter((x) => x.workspaceId !== id);
    this.workspaceDatabase.delete(id);
    this.interactionDatabase.deleteWithWorkspace(id);

    if (Object.keys(this.workspaces).length === 0) {
      this.activeWorkspaceId = undefined;
    }

    this.notifier.notify({ workspaceId: id });
  }

  createInteraction(workspaceId: Workspace['id'], input: InteractionInput) {
    const interaction = {
      id: ulid(),
      workspaceId,
      input,
      outputs: [],
    };

    this.interactions.push(interaction);
    this.interactionDatabase.create(interaction);
    this.notifier.notify({ workspaceId });
    return interaction;
  }

  addOutput(interactionId: Interaction['id'], output: InteractionOutput) {
    const interaction = this.interactions.find((x) => x.id === interactionId);

    if (interaction) {
      interaction.outputs.push(output);
      this.interactionDatabase.update(interaction.id, {
        outputs: interaction.outputs,
      });
      this.notifier.notify({ workspaceId: interaction.workspaceId });
    }
  }

  getInteractions(workspaceId: Workspace['id']) {
    return this.interactions.filter((x) => x.workspaceId === workspaceId);
  }
}

export const workspaceModel = new WorkspaceModel(
  workspaceDatabase,
  interactionDatabase
);
