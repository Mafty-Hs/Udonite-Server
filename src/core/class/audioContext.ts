export interface AudioContext {
  identifier: string;
  name: string;
  type: string;
  url: string;
  filesize: number;
  owner: string;
  volume: number;
  isHidden: boolean;
  tag?: string;
}

export interface AudioUpdateContext {
  context: AudioContext;
  isUpsert: boolean; 
}