import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { io } from "socket.io-client";
let server, url, temp;
const clients = [];
const event = (s, name, predicate = () => true) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      s.off(name, handler);
      reject(Error(`Timeout: ${name}`));
    }, 5000);
    const handler = (v) => {
      if (!predicate(v)) return;
      clearTimeout(timer);
      s.off(name, handler);
      resolve(v);
    };
    s.on(name, handler);
  });
const ack = (s, name, arg) =>
  new Promise((resolve, reject) =>
    s
      .timeout(5000)
      .emit(name, arg, (error, value) =>
        error ? reject(error) : resolve(value),
      ),
  );
async function connect() {
  const s = io(url, { autoConnect: false });
  clients.push(s);
  const connected = event(s, "connect");
  s.connect();
  await connected;
  return s;
}
before(async () => {
  temp = await mkdtemp(join(tmpdir(), "pointing-test-"));
  await writeFile(
    join(temp, "regions.json"),
    await readFile(new URL("./data/regions.json", import.meta.url)),
  );
  server = spawn(process.execPath, ["server.mjs"], {
    cwd: new URL(".", import.meta.url),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: "0",
      REGION_FILE: join(temp, "regions.json"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(Error("Server startup timeout")),
      10000,
    );
    server.stdout.on("data", (chunk) => {
      const m = String(chunk).match(/Ready: (http:\/\/localhost:\d+)/);
      if (m) {
        clearTimeout(timeout);
        resolve(m[1]);
      }
    });
    server.once("exit", (code) => {
      clearTimeout(timeout);
      reject(Error("Server failed: " + code));
    });
  });
});
after(async () => {
  clients.forEach((s) => s.disconnect());
  server?.kill();
  if (temp) await rm(temp, { recursive: true, force: true });
});
test("real sessions synchronize reviewed scenes throughout the video", async () => {
  const host = await connect(),
    phone = await connect();
  const session = await ack(host, "create", null);
  assert.ok(
    (await ack(phone, "join", { id: session.id, token: session.remoteToken }))
      .ok,
  );
  const onChiikawa = event(phone, "state", (s) => s.video === "h0vBWdZf2l0");
  host.emit("video", "h0vBWdZf2l0");
  await onChiikawa;
  for (const [time, pointer, id] of [
    [5, { x: 0.6, y: 0.48 }, "chiikawa"],
    [20, { x: 0.3, y: 0.46 }, "rakko"],
    [30, { x: 0.27, y: 0.22 }, "usagi"],
    [40, { x: 0.48, y: 0.32 }, "hachiware"],
    [85, { x: 0.38, y: 0.5 }, "hachiware"],
    [140, { x: 0.5, y: 0.5 }, "rakko"],
    [170, { x: 0.56, y: 0.5 }, "chiikawa"],
    [255, { x: 0.3, y: 0.55 }, "fugu"],
    [275, { x: 0.23, y: 0.5 }, "usagi"],
    [305, { x: 0.88, y: 0.81 }, "chiikawa"],
  ]) {
    const timed = event(phone, "state", (s) => s.time === time);
    host.emit("time", time);
    await timed;
    const moved = event(
      host,
      "state",
      (s) => s.pointer.x === pointer.x && s.pointer.y === pointer.y,
    );
    phone.emit("pointer", pointer);
    await moved;
    const chosen = event(phone, "selected");
    phone.emit("select");
    assert.equal(await chosen, id, `${time}s`);
  }
  const replay = await ack(host, "create", session);
  assert.equal(replay.id, session.id);
});
test("selection outside targets has explicit fallback without false recognition", async () => {
  const host = await connect();
  await ack(host, "create", null);
  const onChiikawa = event(host, "state", (s) => s.video === "h0vBWdZf2l0");
  host.emit("video", "h0vBWdZf2l0");
  await onChiikawa;
  const timed = event(host, "state", (s) => s.time === 15);
  host.emit("time", 15);
  await timed;
  const miss = event(host, "selection-miss");
  host.emit("select");
  await miss;
  const chosen = event(host, "selected");
  host.emit("choose-character", "usagi");
  assert.equal(await chosen, "usagi");
});
test("the session follows the TV's title, and only the host can switch it", async () => {
  const host = await connect(), phone = await connect();
  const s = await ack(host, "create", null);
  await ack(phone, "join", { id: s.id, token: s.remoteToken });
  const timed = event(phone, "state", (st) => st.time === 15);
  host.emit("time", 15);
  await timed;
  // Mr. Sunshine is the default title: the centre of the 0:15 shot is Eugene Choi.
  let chosen = event(phone, "selected");
  phone.emit("select");
  assert.equal(await chosen, "eugene");
  phone.emit("video", "h0vBWdZf2l0"); // ignored: phones cannot change the title
  const switched = event(phone, "state", (st) => st.video === "h0vBWdZf2l0");
  host.emit("video", "h0vBWdZf2l0");
  await switched;
  const miss = event(phone, "selection-miss");
  phone.emit("select");
  await miss;
});
test("session tokens and annotation validation reject unauthorized changes", async () => {
  const host = await connect(),
    other = await connect();
  const session = await ack(host, "create", null);
  assert.ok(
    (await ack(other, "join", { id: session.id, token: "invalid" })).error,
  );
  assert.equal(
    (
      await fetch(url + "/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "[]",
      })
    ).status,
    403,
  );
  const headers = {
    "Content-Type": "application/json",
    "X-Session-Id": session.id,
    "X-Session-Token": session.hostToken,
  };
  assert.equal(
    (
      await fetch(url + "/api/regions", {
        method: "POST",
        headers,
        body: '[{"characterId":"unknown"}]',
      })
    ).status,
    400,
  );
  const original = await (await fetch(url + "/api/regions")).json();
  assert.equal(
    (
      await fetch(url + "/api/regions", {
        method: "POST",
        headers,
        body: JSON.stringify(original),
      })
    ).status,
    200,
  );
  assert.equal(
    JSON.parse(await readFile(join(temp, "regions.json"), "utf8")).length,
    original.length,
  );
});

