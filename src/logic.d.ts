export type Box = { x: number; y: number; width: number; height: number };
export type Region = {
  characterId: string;
  startTime: number;
  endTime: number;
  boundingBox: Box;
  keyframes?: { time: number; boundingBox: Box }[];
  video?: string;
};
export const CHIIKAWA: string;
export const characterIds: string[];
export function validVideo(v: unknown): boolean;
export function clamp(n: number): number;
export function activeRegions(r: Region[], t: number, video?: string): Region[];
export function hit(r: Region[], p: { x: number; y: number }): string | null;
export function validRegions(v: unknown): boolean;
