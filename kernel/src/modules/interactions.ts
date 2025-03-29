import { Message } from "../shared-types.js";

export interface Interaction {
  input: InteractionInput;
  outputs: InteractionOutput[];
}

export interface InteractionInput {
  text: string;
}

export interface TextOutput {
  type: "text";
  content: string;
}

export type InteractionOutput = TextOutput;

export function interactionsToMessages(interactions: Interaction[]): Message[] {
  let messages: Message[] = [];

  for (let interaction of interactions) {
    messages.push({
      role: "user",
      content: interaction.input.text,
    });

    if (!interaction.outputs) continue;

    for (let output of interaction.outputs) {
      if (output.type === "text") {
        const textOutput = output as InteractionOutput;
        messages.push({
          role: "assistant",
          content: textOutput.content,
        });
      }
    }
  }

  return messages;
}

export function createInteraction(input: InteractionInput): Interaction {
  return {
    input,
    outputs: [],
  };
}

export function createTextOutput(text: string): InteractionOutput {
  return {
    type: "text",
    content: text,
  };
}
