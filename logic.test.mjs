import { test } from "node:test";
import assert from "node:assert/strict";
import { activeRegions, hit, validRegions } from "./src/logic.js";
const region = {
  characterId: "usagi",
  startTime: 1,
  endTime: 5,
  boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
  keyframes: [
    { time: 1, boundingBox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 } },
    { time: 5, boundingBox: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 } },
  ],
};
test("time-gated regions and interpolated coordinates", () => {
  assert.equal(activeRegions([region], 0).length, 0);
  assert.equal(activeRegions([region], 6).length, 0);
  assert.ok(Math.abs(activeRegions([region], 3)[0].boundingBox.x - 0.3) < 1e-8);
});
test("mouse and remote share normalized hit testing", () => {
  assert.equal(hit(activeRegions([region], 3), { x: 0.4, y: 0.2 }), "usagi");
  assert.equal(hit(activeRegions([region], 3), { x: 0.9, y: 0.9 }), null);
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
    assert.ok(activeRegions(timeline, time).some((r) => r.characterId === id), `${id} at ${time}`);
});
test("empty shots do not fabricate named characters", () => {
  for (const time of [15, 65, 115, 125, 180, 225, 245, 285, 310])
    assert.equal(activeRegions(timeline, time).length, 0, `empty shot ${time}`);
});
test("centers of all reviewed character regions resolve to the expected character", () => {
  for (const time of new Set(timeline.map((r) => (r.startTime + r.endTime) / 2)))
    for (const region of activeRegions(timeline, time)) {
      const b = region.boundingBox;
      assert.equal(
        hit(activeRegions(timeline, time), { x: b.x + b.width / 2, y: b.y + b.height / 2 }),
        region.characterId,
        `${region.characterId} center at ${time}`,
      );
    }
});
test("every character of the video can be selected somewhere", () => {
  for (const id of ["chiikawa", "hachiware", "usagi", "rakko", "fugu"])
    assert.ok(timeline.some((r) => r.characterId === id), id);
  assert.equal(validRegions([{ ...region, characterId: "megumi" }]), false);
});
test('malformed imported JSON is rejected instead of crashing',()=>{assert.equal(validRegions([null]),false);assert.equal(validRegions([{...region,keyframes:[null]}]),false);});
