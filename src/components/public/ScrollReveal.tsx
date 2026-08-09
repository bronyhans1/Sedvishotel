"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Optional stagger (ms) after reveal starts. */
  delayMs?: number;
};

/** Soft opacity + 20px rise on scroll into view. Respects prefers-reduced-motion. */
export function ScrollReveal({ children, className, delayMs = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        reducedMotion
          ? "opacity-100"
          : "transition-all duration-[600ms] ease-out",
        !reducedMotion &&
          (visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"),
        className
      )}
      style={
        !reducedMotion && delayMs > 0
          ? { transitionDelay: visible ? `${delayMs}ms` : "0ms" }
          : undefined
      }
    >
      {children}
    </div>
  );
}
