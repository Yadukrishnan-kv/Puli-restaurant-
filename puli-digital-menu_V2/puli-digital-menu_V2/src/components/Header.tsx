import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Theme } from "../hooks/useTheme";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { SearchBar } from "./SearchBar";
import { SearchMegaDropdown } from "./SearchMegaDropdown";
import { AppIcon } from "./AppIcon";
import { useMenuContext } from "../context/MenuContext";

interface HeaderProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  scrolled: boolean;
}

export const Header: React.FC<HeaderProps> = ({ theme, onThemeChange, scrolled }) => {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const isCategoryPage = location.pathname.startsWith("/category/");
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(56);
  const mobileSearchAnchorRef = useRef<HTMLButtonElement | null>(null);
  const desktopSearchAnchorRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const activeSearchAnchorRef = isMobile ? mobileSearchAnchorRef : desktopSearchAnchorRef;

  useEffect(() => {
    if (!filterDropdownOpen) return;
    if (isMobile && headerRef.current) {
      setDropdownTop(headerRef.current.getBoundingClientRect().bottom);
    } else if (activeSearchAnchorRef.current) {
      setDropdownTop(activeSearchAnchorRef.current.getBoundingClientRect().bottom + 4);
    }
  }, [filterDropdownOpen, isMobile, activeSearchAnchorRef]);

  const { settings } = useMenuContext();
  const isArabic = i18n.language === "ar";
  const defaultLogo =
    theme === "light"
      ? "/assets/Logo_EN.svg"
      : "/assets/Logo_lgt_EN.svg";
  const enThemeLogo = theme === "light" ? settings?.logo_dark_url : settings?.logo_light_url;
  const arThemeLogo = theme === "light" ? settings?.logo_dark_ar_url : settings?.logo_light_ar_url;
  // Arabic site prefers the Arabic logo, falling back to the English one when not set.
  const themeLogo = (isArabic ? arThemeLogo : enThemeLogo) || enThemeLogo;
  const preferredLogo = themeLogo || settings?.logo_url || defaultLogo;
  const [logoSrc, setLogoSrc] = useState(preferredLogo);

  useEffect(() => {
    setLogoSrc(preferredLogo);
  }, [preferredLogo]);

  const logoAlt =
    (isArabic ? settings?.restaurant_name_ar : settings?.restaurant_name) ||
    settings?.restaurant_name ||
    settings?.restaurant_name_ar ||
    t("restaurantName");

  const toggleLanguage = () => {
    const nextLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(nextLang);
    document.documentElement.lang = nextLang;
    document.documentElement.dir = nextLang === "ar" ? "rtl" : "ltr";
  };

  const toggleTheme = () => {
    onThemeChange(theme === "dark" ? "light" : "dark");
  };

  const dispatchFocusSearch = () => {
    window.dispatchEvent(new Event("puli-focus-search"));
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    window.sessionStorage.setItem("puli-search-query", value);
    window.dispatchEvent(new CustomEvent("puli-search-query", { detail: value }));
  };

  useEffect(() => {
    if (!isCategoryPage) {
      setSearchValue("");
      window.sessionStorage.removeItem("puli-search-query");
      return;
    }

    const persisted = window.sessionStorage.getItem("puli-search-query") || "";
    setSearchValue(persisted);
  }, [isCategoryPage, location.pathname]);

  return (
    <header
      ref={headerRef}
      className={`header ${scrolled ? "header--scrolled" : ""} ${
        theme === "light" ? "header--light" : "header--dark"
      }`}
    >
      <div className="container">
        <div className="header__inner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {isCategoryPage && (
              <motion.button
                type="button"
                aria-label={t("categoriesTitle")}
                whileTap={{ scale: 0.94 }}
                onClick={() => navigate("/")}
                className="header__back"
              >
                <AppIcon name="arrowLeft" size={18} className="header__back-icon" />
              </motion.button>
            )}
            <Link to="/" style={{ display: "flex", alignItems: "center" }}>
              <img
                src={logoSrc}
                alt={logoAlt}
                className="header__logo"
                style={{ height: 32, width: "auto", display: "block" }}
                onError={() => setLogoSrc(defaultLogo)}
              />
            </Link>
          </div>

          <div className="header__actions">
            {isCategoryPage && (
              <>
                {isMobile ? (
                  <motion.button
                    ref={mobileSearchAnchorRef}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setFilterDropdownOpen(true)}
                    className="header__search-btn header__theme"
                    aria-label={t("searchPlaceholder")}
                  >
                    <AppIcon name="search" size={20} className="header__theme-icon" />
                  </motion.button>
                ) : (
                  <div
                    ref={desktopSearchAnchorRef}
                    className="header__search-wrap"
                    style={{
                      position: "relative",
                      flex: 1,
                      maxWidth: 380,
                      minWidth: 260,
                    }}
                  >
                    <SearchBar
                      value={searchValue}
                      onChange={handleSearchChange}
                      onFocus={() => setFilterDropdownOpen(true)}
                    />
                  </div>
                )}
                <SearchMegaDropdown
                  isOpen={filterDropdownOpen}
                  onClose={() => setFilterDropdownOpen(false)}
                  anchorRef={activeSearchAnchorRef}
                  top={dropdownTop}
                  searchValue={searchValue}
                  onSearchChange={handleSearchChange}
                  showSearchInDropdown={isMobile}
                />
              </>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={toggleLanguage}
              className="header__lang"
            >
              {i18n.language === "ar" ? "EN" : "AR"}
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="header__theme"
            >
              {theme === "dark" ? (
                <AppIcon name="moon" size={18} className="header__theme-icon" />
              ) : (
                <AppIcon name="sun" size={18} className="header__theme-icon" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};

