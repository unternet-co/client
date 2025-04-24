import {
  CoreAssistantMessage,
  CoreSystemMessage,
  CoreUserMessage,
  FilePart,
  ImagePart,
  TextPart,
} from 'ai';
import { ActionDirective, encodeActionHandle } from '../runtime/actions';
import { ProcessContainer } from '../runtime/processes';
import { ulid } from 'ulid';

/* KERNEL MESSAGES */

export type KernelMessage = InputMessage | ResponseMessage | ActionMessage;

export interface BaseMessage {
  id: string;
  createdAt: number;
  correlationId?: string;
}

function baseMessage(overrides: Partial<BaseMessage> = {}) {
  return {
    id: ulid(),
    correlationId: overrides.correlationId ?? ulid(),
    createdAt: Date.now(),
    ...overrides,
  };
}

export interface InputMessage extends BaseMessage {
  type: 'input';
  text?: string;
  files?: FileInput[];
}

export interface FileInput {
  data: Uint8Array;
  filename?: string;
  mimeType?: string;
}

export function inputMessage(init: {
  text?: string;
  files?: FileInput[];
}): InputMessage {
  const base = baseMessage();
  return {
    ...base,
    type: 'input',
    text: init.text,
    files: init.files,
    correlationId: base.id,
  };
}

export interface ResponseMessage extends BaseMessage {
  type: 'response';
  text: string;
}

export function responseMessage(init?: {
  text?: string;
  correlationId?: string;
}): ResponseMessage {
  return {
    ...baseMessage(init),
    type: 'response',
    text: init?.text || '',
  };
}

export interface LogMessage {
  type: 'log';
  source: 'thought';
  text: string;
}

export interface ActionMessage extends BaseMessage {
  type: 'action';
  directive: ActionDirective;
  process?: ProcessContainer;
  content?: any;
}

export function actionMessage(init: {
  directive: ActionDirective;
  process?: ProcessContainer;
  content?: any;
  correlationId?: string;
}): ActionMessage {
  return {
    ...baseMessage(init),
    type: 'action',
    directive: init.directive,
    process: init.process,
    content: init.content,
  };
}

/* MODEL MESSAGES */

export type ModelMessage =
  | CoreSystemMessage
  | CoreUserMessage
  | CoreAssistantMessage;

export function userMessage(content: string) {
  return {
    role: 'user',
    content,
  } as ModelMessage;
}

export function assistantMessage(content: string) {
  return {
    role: 'assistant',
    content,
  } as ModelMessage;
}

export function toModelMessages(kernelMsgs: KernelMessage[]): ModelMessage[] {
  const modelMsgs: ModelMessage[] = [];

  for (const k of kernelMsgs) {
    switch (k.type) {
      /* INPUT MESSAGE */

      case 'input': {
        if (k.text?.trim()) {
          modelMsgs.push({
            role: 'user',
            content: k.text,
          });
        }

        if (k.files?.length) {
          const parts = k.files.map(fileToPart);
          modelMsgs.push({
            role: 'user',
            content: parts,
          });
        }
        break;
      }

      /* RESPONSE MESSAGE */

      case 'response': {
        modelMsgs.push({
          role: 'assistant',
          content: k.text,
        });
        break;
      }

      /* ACTION MESSAGES */

      case 'action': {
        const actionUri = encodeActionHandle(
          k.directive.uri,
          k.directive.actionId
        );

        const body = k.process !== undefined ? k.process.describe() : k.content;

        modelMsgs.push({
          role: 'assistant',
          content: `Action invoked: ${actionUri}\nOutput: ${JSON.stringify(
            body
          )}`,
        });
        break;
      }
    }
  }

  return modelMsgs;
}

function fileToPart(file: FileInput): TextPart | ImagePart | FilePart {
  const { mimeType } = file;

  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    return {
      type: 'text',
      text: new TextDecoder().decode(file.data),
    };
  }

  if (mimeType.startsWith('image/')) {
    return {
      type: 'image',
      image: file.data,
      mimeType,
    };
  }

  return {
    type: 'file',
    data: file.data,
    filename: file.filename,
    mimeType,
  };
}

export function modelMsg(
  role: ModelMessage['role'],
  content: ModelMessage['content']
): ModelMessage {
  return {
    role,
    content,
  } as ModelMessage;
}
