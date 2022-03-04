import { Udonarium } from "core/udonarium/udonarium";

export interface RoomPeersContext {
  [roomId: string]: string[]
}

export interface RoomInstance {
  [roomId: string]: Udonarium
}

export class RoomContext {
  roomNo: number = 0;
  roomName: string = '';
  password: string = '';
  isOpen: boolean = true;
  is2d: boolean = false;
}

export interface RoomDataContext {
  roomNo: number;
  roomId: string;
  roomName: string;
  lastAccess: number;
  dbId: string ;
  imageId: string;
  audioId: string;
  password: string;
  isOpen: boolean;
  is2d: boolean;
}

export class RoomListContext {
  roomNo: number = 0;
  roomName: string = '';
  roomId: string = ''
  password: string = '';
  lastAccess: number = 0;
  isOpen: boolean = false;
  is2d: boolean = false;
  players: number = 0;
}

export interface PeerContext {
  [peerId: string]: PeerCursor
}

export interface PeerCursor {
  peerId :string;
  playerIdentifier :string;
} 

export class RoomControl {
  identifier = "RoomAdmin";
  adminPlayer:string[] = [];
  disableRoomLoad:boolean = false;
  disableObjectLoad:boolean = false;
  disableTabletopLoad:boolean = false;
  disableImageLoad:boolean = false;
  disableAudioLoad:boolean = false;
  disableTableSetting:boolean = false;
  disableTabSetting:boolean = false;
  disableAllDataSave:boolean = false;
  disableSeparateDataSave:boolean = false;
  gameType:string = "";
  templateCharacter:string = "";
  chatTab:string = "";
  diceLog:boolean = false;
  cardLog:boolean = false;
}

export class Round {
  identifier = "Round";
  count:number = 0;
  tabIdentifier:string = "";
  isInitiative:boolean = false;;
  currentInitiative:number = -1;
  roundState:number = 0;
  initName:string = "";
}
