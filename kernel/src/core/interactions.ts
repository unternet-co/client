import { Message } from '../shared-types.js';

export class Interaction {
  input: InteractionInput;
  outputs: InteractionOutput[];

  static createWithInput(input: InteractionInput): Interaction {
    return {
      input,
      outputs: [],
    };
  }

  static createTextOutput(text: string): InteractionTextOutput {
    return {
      type: 'text',
      content: text,
    };
  }

  static toMessages(interactions: Interaction[]): Message[] {
    let messages: Message[] = [];

    for (let interaction of interactions) {
      messages.push({
        role: 'user',
        content: interaction.input.text,
      });

      if (!interaction.outputs) continue;

      for (let output of interaction.outputs) {
        if (output.type === 'text') {
          const textOutput = output as InteractionTextOutput;
          messages.push({
            role: 'assistant',
            content: textOutput.content,
          });
        }
      }
    }

    return messages;
  }
}

/* Input data structure */

export interface InteractionInput {
  text: string;
}

/* Output data structures */

export interface InteractionBaseOutput {
  type: string;
}

export interface InteractionTextOutput extends InteractionBaseOutput {
  type: 'text';
  content: string;
}

export interface InteractionProposalOutput extends InteractionBaseOutput {
  type: 'actionproposal';
}

export interface InteractionProcessOutput extends InteractionBaseOutput {
  type: 'process';
  processId: string | number;
}

export type InteractionOutput =
  | InteractionTextOutput
  | InteractionProposalOutput
  | InteractionProcessOutput;
