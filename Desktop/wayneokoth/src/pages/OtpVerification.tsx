import React, { useEffect, useRef, useState } from "react";
import "./OtpVerification.css";

/**
 * OTP Verification — success & error flows
 * ------------------------------------------------
 * Phases:
 *  idle       → four empty boxes, SMS autofill prompt
 *  filling    → digits pop in one by one
 *  verifying  → digits lift into an orbiting ring while the code is checked
 *  success    → checkmark reveal, "Verified successfully"
 *  error      → cross reveal, "Verification failed", shake feedback
 */

type Phase = "idle" | "filling" | "verifying" | "success" | "error";
type Outcome = "success" | "error";

const CORRECT_CODE = "4719";
const WRONG_CODE = "4382";
const DIGIT_STEP_MS = 170;
const FILL_SETTLE_MS = 500;
const VERIFY_MS = 1900;
const RESOLVE_LEAD_MS = 550; // how early the orbit starts tinting toward the outcome

const PARTICLES = [
  { top: "4%", left: "18%", size: 5, delay: 0 },
  { top: "10%", left: "82%", size: 4, delay: 0.3 },
  { top: "28%", left: "4%", size: 3, delay: 0.6 },
  { top: "22%", left: "94%", size: 5, delay: 0.15 },
  { top: "58%", left: "0%", size: 4, delay: 0.45 },
  { top: "66%", left: "96%", size: 3, delay: 0.75 },
  { top: "88%", left: "22%", size: 4, delay: 0.2 },
  { top: "92%", left: "76%", size: 5, delay: 0.5 },
  { top: "46%", left: "10%", size: 3, delay: 0.9 },
  { top: "48%", left: "88%", size: 3, delay: 0.65 },
];

