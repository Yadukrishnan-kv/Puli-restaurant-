import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import type { DietaryTag, HighlightTag } from "../types/filters";
import { getCountryCodeForHighlightTag, countryCodeToFlag } from "../types/filters";
import { useFilter } from "../context/FilterContext";
import { AppIcon, getDietaryIconName, getHighlightIconName } from "./AppIcon";
import { SearchBar } from "./SearchBar";

const HIDE_TAGS: DietaryTag[] = ["dairy", "nuts", "gluten", "honey"];

const SHOW_TAGS: HighlightTag[] = [
  "chefSignature",
  "chefSpecial",
  "popular",
  "new",
  "vegan",
  "vegetarian",
  "containsEgg",
  "nonVegetarian",
  "hot",
  "extraHot",
  "japan",
  "china",
  "thailand",
  "southKorea",
  "india",
  "vietnam",
  "malaysia",
  "indonesia",
  "hawaii",
  "singapore",
  "lebanon",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Top offset in px (e.g. from getBoundingClientRect().bottom) for fixed positioning */
  top?: number;
  /** When true, show search bar at top of dropdown (e.g. for mobile) */
  showSearchInDropdown?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export const SearchMegaDropdown: React.FC<Props> = ({
  isOpen,
  onClose,
  anchorRef,
  top = 56,
  showSearchInDropdown = false,
  searchValue = "",
  onSearchChange,
}) => {
  const { t } = useTranslation();
  const {
    hiddenAllergens,
    highlightFilters,
    toggleHiddenAllergen,
    toggleHighlight,
    clearFilters,
  } = useFilter();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        anchorRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className="search-mega-dropdown"
          style={{ top: `${top}px` }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="search-mega-dropdown__inner">
            <div className="search-mega-dropdown__header">
              <span className="search-mega-dropdown__title">{t("filters")}</span>
              <div className="search-mega-dropdown__header-actions">
                <button
                  type="button"
                  className="search-mega-dropdown__clear"
                  onClick={clearFilters}
                >
                  {t("clearFilters")}
                </button>
                <button
                  type="button"
                  className="search-mega-dropdown__close"
                  aria-label={t("close")}
                  onClick={onClose}
                >
                  <AppIcon name="xmark" size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {showSearchInDropdown && onSearchChange && (
              <div className="search-mega-dropdown__search-wrap">
                <SearchBar
                  value={searchValue}
                  onChange={onSearchChange}
                  onFocus={undefined}
                />
              </div>
            )}

            <section className="search-mega-dropdown__section">
              <h3 className="search-mega-dropdown__section-title">
                {t("hideWith")}
              </h3>
              <div className="search-mega-dropdown__grid">
                {HIDE_TAGS.map((tag) => {
                  const active = hiddenAllergens.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`search-mega-dropdown__row ${active ? "search-mega-dropdown__row--active" : ""}`}
                      onClick={() => toggleHiddenAllergen(tag)}
                    >
                      <span className="search-mega-dropdown__icon" aria-hidden>
                        <AppIcon name={getDietaryIconName(tag)} size={20} strokeWidth={2} />
                      </span>
                      <span className="search-mega-dropdown__label">{t(tag)}</span>
                      <span className={`search-mega-dropdown__switch ${active ? "search-mega-dropdown__switch--on" : ""}`} aria-hidden>
                        <span className="search-mega-dropdown__switch-thumb" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="search-mega-dropdown__section">
              <h3 className="search-mega-dropdown__section-title">
                {t("showOnly")}
              </h3>
              <div className="search-mega-dropdown__grid">
                {SHOW_TAGS.map((tag) => {
                  const active = highlightFilters.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`search-mega-dropdown__row ${active ? "search-mega-dropdown__row--active" : ""}`}
                      onClick={() => toggleHighlight(tag)}
                    >
                      <span className="search-mega-dropdown__icon" aria-hidden>
                        {getCountryCodeForHighlightTag(tag) ? (
                          <span className="search-mega-dropdown__flag" title={t(tag)}>
                            {countryCodeToFlag(getCountryCodeForHighlightTag(tag)!)}
                          </span>
                        ) : (
                          <AppIcon name={getHighlightIconName(tag)} size={20} strokeWidth={2} />
                        )}
                      </span>
                      <span className="search-mega-dropdown__label">{t(tag)}</span>
                      <span className={`search-mega-dropdown__switch ${active ? "search-mega-dropdown__switch--on" : ""}`} aria-hidden>
                        <span className="search-mega-dropdown__switch-thumb" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <p className="search-mega-dropdown__advisory">
              Please advise of any dietary requirements or allergies and our chefs will be delighted to assist.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
