import { test } from "node:test";
import assert from "node:assert/strict";
import { activeRegions, hit, validRegions, VIDEOS, characterIds } from "./src/logic.js";
const C = VIDEOS.chiikawa, S = VIDEOS.sunshine;
const region = {
  characterId: "usagi",
  video: C,
  startTime: 1,
  endTime: 5,
  boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
  keyframes: [
    { time: 1, boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 } },
    { time: 5, boundingBox: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 } },
  ],
};
test("time-gated regions and interpolated coordinates", () => {
  assert.equal(activeRegions([region], 0, C).length, 0);
  assert.equal(activeRegions([region], 6, C).length, 0);
  assert.ok(Math.abs(activeRegions([region], 3, C)[0].boundingBox.x - 0.3) < 1e-8);
});
test("mouse and remote share normalized hit testing", () => {
  assert.equal(hit(activeRegions([region], 3, C), { x: 0.4, y: 0.2 }), "usagi");
  assert.equal(hit(activeRegions([region], 3, C), { x: 0.9, y: 0.9 }), null);
});
test("reject invalid annotations and out-of-frame bounds", () => {
  assert.ok(validRegions([region]));
  assert.equal(validRegions([{ ...region, endTime: 0 }]), false);
  assert.equal(
    validRegions([
      { ...region, boundingBox: { x: 0.9, y: 0, width: 0.2, height: 0.2 } },
    ]),
    false,
  );
  assert.equal(
    validRegions([
      { ...region, keyframes: [{ time: 9, boundingBox: region.boundingBox }] },
    ]),
    false,
  );
});
import { readFileSync } from "node:fs";
const timeline = JSON.parse(
  readFileSync(new URL("./data/regions.json", import.meta.url), "utf8"),
);
test("timeline is valid and covers all five episodes and the credits", () => {
  assert.ok(validRegions(timeline));
  for (const [time, id] of [
    [5, "chiikawa"], [20, "rakko"], [30, "usagi"], [45, "chiikawa"], [85, "hachiware"],
    [140, "rakko"], [170, "chiikawa"], [220, "rakko"], [255, "fugu"], [275, "usagi"],
    [305, "chiikawa"], [330, "hachiware"],
  ])
    assert.ok(activeRegions(timeline, time, C).some((r) => r.characterId === id), `${id} at ${time}`);
});
test("empty shots do not fabricate named characters", () => {
  for (const time of [15, 65, 115, 125, 180, 225, 245, 285, 310])
    assert.equal(activeRegions(timeline, time, C).length, 0, `empty shot ${time}`);
});
test("centers of all reviewed character regions resolve to the expected character", () => {
  for (const { video, startTime, endTime } of timeline) {
    const time = (startTime + endTime) / 2;
    for (const region of activeRegions(timeline, time, video)) {
      const b = region.boundingBox;
      assert.equal(
        hit(activeRegions(timeline, time, video), { x: b.x + b.width / 2, y: b.y + b.height / 2 }),
        region.characterId,
        `${region.characterId} center at ${time}`,
      );
    }
  }
});
test("Mr. Sunshine: named opening shots, props and the hotel are where they were reviewed", () => {
  for (const [time, id] of [
    [15, "eugene"], [15, "cap"], [19, "aeshin"], [21.5, "dongmae"], [25, "hina"], [30, "heeseong"], [30, "tophat"],
    [40, "pistol"], [174, "rifle"], [342.5, "rifle"], [388.5, "glory"], [570, "bouquet"], [600, "pistol"], [630, "watch"],
  ])
    assert.ok(activeRegions(timeline, time, S).some((r) => r.characterId === id), `${id} at ${time}`);
  // People are only marked where the actor's name is on screen; later shots stay unmarked.
  for (const time of [100, 270, 315, 460, 680])
    assert.equal(activeRegions(timeline, time, S).length, 0, `empty shot ${time}`);
});
test("regions only answer for their own video", () => {
  assert.ok(activeRegions(timeline, 5, C).length > 0);
  assert.equal(activeRegions(timeline, 5, S).length, 0);
  assert.equal(validRegions([{ ...region, video: "not-a-video" }]), false);
});
test("every item can be selected somewhere", () => {
  for (const id of characterIds)
    assert.ok(timeline.some((r) => r.characterId === id), id);
  assert.equal(validRegions([{ ...region, characterId: "megumi" }]), false);
});
test('malformed imported JSON is rejected instead of crashing',()=>{assert.equal(validRegions([null]),false);assert.equal(validRegions([{...region,keyframes:[null]}]),false);});
