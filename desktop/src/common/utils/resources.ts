import { Resource } from '@unternet/kernel';

import { ResourceModel } from '../../models/resource-model';
import { WorkspaceModel } from '../../models/workspace-model';

export function enabledResources(
  resourceModel: ResourceModel,
  workspaceModel: WorkspaceModel
): Array<Resource> {
  const workspace = workspaceModel.activeWorkspace;
  if (!workspace) return [];

  return resourceModel
    .all()
    .filter((resource) => workspace.resources[resource.uri]?.enabled ?? false);
}
