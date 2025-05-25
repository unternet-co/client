import {
  ActionMessage as KernelActionMessage,
  InputMessage as KernelInputMessage,
  ResponseMessage as KernelResponseMessage,
  ThoughtMessage as KernelThoughtMessage,
  LogMessage as KernelLogMessage,
} from '@unternet/kernel';
import { DatabaseService } from '../storage/database-service';

type ExtendedMessageProperties = { workspaceId: string };

export type ActionMessage = KernelActionMessage & ExtendedMessageProperties;
export type InputMessage = KernelInputMessage & ExtendedMessageProperties;
export type ResponseMessage = KernelResponseMessage & ExtendedMessageProperties;
export type ThoughtMessage = KernelThoughtMessage & ExtendedMessageProperties;
export type LogMessage = KernelLogMessage & ExtendedMessageProperties;

export type Message =
  | ActionMessage
  | InputMessage
  | ResponseMessage
  | ThoughtMessage
  | LogMessage;

export type ActionMessageRecord = Omit<ActionMessage, 'process'> & {
  pid?: string;
};

export type MessageRecord =
  | InputMessage
  | ResponseMessage
  | ThoughtMessage
  | LogMessage
  | ActionMessageRecord;

export type MessageDatabaseService = DatabaseService<Message['id'], Message>;

export interface MessagePatch {
  messageId: Message['id'];
  updates: Partial<Message>;
  key?: string;
}
