export const clamp = (n) => Math.max(0, Math.min(1, n));
export const VIDEOS = { sunshine: "4YTXB5qkGzI", chiikawa: "h0vBWdZf2l0" };
export const characterIds = [
  "chiikawa", "hachiware", "usagi", "rakko", "fugu",
  "eugene", "aeshin", "dongmae", "hina", "heeseong",
  "cap", "tophat", "rifle", "pistol", "bouquet", "watch", "glory",
];
const videoIds = Object.values(VIDEOS);
// Each region belongs to one video; only the playing video's regions can be selected.
export function activeRegions(regions, time, video) {
  return regions
    .filter((r) => r.video === video && time >= r.startTime - 1 / 60 && time <= r.endTime + 1 / 60)
    .map((r) => {
      const keys = [...(r.keyframes || [])].sort((a, b) => a.time - b.time);
      let box = r.boundingBox;
      if (keys.length) {
        let a = keys[0],
          b = keys.at(-1);
        for (const k of keys) {
          if (k.time <= time) a = k;
          if (k.time >= time) {
            b = k;
            break;
          }
        }
        const t =
          a.time === b.time ? 0 : clamp((time - a.time) / (b.time - a.time));
        box = Object.fromEntries(
          ["x", "y", "width", "height"].map((k) => [
            k,
            a.boundingBox[k] + (b.boundingBox[k] - a.boundingBox[k]) * t,
          ]),
        );
      }
      return { ...r, boundingBox: box };
    });
}
export function hit(regions, p) {
  const candidates = regions.filter((r) => {
    const b = r.boundingBox;
    return (
      p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height
    );
  });
  candidates.sort((a, b) => score(a.boundingBox, p) - score(b.boundingBox, p));
  return candidates[0]?.characterId || null;
}
function score(b, p) {
  return (
    ((p.x - b.x - b.width / 2) / b.width) ** 2 +
    ((p.y - b.y - b.height / 2) / b.height) ** 2
  );
}
export function validRegions(v) {
  return (
    Array.isArray(v) &&
    v.length <= 1000 &&
    v.every(
      (r) =>
        r && typeof r === "object" &&
        characterIds.includes(r.characterId) &&
        videoIds.includes(r.video) &&
        Number.isFinite(r.startTime) &&
        r.startTime >= 0 &&
        Number.isFinite(r.endTime) &&
        r.endTime > r.startTime &&
        validBox(r.boundingBox) &&
        (!r.keyframes ||
          (Array.isArray(r.keyframes) &&
            r.keyframes.length <= 500 &&
            r.keyframes.every(
              (k) =>
                k && typeof k === "object" &&
                Number.isFinite(k.time) &&
                k.time >= r.startTime &&
                k.time <= r.endTime &&
                validBox(k.boundingBox),
            ))),
    )
  );
}
function validBox(b) {
  return (
    b &&
    ["x", "y", "width", "height"].every(
      (k) => Number.isFinite(b[k]) && b[k] >= 0 && b[k] <= 1,
    ) &&
    b.width > 0 &&
    b.height > 0 &&
    b.x + b.width <= 1.00001 &&
    b.y + b.height <= 1.00001
  );
}
