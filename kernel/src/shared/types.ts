import type {
  CoreSystemMessage,
  CoreUserMessage,
  CoreAssistantMessage,
  CoreToolMessage,
} from 'ai';

export { Schema } from 'ai';

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
