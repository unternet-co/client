import { localAppletProtocol } from './applet/local/protocol';
import { builtinProtocol } from './buitin/protocol';
import { webProtocol } from './http/protocol';

export const protocols = [localAppletProtocol, builtinProtocol, webProtocol];
