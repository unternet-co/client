import type {
  CoreSystemMessage,
  CoreUserMessage,
  CoreAssistantMessage,
  CoreToolMessage,
} from 'ai';
import { Interpreter } from './interpreter';

export { Schema } from 'ai';

/* Messages */

export type Message =
  | CoreSystemMessage
  | CoreUserMessage
  | CoreAssistantMessage
  | CoreToolMessage;

export interface Interaction {
  input: InteractionInput;
  outputs: InteractionOutput[];
}

/* Interactions */

export interface InteractionInput {
  text?: string;
  files?: FileInput[];
}

export interface FileInput {
  data: Uint8Array;
  filename?: string;
  mimeType?: string;
}

export interface TextOutput {
  type: 'text';
  content: string;
}

export interface ActionOutput {
  type: 'action';
  directive: ActionDirective;
  content: any;
}

export type InteractionOutput = TextOutput | ActionOutput;

/* Interpreter */

export interface TextResponse {
  type: 'text';
  text: Promise<string>;
  textStream: AsyncIterable<string>;
}

export interface ActionResponse {
  type: 'action';
  directive: ActionDirective;
}

export type InterpreterResponse = TextResponse | ActionResponse;

export interface Strategy {
  description: string;
  method: (
    interpreter: Interpreter,
    interactions: Interaction[]
  ) => AsyncGenerator<InterpreterResponse, any, Array<Interaction>>;
}

/* Resources */

export interface ResourceIcon {
  src: string;
  purpose?: string;
  sizes?: string;
  type?: string;
}

export interface ActionDefinition {
  description?: string;
  params_schema?: JSONSchemaDefinition;
}

export type ActionRecord = { [id: string]: ActionDefinition };

export interface Resource {
  id?: string;
  protocol: string;
  name?: string;
  short_name?: string;
  icons?: ResourceIcon[];
  description?: string;
  actions?: Record<string, ActionDefinition>;
}

/* Protocols */

export type ProtocolHandler = (
  directive: ActionDirective
) => Promise<any> | any;

export interface Protocol {
  scheme: string;
  handler: ProtocolHandler;
}

export interface ActionDirective {
  protocol: string;
  resourceId?: string;
  actionId?: string;
  args?: Record<string, any>;
}

/* Helpers */

export interface JSONSchemaDefinition {
  type:
    | 'object'
    | 'string'
    | 'number'
    | 'integer'
    | 'array'
    | 'boolean'
    | 'null';
  description?: string;
  properties?: {
    [key: string]: JSONSchemaDefinition;
  };
  required?: string[];
  additionalProperties?: boolean;
}

export type StringEnum = [string, ...string[]];

export interface UriComponents {
  protocol: string;
  resourceId?: string;
  actionId?: string;
}
