export type Box = { x: number; y: number; width: number; height: number };
export type Region = {
  characterId: string;
  startTime: number;
  endTime: number;
  boundingBox: Box;
  keyframes?: { time: number; boundingBox: Box }[];
};
export const VIDEO: string;
export const characterIds: string[];
export function clamp(n: number): number;
export function activeRegions(r: Region[], t: number): Region[];
export function hit(r: Region[], p: { x: number; y: number }): string | null;
export function validRegions(v: unknown): boolean;
