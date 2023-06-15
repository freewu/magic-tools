const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const bs58 = require('base-x')(BASE58);

import { Uint8ArrayToString, stringToUint8Array } from "../../lib/string"

export const Base58Encode = (str :string) :string => {
  console.log(stringToUint8Array(str));
  return bs58.encode(stringToUint8Array(str));
}

export const Base58Decode = (str :string) :string => {
  return Uint8ArrayToString(bs58.decode(str));
} 