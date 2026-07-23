import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Theme } from "../hooks/useTheme";
import { AppIcon } from "./AppIcon";
import { useMenuContext } from "../context/MenuContext";

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const { i18n, t } = useTranslation();
  const isArabic = i18n.language === "ar";

  const theme = (document.documentElement.dataset.theme as Theme) || "light";
  const { settings } = useMenuContext();
  const defaultLogo =
    theme === "light"
      ? "/assets/Logo_EN.svg"
      : "/assets/Logo_lgt_EN.svg";
  const themeLogo = theme === "light" ? settings?.logo_dark_url : settings?.logo_light_url;
  const preferredLogo = themeLogo || settings?.logo_url || defaultLogo;
  const [logoSrc, setLogoSrc] = useState(preferredLogo);

  useEffect(() => {
    setLogoSrc(preferredLogo);
  }, [preferredLogo]);

  const restaurantName =
    (isArabic ? settings?.restaurant_name_ar : settings?.restaurant_name) ||
    settings?.restaurant_name ||
    settings?.restaurant_name_ar ||
    t("restaurantName");

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <img src={logoSrc} alt={restaurantName} className="footer__logo" onError={() => setLogoSrc(defaultLogo)} />
        <div>{t("footerRights", { year, restaurant: restaurantName })}</div>
        <div className="footer__social">
          <a
            href="#"
            aria-label="Facebook"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="footer__icon footer__icon--round">
              <AppIcon name="facebook" size={20} strokeWidth={2} />
            </div>
          </a>
          <a
            href="#"
            aria-label="Instagram"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="footer__icon footer__icon--round">
              <AppIcon name="instagram" size={20} strokeWidth={2} />
            </div>
          </a>
          <a
            href="#"
            aria-label="YouTube"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="footer__icon footer__icon--round">
              <AppIcon name="youtube" size={20} strokeWidth={2} />
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
};

