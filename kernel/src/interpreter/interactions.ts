import { ActionDirective } from '../actions/actions';

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

export interface TextOutput {
  type: 'text';
  content: string;
}

export interface ActionOutput {
  type: 'action';
  directive: ActionDirective;
  content: any;
}

// What happens if an action creates a process that's on a different URI?
// E.g. a "web:->open" action opens a webpage
// Do we care? The model just wants to see an action and its output
// And the URL will be clear from the open action's params

// Processes can be reserved for a different area, as they're running
// and need to be treated differently in the prompt

// So not the below:

// export interface ProcessOutput {
//   type: 'process';
//   pid: string;
//   uri: string;
//   content: any;
// }

export function createInteraction(
  input: InteractionInput | string
): Interaction {
  if (typeof input === 'string') {
    const text = input;
    input = { text };
  }

  return {
    input,
    outputs: [],
  };
}
