import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MenuItemData, CategoryData } from "@/lib/customerAPI";
import { useTranslation } from "react-i18next";
import { getCountryCodeForItem, isVegetarianSection, countryCodeToFlag } from "@/lib/dataConverters";
import { AppIcon, getDietaryIconName } from "./AppIcon";
import type { DietaryTag } from "../types/filters";

const COUNTRY_CODE_TO_I18N: Record<string, string> = {
  IN: "india", JP: "japan", TH: "thailand", CN: "china", KR: "southKorea",
  LB: "lebanon", VN: "vietnam", MY: "malaysia", ID: "indonesia", SG: "singapore", SA: "countrySA",
};

const SPICE_LABELS: Record<number, string> = {
  0: "spiceLevelMild",
  1: "spiceLevelMedium",
  2: "spiceLevelHot",
  3: "spiceLevelExtreme",
};

const MODAL_BAR_BG = "#1e3a5f";
const MODAL_TAB_ACTIVE_BG = "#1e3a5f";
const FALLBACK_DISH_IMAGE = "https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=1200";

function formatTagLabel(tag: string): string {
  return tag
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizeTagToken(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

const DIETARY_TAG_KEY_MAP: Record<string, "vegan" | "vegetarian" | "containsEgg" | "nonVegetarian"> = {
  vegan: "vegan",
  vegetarian: "vegetarian",
  veg: "vegetarian",
  containsegg: "containsEgg",
  egg: "containsEgg",
  eggs: "containsEgg",
  nonvegetarian: "nonVegetarian",
  nonveg: "nonVegetarian",
  nveg: "nonVegetarian",
  nv: "nonVegetarian",
};

const CHEF_SIGNATURE_ALIASES = [
  "chefsignature",
  "chefspecial",
  "chefspecialty",
  "chefspeciality",
  "chefspecials",
  "chefsignaturedish",
  "recommended",
  "recommend",
  "chefselection",
  "chefsselection",
];

interface Props {
  item: MenuItemData | null;
  onClose: () => void;
  category?: CategoryData;
}

export const DishModal: React.FC<Props> = ({ item, onClose, category }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"description" | "information">("description");

  if (!item) return null;

  const isArabic = i18n.language === "ar";
  const normalizedTokens = new Set<string>();
  (item.tags ?? []).forEach((tag) => {
    const token = normalizeTagToken(tag);
    if (token) normalizedTokens.add(token);
  });
  (item.dietary_tags ?? []).forEach((tag) => {
    const token = normalizeTagToken(tag);
    if (token) normalizedTokens.add(token);
  });

  const isChefSignature = CHEF_SIGNATURE_ALIASES.some((alias) => normalizedTokens.has(alias));
  const countryCode = getCountryCodeForItem(item);
  const countryName =
    (isArabic ? item.country_name_ar : item.country_name_en) ||
    item.country_name_en ||
    item.country_name_ar ||
    (countryCode && COUNTRY_CODE_TO_I18N[countryCode] ? t(COUNTRY_CODE_TO_I18N[countryCode]) : countryCode);
  const isVegetarian = isVegetarianSection(item.section_id);
  const dietaryTagKeys = Array.from(
    new Set(
      Array.from(normalizedTokens)
        .map((tag) => DIETARY_TAG_KEY_MAP[tag])
        .filter(Boolean),
    ),
  );
  const nonDietaryTags = (item.tags ?? []).filter((tag) => {
    const normalized = normalizeTagToken(tag);
    if (!normalized) return false;
    if (DIETARY_TAG_KEY_MAP[normalized]) return false;
    if (CHEF_SIGNATURE_ALIASES.includes(normalized)) return false;
    return true;
  });
  const itemName = (isArabic ? item.name_ar : item.name_en) || item.name_en || item.name_ar;
  const itemDescription =
    (isArabic ? item.description_ar : item.description_en) || item.description_en || item.description_ar;
  const categoryName =
    (isArabic ? category?.name_ar : category?.name_en) || category?.name_en || category?.name_ar || item.section_id || item.category_id || "Menu";
  const subtitleText = item.section_id || categoryName;
  const highlightItems = Array.from(
    new Map(
      [
        ...(isChefSignature
          ? [["chefSignature", { label: t("chefSignature"), icon: "chefSignature" as const }]]
          : []),
        ...nonDietaryTags.map((tag) => {
          const normalized = normalizeTagToken(tag);
          if (CHEF_SIGNATURE_ALIASES.includes(normalized)) {
            return ["chefSignature", { label: t("chefSignature"), icon: "chefSignature" as const }];
          }
          return [normalized, { label: formatTagLabel(tag), icon: null }];
        }),
      ] as Array<[string, { label: string; icon: "chefSignature" | null }]>,
    ).values(),
  );
  const dishImage = item.image_url || FALLBACK_DISH_IMAGE;

  return (
    <AnimatePresence>
      <>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="dish-modal__backdrop"
        />
        <motion.div
          key="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dish-modal-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="dish-modal"
        >
          {/* Image */}
          <div className="dish-modal__image-wrap">
            <div
              className="dish-modal__image"
              style={{
                backgroundImage: `url('${dishImage}')`,
              }}
            />
          </div>

          {/* Tabs */}
          <div className="dish-modal__tabs">
            <button
              type="button"
              className={`dish-modal__tab ${activeTab === "description" ? "dish-modal__tab--active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              {t("description").toUpperCase()}
            </button>
            <button
              type="button"
              className={`dish-modal__tab ${activeTab === "information" ? "dish-modal__tab--active" : ""}`}
              onClick={() => setActiveTab("information")}
            >
              {t("information").toUpperCase()}
            </button>
          </div>

          {/* Content */}
          <div className="dish-modal__body">
            {activeTab === "description" && (
              <>
                <div className="dish-modal__title-row">
                  <div className="dish-modal__title-block">
                    <h2 id="dish-modal-title" className="dish-modal__title">{itemName}</h2>
                    {subtitleText && (
                      <p className="dish-modal__sub">{subtitleText}</p>
                    )}
                  </div>
                  <div className="dish-modal__price-wrap">
                    <AppIcon name="price" size={18} strokeWidth={2} aria-hidden />
                    <span className="price dish-modal__price">
                      {typeof item.price === "string" ? item.price : item.price.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="dish-modal__attributes">
                  {item.calories && String(item.calories).trim() !== "" && (
                    <span className="dish-modal__attr">
                      <AppIcon name="calories" size={16} strokeWidth={2} aria-hidden />
                      {item.calories} {t("calories")}
                    </span>
                  )}
                  {dietaryTagKeys.map((tagKey) => (
                    <span key={tagKey} className="dish-modal__attr" title={t(tagKey)}>
                      <AppIcon
                        name={
                          tagKey === "vegan"
                            ? "vegan"
                            : tagKey === "vegetarian"
                              ? "vegetarian"
                              : tagKey === "containsEgg"
                                ? "containsEgg"
                                : "nonVegetarian"
                        }
                        size={16}
                        strokeWidth={2}
                        aria-hidden
                        className={
                          tagKey === "nonVegetarian"
                            ? "icon-nonveg-modal"
                            : tagKey === "vegetarian"
                            ? "icon-veg-modal"
                            : tagKey === "containsEgg"
                            ? "icon-egg-modal"
                            : undefined
                        }
                      />
                      {t(tagKey)}
                    </span>
                  ))}
                  {countryCode && (
                    <span className="dish-modal__attr" title={COUNTRY_CODE_TO_I18N[countryCode] ? t(COUNTRY_CODE_TO_I18N[countryCode]) : countryCode}>
                      <span className="dish-modal__flag">{countryCodeToFlag(countryCode)}</span>
                    </span>
                  )}
                  {isVegetarian && (
                    <span className="dish-modal__attr" title={t("vegetarianDish")}>
                      <AppIcon name="vegetarian" size={16} strokeWidth={2} aria-hidden />
                      {t("vegetarian")}
                    </span>
                  )}
                  {item.allergens?.map((a) => (
                    <span key={a} className="dish-modal__attr">
                      <AppIcon name={getDietaryIconName(a as DietaryTag)} size={16} strokeWidth={2} aria-hidden />
                      {t(a)}
                    </span>
                  ))}
                </div>
                <p className="dish-modal__description">{itemDescription}</p>
              </>
            )}
            {activeTab === "information" && (
              <div className="dish-modal__info">
                {/* Section display removed: property not present on MenuItemData */}
                <div className="dish-modal__detail-row">
                  <span className="dish-modal__detail-label">{t("detailCategory")}</span>
                  <span className="dish-modal__detail-value">{categoryName}</span>
                </div>
                {countryName && (
                  <div className="dish-modal__detail-row">
                    <span className="dish-modal__detail-label">{t("detailCountry")}</span>
                    <span className="dish-modal__detail-value">
                      {countryCode && <span className="dish-modal__flag">{countryCodeToFlag(countryCode)}</span>}
                      {countryName}
                    </span>
                  </div>
                )}
                <div className="dish-modal__detail-row">
                  <span className="dish-modal__detail-label">{t("detailDietary")}</span>
                  <span className="dish-modal__detail-value dish-modal__detail-value--wrap">
                    {dietaryTagKeys.length > 0
                      ? dietaryTagKeys.map((tagKey) => (
                          <span key={tagKey} className="dish-modal__allergen-tag">{t(tagKey)}</span>
                        ))
                      : (isVegetarian ? t("vegetarianDish") : t("nonVegetarian"))}
                  </span>
                </div>
                {highlightItems.length > 0 && (
                  <div className="dish-modal__detail-row">
                    <span className="dish-modal__detail-label">{t("detailHighlight")}</span>
                    <span className="dish-modal__detail-value dish-modal__detail-value--wrap">
                      {highlightItems.map((item) => (
                        <span key={item.label} className="dish-modal__allergen-tag">
                          {item.icon === "chefSignature" && (
                            <AppIcon name="chefSignature" size={14} strokeWidth={2} aria-hidden />
                          )}
                          {item.label}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                <div className="dish-modal__detail-row">
                  <span className="dish-modal__detail-label">{t("detailSpiceLevel")}</span>
                  <span className="dish-modal__detail-value">
                    {t(SPICE_LABELS[item.spice_level ?? (item.tags?.includes("extraHot") ? 3 : item.tags?.includes("hot") ? 2 : 0)] ?? "spiceLevelMild")}
                  </span>
                </div>
                {item.calories && String(item.calories).trim() !== "" && (
                  <div className="dish-modal__detail-row">
                    <span className="dish-modal__detail-label">{t("detailCalories")}</span>
                    <span className="dish-modal__detail-value">
                      <AppIcon name="calories" size={16} strokeWidth={2} aria-hidden />
                      {item.calories} {t("calories")}
                    </span>
                  </div>
                )}
                {item.allergens && item.allergens.length > 0 && (
                  <div className="dish-modal__detail-row">
                    <span className="dish-modal__detail-label">{t("detailAllergens")}</span>
                    <span className="dish-modal__detail-value dish-modal__detail-value--wrap">
                      {item.allergens.map((a) => (
                        <span key={a} className="dish-modal__allergen-tag">
                          <AppIcon name={getDietaryIconName(a as DietaryTag)} size={14} strokeWidth={2} aria-hidden />
                          {t(a)}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                <div className="dish-modal__detail-row dish-modal__detail-row--price">
                  <span className="dish-modal__detail-label">{t("detailPrice")}</span>
                  <span className="dish-modal__detail-value dish-modal__price-wrap">
                    <AppIcon name="price" size={18} strokeWidth={2} aria-hidden />
                    <span className="price">{typeof item.price === "string" ? item.price : item.price.toFixed(0)}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Share + Close */}
            <div className="dish-modal__share">
              <div className="dish-modal__share-row">
                <div>
                  <span className="dish-modal__share-label">{t("share")}</span>
                  <div className="dish-modal__share-icons">
                    <a href="#" className="dish-modal__share-link" aria-label="Facebook">
                      <AppIcon name="facebook" size={20} strokeWidth={2} />
                    </a>
                    <a href="#" className="dish-modal__share-link" aria-label="Instagram">
                      <AppIcon name="instagram" size={20} strokeWidth={2} />
                    </a>
                    <a href="#" className="dish-modal__share-link" aria-label="Youtube">
                      <AppIcon name="youtube" size={20} strokeWidth={2} />
                    </a>
                  </div>
                </div>
                <button type="button" className="dish-modal__btn-close" onClick={onClose}>
                  <AppIcon name="xmark" size={16} strokeWidth={2} aria-hidden />
                  {t("close").toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};
