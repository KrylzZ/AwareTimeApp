import React, { useEffect, useState } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import "./darkmode.css";

const DarkMode = () => {
  const [isDark, setIsDark] = useState(
    () =>
      localStorage.getItem("theme") === "dark" ||
      document.body.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.body.setAttribute("data-theme", nextIsDark ? "dark" : "light");
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
  };

  return (
    <button
      type="button"
      className={`theme-toggle${isDark ? " is-dark" : ""}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle-thumb" />
      <MdLightMode className="theme-icon theme-icon-light" />
      <MdDarkMode className="theme-icon theme-icon-dark" />
    </button>
  );
};

export default DarkMode;
