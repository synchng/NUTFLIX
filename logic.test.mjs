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
test("reviewed timeline is valid and covers opening, body, title, and credits", () => {
  assert.ok(validRegions(timeline));
  for (const [time, id] of [
    [2, "rakko"],
    [9, "chiikawa"],
    [14, "chiikawa"],
    [18, "chiikawa"],
    [22, "rakko"],
    [26, "rakko"],
    [31, "usagi"],
    [33, "hachiware"],
    [37, "chiikawa"],
    [41, "hachiware"],
    [44, "chiikawa"],
    [46, "rakko"],
    [48, "chiikawa"],
    [51, "hachiware"],
    [56, "rakko"],
    [65, "chiikawa"],
    [72, "hachiware"],
    [82, "usagi"],
    [87, "usagi"],
  ])
    assert.ok(
      activeRegions(timeline, time).some((r) => r.characterId === id),
      `${id} at ${time}`,
    );
});
test("empty shots do not fabricate named characters", () => {
  for (const time of [4, 6, 54, 60.5, 79, 80, 84])
    assert.equal(activeRegions(timeline, time).length, 0, `empty shot ${time}`);
});
test("centers of all reviewed character regions resolve to the expected character", () => {
  for (const time of [
    2, 9, 14, 18, 19.5, 22, 26, 28, 31, 33, 37, 41, 44, 46, 48, 51, 56, 65, 72,
    82, 87,
  ])
    for (const region of activeRegions(timeline, time)) {
      const b = region.boundingBox;
      assert.equal(
        hit(activeRegions(timeline, time), {
          x: b.x + b.width / 2,
          y: b.y + b.height / 2,
        }),
        region.characterId,
        `${region.characterId} center at ${time}`,
      );
    }
});
test('malformed imported JSON is rejected instead of crashing',()=>{assert.equal(validRegions([null]),false);assert.equal(validRegions([{...region,keyframes:[null]}]),false);});
test("other titles keep their own regions", () => {
  assert.ok(activeRegions(timeline, 26, "ruX3rIj3--w").some((r) => r.characterId === "megumi"));
  assert.ok(!activeRegions(timeline, 26).some((r) => r.characterId === "megumi"));
  assert.ok(activeRegions(timeline, 58, "lWQQOd6L4UE").some((r) => r.characterId === "chiyo"));
  assert.ok(activeRegions(timeline, 20, "UNjHxhljAck").some((r) => r.characterId === "kurumi"));
  assert.equal(validRegions([{ ...region, video: "not a video id" }]), false);
});
test("added Chiikawa episodes resolve their own scenes", () => {
  assert.ok(activeRegions(timeline, 58, "slyms27PQJQ").some((r) => r.characterId === "hachiware"));
  assert.ok(activeRegions(timeline, 44, "5dTRQblIt-Q").some((r) => r.characterId === "chiikawa"));
  assert.ok(activeRegions(timeline, 95, "BVzxUqjbmzk").some((r) => r.characterId === "usagi"));
  assert.deepEqual(activeRegions(timeline, 10, "BVzxUqjbmzk").map((r) => r.characterId), ["momonga"]);
});
test("every title registers its supporting cast", () => {
  for (const [video, time, id] of [
    ["slyms27PQJQ", 21, "momonga"], ["slyms27PQJQ", 4, "roudou-yoroi"], ["slyms27PQJQ", 45, "pochette-yoroi"],
    ["5dTRQblIt-Q", 12, "kurimanju"], ["BVzxUqjbmzk", 8, "ode"], ["ruX3rIj3--w", 89, "higuruma"],
    ["lWQQOd6L4UE", 43, "nozaki"], ["UNjHxhljAck", 61, "meguree"],
  ])
    assert.ok(activeRegions(timeline, time, video).some((r) => r.characterId === id), `${id} at ${time}`);
});
