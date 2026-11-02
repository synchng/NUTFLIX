import express from "express";
import { createServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { activeRegions, hit, validRegions, clamp, characterIds } from "./src/logic.js";
const prod = process.env.NODE_ENV === "production" || process.argv.includes("--prod");
const dist = fileURLToPath(new URL("./dist/", import.meta.url));
const app = express();
app.use(express.json({ limit: "2mb" }));
const secure = !!(process.env.TLS_KEY && process.env.TLS_CERT);
const server = secure
  ? createHttpsServer(
      {
        key: readFileSync(process.env.TLS_KEY),
        cert: readFileSync(process.env.TLS_CERT),
      },
      app,
    )
  : createServer(app);
const io = new Server(server);
const sessions = new Map();
const regionPath =
  process.env.REGION_FILE || new URL("./data/regions.json", import.meta.url);
let regions = JSON.parse(await readFile(regionPath, "utf8"));
if (!validRegions(regions)) throw Error("Invalid annotation data");
const token = () => randomBytes(24).toString("hex");
const getAddresses = () => Object.values(networkInterfaces())
  .flat()
  .filter((n) => n && n.family === "IPv4" && !n.internal)
  .map((n) => n.address);
app.get("/api/network", (req, res) => res.json({ addresses: getAddresses(), secure }));
app.get("/api/regions", (req, res) => res.json(regions));
app.post("/api/regions", async (req, res) => {
  const s = sessions.get(req.headers["x-session-id"]);
  if (!s || s.hostToken !== req.headers["x-session-token"])
    return res.status(403).json({ error: "PC 세션 인증이 필요합니다." });
  if (!validRegions(req.body))
    return res.status(400).json({ error: "시간과 좌표 범위를 확인해 주세요." });
  try {
    await writeFile(regionPath, JSON.stringify(req.body, null, 2));
    regions = req.body;
    io.emit("regions", regions);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "데이터 저장에 실패했습니다." });
  }
});
const state = (s) => ({
  pointer: s.pointer,
  time: s.time,
  playing: !!s.playing,
  selected: s.selected,
  hover: hit(activeRegions(regions, s.time), s.pointer),
  connected: [...(io.sockets.adapter.rooms.get(s.id) || [])].some(
    (id) => io.sockets.sockets.get(id)?.data.role === "remote",
  ),
});
io.on("connection", (socket) => {
  socket.on("create", (saved, ack) => {
    let s = saved && sessions.get(saved.id);
    if (!s || s.hostToken !== saved.hostToken) {
      s = {
        id: randomBytes(6).toString("hex"),
        hostToken: token(),
        remoteToken: token(),
        pointer: { x: 0.5, y: 0.5 },
        time: 0,
        selected: null,
        touched: Date.now(),
      };
      sessions.set(s.id, s);
    }
    socket.data = { sid: s.id, role: "host" };
    socket.join(s.id);
    s.touched = Date.now();
    ack({
      id: s.id,
      hostToken: s.hostToken,
      remoteToken: s.remoteToken,
      ...state(s),
    });
    io.to(s.id).emit("state", state(s));
  });
  socket.on("join", (data, ack) => {
    const s = sessions.get(data?.id);
    if (!s || data.token !== s.remoteToken)
      return ack({
        error:
          "연결 링크가 만료되었거나 올바르지 않습니다. PC에서 QR을 다시 확인해 주세요.",
      });
    socket.data = { sid: s.id, role: "remote" };
    socket.join(s.id);
    s.touched = Date.now();
    ack({ ok: true });
    io.to(s.id).emit("state", state(s));
  });
  // Only authenticated remotes can send site-wide input to their own host.
  for (const name of ['ui-move', 'ui-scroll', 'ui-tap', 'ui-center']) {
    socket.on(name, (payload) => {
      const s = sessions.get(socket.data.sid);
      if (!s || socket.data.role !== 'remote') return;
      let data;
      if (name === 'ui-move' || name === 'ui-scroll') {
        if (!Number.isFinite(payload?.dy) || (name === 'ui-move' && !Number.isFinite(payload?.dx))) return;
        const bounded = (v) => Math.max(-1, Math.min(1, v));
        data = name === 'ui-move' ? { dx: bounded(payload.dx), dy: bounded(payload.dy) } : { dy: bounded(payload.dy) };
      }
      s.touched = Date.now();
      for (const id of io.sockets.adapter.rooms.get(s.id) || []) {
        if (io.sockets.sockets.get(id)?.data.role === 'host') io.to(id).emit(name, data);
      }
    });
  }
  socket.on("pointer", (p) => {
    const s = sessions.get(socket.data.sid);
    if (!s || !Number.isFinite(p?.x) || !Number.isFinite(p?.y)) return;
    s.pointer = { x: clamp(p.x), y: clamp(p.y) };
    s.touched = Date.now();
    io.to(s.id).emit("state", state(s));
  });
  socket.on("time", (t) => {
    const s = sessions.get(socket.data.sid);
    if (!s || socket.data.role !== "host" || !Number.isFinite(t) || t < 0)
      return;
    s.time = t;
    s.touched = Date.now();
    io.to(s.id).emit("state", state(s));
  });
  socket.on("playing", (on) => {
    const s = sessions.get(socket.data.sid);
    if (!s || socket.data.role !== "host") return;
    s.playing = on === true;
    io.to(s.id).emit("state", state(s));
  });
  socket.on("select", (options) => {
    const s = sessions.get(socket.data.sid);
    if (!s) return;
    const target = socket.data.role === 'remote' || options?.target === 'remote' ? 'remote' : 'host';
    const selected = hit(activeRegions(regions, s.time), s.pointer);
    if (!selected) {
      return io.to(s.id).emit("selection-miss", { target });
    }
    s.selected = selected;
    io.to(s.id).emit("state", state(s));
    io.to(s.id).emit("selected", selected, { target });
  });
  socket.on("choose-character", (id, options) => {
    const s = sessions.get(socket.data.sid);
    if (!s || !characterIds.includes(id)) return;
    s.selected = id;
    s.touched = Date.now();
    io.to(s.id).emit("state", state(s));
    io.to(s.id).emit("selected", id, { target: socket.data.role === "remote" || options?.target === "remote" ? "remote" : "host" });
  });
  socket.on('open-library', () => { if (socket.data.sid) io.to(socket.data.sid).emit('open-library'); });
  socket.on("play", () => {
    if (socket.data.sid) io.to(socket.data.sid).emit("play");
  });
  socket.on("disconnect", () => {
    const s = sessions.get(socket.data.sid);
    if (s) io.to(s.id).emit("state", state(s));
  });
});
setInterval(() => {
  for (const [id, s] of sessions)
    if (
      Date.now() - s.touched > 24 * 60 * 60 * 1000 &&
      !io.sockets.adapter.rooms.get(id)?.size
    )
      sessions.delete(id);
}, 60000).unref();
if (prod) app.use(express.static(dist));
else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
if (prod)
  app.get("/{*path}", (req, res) => res.sendFile(dist + "index.html"));
server.listen(Number(process.env.PORT || 5173), "0.0.0.0", () =>
  console.log(
    `Ready: ${secure ? "https" : "http"}://localhost:${server.address().port}`,
  ),
);
