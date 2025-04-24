import {
  ActionMessage as KernelActionMessage,
  InputMessage as KernelInputMessage,
  KernelMessage,
  ResponseMessage as KernelResponseMessage,
} from '@unternet/kernel';

export type ActionMessage = KernelActionMessage & { workspaceId: string };
export type InputMessage = KernelInputMessage & { workspaceId: string };
export type ResponseMessage = KernelResponseMessage & { workspaceId: string };

export type ActionMessageRecord = Omit<ActionMessage, 'process'> & {
  pid?: string;
};
export type MessageRecord =
  | InputMessage
  | ResponseMessage
  | ActionMessageRecord;

export type Message = ActionMessage | InputMessage | ResponseMessage;
