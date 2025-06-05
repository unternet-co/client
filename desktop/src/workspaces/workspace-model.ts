import { ProcessContainer } from '@unternet/kernel';
import { Message, MessagePatch } from '../messages/types';
import { Disposable } from '../common/disposable';
import { Notifier } from '../common/notifier';
import {
  AddMessageNotification,
  UpdateMessageNotification,
} from '../messages/notifications';
import { ProcessInstance } from '../processes/types';

export type ProcessInstanceRecord = Omit<ProcessInstance, 'process'>;

export interface WorkspaceRecord {
  id: string;
  title: string;
  created: number;
  accessed: number;
  modified: number;
  processInstances: ProcessInstanceRecord[];
}

interface WorkspaceModelInit extends WorkspaceRecord {
  messages: Message[];
  processInstances: ProcessInstance[];
}

export interface ProcessAttachedNotification {
  type: 'process-attached';
  processInstance: ProcessInstance;
}

export interface ProcessClosedNotification {
  type: 'process-closed';
  pid: ProcessInstance['pid'];
}

export type WorkspaceModelNotification =
  | AddMessageNotification
  | UpdateMessageNotification
  | ProcessAttachedNotification
  | ProcessClosedNotification;

export class WorkspaceModel extends Disposable {
  id: WorkspaceRecord['id'];
  title: WorkspaceRecord['title'];
  created: WorkspaceRecord['created'];
  accessed: WorkspaceRecord['accessed'];
  modified: WorkspaceRecord['modified'];
  messageMap = new Map<Message['id'], Message>();
  processInstanceMap = new Map<ProcessInstance['pid'], ProcessInstance>();

  private notifier = new Notifier<WorkspaceModelNotification>();
  readonly subscribe = this.notifier.subscribe;
  readonly onProcessesChanged = this.notifier.when(
    (n) => n.type === 'process-attached' || n.type === 'process-closed'
  );
  readonly onProcessClosed = this.notifier.when(
    (n) => n.type === 'process-closed'
  );
  readonly onMessagesChanged = this.notifier.when(
    (n) => n.type === 'add-message' || n.type === 'update-message'
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

    if (init.processInstances) {
      for (const instance of init.processInstances) {
        this.processInstanceMap.set(instance.pid, instance);
      }
    }
  }

  get messages() {
    return Array.from(this.messageMap.values());
  }

  get processInstances() {
    return Array.from(this.processInstanceMap.values());
  }

  get processes() {
    return this.processInstances.map((instance) => instance.process);
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
      type: 'process-attached',
      processInstance: instance,
    });
  }

  hasProcessInstance(pid: ProcessInstance['pid']) {
    return this.processInstanceMap.has(pid);
  }

  closeProcessInstance(pid: ProcessInstance['pid']) {
    if (this.hasProcessInstance(pid)) {
      this.processInstanceMap.delete(pid);
      this.notifier.notify({
        type: 'process-closed',
        pid: pid,
      });
    }
  }

  attachProcess(process: ProcessContainer) {
    const processInstance = {
      pid: process.pid,
      process,
    };

    for (const p of this.processInstances) {
      this.closeProcessInstance(p.pid);
    }
    this.processInstanceMap.set(process.pid, processInstance);

    this.notifier.notify({
      type: 'process-attached',
      processInstance,
    });
  }

  dispose() {
    this.notifier.dispose();
  }
}
