import { jsonSchema, Schema } from 'ai';
import { ActionDefinition, ActionRecord } from './types.js';

export interface ActionChoiceObject {
  functions: Array<{ id: string; args: any }>;
}

export function actionChoiceSchema(
  actions: Record<string, ActionDefinition>
): Schema {
  return jsonSchema({
    type: 'object',
    properties: {
      functions: {
        type: 'array',
        items: {
          anyOf: Object.entries(actions).map(([actionId, action]) =>
            actionSchema(actionId, action)
          ),
        },
        additionalProperties: false,
      },
    },
    required: ['functions'],
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

  return schema;
}