const OtpVerification: React.FC = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [resolveTint, setResolveTint] = useState<Outcome | null>(null);
  const [resendIn, setResendIn] = useState(24);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  // Resend countdown, only ticking while the user is looking at the idle screen.
  useEffect(() => {
    if (phase !== "idle" || resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, resendIn]);

  const run = (outcome: Outcome) => {
    clearTimers();
    setResolveTint(null);
    setDigits(["", "", "", ""]);
    setPhase("filling");

    const code = outcome === "success" ? CORRECT_CODE : WRONG_CODE;

    code.split("").forEach((d, i) => {
      const id = window.setTimeout(() => {
        setDigits((prev) => {
          const next = [...prev];
          next[i] = d;
          return next;
        });
      }, i * DIGIT_STEP_MS);
      timers.current.push(id);
    });

    const verifyStart = code.length * DIGIT_STEP_MS + FILL_SETTLE_MS;
    timers.current.push(
      window.setTimeout(() => setPhase("verifying"), verifyStart)
    );
    timers.current.push(
      window.setTimeout(
        () => setResolveTint(outcome),
        verifyStart + VERIFY_MS - RESOLVE_LEAD_MS
      )
    );
    timers.current.push(
      window.setTimeout(() => setPhase(outcome), verifyStart + VERIFY_MS)
    );
  };

  const reset = () => {
    clearTimers();
    setResolveTint(null);
    setDigits(["", "", "", ""]);
    setResendIn(24);
    setPhase("idle");
  };

  const showInputRow = phase === "idle" || phase === "filling";
  const showOrbit = phase === "verifying";
  const showResult = phase === "success" || phase === "error";

  return (
    <div className="otpv-scene">
      <div className={`otpv-card ${phase === "error" ? "otpv-shake" : ""}`}>
        {showInputRow && (
          <>
            <header className="otpv-header">
              <h1>Verify your number</h1>
              <p>
                Enter the 4-digit code we sent to <b>+1 415 •••0142</b>
              </p>
            </header>

            <div className="otpv-boxes" role="group" aria-label="One-time code">
              {digits.map((d, i) => {
                const isActive =
                  phase === "filling" && digits.slice(0, i).every(Boolean) && !d;
                return (
                  <div
                    key={i}
                    className={`otpv-box ${d ? "otpv-box--filled" : ""} ${
                      isActive ? "otpv-box--active" : ""
                    }`}
                  >
                    <span className={d ? "otpv-pop" : ""}>{d}</span>
                    {isActive && <i className="otpv-caret" />}
                  </div>
                );
              })}
            </div>

            <p className="otpv-resend">
              Didn't receive the code?{" "}
              <span>
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </span>
            </p>

            <div className="otpv-sms">
              <span className="otpv-sms-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5v-3.5H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="otpv-sms-text">
                <p className="otpv-sms-label">Message · OTP</p>
                <p>
                  <b>{CORRECT_CODE}</b> is your verification code.
                </p>
              </div>
              <button
                className="otpv-fill-btn"
                onClick={() => run("success")}
                disabled={phase === "filling"}
              >
                Fill
              </button>
            </div>

            <button className="otpv-ghost-link" onClick={() => run("error")}>
              Simulate an incorrect code
            </button>
          </>
        )}

        {showOrbit && (
          <div className="otpv-verifying">
            <p className="otpv-verifying-label">Verifying your code…</p>
            <div
              className={`otpv-orbit ${
                resolveTint ? `otpv-orbit--${resolveTint}` : ""
              }`}
            >
              <div className="otpv-orbit-ring" />
              <div className="otpv-orbit-dot" />
              {digits.map((d, i) => (
                <div
                  className="otpv-pivot"
                  key={i}
                  style={{ animationDelay: `${-i * 0.55}s` }}
                >
                  <div
                    className="otpv-orbit-item"
                    style={{ animationDelay: `${-i * 0.55}s` }}
                  >
                    {d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showResult && (
          <div className={`otpv-result otpv-result--${phase}`}>
            <div className="otpv-badge">
              <span className="otpv-badge-particles">
                {PARTICLES.map((p, i) => (
                  <i
                    key={i}
                    style={{
                      top: p.top,
                      left: p.left,
                      width: p.size,
                      height: p.size,
                      animationDelay: `${p.delay}s`,
                    }}
                  />
                ))}
              </span>
              <span className="otpv-badge-ring otpv-badge-ring--outer" />
              <span className="otpv-badge-ring otpv-badge-ring--inner">
                {phase === "success" ? (
                  <svg viewBox="0 0 24 24" fill="none" className="otpv-icon-draw">
                    <path
                      d="M5 12.5 10 17.5 19 7"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="otpv-icon-draw">
                    <path
                      d="M6 6l12 12M18 6 6 18"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
            </div>

            {phase === "success" ? (
              <>
                <h2 className="otpv-result-title otpv-result-title--success">
                  Verified successfully
                </h2>
                <p className="otpv-result-sub">Your number has been verified.</p>
                <p className="otpv-result-meta">
                  <LockIcon /> Verified and secure
                </p>
                <button className="otpv-cta otpv-cta--success" onClick={reset}>
                  Continue
                </button>
              </>
            ) : (
              <>
                <h2 className="otpv-result-title otpv-result-title--error">
                  Verification failed
                </h2>
                <p className="otpv-result-sub">
                  That code doesn't match. Give it another try.
                </p>
                <p className="otpv-result-meta otpv-result-meta--error">
                  <WarnIcon /> {WRONG_CODE} was rejected
                </p>
                <button className="otpv-cta otpv-cta--error" onClick={reset}>
                  Try again
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const LockIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden="true">
    <rect
      x="5"
      y="10.5"
      width="14"
      height="9"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M8 10.5V8a4 4 0 1 1 8 0v2.5"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const WarnIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden="true">
    <path
      d="M12 4 21 20H3L12 4Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M12 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="16.7" r="0.9" fill="currentColor" />
  </svg>
);

export default OtpVerification;
