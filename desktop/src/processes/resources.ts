import { Resource } from '@unternet/kernel';
import { unternetResources } from '../unternet/unternet-resources';

const initialResources: Array<Resource> = new Array();
initialResources.push(...unternetResources);

interface ResourceManagerInit {
  initialResources: Array<Resource>;
}

class ResourceManager {
  readonly resources: Array<Resource>;

  constructor({ initialResources }: ResourceManagerInit) {
    this.resources = initialResources;
  }
}

export { ResourceManager, initialResources };
