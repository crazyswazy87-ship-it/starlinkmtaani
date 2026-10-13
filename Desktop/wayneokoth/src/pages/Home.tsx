import React, { useState } from "react";
import { FaInstagram, FaWhatsapp, FaGithub } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

import Logo from "../../public/assets/images/bseven-white.png";
import ShinyText from "../components/ShinyText";
import StaggeredMenu from "../components/StaggeredMenu";
import SEO from "../components/SEO";
import MetaBalls from "../components/MetaBalls";
import GooeyNav from "../components/shared/GooeyNav";
import LayoutSwitcher from "../components/shared/LayoutSwitcher";
import ColorBends from "../components/shared/ColorBends";
import Ferrofluid from "../components/shared/Ferrofluid";
import CurvedInput from "../components/shared/CurvedInput";
import PixelTransition from "../components/PixelTransition";

import mboto from "../../public/assets/images/swazyy.png"
import ArrowFillButton from "../components/shared/ArrowFillButton";

const MAX_REVEAL = 230;

type PageRoute = "/" | "/work" | "/contact";



const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [reveal, setReveal] = useState(0);

  type BackgroundType = "metaballs" | "ferrofluid" | "colorbends";

  const [background, setBackground] =
    useState<BackgroundType>("ferrofluid");

  const currentPath: PageRoute =
    location.pathname === "/work" || location.pathname === "/contact"
      ? location.pathname
      : "/";

  const toggleQuickSettings = () => {
    setReveal((current) => (current > 0 ? 0 : MAX_REVEAL));
  };

  const progress = reveal / MAX_REVEAL;

  const scale = 1 - progress * 0.06;
  const radius = 8 + progress * 26;

  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNavigation = (path: string) => {
  if (path === location.pathname || isTransitioning) return;

  setIsTransitioning(true);

  // Let the exit animation play first
  window.setTimeout(() => {
    navigate(path);

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });

    // Give the new page its entrance animation
    window.setTimeout(() => {
      setIsTransitioning(false);
    }, 550);
  }, 550);
};
  

  const items = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Work",
      href: "/work",
    },
    {
      label: "Contact",
      href: "/contact",
    },
  ];


  return (
    <>
      <SEO
        title= "Wayne Okoth"
        description="full stack developer UX/UI base in Kenya"
        path="/"
      />

      <div className="quick-settings-page">
        {/* =====================================================
            QUICK SETTINGS BACKGROUND
        ===================================================== */}

        <div className="quick-settings-background">
          <p>
            <ShinyText
              text="A Block Seven Creation"
              className="ans"
              speed={2}
              shineColor="#fff"
            />
          </p>

          <div className="social-links">
            <a
              href="https://www.instagram.com/block.seven_/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram size={18} />
            </a>

            <a
              href="https://wa.me/254703983973"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <FaWhatsapp size={18} />
            </a>

            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <FaGithub size={18} />
            </a>
          </div>

          <div className="background-switcher">
            <button
              type="button"
              className={background === "metaballs" ? "active" : ""}
              onClick={() => setBackground("metaballs")}
            >
              MetaBalls
            </button>

            <button
              type="button"
              className={background === "ferrofluid" ? "active" : ""}
              onClick={() => setBackground("ferrofluid")}
            >
              Ferrofluid
            </button>

            <button
              type="button"
              className={background === "colorbends" ? "active" : ""}
              onClick={() => setBackground("colorbends")}
            >
              Color Bends
            </button>
          </div>
        </div>

        {/* =====================================================
            MAIN APP SHELL
        ===================================================== */}

        <div
          className={`quick-settings-home ${
            isTransitioning ? "is-transitioning" : ""
          }`}
          style={{
            transform: `
              translateY(${reveal}px)
              scale(${scale})
            `,
            borderRadius: `
              ${radius}px
              ${radius}px
              0
              0
            `,
            boxShadow:
              progress > 0.02
                ? "0 -14px 30px rgba(0,0,0,0.45)"
                : "none",
          }}
        >
          <div className="home-page-content">
            <div className="hero">
             {/* =================================================
                  ANIMATED BACKGROUND
              ================================================= */}

              <div className="hero-meta-background">

                {background === "metaballs" && (
                  <MetaBalls
                    color="#ffffff"
                    cursorBallColor="#ffffff"
                    cursorBallSize={1}
                    ballCount={17}
                    animationSize={30}
                    enableMouseInteraction
                    enableTransparency
                    hoverSmoothness={0.20}
                    clumpFactor={1.4}
                    speed={0.2}
                  />
                )}

                {background === "ferrofluid" && (
                  <Ferrofluid
                    colors={["#ffffff", "#ffffff", "#ffffff"]}
                    speed={0.4}
                    scale={1.6}
                    turbulence={1}
                    fluidity={0.1}
                    rimWidth={0.2}
                    sharpness={2.5}
                    shimmer={1.5}
                    glow={2}
                    flowDirection="down"
                    opacity={1}
                    mouseInteraction
                    mouseStrength={1}
                    mouseRadius={0.35}
                  />
                )}

                {background === "colorbends" && (
                  <ColorBends
                    colors={["#00ff04", "#f2f1ec", "#c9d006"]}
                    rotation={90}
                    speed={0.2}
                    scale={1}
                    frequency={1}
                    warpStrength={1}
                    mouseInfluence={1}
                    noise={0.15}
                    parallax={0.5}
                    iterations={1}
                    intensity={1.5}
                    bandWidth={6}
                    transparent
                    autoRotate={0}
                    color="#A855F7"
                  />
                )}

              </div>

              {/* =================================================
                  FOREGROUND
              ================================================= */}

              <div className="hero-content">
                {/* =================================================
                    TOP SETTINGS / LOGO BAR
                ================================================= */}

                <div className="topbar">
                  <StaggeredMenu
                    position="right"
                    logoUrl={Logo}
                    menuButtonColor="#fff"
                    openMenuButtonColor="#fff"
                    accentColor="#06bb28"
                    changeMenuColorOnOpen
                    colors={["#7cff67", "#ff2727"]}
                    onClick={toggleQuickSettings}
                    onLogoClick={() => {
                      setReveal(0);
                      handleNavigation("/");
                    }}
                  />

                </div>

                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <main className="route-content">
                  <div
                    key={currentPath}
                    className="route-content-inner"
                  >
                    {/* HOME */}
                    {currentPath === "/" && (

                  <div className="home-intro">

                    
                    {/* Pixel intro */}
                    <div className="home-pixel">
                      <PixelTransition
                         firstContent={
                          <img
                            src={mboto}
                            alt="default pixel transition content, a cat!"
                            style={{ width: "96%", height: "98%", objectFit: "cover"}}
                          />
                        }
                        secondContent={
                          <div className="pixel-intro-content pixel-second">
                            <span>Let me work on your website today!</span>
                          </div>
                        }
                        gridSize={8}
                        pixelColor="#ffffff"
                        once={false}
                        animationStepDuration={0.4}
                        className="custom-pixel-card"
                      />
                    </div>

                    {/* Intro text */}
                    <div className="intro-text">
                      <span className="intro-greeting">
                        Hi, I’m Wayne Okoth
                      </span>

                      <h1 className="intro-title">
                        UX / UI Designer
                      </h1>
                      

                      <p className="intro-description">
                        I design clean, engaging digital experiences
                        that look great and feel effortless to use.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="route-actions">

                      <ArrowFillButton className="hire-button"
                      onClick={() =>  handleNavigation("/contact")}>
                        Hire me
                      </ArrowFillButton>

                      
                    </div>
                    

                      </div>
                    )}


                    {/* WORK */}
                    {currentPath === "/work" && (
                      <div className="work-grid">

                        <LayoutSwitcher/>

                      </div>
                    )}

                    {/* CONTACT */}
                    {currentPath === "/contact" && (
                      <div className="contact-panel">

                        <CurvedInput
                          showButton
                          showIcon
                          placeholder="Enter email or Phone"
                          buttonText="5207418"
                          cornerRadius={20}
                          borderWidth={1.0}
                          fontSize={16}
                          backgroundColor="#1B1722"
                          textColor="#fffafa"
                          borderColor="#ddea08"
                          buttonColor="#fdfaff"
                          buttonTextColor="#0c0b0b"
                          shadowSize="md"
                        />
                        


                        <div className="social-links-down">
                          <a
                            href="https://www.instagram.com/block.seven_/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                          >
                            <FaInstagram size={18} />
                          </a>

                          <a
                            href="https://wa.me/254703983973"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="WhatsApp"
                          >
                            <FaWhatsapp size={18} />
                          </a>

                          <a
                            href="https://github.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub"
                          >
                            <FaGithub size={18} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </main>

                {/* =================================================
                    FLOATING NAVIGATION
                ================================================= */}

                <div className="hero-floating-nav">
                  <GooeyNav
                    items={items}
                    particleCount={15}
                    particleDistances={[90, 10]}
                    particleR={100}
                    initialActiveIndex={
                      currentPath === "/"
                        ? 0
                        : currentPath === "/work"
                          ? 1
                          : 2
                    }
                    animationTime={600}
                    timeVariance={300}
                    colors={[1, 2, 3, 1, 2, 3, 1, 4]}
                    onItemClick={(item: { href: string }) => {
                      handleNavigation(item.href);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;