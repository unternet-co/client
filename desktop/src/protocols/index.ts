import { builtinProtocol } from './buitin/protocol';
import { webProtocol } from './http/protocol';
import { fileProtocol } from './file/protocol';

export const protocols = [builtinProtocol, webProtocol, fileProtocol];
