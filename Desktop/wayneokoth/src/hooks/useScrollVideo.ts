import {  useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useScrollVideo(
  sectionRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>
) {
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;

    if (!section || !video) return;

    const init = () => {
      const duration = video.duration || 1;

      gsap.to(video, {
        currentTime: duration,
        ease: "none",

        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=3500",
          scrub: 1.5,
          pin: true,
          anticipatePin: 1
        }
      });
    };

    if (video.readyState >= 1) {
      init();
    } else {
      video.addEventListener("loadedmetadata", init);
    }

    return () => {
      video.removeEventListener("loadedmetadata", init);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);
}