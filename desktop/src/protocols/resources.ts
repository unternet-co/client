import { Resource } from '@unternet/kernel';
import webResource from './web/resource';

const initialResources: Array<Resource> = new Array();

if (import.meta.env.APP_UNTERNET_API_KEY) {
  initialResources.push(webResource);
}

interface ResourceModelInit {
  initialResources: Array<Resource>;
}

class ResourceModel {
  readonly resources: Array<Resource>;

  constructor({ initialResources }: ResourceModelInit) {
    this.resources = initialResources;
  }

  find(uri: string) {
    let result: Resource;
    result = this.resources.find((x) => x.uri === uri);

    if (!result) {
      throw new Error(`No resource matches this URI: ${JSON.stringify(uri)}`);
    }

    return result;
  }
}

export { ResourceModel, initialResources };
