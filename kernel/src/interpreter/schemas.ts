import { jsonSchema, Schema } from 'ai';
import { ActionDefinition, ProcessDisplayMode } from '../runtime/actions';
import { Strategy } from './strategies';
import { ProcessDisplayModes } from '../runtime/actions';

export interface ActionChoiceObject {
  tools: Array<{ id: string; args?: any; display: ProcessDisplayMode }>;
}

export function actionChoiceSchema(
  actions: Record<string, ActionDefinition>
): Schema<ActionChoiceObject> {
  return jsonSchema<ActionChoiceObject>({
    type: 'object',
    properties: {
      tools: {
        type: 'array',
        items: {
          anyOf: Object.entries(actions).map(([actionId, action]) =>
            actionSchema(actionId, action)
          ),
        },
        additionalProperties: false,
      },
    },
    required: ['tools'],
    additionalProperties: false,
  });
}

function actionSchema(actionId: string, action: ActionDefinition) {
  const schema: any = {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        enum: [actionId],
      },
    },
    additionalProperties: false,
    required: ['id'],
  };

  if (action.params_schema) {
    schema.properties.args = action.params_schema;

    // Set some variables that OpenAI requires if they're not present
    if (!schema.properties.args.required) {
      schema.properties.args.required = Object.keys(
        schema.properties.args.properties
      );
    }
    schema.properties.args.additionalProperties = false;
    schema.required.push('args');
  }

  if (!action.display || action.display === 'auto') {
    (schema.properties['display'] = {
      type: 'string',
      enum: ProcessDisplayModes.filter((x) => x !== 'auto'),
    }),
      schema.required.push('display');
  }

  return schema;
}

function strategies(strategies: Record<string, Strategy>) {
  return jsonSchema<{ strategy: string }>({
    type: 'object',
    properties: {
      strategy: {
        type: 'string',
        enum: [...Object.keys(strategies)],
      },
    },
    additionalProperties: false,
    required: ['strategy'],
  });
}

export const schemas = {
  strategies,
};
