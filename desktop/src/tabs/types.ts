type TabType = 'workspace';

export interface BaseTab {
  id?: string;
  title: string;
  type: TabType;
}

export interface WorkspaceTab extends BaseTab {
  type: 'workspace';
  workspaceId: string;
}

export type Tab = BaseTab | WorkspaceTab;
