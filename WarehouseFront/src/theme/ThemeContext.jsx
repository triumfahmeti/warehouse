/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark((v) => !v);

  // Keep the CSS theme attribute synchronized before children read colors.
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light",
  );

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {/* key e forcon re-render të të gjithë fëmijëve */}
      <div key={isDark ? "dark" : "light"} style={{ display: "contents" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
