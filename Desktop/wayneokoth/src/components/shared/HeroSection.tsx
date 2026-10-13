import { useEffect, useRef, useState } from "react";
import "../../Herosection.css";

/**
 * HeroSection
 * -----------
 * A cinematic landing hero modeled on Kling AI's pattern:
 *   1. Logo appears alone on a black stage and pulses.
 *   2. Logo dissolves/scales away while a fullscreen video reveals
 *      underneath it (zoom-out "reveal" transition).
 *   3. Nav + headline + CTAs stagger in on top of the video.
 *   4. Once the video finishes its first play-through, the hero settles
 *      to a shorter height so the next section peeks into view, then the
 *      video loops on quietly as ambient background.
 *   5. While idle, the headline/subhead slowly cross-fade between a small
 *      set of slides — slow and understated, since the video is the focal point.
 */

type Stage = "logo-in" | "logo-hold" | "reveal" | "content";

interface Slide {
  headline: string;
  subhead: string;
}

interface HeroSectionProps {
  logoSrc: string;
  videoSrc: string;
  posterSrc?: string;
  eyebrow?: string;
  /** Two or more headline/subhead pairs the hero slowly cross-fades between. */
  slides?: Slide[];
  /** How long each slide is held before crossfading to the next, in ms. */
  slideHoldMs?: number;
  /** Duration of the crossfade itself, in ms. Keep this slow/unhurried. */
  slideFadeMs?: number;
  /** Viewport height the hero settles to once the video finishes its first play. */
  collapsedHeight?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  onPrimaryCta?: () => void;
  onSecondaryCta?: () => void;
}

const TIMING = {
  logoIn: 200, // ms before logo starts fading in
  logoHold: 900, // ms the logo sits/pulses before reveal starts
  reveal: 1100, // ms for the logo -> video dissolve/zoom
};

const DEFAULT_SLIDES: Slide[] = [
  {
    headline: "Turn a single sentence into cinema.",
    subhead:
      "Generate multi-shot, native-audio video from text or a single image — up to 4K, up to 15 seconds, frame-perfect character consistency.",
  },
  {
    headline: "Every frame, exactly as you imagined it.",
    subhead:
      "Element Lock keeps faces, props, and scenes stable across the whole sequence — no flicker, no drift, no distortion.",
  },
  {
    headline: "One take. Any language.",
    subhead:
      "Native lip-sync generates localized dialogue across languages and accents, straight from your script.",
  },
];

