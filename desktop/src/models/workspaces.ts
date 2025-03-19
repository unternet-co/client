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

export interface Workspace {
  id: string;
}

export class WorkspaceModel {
  readonly workspaces: { [id: Workspace['id']]: Workspace } = {};
  private interactions: Interaction[] = [];
  private activeWorkspaceId?: Workspace['id'];
  private notifier = new Notifier();
  readonly subscribe = this.notifier.subscribe;

  constructor(
    public workspaceDatabase: DatabaseService<string, Workspace>,
    public interactionDatabase: InteractionDatabaseService
  ) {
    this.workspaceDatabase = workspaceDatabase;
    this.interactionDatabase = interactionDatabase;
    this.load();
  }

  async load() {
    const workspaceRecords = await this.workspaceDatabase.all();
    for (const record of workspaceRecords) {
      this.workspaces[record.id] = record;
    }
    this.interactions = await this.interactionDatabase.all();
    this.notifier.notify();
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
    if (!Object.keys(this.workspaces).length)
      this.activeWorkspaceId = undefined;
    this.workspaceDatabase.delete(id);
    this.notifier.notify();
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
    this.notifier.notify();
    return interaction;
  }

  addOutput(interactionId: Interaction['id'], output: InteractionOutput) {
    const interaction = this.interactions.find((x) => x.id === interactionId);

    if (interaction) {
      interaction.outputs.push(output);
      this.interactionDatabase.update(interaction.id, {
        outputs: interaction.outputs,
      });
      this.notifier.notify();
    }
  }

  getInteractions(
    workspaceId: Workspace['id'] | undefined = this.activeWorkspaceId
  ) {
    return this.interactions.filter((x) => x.workspaceId === workspaceId);
  }
}

export const workspaceModel = new WorkspaceModel(
  workspaceDatabase,
  interactionDatabase
);
