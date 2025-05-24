import { Message, MessagePatch } from './types';

export interface AddMessageNotification {
  type: 'add-message';
  message: Message;
}

export interface UpdateMessageNotification {
  type: 'update-message';
  patch: MessagePatch;
  message?: Message;
}
