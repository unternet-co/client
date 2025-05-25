import { ActionDict, ResourceIcon } from '@unternet/kernel';
import { Readability } from '@mozilla/readability';

export function uriWithScheme(
  url: string,
  defaultProtocol: 'http' | 'https' = 'https'
) {
  const trimmedUrl = url.trim();
  if (trimmedUrl.includes('localhost') && !defaultProtocol)
    uriWithScheme(trimmedUrl, 'http');

  try {
    const hasProtocol = /^[a-zA-Z]+:\/\//.test(trimmedUrl);
    return hasProtocol ? trimmedUrl : `${defaultProtocol}://${trimmedUrl}`;
  } catch (error) {
    return null;
  }
}

export function isValidURL(input: string): boolean {
  const trimmedInput = input.trim();

  // Quick rejection for obviously non-URL inputs
  if (trimmedInput.length < 3) return false;

  try {
    // Try parsing as-is first (for full URLs)
    let url: URL;
    try {
      url = new URL(trimmedInput);
    } catch {
      // If that fails, try with https:// prefix
      url = new URL(`https://${trimmedInput}`);
    }

    const hostname = url.hostname;

    // Allow localhost and IP addresses
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    // For domain names, use a simple but effective check:
    // Must have at least one dot and a reasonable TLD
    const parts = hostname.split('.');
    return (
      parts.length >= 2 &&
      parts.every((part) => part.length > 0) &&
      parts[parts.length - 1].length >= 2
    ); // TLD must be at least 2 chars
  } catch {
    return false;
  }
}

interface WebsiteMetadata {
  title: string;
  name: string;
  short_name: string;
  description: string;
  icons: ResourceIcon[];
  actions: ActionDict;
  textContent?: string;
}

export async function getMetadata(url: string): Promise<WebsiteMetadata> {
  let metadata = {} as WebsiteMetadata;

  url = new URL(url).href;

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

  if (!metadata.title) {
    metadata.title = metadata.name;
  }

  const r = new Readability(dom);
  const content = r.parse();
  metadata.textContent = content.textContent;

  return metadata;
  // dom.querySelector('meta[name="description"]').getAttribute('content');
}
