import { liveQuery } from 'dexie';
import db from '../lib/db';
import { ActionChoice } from '../lib/types';
import { AppletDataEvent, applets } from '@web-applets/sdk';
import { unternet } from '../lib/unternet';

/* Models */

export type Process = WebProcess;
type ProcessType = 'web';

interface BaseProcess {
  id?: number;
  type: ProcessType;
}

export interface WebProcess extends BaseProcess {
  id?: number;
  type: 'web';
  url: string;
  data?: Record<string, unknown>;
}

/* Actions */

async function runAction(actionChoice: ActionChoice) {
  if (actionChoice.protocol === 'search') {
    const { webpages } = await unternet.lookup.query({
      q: actionChoice.arguments.query,
      webpages: {
        sites: [actionChoice.url],
      },
    });
    return webpages;
  } else {
    console.log('[Operator] Loading applet, for one-off run.');
    const applet = await applets.load(actionChoice.url);
    console.log('[Operator] Applet loaded.');
    console.log(
      '[Operator] Dispatching action:',
      actionChoice.actionId,
      actionChoice.arguments
    );
    await applet.dispatchAction(actionChoice.actionId, actionChoice.arguments);
    return applet.data;
  }
}

async function createWebProcess(url: string, actionChoice?: ActionChoice) {
  const id = await db.processes.add({
    type: 'web',
    url,
  });
  if (actionChoice) dispatchAction(id, actionChoice);
  return id;
}

async function runWebResourceAction(actionChoice?: ActionChoice) {}

async function dispatchAction(processId: number, actionChoice: ActionChoice) {
  const instance = await processes.get(processId);
  if (!instance) {
    throw new Error(`Process with ID ${processId} doesn't exist!`);
  }
  if (!actionChoice.actionId) {
    console.warn('No action ID supplied, aborting action dispatch.');
    return;
  }

  console.log('[Operator] Loading applet.');
  const applet = await applets.load(instance.url);
  console.log('[Operator] Applet loaded.');
  if (instance.data) applet.data = instance.data;

  applet.ondata = (event: AppletDataEvent) => {
    console.log('[Operator] Updating data', event.data);
    processes.setAppletData(processId, event.data);
  };

  console.log(
    '[Operator] Dispatching action:',
    actionChoice.actionId,
    actionChoice.arguments
  );
  await applet.dispatchAction(actionChoice.actionId, actionChoice.arguments);
  applet.ondata = () => {};

  return applet.data;
}

async function setAppletData(instanceId: number, data: any) {
  db.processes.update(instanceId, { data });
}

/* Subscriptions */

function subscribe(
  query: () => Process[] | Process,
  callback: (processes: Process[] | Process) => void
) {
  return liveQuery(query).subscribe(callback);
}

/* Exports */

export const processes = {
  get: db.processes.get.bind(db.processes),
  createWebProcess,
  runAction,
  runWebResourceAction,
  setAppletData,
  dispatchAction,
  destroy: db.processes.delete.bind(db.processes),
  clear: db.processes.clear.bind(db.processes),
  subscribe,
};
