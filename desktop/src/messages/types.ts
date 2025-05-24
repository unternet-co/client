import {
  ActionMessage as KernelActionMessage,
  InputMessage as KernelInputMessage,
  ResponseMessage as KernelResponseMessage,
} from '@unternet/kernel';
import { DatabaseService } from '../storage/database-service';

type ExtendedMessageProperties = { workspaceId: string };

export type ActionMessage = KernelActionMessage & ExtendedMessageProperties;
export type InputMessage = KernelInputMessage & ExtendedMessageProperties;
export type ResponseMessage = KernelResponseMessage & ExtendedMessageProperties;

export type Message = ActionMessage | InputMessage | ResponseMessage;

export type ActionMessageRecord = Omit<ActionMessage, 'process'> & {
  pid?: string;
};

export type MessageRecord =
  | InputMessage
  | ResponseMessage
  | ActionMessageRecord;

export type MessageDatabaseService = DatabaseService<Message['id'], Message>;

export interface MessagePatch {
  messageId: Message['id'];
  updates: Partial<Message>;
  key?: string;
}
