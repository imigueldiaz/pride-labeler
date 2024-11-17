declare module 'multiformats/cid' {
  export interface CID {
    toString(): string;
    toV1(): CID;
    equals(other: CID): boolean;
    readonly version: number;
    readonly code: number;
    readonly multihash: { digest: Uint8Array; code: number; size: number };
    readonly bytes: Uint8Array;
  }

  export function CID(version: number, code: number, multihash: { digest: Uint8Array; code: number; size: number }): CID;
}
