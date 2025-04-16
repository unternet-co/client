import { Resource } from '@unternet/kernel';
import { unternetResources } from '../unternet/resources';

const initialResources: Array<Resource> = new Array();

if (import.meta.env.APP_UNTERNET_API_KEY) {
  initialResources.push(...unternetResources);
}

interface ResourceModelInit {
  initialResources: Array<Resource>;
}

interface ResourceDescriptor {
  protocol?: string;
  id?: string;
}

class ResourceModel {
  readonly resources: Array<Resource>;

  constructor({ initialResources }: ResourceModelInit) {
    this.resources = initialResources;
  }

  find(descriptor: ResourceDescriptor) {
    let result: Resource;
    if (descriptor.id) {
      result = this.resources.find((x) => x.id == descriptor.id);
    } else {
      result = this.resources.find((x) => x.protocol === descriptor.protocol);
    }

    if (!result) {
      throw new Error(
        `No resource matches this descriptor: ${JSON.stringify(descriptor)}`
      );
    }

    return result;
  }
}

export { ResourceModel, initialResources };
