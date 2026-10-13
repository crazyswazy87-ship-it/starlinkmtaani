import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import OtpVerification from "./pages/OtpVerification";
import CardShuffle from "./pages/CardShuffle";

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(() => {
    return localStorage.getItem("wayne-loader-seen") !== "true";
  });

  useEffect(() => {
    if (!isLoading) return;

    const timer = window.setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem("wayne-loader-seen", "true");
    }, 800);

    return () => window.clearTimeout(timer);
  }, [isLoading]);
  
  return (
    <>
      {isLoading && (
        <div className="sheng-loader">
          <div id="page">
            <div id="container">
              <div id="ring"></div>
              <div id="ring"></div>
              <div id="ring"></div>
              <div id="ring"></div>

              <div id="h3">Initializing..</div>
            </div>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/shuffle" element={<CardShuffle />} />
        <Route path="*" element={<Home />} />
        <Route path="/otp" element={<OtpVerification/>} />
      </Routes>
    </>
  );
};

export default App;