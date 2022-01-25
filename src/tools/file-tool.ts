
import fs from 'fs';
import CryptoJS from 'crypto-js';

export async function getHash(file :File):Promise<string> {
  if (!file) return "";
  let blob :Blob = file;
  let b = await blob.arrayBuffer();
  let reader = new FileReader()
  reader.readAsArrayBuffer(file)
  let arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      throw "error on file read";
    };

    reader.onload = () => {
      console.log('onload');
      resolve(<ArrayBuffer>reader.result);
    };
   });
  let wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
  return CryptoJS.SHA256(wordArray).toString();
  
}


