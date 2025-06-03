import { Resource } from '@unternet/kernel';

import { ResourceModel } from '../../models/resource-model';
import { WorkspaceModel } from '../../models/workspace-model';

let lastEnabledCount = 0;

export function enabledResources(
  resourceModel: ResourceModel,
  workspaceModel: WorkspaceModel
): Array<Resource> {
  const workspace = workspaceModel.activeWorkspace;
  if (!workspace) {
    return [];
  }

  const allResources = resourceModel.all();
  const enabled = allResources.filter(
    (resource) => workspace.resources[resource.uri]?.enabled ?? false
  );

  if (enabled.length !== lastEnabledCount) {
    console.log('[RESOURCES] Enabled resources count:', enabled.length);
    lastEnabledCount = enabled.length;
  }

  return enabled;
}
