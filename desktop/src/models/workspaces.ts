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
    this.notifier.notify({ workspaceId: id });
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

    if (!this.interactions.has(workspaceId)) {
      this.interactions.set(workspaceId, []);
    }
    this.interactions.get(workspaceId)!.push(interaction);
    this.interactionDatabase.create(interaction);
    this.notifier.notify({ workspaceId });

    return interaction;
  }

  addOutput(
    interactionId: Interaction['id'],
    output: InteractionOutput
  ): number {
    const interaction = this.getInteraction(interactionId);
    if (!interaction) {
      throw new Error('Interaction does not exist!');
    }

    interaction.outputs.push(output);
    this.interactionDatabase.update(interaction.id, {
      outputs: interaction.outputs,
    });
    this.notifier.notify({ workspaceId: interaction.workspaceId });
    const outputIndex = interaction.outputs.length - 1;
    return outputIndex;
  }

  updateOutput(
    interactionId: Interaction['id'],
    outputIndex: number,
    update: Partial<InteractionOutput>
  ) {
    const interaction = this.getInteraction(interactionId);

    if (interaction && interaction[outputIndex]) {
      interaction[outputIndex] = { ...interaction[outputIndex], ...update };
      this.interactionDatabase.update(interaction.id, {
        outputs: interaction.outputs,
      });
      this.notifier.notify({ workspaceId: interaction.workspaceId });
    }
  }

  getInteraction(id: Interaction['id']): Interaction {
    let interaction: Interaction | null = null;
    for (const interactions of this.interactions.values()) {
      const possibleInteraction = interactions.find(
        (x: Interaction) => x.id === id
      );
      if (possibleInteraction) {
        interaction = possibleInteraction;
        continue;
      }
    }
    if (!interaction) throw new Error('No interaction with this ID!');
    return interaction;
  }

  allInteractions(workspaceId: Workspace['id']): Interaction[] {
    return this.interactions.get(workspaceId) || [];
  }
}
