import { Notifier } from '../base/notifier';
import {
  Interaction,
  InteractionInput,
  InteractionOutput,
} from './interactions';
import { DatabaseService } from '../services/db-service';
import { ulid } from 'ulid';
import { DisposableGroup } from '../base/disposable';

export interface Workspace {
  id: string;
  title: string;
}

export interface WorkspaceNotification {
  workspaceId: Workspace['id'];
}

export class WorkspaceModel {
  readonly workspaces = new Map<Workspace['id'], Workspace>();
  private interactions = new Map<Workspace['id'], Interaction[]>();
  private notifier = new Notifier<WorkspaceNotification>();
  readonly subscribe = this.notifier.subscribe;
  private disposables = new DisposableGroup();

  constructor(
    public workspaceDatabase: DatabaseService<string, Workspace>,
    public interactionDatabase: DatabaseService<string, Interaction>
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
    this.workspaces[id].title = title;
    this.workspaceDatabase.update(id, { title });
  }

  async activate(id: Workspace['id']): Promise<void> {
    const workspaceInteractions = await this.interactionDatabase.where({
      workspaceId: id,
    });
    this.interactions.set(id, workspaceInteractions);
  }

  deactivate(id: Workspace['id']): void {
    this.interactions.delete(id);
  }

  create() {
    const workspace = {
      id: ulid(),
      title: 'New workspace',
    };

    this.workspaces.set(workspace.id, workspace);
    this.workspaceDatabase.create(workspace);
    this.notifier.notify();
    return workspace;
  }

  delete(id: Workspace['id']) {
    this.workspaces.delete(id);
    this.interactions.delete(id);
    this.workspaceDatabase.delete(id);
    this.interactionDatabase.deleteWhere({ workspaceId: id });
    this.notifier.notify({ workspaceId: id });
  }

  createInteraction(workspaceId: Workspace['id'], input: InteractionInput) {
    const interaction = {
      id: ulid(),
      workspaceId,
      input,
      outputs: [],
    };

    this.interactions.get(workspaceId)?.push(interaction);
    this.interactionDatabase.create(interaction);
    this.notifier.notify({ workspaceId });
    return interaction;
  }

  addOutput(interactionId: Interaction['id'], output: InteractionOutput) {
    const interaction = this.getInteraction(interactionId);

    if (interaction) {
      interaction.outputs.push(output);
      this.interactionDatabase.update(interaction.id, {
        outputs: interaction.outputs,
      });
      this.notifier.notify({ workspaceId: interaction.workspaceId });
    }
  }

  getInteraction(id: Interaction['id']) {
    for (const key in this.interactions.keys) {
      const interaction = this.interactions
        .get(key)
        ?.find((x: Interaction) => x.id === id);
      if (interaction) return interaction;
    }
  }

  getInteractions(workspaceId: Workspace['id']): Interaction[] {
    console.log(workspaceId);
    console.log(this.interactions);
    return this.interactions.get(workspaceId) || [];
  }
}
