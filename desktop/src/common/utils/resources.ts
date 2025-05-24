import { Resource } from '@unternet/kernel';

import { ResourceModel } from '../../resources/resource-service';
import { WorkspaceModel } from '../../deprecated/workspace-service';

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
