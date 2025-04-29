import {
  ActionMessage as KernelActionMessage,
  InputMessage as KernelInputMessage,
  KernelMessage,
  ResponseMessage as KernelResponseMessage,
} from '@unternet/kernel';

type ExtendedMessageProperties = { workspaceId: string };

export type ActionMessage = KernelActionMessage & ExtendedMessageProperties;
export type InputMessage = KernelInputMessage & ExtendedMessageProperties;
export type ResponseMessage = KernelResponseMessage & ExtendedMessageProperties;

export type ActionMessageRecord = Omit<ActionMessage, 'process'> & {
  pid?: string;
};
export type MessageRecord =
  | InputMessage
  | ResponseMessage
  | ActionMessageRecord;

export type Message = ActionMessage | InputMessage | ResponseMessage;
