"use client";

import React, { useState, useRef, useCallback } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

const POSITION_CLASSES: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({ content, children, side = "top", delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).slice(2)}`).current;

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;

  return (
    <span className="relative inline-flex">
      {React.cloneElement(child, {
        "aria-describedby": visible ? tooltipId : undefined,
        onMouseEnter: (e: React.MouseEvent) => {
          show();
          child.props.onMouseEnter?.(e as React.MouseEvent<HTMLElement>);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          hide();
          child.props.onMouseLeave?.(e as React.MouseEvent<HTMLElement>);
        },
        onFocus: (e: React.FocusEvent) => {
          show();
          child.props.onFocus?.(e as React.FocusEvent<HTMLElement>);
        },
        onBlur: (e: React.FocusEvent) => {
          hide();
          child.props.onBlur?.(e as React.FocusEvent<HTMLElement>);
        },
      } as React.HTMLAttributes<HTMLElement>)}

      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={[
            "absolute z-[var(--z-tooltip)] pointer-events-none",
            "bg-[var(--color-primary-xdark)] text-[var(--color-text-inverse)]",
            "text-[var(--text-xs)] px-2.5 py-1.5 rounded-[var(--radius-sm)]",
            "shadow-[var(--shadow-md)] whitespace-nowrap animate-fade-in",
            POSITION_CLASSES[side],
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {content}
        </span>
      )}
    </span>
  );
}