export default function HeroSection({
  logoSrc,
  videoSrc,
  posterSrc,
  eyebrow = "Kling AI · Video 3.0",
  slides = DEFAULT_SLIDES,
  slideHoldMs = 5200,
  slideFadeMs = 1000,
  collapsedHeight = "64vh",
  primaryCtaLabel = "Create Now",
  secondaryCtaLabel = "Watch Showcase",
  onPrimaryCta,
  onSecondaryCta,
}: HeroSectionProps) {
  const [stage, setStage] = useState<Stage>("logo-in");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideFading, setSlideFading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCollapsedRef = useRef(false);
  const slideTimers = useRef<number[]>([]);

  // Respect reduced-motion preference throughout.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Intro sequence: logo -> reveal -> content.
  useEffect(() => {
    if (reducedMotion) {
      setStage("content");
      return;
    }

    const t1 = window.setTimeout(() => setStage("logo-hold"), TIMING.logoIn);
    const t2 = window.setTimeout(
      () => setStage("reveal"),
      TIMING.logoIn + TIMING.logoHold
    );
    const t3 = window.setTimeout(() => {
      setStage("content");
      videoRef.current?.play().catch(() => {
        /* autoplay can be blocked; that's fine, poster still shows */
      });
    }, TIMING.logoIn + TIMING.logoHold + TIMING.reveal);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [reducedMotion]);

  // First time the video completes a full play-through, settle the hero
  // upward, then let it loop quietly from then on.
  const handleVideoEnded = () => {
    if (!hasCollapsedRef.current) {
      hasCollapsedRef.current = true;
      setCollapsed(true);
    }
    const el = videoRef.current;
    if (el) {
      el.loop = true;
      el.play().catch(() => {});
    }
  };

  // Slow crossfade between headline/subhead slides. Only runs once the
  // content stage is showing, and pauses cleanly on unmount.
  useEffect(() => {
    if (stage !== "content" || slides.length < 2) return;

    const clearAll = () => {
      slideTimers.current.forEach((id) => window.clearTimeout(id));
      slideTimers.current = [];
    };

    const scheduleNext = () => {
      const holdId = window.setTimeout(() => {
        if (reducedMotion) {
          setSlideIndex((i) => (i + 1) % slides.length);
          scheduleNext();
          return;
        }
        setSlideFading(true);
        const fadeId = window.setTimeout(() => {
          setSlideIndex((i) => (i + 1) % slides.length);
          setSlideFading(false);
          scheduleNext();
        }, slideFadeMs);
        slideTimers.current.push(fadeId);
      }, slideHoldMs);
      slideTimers.current.push(holdId);
    };

    scheduleNext();
    return clearAll;
  }, [stage, slides.length, slideHoldMs, slideFadeMs, reducedMotion]);

  const showLogoStage = stage === "logo-in" || stage === "logo-hold" || stage === "reveal";
  const showVideo = stage === "reveal" || stage === "content";
  const showContent = stage === "content";
  const current = slides[slideIndex] ?? slides[0];

  return (
    <section
      className={["khero", collapsed ? "is-collapsed" : ""].join(" ")}
      style={collapsed ? ({ ["--khero-collapsed-h" as string]: collapsedHeight }) : undefined}
      aria-label="Hero"
    >
      {/* Stage 1 & 2: standalone logo, held then dissolved */}
      {showLogoStage && (
        <div
          className={[
            "khero__logo-stage",
            stage === "logo-in" ? "is-entering" : "",
            stage === "logo-hold" ? "is-holding" : "",
            stage === "reveal" ? "is-leaving" : "",
          ].join(" ")}
          aria-hidden={stage !== "logo-in" && stage !== "logo-hold"}
        >
          <img src={logoSrc} alt="" className="khero__logo" />
        </div>
      )}

      {/* Video layer — plays once, then loops quietly after settling */}
      <div className={["khero__media", showVideo ? "is-visible" : ""].join(" ")}>
        <video
          ref={videoRef}
          className="khero__video"
          src={videoSrc}
          poster={posterSrc}
          muted
          playsInline
          autoPlay={reducedMotion}
          loop={reducedMotion}
          preload="auto"
          onEnded={handleVideoEnded}
        />
        <div className="khero__scrim" />
      </div>

      {/* Stage 3: nav + copy over the video */}
      <header className={["khero__nav", showContent ? "is-visible" : ""].join(" ")}>
        <img src={logoSrc} alt="Kling AI" className="khero__nav-logo" />
        <nav className="khero__nav-links">
          <a href="#tools">AI Tools</a>
          <a href="#api">API</a>
          <a href="#resources">Resources</a>
          <a href="#about">About</a>
        </nav>
        <button className="khero__nav-cta" type="button" onClick={onPrimaryCta}>
          Experience Now
        </button>
      </header>

      <div className={["khero__content", showContent ? "is-visible" : ""].join(" ")}>
        <p className="khero__eyebrow">{eyebrow}</p>

        <h1 className="khero__headline">
          <span className={["khero__slide-text", slideFading ? "is-fading" : ""].join(" ")}>
            {current.headline}
          </span>
        </h1>

        <p className="khero__subhead">
          <span className={["khero__slide-text", slideFading ? "is-fading" : ""].join(" ")}>
            {current.subhead}
          </span>
        </p>

        <div className="khero__actions">
          <button className="khero__btn khero__btn--primary" type="button" onClick={onPrimaryCta}>
            {primaryCtaLabel}
          </button>
          <button className="khero__btn khero__btn--ghost" type="button" onClick={onSecondaryCta}>
            <span className="khero__play-icon" aria-hidden="true" />
            {secondaryCtaLabel}
          </button>
        </div>

        {slides.length > 1 && (
          <div className="khero__slide-dots" role="tablist" aria-label="Hero highlights">
            {slides.map((s, i) => (
              <span
                key={s.headline}
                className={["khero__slide-dot", i === slideIndex ? "is-active" : ""].join(" ")}
                role="tab"
                aria-selected={i === slideIndex}
                aria-label={s.headline}
              />
            ))}
          </div>
        )}
      </div>

      <div className={["khero__scroll-cue", showContent && !collapsed ? "is-visible" : ""].join(" ")}>
        <span />
      </div>
    </section>
  );
}
