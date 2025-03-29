import { Interpreter, InteractionInput, LanguageModel } from "@unternet/kernel";
import { Workspace, WorkspaceModel } from "./models/workspaces";

export interface KernelInit {
  model: LanguageModel;
  workspaceModel: WorkspaceModel;
}

export class Kernel {
  interpreter: Interpreter;
  workspaceModel: WorkspaceModel;

  constructor({ model, workspaceModel }: KernelInit) {
    this.interpreter = new Interpreter(model);
    this.workspaceModel = workspaceModel;
  }

  async handleInput(workspaceId: Workspace["id"], input: InteractionInput) {
    this.workspaceModel.updateModified(workspaceId);

    const interaction = this.workspaceModel.createInteraction(
      workspaceId,
      input,
    );

    const recentInteractions = this.workspaceModel.allInteractions(workspaceId);
    const output = await this.interpreter.generateOutput(recentInteractions);

    if (output.type === "text") {
      const outputIndex = this.workspaceModel.addOutput(interaction.id, {
        type: output.type,
        content: "",
      });
      let text = "";
      for await (const chunk of output.textStream) {
        text += chunk;
        this.workspaceModel.updateOutput(interaction.id, outputIndex, {
          content: text,
        });
      }
    }
  }
}
