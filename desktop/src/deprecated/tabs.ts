import { workspaces, type Workspace } from '.';
import db from './db';
import { liveQuery } from 'dexie';
import { config } from './config';

export type Tab = WorkspaceTab;
export type TabType = 'workspace';

export interface BaseTab {
  id?: number;
  title: string;
  type: TabType;
}

export interface WorkspaceTab extends BaseTab {
  type: 'workspace';
  workspaceId: Workspace['id'];
}

async function create(type?: TabType) {
  const workspaceId = await workspaces.create();

  const id = await db.tabs.add({
    type: 'workspace',
    title: 'New workspace',
    workspaceId,
  });

  config.set('activeTab', id);
  return id;
}

function setTitle(id: Tab['id'], title: string) {
  return db.tabs.update(id, { title });
}

async function getWorkspaceId(id: Tab['id']) {
  const tab = await db.tabs.get(id);
  if (!tab) return null;
  return tab.workspaceId;
}

async function getWorkspace(id: Tab['id']) {
  const tab = await db.tabs.get(id);
  if (tab.type !== 'workspace') {
    console.error("Tried to get workspace for a tab not of type 'workspace'");
    return null;
  }
  return workspaces.get(tab.workspaceId);
}

async function close(id: Tab['id']) {
  const { workspaceId } = await db.tabs.get(id);
  await db.tabs.delete(id);
  const allTabs = await db.tabs.toArray();

  let nextSelectedId =
    allTabs.length === 0 ? -1 : allTabs[allTabs.length - 1].id;

  config.set('activeTab', nextSelectedId);
  // TODO: Remove this when history done
  await workspaces.delete(workspaceId);
}

function subscribe(
  query: () => Promise<Tab[]>,
  callback: (tabs: Tab[]) => void
) {
  return liveQuery(query).subscribe(callback);
}

export const tabs = {
  create,
  close,
  setTitle,
  getWorkspaceId,
  getWorkspace,
  subscribe,
  all: db.tabs.toArray.bind(db.tabs),
};
