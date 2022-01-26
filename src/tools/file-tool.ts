import CryptoJS from 'crypto-js';

export function getTextHash(text :string):string {
  return CryptoJS.SHA256(text).toString();
  
}


