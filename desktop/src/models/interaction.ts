import { Interaction as KernelInteraction } from '@unternet/kernel';
import { DatabaseService } from '../services/database-service';

export interface Interaction extends KernelInteraction {
  id: string;
}

const interactionDatabase = new DatabaseService<string, Interaction>(
  'interactions'
);
