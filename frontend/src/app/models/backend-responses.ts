import { Winner } from './winner';

export class GenericResponse {
  success: boolean;
  message: string;
}

export class CheckStatusResponse {
  gameStatus: string;
  registered: boolean;
  winner: boolean;
  lobbyId: string;
  lobbyPassword: string;
  subMult: number;
  entryCount: number;
  winners: Winner[];
  confirmed: boolean;
}

export class RollResponse extends GenericResponse {
  winners: Winner[];
}

export class ForbiddenKnowledgeResponse extends GenericResponse {
  lobbyId: string;
  lobbyPassword: string;
}
