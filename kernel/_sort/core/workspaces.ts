import { liveQuery } from 'dexie';
import db from '../lib/db';
import { Interaction, interactions } from './interactions';

export interface Workspace {
  id?: number;
  interactionIds: number[];
  resourceUrls: string[];
}

function create() {
  return db.workspaces.add({
    interactionIds: [],
    resourceUrls: [],
  });
}

async function getInteractions(id: Workspace['id']) {
  const workspace = await workspaces.get(id);
  console.log(workspace);
  return (await interactions.bulkGet(workspace.interactionIds)) || [];
}

async function addInteraction(
  id: Workspace['id'],
  interactionId: Interaction['id']
) {
  const workspace = await workspaces.get(id);
  workspace.interactionIds.push(interactionId);
  const worskpace = await workspaces.update(id, {
    interactionIds: [...workspace.interactionIds],
  });
  console.log('NOW', await workspaces.get(id));

  return worskpace;
}

function subscribe(
  query: () => Promise<Workspace[]>,
  callback: (workspaces: Workspace[]) => void
) {
  return liveQuery(query).subscribe(callback);
}

async function subscribeToInteractions(
  workspaceId: Workspace['id'],
  callback: (interactions: Interaction[]) => void
) {
  async function query() {
    const workspace = await workspaces.get(workspaceId);
    return interactions.bulkGet(workspace.interactionIds);
  }
  return liveQuery(query).subscribe(callback);
}

export const workspaces = {
  create,
  close,
  all: db.workspaces.toArray.bind(db.workspaces),
  get: (id: Workspace['id']) => db.workspaces.get(id),
  update: db.workspaces.update.bind(db.workspaces),
  getInteractions,
  addInteraction,
  subscribeToInteractions,
  delete: db.workspaces.delete.bind(db.workspaces),
  subscribe,
};
