import { ActionProposal, ProcessDisplayMode } from '../runtime/actions';
import { Process, ProcessContainer } from '../runtime/processes';

export type InterpreterResponse =
  | DirectResponse
  | ActionProposalResponse
  | ActionResultResponse
  | ThoughtResponse
  | LogResponse;

export type KernelResponse = InterpreterResponse;

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
  display?: ProcessDisplayMode;
}): ActionProposalResponse {
  return {
    type: 'actionproposal',
    uri: init.uri,
    actionId: init.actionId,
    args: init.args,
    display: init.display || 'auto',
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

export interface ThoughtResponse {
  type: 'thought';
  content: string;
}

export function thoughtResponse(content: string): ThoughtResponse {
  return {
    type: 'thought',
    content,
  };
}

export interface LogResponse {
  type: 'log';
  content: string;
}

export function logResponse(content: string): LogResponse {
  return {
    type: 'log',
    content,
  };
}
