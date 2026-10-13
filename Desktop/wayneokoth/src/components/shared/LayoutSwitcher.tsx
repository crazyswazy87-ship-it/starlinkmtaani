"use client";

import {
  motion,
  LayoutGroup,
  AnimatePresence,
  type Transition,
} from "motion/react";

import {
  Playlist01Icon,
  GridViewIcon,
  Layers01Icon,
  StarIcon,
  Ticket01Icon,
  CodeIcon,
  ShirtIcon,
  CardsIcon,
  ShoppingBagIcon,
  Translate,
} from "@hugeicons/core-free-icons";

import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { cn } from "../../lib/utils";
import "./LayoutSwitcher.css";

interface CollectionItem {
  id: string;
  title: string;
  subtitle: string;
  idNumber: string;
  image: string;
  icon: any;
  link: string;
}

// Change Here
const ITEMS: CollectionItem[] = [
  {
    id: "1",
    title: "BLOCK SEVEN",
    subtitle: "Digital Ecosystem",
    idNumber: "001",
    image: "assets/images/b77.png",
    icon: CodeIcon,
    link: "https://blockseven.vercel.app",
  },
  {
    id: "2",
    title: "WOLFGANG",
    subtitle: "Clothing Brand",
    idNumber: "002",
    image: "assets/images/wolflogo.png",
    icon: ShirtIcon,
    link: " https://wolfgang-alpha.vercel.app/",
  },
  {
    id: "3",
    title: "Sheng.AI",
    subtitle: "Sheng Dictionary",
    idNumber: "003",
    image: "assets/images/sheng.png",
    icon: Translate,
    link: "https://sheng-two.vercel.app",
  },
  {
    id: "4",
    title: "KADI",
    subtitle: "Business Cards",
    idNumber: "004",
    image: "assets/images/kadi.png",
    icon: CardsIcon,
    link: "https://kadi.vercel.app",
  },
  {
    id: "5",
    title: "DEVBITS",
    subtitle: "React Components",
    idNumber: "005",
    image: "assets/images/logobits.png",
    icon: CodeIcon,
    link: "https://devbitss.vercel.app/",
  },
  {
    id: "6",
    title: "ARTSHORDY",
    subtitle: "Art & Shop",
    idNumber: "006",
    image: "assets/images/artshordylogo.png",
    icon: ShoppingBagIcon,
    link: "https://artshordy.com",
  },
];
type ViewMode = "list" | "card" | "pack";

const snappySpring: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 1,
};

const fastFade: Transition = {
  duration: 0.15,
  ease: "linear",
};

export function LayoutSwitcher() {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div className="layout-switcher">
      <div className="layout-switcher-inner">

        {/* Header */}
        <div className="layout-switcher-header">
          <h2 className="blender">Selected works</h2>

          {/* Water Tabs */}
          <div className="water-tabs">
            <Tab
              active={view === "list"}
              onClick={() => setView("list")}
              icon={Playlist01Icon}
              label="List"
            />

            <Tab
              active={view === "card"}
              onClick={() => setView("card")}
              icon={GridViewIcon}
              label="Card"
            />

            <Tab
              active={view === "pack"}
              onClick={() => setView("pack")}
              icon={Layers01Icon}
              label="Pack"
            />
          </div>
        </div>

        <div className="water-divider" />

        {/* Content */}
        <div className="water-content">
          <div className="water-content-glow" />

          <LayoutGroup>
            <motion.div
              layout
              transition={snappySpring}
              className={cn(
                "collection-layout",
                view === "list" && "collection-list",
                view === "card" && "collection-grid",
                view === "pack" && "collection-pack"
              )}
            >
              {ITEMS.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  transition={snappySpring}
                  className={cn(
                    "collection-item",
                    view === "list" && "item-list",
                    view === "card" && "item-card",
                    view === "pack" && "item-pack"
                  )}
                  style={{
                    zIndex:
                      view === "pack"
                        ? ITEMS.length - index
                        : 1,
                  }}
                  animate={
                    view === "pack"
                      ? {
                          rotate: index === 0 ? -12 : 6,
                          x: index === 0 ? -25 : 25,
                          y: index === 0 ? -5 : 5,
                        }
                      : {
                          rotate: 0,
                          x: 0,
                          y: 0,
                        }
                  }
                >

                  {/* CARD LINK */}
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${item.title}`}
                    className="collection-link"
                  >

                    {/* Image */}
                    <motion.div
                      layout
                      transition={snappySpring}
                      className={cn(
                        "water-image",
                        view === "list" && "image-list",
                        view === "card" && "image-card",
                        view === "pack" && "image-pack"
                      )}
                    >
                      <motion.img
                        layout
                        transition={snappySpring}
                        src={item.image}
                        alt={item.title}
                        className="collection-image"
                      />

                      <div className="image-water-shine" />

                      {/* DIAGONAL ARROW */}
                      <span className="collection-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </motion.div>

                    {/* Information */}
                    <AnimatePresence
                      mode="popLayout"
                      initial={false}
                    >
                      {view !== "pack" && (
                        <motion.div
                          key={`${item.id}-info`}
                          layout
                          initial={{
                            opacity: 0,
                            scale: 0.92,
                            filter: "blur(5px)",
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            filter: "blur(0px)",
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.92,
                            filter: "blur(5px)",
                          }}
                          transition={fastFade}
                          className={cn(
                            "collection-info",
                            view === "card" &&
                              "collection-info-card"
                          )}
                        >
                          <div className="collection-details">
                            <motion.h3 layout>
                              {item.title}
                            </motion.h3>

                            <motion.div
                              layout
                              className="collection-subtitle"
                            >
                              <HugeiconsIcon
                                icon={item.icon}
                                size={13}
                              />

                              <span>
                                {item.subtitle}
                              </span>
                            </motion.div>
                          </div>

                          <motion.div
                            layout
                            className="collection-number"
                          >
                            <HugeiconsIcon
                              icon={StarIcon}
                              size={10}
                            />

                            <span>
                              #{item.idNumber}
                            </span>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* List separator */}
                    {view === "list" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="list-separator"
                      />
                    )}

                  </a>
                </motion.div>
              ))}
            </motion.div>

            {/* Pack message */}
            <AnimatePresence>
              {view === "pack" && (
                <motion.div
                  layout
                  initial={{
                    opacity: 0,
                    y: 10,
                    filter: "blur(5px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    y: 5,
                    filter: "blur(5px)",
                  }}
                  transition={{
                    duration: 0.3,
                    delay: 0.1,
                  }}
                  className="bundle-message"
                >
                  <div className="bundle-pill">
                    <HugeiconsIcon
                      icon={Ticket01Icon}
                      size={13}
                    />

                    <span>Block 7 Creation</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TAB
========================================================= */

interface TabProps {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}

function Tab({
  active,
  onClick,
  icon,
  label,
}: TabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "water-tab",
        active && "water-tab-active"
      )}
    >
      {active && (
        <motion.div
          layoutId="active-water-tab"
          className="water-active-tab"
          transition={snappySpring}
        >
          <div className="water-active-highlight" />
          <div className="water-active-reflection" />
        </motion.div>
      )}

      <span className="water-tab-content">
        <HugeiconsIcon
          icon={icon}
          size={16}
          className={cn(
            "water-tab-icon",
            active && "water-tab-icon-active"
          )}
        />

        <span>{label}</span>
      </span>
    </button>
  );
}

export default LayoutSwitcher;