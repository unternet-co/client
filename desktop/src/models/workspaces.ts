import { Notifier } from '../base/notifier';
import {
  Interaction,
  InteractionInput,
  InteractionOutput,
} from './interactions';
import { DatabaseService } from '../services/database-service';
import { ulid } from 'ulid';
import { DisposableGroup } from '../base/disposable';

export interface Workspace {
  id: string;
  title: string;
  createdAt: number;
  lastOpenedAt: number;
  lastModifiedAt: number;
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
      // Update the lastOpenedAt timestamp
      workspace.lastOpenedAt = Date.now();
      this.workspaceDatabase.update(id, { lastOpenedAt: workspace.lastOpenedAt });
    }
    
    const workspaceInteractions = await this.interactionDatabase.where({
      workspaceId: id,
    });
    this.interactions.set(id, workspaceInteractions);
    this.notifier.notify({ workspaceId: id });
  }

  deactivate(id: Workspace['id']): void {
    this.interactions.delete(id);
  }

  create() {
    const now = Date.now();
    const workspace = {
      id: ulid(),
      title: 'New workspace',
      createdAt: now,
      lastOpenedAt: now,
      lastModifiedAt: now,
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

    if (!this.interactions.has(workspaceId)) {
      this.interactions.set(workspaceId, []);
    }
    this.interactions.get(workspaceId)!.push(interaction);
    this.interactionDatabase.create(interaction);
    this.notifier.notify({ workspaceId });
    console.log('in interactions', interaction);
    return interaction;
  }

  addOutput(interactionId: Interaction['id'], output: InteractionOutput) {
    const interaction = this.getInteraction(interactionId);
    console.log(interaction, output);

    if (interaction) {
      interaction.outputs.push(output);
      this.interactionDatabase.update(interaction.id, {
        outputs: interaction.outputs,
      });
      this.notifier.notify({ workspaceId: interaction.workspaceId });
    }
  }

  getInteraction(id: Interaction['id']) {
    console.log(this.interactions.keys());
    for (const [interactionId, interactions] of this.interactions.entries()) {
      console.log('gettig', interactions);
      const interaction = interactions.find((x: Interaction) => x.id === id);
      if (interaction) return interaction;
    }
  }

  allInteractions(workspaceId: Workspace['id']): Interaction[] {
    return Array.from(this.interactions.get(workspaceId) || []);
  }

  updateLastModified(id: Workspace['id']): void {
    const workspace = this.workspaces.get(id);
    if (workspace) {
      // Update the lastModifiedAt timestamp
      workspace.lastModifiedAt = Date.now();
      this.workspaceDatabase.update(id, { lastModifiedAt: workspace.lastModifiedAt });
      this.notifier.notify({ workspaceId: id });
    }
  }
}
