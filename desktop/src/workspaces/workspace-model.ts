import { ProcessContainer } from '@unternet/kernel';
import { Message, MessagePatch } from '../messages/types';
import { Disposable } from '../common/disposable';
import { Notifier } from '../common/notifier';
import {
  AddMessageNotification,
  UpdateMessageNotification,
} from '../messages/notifications';
import { ProcessInstance } from '../processes/types';

type ProcessInstanceRecord = Omit<ProcessInstance, 'process'>;

export interface WorkspaceRecord {
  id: string;
  title: string;
  created: number;
  accessed: number;
  modified: number;
  processes: ProcessInstanceRecord[];
}

interface WorkspaceModelInit extends WorkspaceRecord {
  messages: Message[];
  processes: ProcessInstance[];
}

export interface ProcessConnectEvent {
  type: 'process-connect';
  processInstance: ProcessInstance;
}

export type WorkspaceModelNotification =
  | AddMessageNotification
  | UpdateMessageNotification
  | ProcessConnectEvent;

export class WorkspaceModel extends Disposable {
  id: WorkspaceRecord['id'];
  title: WorkspaceRecord['title'];
  created: WorkspaceRecord['created'];
  accessed: WorkspaceRecord['accessed'];
  modified: WorkspaceRecord['modified'];
  messageMap = new Map<Message['id'], Message>();
  processMap = new Map<ProcessInstance['pid'], ProcessInstance>();

  private notifier = new Notifier<WorkspaceModelNotification>();
  readonly subscribe = this.notifier.subscribe;
  readonly onProcessesChanged = this.notifier.when(
    (n) => n.type === 'process-connect'
  );

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

  addMessage(message: Message, source?: AddMessageNotification['source']) {
    this.messageMap.set(message.id, message);
    this.notifier.notify({ type: 'add-message', message, source });
  }

  updateMessage(
    patch: MessagePatch,
    source?: UpdateMessageNotification['source']
  ) {
    const message = this.messageMap.get(patch.messageId);
    if (!message) {
      throw new Error(`Message with id ${patch.messageId} not found`);
    }

    const updatedMessage = { ...message, ...patch.updates } as Message;
    this.messageMap.set(message.id, updatedMessage);

    this.notifier.notify({
      type: 'update-message',
      message: updatedMessage,
      source,
    });
  }

  addProcessInstance(instance: ProcessInstance) {
    this.notifier.notify({
      type: 'process-connect',
      processInstance: instance,
    });
  }

  // connectProcess(process: ProcessContainer) {
  //   const processInstance = {
  //     pid: process.pid,
  //     process,
  //   };
  //   this.processMap.set(process.pid, processInstance);

  //   this.notifier.notify({
  //     type: 'process-connect',
  //     processInstance,
  //   });
  // }

  dispose() {
    this.notifier.dispose();
  }
}
