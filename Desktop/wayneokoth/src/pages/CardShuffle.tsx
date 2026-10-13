import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Transition, type Variants } from "framer-motion";

/**
 * Card shuffle: three visible slots (top pill, main card, bottom pill).
 * On every tick each item moves one slot down and morphs its shape:
 *
 *   hidden above -> top pill -> main card -> bottom pill -> fades out below
 *
 * Every item keeps a stable key, so the same DOM node is reused and Framer
 * Motion morphs it between slot shapes instead of swapping elements.
 */

type Slot = -1 | 0 | 1 | 2 | 3;
const SLOTS: Slot[] = [-1, 0, 1, 2, 3];

// Geometry taken from the reference screenshot (327 x 509 stage).
const STAGE = { width: 327, height: 509 };
const PILL = { x: 34, width: 254, height: 32, borderRadius: 16 };
const CARD = { x: 18, width: 287, height: 345, borderRadius: 44 };

const SHAPES: Record<Slot, string> = {
  "-1": "enter",
  0: "top",
  1: "main",
  2: "bottom",
  3: "exit",
};

const variants: Variants = {
  enter: { ...PILL, y: -14, opacity: 0, scale: 0.92 },
  top: { ...PILL, y: 19, opacity: 1, scale: 1 },
  main: { ...CARD, y: 60, opacity: 1, scale: 1 },
  bottom: { ...PILL, y: 442, opacity: 1, scale: 1 },
  exit: { ...PILL, y: 478, opacity: 0, scale: 0.92 },
};

// Near-critically damped spring: fluid, no visible wobble.
const transition: Transition = {
  type: "spring",
  stiffness: 190,
  damping: 26,
  mass: 1,
  opacity: { duration: 0.35, ease: "easeOut" },
};

const zIndexFor = (slot: Slot): number => (slot === 1 ? 2 : slot === 0 || slot === 2 ? 1 : 0);

type Props = {
  /** Milliseconds between shuffles. */
  interval?: number;
  /** Optional content for each item. `id` increases by one every shuffle. */
  renderItem?: (id: number, slot: Slot) => ReactNode;
};

export default function CardShuffle({ interval = 2800, renderItem }: Props) {
  const [tick, setTick] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setInterval(() => setTick((t) => t + 1), interval);
    return () => window.clearInterval(timer);
  }, [interval]);

  return (
    <div
      aria-hidden
      style={{
        position: "relative",
        width: STAGE.width,
        height: STAGE.height,
        overflow: "hidden",
        background: "#101010",
      }}
    >
      {SLOTS.map((slot) => {
        const id = tick - slot;
        return (
          <motion.div
            key={id}
            variants={variants}
            initial={false}
            animate={SHAPES[slot]}
            transition={reduceMotion ? { duration: 0 } : transition}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: zIndexFor(slot),
              overflow: "hidden",
              background: "#ff3352",
              willChange: "transform, width, height",
            }}
          >
            {renderItem?.(id, slot)}
          </motion.div>
        );
      })}
    </div>
  );
}
