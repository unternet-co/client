interface UriComponents {
  protocol?: string;
  resourceUri: string;
  actionId?: string;
}

export function encodeActionUri({
  protocol,
  resourceUri,
  actionId,
}: UriComponents) {
  let uriString = '';
  if (protocol) uriString += `${protocol}:`;
  uriString += resourceUri;
  if (actionId) uriString += `#${actionId}`;
  return uriString;
}

export function decodeActionUri(encodedActionURI: string): UriComponents {
  let [protocol, ...rest] = encodedActionURI.split(':');
  let [resourceUri, actionId] = rest.join(':').split('#');

  // This is a URL protocol, not a resource protocol, so it's part of the
  // resource URI
  if (resourceUri.startsWith('//')) {
    resourceUri = `${protocol}:${resourceUri}`;
    protocol = undefined;
  }

  return {
    protocol,
    resourceUri,
    actionId: actionId,
  };
}
