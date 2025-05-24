import { ProcessContainer } from '@unternet/kernel';
import { Message, MessagePatch } from '../messages/types';
import { WorkspaceRecord } from './types';
import { Disposable } from '../common/disposable';
import { ulid } from 'ulid';
import { Notifier } from '../common/notifier';
import {
  AddMessageNotification,
  UpdateMessageNotification,
} from '../messages/notifications';

export type WorkspaceModelNotification =
  | AddMessageNotification
  | UpdateMessageNotification;

interface WorkspaceModelInit extends WorkspaceRecord {
  messages?: Message[];
  processes?: ProcessContainer[];
}

export class WorkspaceModel extends Disposable {
  id: WorkspaceRecord['id'];
  title: WorkspaceRecord['title'];
  created: WorkspaceRecord['created'];
  accessed: WorkspaceRecord['accessed'];
  modified: WorkspaceRecord['modified'];
  messageMap = new Map<Message['id'], Message>();
  processMap = new Map<ProcessContainer['pid'], ProcessContainer>();

  private notifier = new Notifier<WorkspaceModelNotification>();
  readonly subscribe = this.notifier.subscribe;

  constructor(init: WorkspaceModelInit) {
    super();

    this.id = init.id;
    this.title = init.title;
    this.created = init.created;
    this.accessed = init.accessed;
    this.modified = init.modified;

    if (init.messages) {
      for (const message of init.messages) {
        this.messageMap.set(message.id, message);
      }
    }

    if (init.processes) {
      for (const process of init.processes) {
        this.processMap.set(process.pid, process);
      }
    }
  }

  get messages() {
    return Array.from(this.messageMap.values());
  }

  get processes() {
    return Array.from(this.processMap.values());
  }

  addMessage(message: Message) {
    this.messageMap.set(message.id, message);
    this.notifier.notify({ type: 'add-message', message });
  }

  updateMessage(patch: MessagePatch) {
    const message = this.messageMap.get(patch.messageId);
    if (!message) {
      throw new Error(`Message with id ${patch.messageId} not found`);
    }

    const updatedMessage = { ...message, ...patch.updates } as Message;
    this.messageMap.set(message.id, updatedMessage);

    this.notifier.notify({
      type: 'update-message',
      patch: {
        messageId: message.id,
        updates: updatedMessage,
      },
      message: updatedMessage,
    });
  }

  dispose() {
    this.notifier.dispose();
  }
}
