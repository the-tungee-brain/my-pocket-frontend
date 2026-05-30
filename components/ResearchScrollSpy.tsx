"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { appTabBarClass, appTabLinkClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

export type ScrollSpySection = {
  id: string;
  label: string;
};

type ScrollSpyContextValue = {
  register: (section: ScrollSpySection) => void;
  unregister: (id: string) => void;
};

const ScrollSpyContext = createContext<ScrollSpyContextValue | null>(null);

/** Match sticky research header + in-page sub-nav offset. */
const ACTIVE_SECTION_OFFSET_PX = 120;

type ResearchScrollSpyProps = {
  children: ReactNode;
  className?: string;
  navClassName?: string;
  /** Scroll container id — defaults to main app content. */
  scrollRootId?: string;
};

export function ResearchScrollSpy({
  children,
  className,
  navClassName,
  scrollRootId = "main-content",
}: ResearchScrollSpyProps) {
  const navId = useId();
  const [sections, setSections] = useState<ScrollSpySection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sectionsRef = useRef<ScrollSpySection[]>([]);

  const register = useCallback((section: ScrollSpySection) => {
    setSections((prev) => {
      if (prev.some((item) => item.id === section.id)) return prev;
      return [...prev, section];
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setSections((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const contextValue = useMemo(
    () => ({ register, unregister }),
    [register, unregister],
  );

  sectionsRef.current = sections;

  const syncActiveSection = useCallback(() => {
    const currentSections = sectionsRef.current;
    if (currentSections.length === 0) return;

    const root = document.getElementById(scrollRootId);
    const rootTop = root?.getBoundingClientRect().top ?? 0;
    const triggerY = rootTop + ACTIVE_SECTION_OFFSET_PX;

    let nextActive = currentSections[0].id;
    for (const section of currentSections) {
      const element = document.getElementById(section.id);
      if (!element) continue;
      if (element.getBoundingClientRect().top <= triggerY) {
        nextActive = section.id;
      }
    }

    setActiveId(nextActive);
  }, [scrollRootId]);

  useEffect(() => {
    if (sections.length === 0) {
      setActiveId(null);
      return;
    }

    setActiveId((current) =>
      current != null && sections.some((section) => section.id === current)
        ? current
        : sections[0].id,
    );
  }, [sections]);

  useEffect(() => {
    const root = document.getElementById(scrollRootId);
    if (!root || sections.length === 0) return;

    const runSync = () => syncActiveSection();
    runSync();

    root.addEventListener("scroll", runSync, { passive: true });
    window.addEventListener("resize", runSync);

    const frame = window.requestAnimationFrame(runSync);

    return () => {
      root.removeEventListener("scroll", runSync);
      window.removeEventListener("resize", runSync);
      window.cancelAnimationFrame(frame);
    };
  }, [scrollRootId, sections, syncActiveSection]);

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    const root = document.getElementById(scrollRootId);
    const offset = 88;
    const targetRect = target.getBoundingClientRect();

    if (root && root.scrollHeight > root.clientHeight + 1) {
      const rootRect = root.getBoundingClientRect();
      const nextTop =
        root.scrollTop + (targetRect.top - rootRect.top) - offset;
      root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
    } else {
      const nextTop = window.scrollY + targetRect.top - offset;
      window.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
    }

    setActiveId(id);
  };

  return (
    <ScrollSpyContext.Provider value={contextValue}>
      {sections.length > 1 ? (
        <nav
          id={navId}
          aria-label="On this page"
          className={cn(
            "sticky top-14 z-10 -mx-1 mb-4 border-b border-border/60 bg-background/95 px-1 py-2.5 backdrop-blur-md",
            navClassName,
          )}
        >
          <div
            className={cn(
              appTabBarClass,
              "w-full overflow-x-auto scrollbar-dark snap-x snap-mandatory",
            )}
          >
            {sections.map((section) => {
              const active = activeId === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    appTabLinkClass(active),
                    "flex-none snap-start whitespace-nowrap",
                  )}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}
      <div className={className}>{children}</div>
    </ScrollSpyContext.Provider>
  );
}

type ResearchScrollSpySectionProps = {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
};

export function ResearchScrollSpySection({
  id,
  label,
  children,
  className,
}: ResearchScrollSpySectionProps) {
  const context = useContext(ScrollSpyContext);

  useEffect(() => {
    if (!context) return;
    context.register({ id, label });
    return () => context.unregister(id);
  }, [context, id, label]);

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      style={{ scrollMarginTop: "5.5rem" }}
      className={className}
    >
      {children}
    </section>
  );
}
