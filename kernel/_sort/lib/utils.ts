import { Interaction } from '../core/interactions';
import { Process, processes } from '../core/processes';
import { type Resource } from '../core/resources';

export async function interactionsToMessages(interactions: Interaction[]) {
  let messages = [];
  for (let interaction of interactions) {
    messages.push({
      role: 'user',
      content: interaction.input.text,
    });

    for (let output of interaction.outputs) {
      if (output.type === 'data') {
        messages.push({
          role: 'system',
          content: `Latest, relevant data for this query:\n\n${JSON.stringify(
            output.content
          )}`,
        });
      } else if (output.type === 'text') {
        messages.push({
          role: 'assistant',
          content: output.content,
        });
      } else if (output.type === 'web') {
        const process: Process = await processes.get(output.processId);
        messages.push({
          role: 'system',
          content: `Data from tool:\n\n${JSON.stringify(process.data)}`,
        });
      }
    }
  }

  return messages;
}

export function createObjectSchema(properties: object) {
  return {
    type: 'object',
    required: Object.keys(properties),
    properties,
    additionalProperties: false,
  };
}

interface URIComponents {
  protocol?: string;
  url: string;
  actionId?: string;
}

export function encodeActionURI({ protocol, url, actionId }: URIComponents) {
  return `${protocol ? protocol + ':' : ''}${url}${
    actionId ? '#' + actionId : ''
  }`;
}
export function decodeActionId(encodedActionURI: string): URIComponents {
  const [protocol, ...rest] = encodedActionURI.split(':');
  const [url, actionId] = rest.join(':').split('#');

  return {
    protocol,
    url: url.startsWith('//') ? `${protocol}:${url}` : url,
    actionId: actionId || '',
  };
}

function hasAllKeys(obj, keys) {
  return keys.every((key) => key in obj);
}

export async function getMetadata(url: string): Promise<Partial<Resource>> {
  let metadata = {} as Partial<Resource>;

  url = new URL(url).href;
  // TODO: Allow importer of kernel to specify fetch function, i.e. use a proxy
  const html = await system.fetch(url);
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const manifestLink = dom.querySelector(
    'link[rel="manifest"]'
  ) as HTMLLinkElement;

  if (manifestLink) {
    const baseUrl = new URL(url).origin;
    const manifestUrl = new URL(manifestLink.getAttribute('href'), baseUrl)
      .href;
    const manifestText = await system.fetch(manifestUrl);
    if (manifestText) {
      const manifest = JSON.parse(manifestText);
      metadata = manifest;
      if (manifest.icons) {
        metadata.icons = manifest.icons.map((icon) => {
          icon.src = new URL(icon.src, manifestUrl).href;
          return icon;
        });
      }
    }
  }

  if (!metadata.name) {
    const metaAppName = dom.querySelector(
      'meta[name="application-name"]'
    ) as HTMLMetaElement;
    if (metaAppName) {
      metadata.name = metaAppName.content;
    } else {
      const title = dom.querySelector('title')?.innerText;
      metadata.name = title.split(' - ')[0].split(' | ')[0];
    }
  }

  if (!metadata.icons) {
    const faviconLink = dom.querySelector(
      'link[rel~="icon"]'
    ) as HTMLLinkElement;
    if (faviconLink)
      metadata.icons = [
        { src: new URL(faviconLink.getAttribute('href'), url).href },
      ];
  }

  if (!metadata.description) {
    metadata.description = dom
      .querySelector('meta[name="description"]')
      ?.getAttribute('content');
  }

  return metadata;
  // dom.querySelector('meta[name="description"]').getAttribute('content');
}

export function normalizeUrl(url, defaultProtocol: 'http' | 'https' = 'https') {
  try {
    const hasProtocol = /^[a-zA-Z]+:\/\//.test(url);
    return hasProtocol ? url : `${defaultProtocol}://${url}`;
  } catch (error) {
    return null;
  }
}
