import type {
  CoreSystemMessage,
  CoreUserMessage,
  CoreAssistantMessage,
  CoreToolMessage,
} from 'ai';

import { Interpreter } from './interpreter';

// 🚚

export { Schema } from 'ai';

// MESSAGES

export type Message =
  | CoreSystemMessage
  | CoreUserMessage
  | CoreAssistantMessage
  | CoreToolMessage;

// INTERACTIONS

export interface Interaction {
  input: InteractionInput;
  outputs: InteractionOutput[];
}

export interface InteractionInput {
  text?: string;
  files?: FileInput[];
}

export interface FileInput {
  data: Uint8Array;
  filename?: string;
  mimeType?: string;
}

export type InteractionOutput = TextOutput | ActionOutput;

export interface ActionOutput {
  type: 'action';
  directive: ActionDirective;
  content: any;
}

export interface TextOutput {
  type: 'text';
  content: string;
}

// INTERPRETER

export type InterpreterResponse = TextResponse | ActionResponse;

export interface TextResponse {
  type: 'text';
  text: Promise<string>;
  textStream: AsyncIterable<string>;
}

export interface ActionResponse {
  type: 'action';
  directive: ActionDirective;
}

export interface Strategy {
  description: string;
  method: (
    interpreter: Interpreter,
    interactions: Interaction[]
  ) => AsyncGenerator<InterpreterResponse, any, Array<Interaction>>;
}

// PROTOCOLS

/**
 * Protocols determine how an `ActionDirective` is executed.
 * This goes hand in hand with `Resource`s.
 * Each protocol has a unique `scheme`.
 */
export interface Protocol {
  scheme: string;
  handler: ProtocolHandler;
}

export type ProtocolHandler = (
  directive: ActionDirective
) => Promise<any> | any;

export interface ActionDirective {
  protocol: string;
  resourceId?: string;
  actionId?: string;
  args?: Record<string, any>;
}

// RESOURCES

/**
 * A resource specifies how a `Protocol` could be consumed,
 * along with some additional (optional) metadata.
 */
export interface Resource {
  id?: string;
  protocol: string;
  name?: string;
  short_name?: string;
  icons?: ResourceIcon[];
  description?: string;
  actions?: Record<string, ActionDefinition>;
}

export interface ResourceIcon {
  src: string;
  purpose?: string;
  sizes?: string;
  type?: string;
}

/**
 * Describe an action as detailed as possible.
 * An action is something the assistant can do
 * based on interactions (inputs & previous outputs).
 */
export interface ActionDefinition {
  description?: string;
  params_schema?: JSONSchemaDefinition;
}

/**
 * Action dictionary, indexed by the action id.
 */
export type ActionRecord = { [id: string]: ActionDefinition };

// HELPERS

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
