import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  label,
  children,
  onClose,
  className = "",
}: {
  label: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const target = panel.current;
    target?.focus({ preventScroll: true });
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !target) return;
      const items = Array.from(
        target.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select,[tabindex="0"]',
        ),
      ).filter((e) => e.getClientRects().length > 0);
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0],
        last = items.at(-1)!;
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === target)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    target?.addEventListener("keydown", trap);
    return () => {
      target?.removeEventListener("keydown", trap);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <div
      className={"modal-backdrop " + className}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="stream-modal"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <button
          className="modal-close"
          aria-label={label + " 닫기"}
          onClick={onClose}
        >
          <X size={23} />
        </button>
        {children}
      </div>
    </div>
  );
}
