import { KernelMessage } from '@unternet/kernel';

export type MessageRecord = KernelMessage & { workspaceId: string };
