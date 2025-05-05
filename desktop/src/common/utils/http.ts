import { ActionDict, Resource, ResourceIcon } from '@unternet/kernel';

export function uriWithScheme(
  url: string,
  defaultProtocol: 'http' | 'https' = 'https'
) {
  if (url.includes('localhost') && !defaultProtocol) uriWithScheme(url, 'http');

  try {
    const hasProtocol = /^[a-zA-Z]+:\/\//.test(url);
    return hasProtocol ? url : `${defaultProtocol}://${url}`;
  } catch (error) {
    return null;
  }
}

interface WebsiteMetadata {
  title: string;
  name: string;
  short_name: string;
  description: string;
  icons: ResourceIcon[];
  actions: ActionDict;
}

export async function getMetadata(url: string): Promise<WebsiteMetadata> {
  let metadata = {} as WebsiteMetadata;

  url = new URL(url).href;
  // TODO: Allow importer of kernel to specify fetch function, i.e. use a proxy
  const html = await system.fetch(url);
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');
  const manifestLink = dom.querySelector(
    'link[rel="manifest"]'
  ) as HTMLLinkElement;

  metadata.title = dom.querySelector('title')?.innerText;

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
          icon.src = new URL(`../${icon.src}`, manifestUrl).href;
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

  if (!metadata.actions) {
    metadata.actions = {};
  }

  return metadata;
  // dom.querySelector('meta[name="description"]').getAttribute('content');
}
