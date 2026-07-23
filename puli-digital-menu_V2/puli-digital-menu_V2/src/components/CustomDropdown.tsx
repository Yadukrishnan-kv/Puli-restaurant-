import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface CustomDropdownOption {
  value: string | null;
  label: string;
}

interface CustomDropdownProps {
  options: CustomDropdownOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className = "",
  "aria-label": ariaLabel,
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, [open]);

  const selected = value == null ? null : options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : placeholder;

  return (
    <div
      className={`custom-dropdown ${className}`}
      ref={wrapRef}
      data-open={open ? "true" : undefined}
    >
      <button
        type="button"
        className="custom-dropdown__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel ?? placeholder}
      >
        <span className="custom-dropdown__trigger-label">{displayLabel}</span>
        <ChevronDownIcon className="custom-dropdown__chevron" />
      </button>
      <AnimatePresence>
        {open && (
          <div className="custom-dropdown__list-wrap">
            <motion.ul
              className="custom-dropdown__list"
              role="listbox"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {options.map((opt) => (
              <li key={opt.value ?? "__all__"} role="option" aria-selected={value === opt.value}>
                <button
                  type="button"
                  className={`custom-dropdown__option ${value === opt.value ? "custom-dropdown__option--active" : ""}`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
              ))}
            </motion.ul>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
