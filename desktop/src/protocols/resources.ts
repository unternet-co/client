import { resource, Resource } from '@unternet/kernel';
import webResource from './builtin/resources';
import { Notifier } from '../common/notifier';
import { getMetadata, uriWithScheme } from '../common/utils/http';
import { DatabaseService } from '../storage/database-service';

const initialResources: Array<Resource> = new Array();

if (import.meta.env.APP_UNTERNET_API_KEY) {
  initialResources.push(webResource);
}

interface ResourceModelInit {
  initialResources: Array<Resource>;
  resourceDatabaseService: DatabaseService<string, Resource>;
}

class ResourceModel {
  private resources = new Map<string, Resource>();
  private db: DatabaseService<string, Resource>;
  private notifier = new Notifier();
  public readonly subscribe = this.notifier.subscribe;

  constructor({
    initialResources,
    resourceDatabaseService,
  }: ResourceModelInit) {
    this.db = resourceDatabaseService;
    initialResources.map(this.add.bind(this));
  }

  all() {
    return Array.from(this.resources.values());
  }

  async register(uri: string) {
    uri = uriWithScheme(uri);

    try {
      const urlObj = new URL(uri);
      if (!['http', 'https'].includes(urlObj.protocol.replace(':', ''))) {
        throw new Error(
          `Adding resources from non-web sources not currently supported.`
        );
      }
    } catch (e) {
      console.error(`Error registering resource '${uri}': ${e.message}`);
    }

    const metadata = await getMetadata(uri);
    const _resource = resource({
      uri,
      ...metadata,
    });
    this.add(_resource);
  }

  add(resource: Resource) {
    this.resources.set(resource.uri, resource);
    this.db.put(resource);
    this.notifier.notify();
  }

  get(uri: string) {
    const result = this.resources.get(uri);
    if (!result) {
      throw new Error(`No resource matches this URI: ${JSON.stringify(uri)}`);
    }

    return result;
  }
}

export { ResourceModel, initialResources };
