"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
  lang?: string;
};

type SelectProps = {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
  menuAlign?: "start" | "end";
  name?: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  value: string;
  variant?: "compact" | "field";
};

const triggerClassNames = {
  compact:
    "h-10 rounded-full border border-ink/20 bg-paper/80 py-0 pr-3 pl-3 text-[0.72rem] font-extrabold shadow-[0_4px_18px_rgb(22_23_19_/_0.06)] backdrop-blur-md hover:border-ink/40 hover:bg-white/60",
  field:
    "min-h-[3.65rem] w-full rounded-[0.8rem] border border-ink/18 bg-white/35 p-4 text-left hover:border-ink/35 focus:border-accent focus:bg-white/55 focus:ring-4 focus:ring-accent/10",
};

const menuClassNames = {
  compact: "min-w-[11rem] rounded-[1rem] p-1.5",
  field: "max-h-72 w-full overflow-y-auto rounded-[0.9rem] p-2",
};

export function Select({
  ariaLabel,
  ariaLabelledBy,
  className = "",
  menuAlign = "start",
  name,
  onValueChange,
  options,
  placeholder,
  value,
  variant = "field",
}: SelectProps) {
  const generatedId = useId();
  const listboxId = `${generatedId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const typeaheadRef = useRef({ query: "", typedAt: 0 });
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = options[selectedIndex];
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(selectedIndex, 0),
  );

  useEffect(() => {
    if (!open) return;

    const closeWhenClickingOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeWhenFocusLeaves = (event: FocusEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("focusin", closeWhenFocusLeaves);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("focusin", closeWhenFocusLeaves);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, open]);

  const openMenu = (index = Math.max(selectedIndex, 0)) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onValueChange(option.value);
    setActiveIndex(index);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        openMenu(
          selectedIndex < 0
            ? 0
            : Math.min(selectedIndex + 1, options.length - 1),
        );
      } else {
        setActiveIndex((index) => Math.min(index + 1, options.length - 1));
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu(
          selectedIndex < 0
            ? options.length - 1
            : Math.max(selectedIndex - 1, 0),
        );
      } else {
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const index = event.key === "Home" ? 0 : options.length - 1;
      if (!open) openMenu(index);
      else setActiveIndex(index);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(activeIndex);
      else openMenu();
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const now = Date.now();
      const previous = typeaheadRef.current;
      const query =
        `${now - previous.typedAt < 700 ? previous.query : ""}${event.key}`.toLocaleLowerCase();
      typeaheadRef.current = { query, typedAt: now };
      const startIndex = open
        ? activeIndex + 1
        : Math.max(selectedIndex + 1, 0);
      const match = [...options, ...options]
        .slice(startIndex, startIndex + options.length)
        .findIndex((option) =>
          option.label.toLocaleLowerCase().startsWith(query),
        );

      if (match >= 0) {
        event.preventDefault();
        const index = (startIndex + match) % options.length;
        if (!open) openMenu(index);
        else setActiveIndex(index);
      }
    }
  };

  return (
    <div
      className={cn(
        "relative",
        variant === "field" ? "w-full" : "inline-flex",
        className,
      )}
      ref={rootRef}
    >
      {name ? <input name={name} type="hidden" value={value} /> : null}
      <button
        type="button"
        role="combobox"
        aria-activedescendant={
          open ? `${listboxId}-option-${activeIndex}` : undefined
        }
        aria-autocomplete="none"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "inline-flex cursor-pointer items-center justify-between gap-3 whitespace-nowrap text-ink leading-none outline-none transition-[border-color,background-color,box-shadow] duration-200",
          triggerClassNames[variant],
        )}
        onClick={() => {
          if (open) setOpen(false);
          else openMenu();
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="inline-flex min-w-0 items-center gap-2 self-center">
          {selectedOption?.icon ? (
            <span aria-hidden="true" className="text-base leading-none">
              {selectedOption.icon}
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center truncate leading-none",
              !selectedOption && "text-muted",
            )}
            lang={selectedOption?.lang}
          >
            {selectedOption?.label ?? placeholder}
          </span>
        </span>
        <Chevron open={open} />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-[60] border border-ink/15 bg-paper shadow-[0_18px_55px_rgb(22_23_19_/_0.16)]",
            menuAlign === "end" ? "right-0" : "left-0",
            menuClassNames[variant],
          )}
        >
          <div
            role="listbox"
            id={listboxId}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
          >
            {options.map((option, index) => {
              const selected = option.value === value;
              const active = index === activeIndex;
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-[0.7rem] px-3 py-2.5 text-left text-sm font-bold outline-none transition-colors",
                    active
                      ? "bg-accent/12 text-ink"
                      : "text-ink/75 hover:bg-white/55 hover:text-ink",
                  )}
                  id={`${listboxId}-option-${index}`}
                  key={option.value}
                  lang={option.lang}
                  onClick={() => choose(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onPointerMove={() => setActiveIndex(index)}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  tabIndex={-1}
                >
                  {option.icon ? (
                    <span aria-hidden="true" className="text-base leading-none">
                      {option.icon}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">{option.label}</span>
                  {selected ? <Checkmark /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "size-3.5 shrink-0 transition-transform duration-200",
        open && "rotate-180",
      )}
      viewBox="0 0 14 14"
    >
      <path
        d="m3.5 5.25 3.5 3.5 3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function Checkmark() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0 text-accent-ink"
      viewBox="0 0 16 16"
    >
      <path
        d="m3.25 8.25 3 3 6.5-6.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}
