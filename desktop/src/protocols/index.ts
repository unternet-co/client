import { builtinProtocol } from './buitin/protocol';
import { builtinResources } from './buitin/resources';
import { webProtocol } from './http/protocol';

export const protocols = [builtinProtocol, webProtocol];
export const resources = [...builtinResources];
