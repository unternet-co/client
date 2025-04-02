import type {
  CoreSystemMessage,
  CoreUserMessage,
  CoreAssistantMessage,
  CoreToolMessage,
  LanguageModel,
} from 'ai';

export type Message =
  | CoreSystemMessage
  | CoreUserMessage
  | CoreAssistantMessage
  | CoreToolMessage;

export interface Interaction {
  input: InteractionInput;
  outputs?: InteractionOutput[];
}

export interface InteractionInput {
  text: string;
}

export interface TextOutput {
  type: 'text';
  content: string;
}

export type InteractionOutput = TextOutput;

export type InterpreterResponse = TextResponse | ActionResponse;

export interface TextResponse {
  type: 'text';
  text: Promise<string>;
  textStream: AsyncIterable<string>;
}

export interface ActionResponse {
  type: 'action';
  uri: string;
  actionId: string;
  args?: Record<string, any>;
}

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

export interface StrategyCallbackOptions {
  interactions: Array<Interaction>;
  actions: Record<string, ActionDefinition>;
  model: LanguageModel;
}

export interface Strategy {
  name: string;
  description: string;
  callback: (
    options: StrategyCallbackOptions
  ) => Promise<InterpreterResponse> | InterpreterResponse;
}

export type StrategyRecord = Record<string, Strategy>;

export type ActionRecord = { [uri: string]: ActionDefinition };

export interface Resource {
  uri: string;
  protocol: string;
  name?: string;
  short_name?: string;
  icons?: ResourceIcon[];
  description?: string;
  actions?: Record<string, ActionDefinition>;
}

export interface Protocol {
  scheme: string;
}

export type ProtocolRecord = { [scheme: string]: Protocol };

export type StringEnum = [string, ...string[]];

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
