import { ActionProposal } from './runtime/actions';
import { Process, ProcessContainer } from './runtime/processes';

export type KernelResponse =
  | DirectResponse
  | ActionProposalResponse
  | ActionResultResponse;

export interface DirectResponse {
  type: 'direct';
  mimeType: 'text/markdown';
  content: Promise<string>;
  contentStream: AsyncIterable<string>;
}

export function directResponse(init: {
  mimeType: 'text/markdown';
  content: Promise<string>;
  contentStream: AsyncIterable<string>;
}): DirectResponse {
  return {
    type: 'direct',
    mimeType: init.mimeType,
    content: init.content,
    contentStream: init.contentStream,
  };
}

export interface ActionProposalResponse extends ActionProposal {
  type: 'actionproposal';
}

export function actionProposalResponse(init: {
  uri: string;
  actionId: string;
  args?: Record<string, any>;
}): ActionProposalResponse {
  return {
    type: 'actionproposal',
    uri: init.uri,
    actionId: init.actionId,
    args: init.args,
  };
}

export interface ActionResultResponse {
  type: 'actionresult';
  process?: Process;
  content?: any;
}

export function actionResultResponse(init: {
  process?: Process;
  content?: any;
}): ActionResultResponse {
  return {
    type: 'actionresult',
    process: init.process,
    content: init.content || init.process.describe(),
  };
}
