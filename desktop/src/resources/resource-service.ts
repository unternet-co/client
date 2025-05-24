import { Resource } from '@unternet/kernel';
import webResource from '../protocols/buitin/resources';
import { Notifier } from '../common/notifier';
import { uriWithScheme } from '../common/utils/http';
import { DatabaseService } from '../storage/database-service';
import { WebProtocol } from '../protocols/http/protocol';

const initialResources: Array<Resource> = new Array();

if (import.meta.env.APP_UNTERNET_API_KEY) {
  initialResources.push(webResource);
}

interface ResourceServiceInit {
  initialResources: Array<Resource>;
  resourceDatabaseService: DatabaseService<string, Resource>;
}

class ResourceService {
  private resources = new Map<string, Resource>();
  private db: DatabaseService<string, Resource>;
  private notifier = new Notifier();
  public readonly subscribe = this.notifier.subscribe;

  constructor({
    initialResources,
    resourceDatabaseService,
  }: ResourceServiceInit) {
    this.db = resourceDatabaseService;
    initialResources.map(this.add.bind(this));
    this.load();
  }

  async load() {
    const allResources = await this.db.all();
    for (const resource of allResources) {
      this.resources.set(resource.uri, resource);
    }
    this.notifier.notify();
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

    const newResource = await WebProtocol.createResource(uri);
    this.add(newResource);
  }

  add(resource: Resource) {
    this.resources.set(resource.uri, resource);
    this.db.put(resource);
    this.notifier.notify();
  }

  get(uri: string) {
    const result = this.resources.get(uri);
    console.log(this.resources);
    if (!result) {
      throw new Error(`No resource matches this URI: ${JSON.stringify(uri)}`);
    }

    return result;
  }

  async remove(uri: string) {
    this.resources.delete(uri);
    await this.db.delete(uri);
    this.notifier.notify();
  }
}

export { ResourceService, initialResources };
