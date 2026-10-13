import { useEffect, useRef, type RefObject } from "react";

export interface ScrollScrubRefs {
  /** The tall (e.g. 460vh) scroll container the sticky stage lives inside. */
  containerRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  barTopRef: RefObject<HTMLElement | null>;
  barBottomRef: RefObject<HTMLElement | null>;
  timecodeRef: RefObject<HTMLElement | null>;
  railFillRef: RefObject<HTMLElement | null>;
  cueRef: RefObject<HTMLElement | null>;
  chapterIndexRef: RefObject<HTMLElement | null>;
  /** One ref per chapter, in order. */
  chapterRefs: RefObject<(HTMLElement | null)[]>;
}

export interface ScrollScrubOptions {
  chapterCount: number;
  /** Source frame rate of the video — used to snap seeks to real frames. */
  fps?: number;
  /** Used until the video's real duration loads. */
  fallbackDuration?: number;
  /** Lerp factor per animation frame. Lower = smoother/laggier, higher = snappier. */
  ease?: number;
  /** Progress (0–1) at which the letterbox has fully opened / first chapter may begin. */
  introEnd?: number;
  /** Progress (0–1) after which no chapter is shown. */
  outroStart?: number;
  /** Fraction of each chapter's band spent fading in and fading out. */
  fadeFraction?: number;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Ties a video's currentTime, letterbox bars, timecode readout, progress rail
 * and a set of fading "chapter" captions to scroll position within `containerRef`.
 *
 * The container should be much taller than 100vh (e.g. 460vh) and hold a
 * `position: sticky; top: 0; height: 100vh` stage. Scroll progress through
 * the container's extra height maps 0→1 onto the video's duration.
 *
 * Runs a single continuous rAF loop that eases toward the real scroll
 * position and writes directly to the DOM via refs — deliberately avoids
 * React state so this never triggers a re-render mid-scroll.
 *
 * Seeks are gated behind the video's `seeked` event: only one seek is ever
 * in flight, and if new scroll positions arrive while a seek is still
 * resolving, only the latest one is applied once it's free. Firing
 * `currentTime` on every animation frame without this gate is the usual
 * cause of visible stutter — the browser ends up with a backlog of
 * overlapping seeks it can't keep up with.
 */
export function useScrollScrub(
  refs: ScrollScrubRefs,
  {
    chapterCount,
    fps = 24,
    fallbackDuration = 5,
    ease = 0.09,
    introEnd = 0.06,
    outroStart = 0.98,
    fadeFraction = 0.32,
  }: ScrollScrubOptions
): void {
  const durationRef = useRef(fallbackDuration);
  const displayRef = useRef(0);
  const lastFrameRef = useRef(-1);
  const rafRef = useRef<number | undefined>(undefined);

  // seek-gating state
  const isSeekingRef = useRef(false);
  const pendingTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const video = refs.videoRef.current;
    const container = refs.containerRef.current;
    if (!video || !container) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Make sure the video is never trying to play *and* be scrubbed at the
    // same time — playback decode fights with seek decode and is a common
    // source of lag on lower-end devices.
    if (!reducedMotion) {
      video.pause();
      video.autoplay = false;
    }

    const onLoadedMetadata = () => {
      if (video.duration && isFinite(video.duration)) {
        durationRef.current = video.duration;
      }
    };
    video.addEventListener("loadedmetadata", onLoadedMetadata);

    // --- seek gating -------------------------------------------------
    const seekTo = (time: number) => {
      if (isSeekingRef.current) {
        pendingTimeRef.current = time;
        return;
      }
      isSeekingRef.current = true;
      try {
        video.currentTime = time;
      } catch {
        isSeekingRef.current = false;
      }
    };

    const onSeeked = () => {
      isSeekingRef.current = false;
      if (pendingTimeRef.current !== null) {
        const next = pendingTimeRef.current;
        pendingTimeRef.current = null;
        seekTo(next);
      }
    };
    video.addEventListener("seeked", onSeeked);
    // -------------------------------------------------------------------

    if (reducedMotion) {
      video.loop = true;
      video.muted = true;
      video.play().catch(() => {});
    }

    const band = (outroStart - introEnd) / chapterCount;

    const chapterVisual = (progress: number, i: number) => {
      const start = introEnd + i * band;
      const end = start + band;
      if (progress <= start || progress >= end) {
        return { opacity: 0, y: progress <= start ? 16 : -16 };
      }
      const local = (progress - start) / band;
      const fadeIn = Math.min(1, local / fadeFraction);
      const fadeOut = Math.min(1, (1 - local) / fadeFraction);
      const opacity = Math.min(fadeIn, fadeOut);
      const y = 16 * (1 - fadeIn) - 16 * (1 - fadeOut);
      return { opacity, y };
    };

    const formatTimecode = (t: number) => {
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      const f = Math.floor((t - Math.floor(t)) * fps);
      const pad = (n: number) => (n < 10 ? "0" + n : String(n));
      return `00:${pad(m)}:${pad(s)}:${pad(f)}`;
    };

    const getTargetProgress = () => {
      const rect = container.getBoundingClientRect();
      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      return clamp01(-rect.top / scrollable);
    };

    const render = (progress: number) => {
      if (!reducedMotion && video.readyState >= 1) {
        const duration = durationRef.current;
        const frame = Math.round(progress * duration * fps);
        if (frame !== lastFrameRef.current) {
          lastFrameRef.current = frame;
          seekTo(frame / fps);
        }
      }

      const openAmount = clamp01(progress / (introEnd * 1.4 || 0.16));
      const barVh = 14 * (1 - openAmount);
      if (refs.barTopRef.current)
        refs.barTopRef.current.style.height = `${barVh}vh`;
      if (refs.barBottomRef.current)
        refs.barBottomRef.current.style.height = `${barVh}vh`;

      if (refs.timecodeRef.current) {
        refs.timecodeRef.current.textContent = formatTimecode(
          progress * durationRef.current
        );
      }

      if (refs.railFillRef.current) {
        refs.railFillRef.current.style.width = `${progress * 100}%`;
      }

      if (refs.cueRef.current) {
        refs.cueRef.current.style.opacity = progress > 0.04 ? "0" : "1";
      }

      let activeIndex = 1;
      const chapterEls = refs.chapterRefs.current ?? [];
      for (let i = 0; i < chapterCount; i++) {
        const el = chapterEls[i];
        if (!el) continue;
        const { opacity, y } = chapterVisual(progress, i);
        el.style.opacity = String(opacity);
        el.style.transform = `translate(-50%, calc(-50% + ${y}px))`;
        if (opacity > 0.4) activeIndex = i + 1;
      }
      if (refs.chapterIndexRef.current) {
        refs.chapterIndexRef.current.textContent =
          activeIndex < 10 ? `0${activeIndex}` : String(activeIndex);
      }
    };

    const loop = () => {
      const target = reducedMotion ? 0 : getTargetProgress();
      displayRef.current += (target - displayRef.current) * ease;
      if (Math.abs(target - displayRef.current) < 0.0006) {
        displayRef.current = target;
      }
      render(displayRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("seeked", onSeeked);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterCount, fps, fallbackDuration, ease, introEnd, outroStart, fadeFraction]);
}