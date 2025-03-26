import { type LanguageModel } from 'ai';
import {
  Interpreter,
  Interaction,
  Dispatcher,
  Resource,
  InteractionInput,
  ResourceMap,
  createInteraction,
} from '../../src/index';

interface KernelInit {
  model: LanguageModel;
  resources?: Resource[];
}

export class Kernel {
  interpreter: Interpreter;
  dispatcher: Dispatcher;
  interactions: Interaction[] = [];
  resources = new ResourceMap();

  constructor({ model, resources }: KernelInit) {
    this.interpreter = new Interpreter(model);
    this.dispatcher = new Dispatcher();
    if (resources) {
      for (const resource of resources) this.resources.add(resource);
    }
  }

  addInteraction(interaction: Interaction) {
    this.interactions.push(interaction);
    return this.interactions.length - 1;
  }

  async handleInput(input: InteractionInput) {
    const interaction = createInteraction(input);
    const interactionId = this.addInteraction(interaction);

    // Get output from the interpreter
    const output = await this.interpreter.generateOutput(this.interactions);

    // // Add the output to the interaction
    // this.interactions[interactionIndex].outputs.push(output);

    // if (output.complete) return;
    // if (output.type === 'action') {
    // // Do something with the action, add the action's output, then continue
    // }
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
