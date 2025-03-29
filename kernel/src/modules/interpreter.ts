import { LanguageModel, streamText } from "ai";
import { Interaction, interactionsToMessages } from "./interactions.js";

type InterpreterResult = TextResult;

interface TextResult {
  type: "text";
  text: Promise<string>;
  textStream: AsyncIterable<string>;
}

export class Interpreter {
  model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  async generateOutput(
    interactions: Array<Interaction>,
  ): Promise<InterpreterResult> {
    const output = streamText({
      model: this.model,
      messages: interactionsToMessages(interactions),
    });

    return createTextResult({
      text: output.text,
      textStream: output.textStream,
    });
  }
}

function createTextResult(init: Omit<TextResult, "type">): TextResult {
  return {
    type: "text",
    ...init,
  };
}
