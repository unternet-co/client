import { KernelMessage } from '@unternet/kernel';
import { Notifier } from '../common/notifier';
import { WorkspaceRecord } from '../workspaces/workspace-model';
import {
  AddMessageNotification,
  UpdateMessageNotification,
} from './notifications';
import { Message, MessageDatabaseService, MessageRecord } from './types';
import { ulid } from 'ulid';

type MessageServiceNotification =
  | AddMessageNotification
  | UpdateMessageNotification;

export class MessageService {
  private notifier = new Notifier<MessageServiceNotification>();
  readonly subscribe = this.notifier.subscribe;

  constructor(
    private readonly databaseService: MessageDatabaseService
    // private readonly processService: ProcessService
  ) {}

  async createMessageForWorkspace(
    workspaceId: WorkspaceRecord['id'],
    msg: KernelMessage
  ) {
    const record: MessageRecord = {
      ...msg,
      workspaceId,
    };

    const hydratedMsg = this.hydrateMessage(record);
    this.notifier.notify({ type: 'add-message', message: hydratedMsg });

    await this.databaseService.add(record);
  }

  async fetchMessages(workspaceId?: WorkspaceRecord['id']) {
    if (!workspaceId) {
      return this.databaseService.all();
    }
    return await this.databaseService.where({ workspaceId });
  }

  async update(messageId: Message['id'], updates: Partial<Message>) {
    await this.databaseService.update(messageId, updates);
    this.notifier.notify({
      type: 'update-message',
      patch: {
        messageId: messageId,
        updates,
        key: ulid(),
      },
    });
  }

  serializeMessage(message: Message): MessageRecord {
    if (message.type === 'action' && message.process) {
      const { process, ...rest } = message;
      return {
        ...rest,
        pid: process.pid,
      };
    }
    return message;
  }

  hydrateMessage(record: MessageRecord): Message {
    if (record.type === 'action' && record.pid) {
      const { pid, ...rest } = record;
      return {
        ...rest,
        // process: this.processService.getProcess(record.pid),
      };
    }
    return record;
  }
}
