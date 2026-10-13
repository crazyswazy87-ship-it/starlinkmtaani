import React, {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";

export interface StaggeredMenuProps {
  position?: "left" | "right";
  colors?: string[];
  className?: string;
  logoUrl?: string;

  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;

  changeMenuColorOnOpen?: boolean;

  onClick?: () => void;
  onLogoClick?: () => void;
}

const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = "right",
  colors = ["#7cff67", "#ff2727"],
  className = "",
  logoUrl,

  menuButtonColor = "#fff",
  openMenuButtonColor = "#fff",
  accentColor = "#06bb28",

  changeMenuColorOnOpen = true,

  onClick,
  onLogoClick,
}) => {
  const [open, setOpen] = useState(false);

  const openRef = useRef(false);

  const buttonRef =
    useRef<HTMLButtonElement | null>(null);

  const iconRef =
    useRef<HTMLSpanElement | null>(null);

  const textInnerRef =
    useRef<HTMLSpanElement | null>(null);

  const layersRef =
    useRef<HTMLDivElement | null>(null);

  const iconHorizontalRef =
    useRef<HTMLSpanElement | null>(null);

  const iconVerticalRef =
    useRef<HTMLSpanElement | null>(null);

  const textTween =
    useRef<gsap.core.Tween | null>(null);

  const iconTween =
    useRef<gsap.core.Tween | null>(null);

  const layerTween =
    useRef<gsap.core.Timeline | null>(null);

  /*
   * ---------------------------------------------------------
   * INITIAL TEXT
   * ---------------------------------------------------------
   */

  const [textLines, setTextLines] = useState([
    "Menu",
    "Close",
  ]);

  /*
   * ---------------------------------------------------------
   * INITIAL SETUP
   * ---------------------------------------------------------
   */

  useLayoutEffect(() => {
    const layers = layersRef.current
      ? Array.from(
          layersRef.current.querySelectorAll(
            ".sm-prelayer"
          )
        )
      : [];

    const offscreen =
      position === "left" ? -100 : 100;

    if (layers.length) {
      gsap.set(layers, {
        xPercent: offscreen,
      });
    }

    /*
     * Plus icon
     */
    if (iconRef.current) {
      gsap.set(iconRef.current, {
        rotate: 0,
      });
    }

    /*
     * Horizontal = plus bar
     */
    if (iconHorizontalRef.current) {
      gsap.set(iconHorizontalRef.current, {
        rotate: 0,
      });
    }

    /*
     * Vertical = plus bar
     */
    if (iconVerticalRef.current) {
      gsap.set(iconVerticalRef.current, {
        rotate: 90,
      });
    }

    if (textInnerRef.current) {
      gsap.set(textInnerRef.current, {
        yPercent: 0,
      });
    }

    if (buttonRef.current) {
      gsap.set(buttonRef.current, {
        color: menuButtonColor,
      });
    }
  }, [position, menuButtonColor]);

  /*
   * ---------------------------------------------------------
   * LAYERS
   * ---------------------------------------------------------
   */

  const animateLayers = useCallback(
    (opening: boolean) => {
      if (!layersRef.current) return;

      const layers = Array.from(
        layersRef.current.querySelectorAll(
          ".sm-prelayer"
        )
      ) as HTMLElement[];

      const offscreen =
        position === "left" ? -100 : 100;

      layerTween.current?.kill();

      const tl = gsap.timeline();

      if (opening) {
        layers.forEach((layer, index) => {
          tl.to(
            layer,
            {
              xPercent: 0,
              duration: 0.45,
              ease: "power4.out",
            },
            index * 0.07
          );
        });
      } else {
        [...layers]
          .reverse()
          .forEach((layer, index) => {
            tl.to(
              layer,
              {
                xPercent: offscreen,
                duration: 0.3,
                ease: "power3.in",
              },
              index * 0.05
            );
          });
      }

      layerTween.current = tl;
    },
    [position]
  );

  /*
   * ---------------------------------------------------------
   * PLUS / MINUS ICON
   *
   * CLOSED:
   *
   *       +
   *
   * OPEN:
   *
   *       −
   *
   * We keep the plus/minus icon.
   * ---------------------------------------------------------
   */

 const animateIcon = useCallback((opening: boolean) => {
  if (!iconRef.current) return;

  iconTween.current?.kill();

  iconTween.current = gsap.to(iconRef.current, {
    rotate: opening ? 180 : 0,
    duration: 0.5,
    ease: "power3.inOut",
    overwrite: true,
  });

  /*
   * Vertical line transforms into the horizontal
   * minus line during the rotation.
   */
  if (iconVerticalRef.current) {
    gsap.to(iconVerticalRef.current, {
      scaleY: opening ? 0 : 1,
      opacity: opening ? 0 : 1,
      duration: 0.35,
      delay: opening ? 0.08 : 0,
      ease: "power3.inOut",
      overwrite: true,
    });
  }
}, []);

  /*
   * ---------------------------------------------------------
   * MENU / CLOSE TEXT
   * ---------------------------------------------------------
   */

  const animateText = useCallback(
    (opening: boolean) => {
      if (!textInnerRef.current) return;

      textTween.current?.kill();

      const sequence = opening
        ? [
            "Menu",
            "Meno",
            "Menu",
            "Cenu",
            "Close",
          ]
        : [
            "Close",
            "Cluse",
            "Close",
            "Mnue",
            "Menu",
          ];

      setTextLines(sequence);

      gsap.set(textInnerRef.current, {
        yPercent: 0,
      });

      const shift =
        ((sequence.length - 1) /
          sequence.length) *
        100;

      textTween.current = gsap.to(
        textInnerRef.current,
        {
          yPercent: -shift,
          duration: 0.75,
          ease: "power4.out",
        }
      );
    },
    []
  );

  /*
   * ---------------------------------------------------------
   * BUTTON COLOR
   * ---------------------------------------------------------
   */

  const animateColor = useCallback(
    (opening: boolean) => {
      if (!buttonRef.current) return;

      gsap.to(buttonRef.current, {
        color:
          changeMenuColorOnOpen
            ? opening
              ? openMenuButtonColor
              : menuButtonColor
            : menuButtonColor,

        duration: 0.3,
        ease: "power2.out",

        overwrite: true,
      });
    },
    [
      changeMenuColorOnOpen,
      openMenuButtonColor,
      menuButtonColor,
    ]
  );

  /*
   * ---------------------------------------------------------
   * BUTTON CLICK
   * ---------------------------------------------------------
   */

  const handleClick = useCallback(() => {
    const nextOpen = !openRef.current;

    openRef.current = nextOpen;

    setOpen(nextOpen);

    /*
     * Animate StaggeredMenu itself
     */
    animateLayers(nextOpen);
    animateIcon(nextOpen);
    animateText(nextOpen);
    animateColor(nextOpen);

    /*
     * IMPORTANT:
     *
     * This calls:
     *
     * toggleQuickSettings()
     *
     * from Home.tsx
     */
    onClick?.();
  }, [
    animateLayers,
    animateIcon,
    animateText,
    animateColor,
    onClick,
  ]);

  return (
    <div
      className={`staggered-menu-trigger ${className}`}
      data-open={open}
      data-position={position}
      style={
        {
          "--sm-accent": accentColor,
        } as React.CSSProperties
      }
    >
      {/* =====================================================
          STAGGERED COLOR LAYERS
      ===================================================== */}

     <div
        ref={layersRef}
        className="sm-prelayers"
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      >
        {colors
          .slice(0, 3)
          .map((color, index) => (
            <div
              key={`${color}-${index}`}
              className="sm-prelayer"
              style={{
                background: color,
              }}
            />
          ))}
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className="staggered-menu-header"
        style={{
          position: "relative",
          zIndex: 1000,
        }}
      >
       {logoUrl && (
          <div className="sm-logo">
            <img
              src={logoUrl}
              alt="Logo"
              className="sm-logo-img"
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                onLogoClick?.();
              }}
            />
          </div>
        )}

        {/* =================================================
            BUTTON
        ================================================= */}

        <button
          ref={buttonRef}
          type="button"
          className="sm-toggle"
          style={{
          position: "relative",
          zIndex: 1001,
          pointerEvents: "auto",
        }}
          onClick={handleClick}
          aria-label={
            open
              ? "Close navigation"
              : "Open navigation"
          }
          aria-expanded={open}
        >
          {/* TEXT */}

          <span
            className="sm-toggle-textWrap"
            aria-hidden="true"
          >
            <span
              ref={textInnerRef}
              className="sm-toggle-textInner"
            >
              {textLines.map(
                (line, index) => (
                  <span
                    key={`${line}-${index}`}
                    className="sm-toggle-line"
                  >
                    {line}
                  </span>
                )
              )}
            </span>
          </span>

          {/* PLUS / MINUS */}

          <span
            ref={iconRef}
            className="sm-icon"
            aria-hidden="true"
          >
            {/* horizontal bar */}
            <span
              ref={iconHorizontalRef}
              className="sm-icon-line"
            />

            {/* vertical bar */}
            <span
              ref={iconVerticalRef}
              className="sm-icon-line sm-icon-line-v"
            />
          </span>
        </button>
      </header>
    </div>
  );
};

export default StaggeredMenu;