test("remote viewport input reaches only its host and requires a joined session", async () => {
  const host = await connect(), phone = await connect(), outsider = await connect();
  const session = await ack(host, 'create', null);
  await ack(phone, 'join', { id: session.id, token: session.remoteToken });
  const received = [];
  const listener = p => received.push(p);
  host.on('ui-move', listener);
  outsider.emit('ui-move', { dx: .9, dy: .9 });
  phone.emit('ui-move', { dx: 'bad', dy: .2 });
  const moved = event(host, 'ui-move');
  phone.emit('ui-move', { dx: .1, dy: -.2 });
  assert.deepEqual(await moved, { dx: .1, dy: -.2 });
  const tapped = event(host, 'ui-tap'); phone.emit('ui-tap'); await tapped;
  const scrolled = event(host, 'ui-scroll'); phone.emit('ui-scroll', { dy: 20 });
  assert.deepEqual(await scrolled, { dy: 1 });
  const centered = event(host, 'ui-center'); phone.emit('ui-center'); await centered;
  assert.deepEqual(received, [{ dx: .1, dy: -.2 }]);
  host.off('ui-move', listener);
});

test('selection destination distinguishes phone, remote cursor and desktop mouse', async () => {
  const host = await connect(), phone = await connect();
  const s = await ack(host, 'create', null);
  await ack(phone, 'join', { id: s.id, token: s.remoteToken });
  const selected = () => new Promise(resolve => phone.once('selected', (id, meta) => resolve({id, ...meta})));
  let result = selected(); phone.emit('choose-character', 'usagi');
  assert.deepEqual(await result, {id:'usagi',target:'remote'});
  result = selected(); host.emit('choose-character', 'rakko', {target:'remote'});
  assert.deepEqual(await result, {id:'rakko',target:'remote'});
  result = selected(); host.emit('choose-character', 'chiikawa');
  assert.deepEqual(await result, {id:'chiikawa',target:'host'});
  const library = event(phone, 'open-library'); host.emit('open-library'); await library;
});
