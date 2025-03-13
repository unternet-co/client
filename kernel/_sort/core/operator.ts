import { InteractionInput, interactions } from './interactions';
import { resources } from './resources';
import { completions } from '../lib/completions';
import { processes } from './processes';
import { type InputOptions } from '../lib/types';
import { Workspace, workspaces } from './workspaces';

export const strategies = {
  TEXT: `Respond with a straight text response. This is appropriate for simple queries that you can provide a definitive answer to, where no research or tool use is needed, or when the prompt is a creative one or a trivial & non-controversial question.`,
  SEARCH: `Use this for search-like queries that depend on information from external sources that need to be synthesized into a response. For example, a SEARCH strategy may involve searching the web, or retrieving information from a locations API, or the users's documents, and then writing a response that summarizes the information retrieved.`,
  DISPLAY: `Use this when the user's query is answered most effectively by showing the user output from one of the available tools. For example, if the user has asked you to show a map, or to view flights, or has requested an tool to use directly. This will show the user a rich view created by the tool. Only select this if there is a tool that can respond.`,
};

async function init(appletUrls: string[]) {
  appletUrls.map((url) => resources.register(url));
}

async function handleInput(
  input: InteractionInput,
  workspaceId: Workspace['id']
) {
  if (input.text === 'clear') {
    interactions.clear();
    return;
  }

  const interactionId = await interactions.create(input, { workspaceId });
  const history = await workspaces.getInteractions(workspaceId);
  const recentHistory = history.slice(-10);
  const actions = await resources.actions.all();

  const { strategy } = await completions.chooseStrategy(
    recentHistory,
    strategies,
    actions
  );
  console.log(`[OPERATOR] Chosen strategy: '${strategy}'`);

  if (strategy === 'TEXT') {
    const outputIndex = await interactions.createTextOutput(interactionId);
    completions.streamText(recentHistory, (text) => {
      interactions.updateTextOutput(interactionId, outputIndex, text);
    });
  } else if (strategy === 'SEARCH') {
    const actionChoices = await completions.chooseActions(history, actions, 3);

    console.log(`[OPERATOR] Chosen actions:`, actionChoices);

    // TODO: Eliminate 'data' type, just have it a hidden thing, not running process?
    for await (const actionChoice of actionChoices) {
      const data = await processes.runAction(actionChoice);
      await interactions.createDataOutput(interactionId, {
        resourceUrl: actionChoice.url,
        content: data,
      });
    }

    const newHistory = await workspaces.getInteractions(workspaceId);

    const outputIndex = await interactions.createTextOutput(interactionId);
    completions.streamText(
      newHistory,
      (text: string) => {
        interactions.updateTextOutput(interactionId, outputIndex, text);
      },
      {
        system:
          'Cite relevant sources with a link in brackets, e.g. ([theverge.com](https://theverge.com/...))',
      }
    );
  } else if (strategy === 'DISPLAY') {
    // TODO: Make it only choose visible ones
    const actionChoice = await completions.chooseAction(
      history,
      actions,
      'Do not choose `search:` prefixed actions.'
    );
    const logMessage = `${actionChoice.url}${
      actionChoice.actionId ? `#${actionChoice.actionId}` : ''
    }`;
    console.log(`[OPERATOR]  Chosen action: ${logMessage}`);

    const processId = await processes.createWebProcess(actionChoice.url);
    interactions.createWebOutput(interactionId, processId);
    await processes.dispatchAction(processId, actionChoice);
  }
}

export const operator = {
  init,
  handleInput,
};
