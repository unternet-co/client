import { type LanguageModel } from 'ai';
import { Interpreter, Resource, InteractionInput } from '../../src/index';

interface KernelInit {
  model: LanguageModel;
  resources?: Array<Resource>;
}

export class Kernel {
  interpreter: Interpreter;

  constructor({ model, resources }: KernelInit) {
    this.interpreter = new Interpreter({ model, resources });
  }

  async handleInput(input: InteractionInput) {
    const interaction = { input };

    // Get output from the interpreter
    const output = await this.interpreter.generateOutput([interaction]);

    console.log(output);
  }
}

/*

const proposal = await this.interpreter.createProposal(
  this.interactions,
  this.resources
);

if (proposal.type === 'text') {
  // Could also have await proposal.text() if you just want it all
  for async (const part of proposal.textStream) {
    const outputIndex = this.addInteractionOutput({ type: 'text', content: '' })
    this.updateInteractionOutput(interactionId, outputIndex, { text: part });
  }
}

if (proposal.type === 'action') {
  const processId = this.processManager.dispatch(proposal.action);
  // has running | complete = true | false, or status == 'complete' | 'running'
  // which decides how it shows in the UI
  // also .dispose(), should probably implement some class/interface
  this.addInteractionOutput(interactionId, { type: 'process', processId });
  // Might actually want to add both the action call and the output here, not just process output
  // Also need to differentiate between running process (data/home not in interactions?)
  // vs not running (output in interactions?)
  }

if (proposal.type  === 'complete' || steps > MAX_STEPS) return;

this.generateOutput();

====

If the output is on the stage, then the data should just be there in a separate context area.
If not, the data should be inline.
This should be orchestrated at the kernel level somehow, not inside the Interaction object etc.
Could live in the interactions object, and you supply an additional context var to the interpreter call
Maybe process management has to be a bit different. It shouldn't care where something is. You just poitn to it either in the thread or outside.


*/
