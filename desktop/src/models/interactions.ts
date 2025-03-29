import { Interaction as KernelInteraction } from "@unternet/kernel";

export interface Interaction extends KernelInteraction {
  id: string;
  workspaceId: string;
}

export {
  type InteractionInput,
  type InteractionOutput,
} from "@unternet/kernel";
