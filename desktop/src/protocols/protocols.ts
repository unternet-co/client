import { builtin } from './builtin/protocol';
import { webProtocol } from './web/web-process';

export const protocols = [builtin, webProtocol];
