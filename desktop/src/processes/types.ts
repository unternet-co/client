import { ProcessContainer, ProcessSnapshot } from '@unternet/kernel';

export interface ProcessRecord extends ProcessSnapshot {}

export interface ProcessInstance {
  pid: ProcessContainer['pid'];
  process?: ProcessContainer;
}
