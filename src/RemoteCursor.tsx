import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Socket } from "socket.io-client";

export let remoteInputActive = false;

// The phone controls this site's viewport, including modals and player controls.
// It is a small circle shown only while the touchpad is in use; it fades after 2s without input.
export function RemoteCursor({ socket, wake, target }: { socket: Socket; wake: () => void; target: boolean }) {
  const [position, setPosition] = useState<{ x: number; y: number; overVideo: boolean } | null>(null);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const current = useRef({ x: innerWidth / 2, y: innerHeight / 2 });
  const wakeRef = useRef(wake);
  wakeRef.current = wake;
  useEffect(() => {
    let hovered: Element | null = null;
    const target = () => document.elementFromPoint(current.current.x, current.current.y);
    const update = () => {
      wakeRef.current();
      setIdle(false);
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIdle(true), 2000);
      hovered?.classList.remove("remote-hover");
      const el = target();
      setPosition({ ...current.current, overVideo: !!el?.closest('.video-interaction') });
      hovered = el?.closest('button, a, input, select, [role="button"]') || null;
      hovered?.classList.add("remote-hover");
      if (el?.closest('.video-interaction')) {
        el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: current.current.x, clientY: current.current.y }));
      }
    };
    const move = (p: { dx: number; dy: number }) => {
      current.current = {
        x: Math.max(1, Math.min(innerWidth - 2, current.current.x + p.dx * innerWidth)),
        y: Math.max(1, Math.min(innerHeight - 2, current.current.y + p.dy * innerHeight)),
      };
      update();
    };
    const clickTarget = () => {
      update();
      const raw = target();
      const el = raw instanceof HTMLElement ? raw : raw?.closest('button,a,[role="button"]');
      if (!(el instanceof HTMLElement)) return;
      const input = el.closest('input');
      if (input instanceof HTMLInputElement && input.type === 'range' && !input.disabled) {
        const rect = input.getBoundingClientRect();
        const min = Number(input.min) || 0, max = Number(input.max) || 100, step = Number(input.step) || 1;
        const ratio = Math.max(0, Math.min(1, (current.current.x - rect.left) / rect.width));
        const value = Math.min(max, min + Math.round(ratio * (max - min) / step) * step);
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, String(value));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        if (!el.closest('.video-interaction')) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: current.current.x, clientY: current.current.y }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: current.current.x, clientY: current.current.y }));
      }
    };
    const click = () => { remoteInputActive = true; try { clickTarget(); } finally { remoteInputActive = false; } };
    const scroll = (p: { dy: number }) => {
      wakeRef.current();
      let el = target();
      while (el && el !== document.documentElement) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) {
          el.scrollBy({ top: p.dy * innerHeight });
          return;
        }
        el = el.parentElement;
      }
      window.scrollBy({ top: p.dy * innerHeight });
    };
    const center = () => { current.current = { x: innerWidth / 2, y: innerHeight / 2 }; update(); };
    socket.on('ui-move', move);
    socket.on('ui-tap', click);
    socket.on('ui-scroll', scroll);
    socket.on('ui-center', center);
    return () => {
      hovered?.classList.remove('remote-hover');
      clearTimeout(idleTimer.current);
      socket.off('ui-move', move); socket.off('ui-tap', click);
      socket.off('ui-scroll', scroll); socket.off('ui-center', center);
    };
  }, [socket]);
  const driving = !!position && !idle;
  // While the phone drives, the video's own crosshair steps aside so only one pointer shows.
  useEffect(() => {
    document.body.classList.toggle("remote-driving", driving);
    return () => document.body.classList.remove("remote-driving");
  }, [driving]);
  return position && createPortal(
    <div
      className={"remote-screen-cursor" + (idle ? " is-idle" : "") + (target && position.overVideo ? " is-target" : "")}
      aria-hidden="true"
      style={{ left: position.x, top: position.y }}
    />,
    document.body,
  );
}
