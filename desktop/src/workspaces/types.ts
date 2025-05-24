import { Message } from '../messages/types';
import { ProcessContainer } from '@unternet/kernel';

export interface WorkspaceRecord {
  id: string;
  title: string;
  created: number;
  accessed: number;
  modified: number;
}

export interface WorkspaceModel extends WorkspaceRecord {
  messages: Message[];
  processes: ProcessContainer[];
}

export interface WorkspaceResource {
  enabled: boolean;
  uri: string;
}
