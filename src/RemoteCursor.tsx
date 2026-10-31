import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Socket } from "socket.io-client";

export let remoteInputActive = false;

// The phone controls this site's viewport, including modals and player controls.
export function RemoteCursor({ socket, wake }: { socket: Socket; wake: () => void }) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const current = useRef({ x: innerWidth / 2, y: innerHeight / 2 });
  const wakeRef = useRef(wake);
  wakeRef.current = wake;
  useEffect(() => {
    let hovered: Element | null = null;
    const target = () => document.elementFromPoint(current.current.x, current.current.y);
    const update = () => {
      wakeRef.current();
      setPosition({ ...current.current });
      hovered?.classList.remove("remote-hover");
      const el = target();
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
      socket.off('ui-move', move); socket.off('ui-tap', click);
      socket.off('ui-scroll', scroll); socket.off('ui-center', center);
    };
  }, [socket]);
  return position && createPortal(<div className="remote-screen-cursor" aria-hidden="true" style={{ left: position.x, top: position.y }}><svg width="25" height="30" viewBox="0 0 25 30"><path d="M3 2 L3 23 L9 18 L14 28 L19 25 L14 16 L23 15 Z" fill="#e50914" stroke="white" strokeWidth="2" strokeLinejoin="round" /></svg></div>, document.body);
}
