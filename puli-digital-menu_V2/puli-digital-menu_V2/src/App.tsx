import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { IconoirProvider } from "iconoir-react";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { CategoryPage } from "./pages/CategoryPage";
import { useTheme } from "./hooks/useTheme";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { FilterProvider } from "./context/FilterContext";
import { MenuProvider } from "./context/MenuContext";
import { iconDefaultProps } from "./components/AppIcon";

const AppShell: React.FC = () => {
  const [theme, setTheme] = useTheme();
  const { i18n } = useTranslation();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <IconoirProvider iconProps={iconDefaultProps}>
    <FilterProvider>
    <MenuProvider>
    <div className="app-root">
      <Header
        theme={theme}
        onThemeChange={setTheme}
        scrolled={scrolled}
      />
      <AnimatePresence mode="wait">
        <motion.div
          className="app-content"
          key={location.pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
    </MenuProvider>
    </FilterProvider>
    </IconoirProvider>
  );
};

export const App: React.FC = () => <AppShell />;

