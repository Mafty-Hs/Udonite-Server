export interface ImageContext {
  identifier: string ;
  type: string;
  url: string;
  thumbnail: ThumbnailContext;
  filesize: number;
  owner: string[];
  isHide: boolean;
  tag?: string[];
}

export interface ImageUpdateContext {
  context: ImageContext;
  isUpsert: boolean; 
}

export interface ThumbnailContext {
  type: string;
  url: string;
}
