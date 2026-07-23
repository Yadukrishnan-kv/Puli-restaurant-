import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface IconWithTooltipProps {
  children: React.ReactNode;
  label: string;
  /** When true, tooltip also shows on click (mobile) and auto-hides after delay */
  showOnClick?: boolean;
}

export function IconWithTooltip({ children, label, showOnClick = true }: IconWithTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      left: rect.left + rect.width / 2,
      top: rect.top,
    });
  };

  // Hover: show on enter, hide on leave
  const onMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setClicked(false);
    updatePosition();
    setVisible(true);
  };
  const onMouseLeave = () => {
    if (clicked) return;
    setVisible(false);
    setPosition(null);
  };

  // Click (mobile): show tooltip above, auto-hide after 2.5s
  const onClick = (e: React.MouseEvent) => {
    if (!showOnClick) return;
    e.preventDefault();
    e.stopPropagation();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    setClicked(true);
    setVisible(true);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setClicked(false);
      setPosition(null);
      timeoutRef.current = null;
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const showBubble = visible && position !== null;

  return (
    <span
      className="icon-with-tooltip"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onPointerDown={(e) => showOnClick && e.stopPropagation()}
    >
      <span
        ref={triggerRef}
        className="icon-with-tooltip__trigger"
        title={label}
        aria-label={label}
      >
        {children}
      </span>
      {showBubble &&
        createPortal(
          <span
            className="icon-with-tooltip__bubble icon-with-tooltip__bubble--portal"
            role="tooltip"
            style={{
              left: position.left,
              top: position.top,
            }}
          >
            {label}
          </span>,
          document.body
        )}
    </span>
  );
}
