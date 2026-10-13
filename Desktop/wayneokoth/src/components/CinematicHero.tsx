import { useRef } from "react";
import { useScrollScrub } from "../hooks/useScrollScrub";
import { chapters } from "../types/chapters";

export interface CinematicHeroProps {
  
  /** Path or URL to the video file. Use an all-intra (every frame is a keyframe)
   *  encode for smooth scrubbing — see the encoding note in the README below. */
  videoSrc: string;
  /** Fallback used before the video's real duration has loaded. */
  fallbackDuration?: number;
  /** Source frame rate of the video file. */
  fps?: number;
  studioName?: string;
}

export function CinematicHero({
  videoSrc,
  fallbackDuration = 5,
  fps = 24,
  studioName = "Fernweh Films",
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barTopRef = useRef<HTMLDivElement>(null);
  const barBottomRef = useRef<HTMLDivElement>(null);
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const chapterIndexRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  useScrollScrub(
    {
      containerRef,
      videoRef,
      barTopRef,
      barBottomRef,
      timecodeRef,
      railFillRef,
      cueRef,
      chapterIndexRef,
      chapterRefs,
    },
    {
      chapterCount: chapters.length,
      fps,
      fallbackDuration,
    }
  );

  return (
    <section ref={containerRef} className="hero-two">
      <div className="stage">
        <video
          ref={videoRef}
          className="video"
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
        />

        <div className="scrim" />
        <div className="grain" />
        <div ref={barTopRef} className= "bar barTop" />
        <div
          ref={barBottomRef}
          className="bar barBottom"
        />

        <div className="frame">
          <div className="row">
            <span className="mark">{studioName}</span>
            <span ref={timecodeRef} className="timecode">
              00:00:00:00
            </span>
          </div>

          <div className="chapters">
            {chapters.map((chapter, i) => (
              <div
                key={chapter.eyebrow}
                ref={(el) => {
                  chapterRefs.current[i] = el;
                }}
                className="chapter"
              >
                <div className="chapterEyebrow">{chapter.eyebrow}</div>
                <div
                  className="chapterLine"
                  // Chapter copy is authored in chapters.ts, not user input.
                  dangerouslySetInnerHTML={{ __html: chapter.line }}
                />
              </div>
            ))}
          </div>

          <div className="row rowEnd">
            <span className="count">
              Scene <b ref={chapterIndexRef}>01</b> / {chapters.length}
            </span>
            <div ref={cueRef} className="cue">
              <span>Scroll</span>
              <div className="cueLine" />
            </div>
          </div>
        </div>

        <div className="rail">
          <div ref={railFillRef} className="railFill" />
        </div>
      </div>
    </section>
  );
}

export default CinematicHero;
