import { Message, MessagePatch } from './types';

export interface AddMessageNotification {
  type: 'add-message';
  message: Message;
  source?: 'external';
}

export interface UpdateMessageNotification {
  type: 'update-message';
  patch?: MessagePatch;
  message?: Message;
  source?: 'external';
}
