import { Protocol, Resource } from '@unternet/kernel';
import { Notifier } from '../common/notifier';
import { uriWithScheme } from '../common/utils/http';
import { DatabaseService } from '../storage/database-service';
import { WebProtocol } from '../protocols/http/protocol';
import { protocols, resources } from '../protocols';

export const initialResources = [...resources];

export interface ResourceServiceInit {
  initialResources: Array<Resource>;
  resourceDatabaseService: DatabaseService<string, Resource>;
}

export class ResourceService {
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
    let scheme: string;
    let protocol: Protocol;

    try {
      const urlObj = new URL(uri);
      scheme = urlObj.protocol.replace(':', '');
      protocol = protocols.find(
        (p) => p.scheme === scheme || p.scheme.includes(scheme)
      );
      if (!protocol)
        throw new Error(`No protocol handler installed for '${scheme}'.`);
    } catch (e) {
      console.error(`Error registering resource '${uri}': ${e.message}`);
    }

    const ctor = protocol.constructor as typeof Protocol;
    const newResource = await ctor.resolveResource(uri);
    console.log(`Registered resource: ${newResource.uri}`);
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

  async remove(uri: string) {
    this.resources.delete(uri);
    await this.db.delete(uri);
    this.notifier.notify();
  }
}
