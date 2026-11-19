import React, { useState, useEffect } from "react";
import BeatLoader from "react-spinners/BeatLoader";
import "./styles/Home.css";
import Navbar from "./Navbar";
import Profile from "./Profile";
import Secondary from "./Secondary";
import { Outlet, useLocation } from "react-router-dom";

const Home = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1200);
  }, []);

  const showProfile = location.pathname === "/Home/calendar";

  return (
    <>
      {loading ? (
        <BeatLoader
          color={"#39A7FF"}
          loading={loading}
          size={50}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      ) : (
        <div className="main-home-container">
          <Navbar />
          <div className="home-main-column">
            <header className="home-topbar">
              <div className="home-topbar-brand">
                <span className="home-topbar-mark">A</span>
                <span>AwareTime</span>
              </div>
              <Secondary />
            </header>
            <main className={`home-route-content${showProfile ? " has-profile" : ""}`}>
              <Outlet />
              {showProfile && <Profile />}
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
