"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { TOKENS, FONTS } from "./tokens";

/**
 * StatutoryTooltip
 *
 * Hover/click tooltip used throughout the wizard to surface plain-English
 * explanations alongside statutory citations. The citation is the credibility
 * signal — a Texas attorney reviewing the wizard should see § references
 * everywhere a legal concept appears.
 *
 * Tooltip opens are logged to audit (helps us understand what users find
 * confusing). Citation rendering uses monospace for visual separation from
 * body copy.
 *
 * Props:
 *   children       — the trigger element (defaults to a HelpCircle icon)
 *   plainEnglish   — required, the friendly explanation
 *   citation       — optional, the statutory reference (e.g., "Tex. Est. Code § 752.051")
 *   width          — tooltip max width in pixels (default 320)
 *   onOpen         — callback fired when tooltip opens (for audit logging)
 */
export function StatutoryTooltip({
  children,
  plainEnglish,
  citation,
  width = 320,
  onOpen,
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipHeight = 200; // rough estimate
      const viewportHeight = window.innerHeight;

      // Position above if there's room, otherwise below
      const showAbove = rect.top > tooltipHeight + 20;

      setPosition({
        top: showAbove ? rect.top - tooltipHeight + 10 : rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - width - 16),
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, width]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && onOpen) onOpen();
  }

  return (
    <>
      <span
        ref={triggerRef}
        onClick={handleToggle}
        onMouseEnter={() => {
          if (!open && onOpen) onOpen();
          setOpen(true);
        }}
        onMouseLeave={(e) => {
          // Only close if mouse isn't moving to the tooltip itself
          if (!e.relatedTarget || !e.relatedTarget.closest?.(".statutory-tooltip")) {
            setOpen(false);
          }
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          cursor: "help",
          marginLeft: 4,
          color: TOKENS.INK_40,
          verticalAlign: "middle",
        }}
      >
        {children || <HelpCircle size={13} strokeWidth={1.8} />}
      </span>

      {open && typeof window !== "undefined" && (
        <div
          className="statutory-tooltip"
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            width,
            background: TOKENS.INK,
            color: TOKENS.PAPER,
            padding: "14px 16px",
            borderRadius: 8,
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.4)",
            fontSize: 13,
            lineHeight: 1.55,
            zIndex: 9999,
            fontFamily: FONTS.SANS,
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div>{plainEnglish}</div>
          {citation && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: `1px solid rgba(255,255,255,0.15)`,
                fontFamily: FONTS.MONO,
                fontSize: 11,
                color: TOKENS.INK_20,
                letterSpacing: "0.01em",
              }}
            >
              {citation}
            </div>
          )}
        </div>
      )}
    </>
  );
}
