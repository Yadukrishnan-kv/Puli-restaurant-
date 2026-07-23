import { motion } from "framer-motion";
import type { MenuItemData } from "@/lib/customerAPI";
import type { DietaryTag } from "../types/filters";
import { useTranslation } from "react-i18next";
import { getCountryCodeForItem } from "@/lib/dataConverters";
import { AppIcon, getDietaryIconName } from "./AppIcon";
import { IconWithTooltip } from "./IconWithTooltip";

const COUNTRY_CODE_TO_I18N: Record<string, string> = {
  IN: "india",
  JP: "japan",
  TH: "thailand",
  CN: "china",
  KR: "southKorea",
  LB: "lebanon",
  VN: "vietnam",
  MY: "malaysia",
  ID: "indonesia",
  SG: "singapore",
  SA: "countrySA",
};

type CardSpiceLevel = "mild" | "medium" | "hot";

const SPICE_LABELS: Record<CardSpiceLevel, string> = {
  mild: "spiceLevelMild",
  medium: "spiceLevelMedium",
  hot: "spiceLevelHot",
};

const SPICE_ICON_COUNT: Record<CardSpiceLevel, number> = {
  mild: 1,
  medium: 2,
  hot: 3,
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
const VEGAN_ALIASES = ["vegan"];
const VEGETARIAN_ALIASES = ["vegetarian", "veg"];
const NON_VEGETARIAN_ALIASES = ["nonvegetarian", "nonveg", "nveg", "nv"];
const CONTAINS_EGG_ALIASES = ["containsegg", "egg", "eggs"];
const HOT_ALIASES = ["hot", "spicy"];
const EXTRA_HOT_ALIASES = ["extrahot", "veryhot", "superhot", "extraspicy"];
const POPULAR_ALIASES = ["popular"];

function normalizeToken(value?: string | null): string {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

function hasAnyAlias(tokens: Set<string>, aliases: string[]): boolean {
  return aliases.some((alias) => tokens.has(alias));
}

interface Props {
  item: MenuItemData;
  onOpen: () => void;
  index: number;
  resolvedCountryName?: string;
  resolvedCountryFlagUrl?: string;
}

export const DishItem: React.FC<Props> = ({ item, onOpen, index, resolvedCountryName, resolvedCountryFlagUrl }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const itemName = (isArabic ? item.name_ar : item.name_en) || item.name_en || item.name_ar;
  const itemDescription =
    (isArabic ? item.description_ar : item.description_en) || item.description_en || item.description_ar;

  const normalizedTokens = new Set<string>();
  (item.tags ?? []).forEach((tag) => {
    const token = normalizeToken(tag);
    if (token) normalizedTokens.add(token);
  });
  (item.dietary_tags ?? []).forEach((tag) => {
    const token = normalizeToken(tag);
    if (token) normalizedTokens.add(token);
  });
  const normalizedSection = normalizeToken(item.section_id);
  if (normalizedSection) normalizedTokens.add(normalizedSection);

  const isChefSignature =
    (item.tags?.includes("chefSignature") ?? false) ||
    hasAnyAlias(normalizedTokens, CHEF_SIGNATURE_ALIASES);
  const hasPopular = hasAnyAlias(normalizedTokens, POPULAR_ALIASES);
  const visibleTagKeys: Array<"chefSignature"> = [];
  const showChefSignatureBadge = isChefSignature || hasPopular;
  if (showChefSignatureBadge) visibleTagKeys.push("chefSignature");

  const tagLabels: Record<"chefSignature", string> = {
    chefSignature: t("chefSignature"),
  };

  const allergenList = (item.allergens ?? []) as DietaryTag[];
  const countryCode = getCountryCodeForItem(item);
  const countryName =
    resolvedCountryName ||
    (isArabic ? item.country_name_ar : item.country_name_en) ||
    item.country_name_en ||
    item.country_name_ar ||
    (countryCode && COUNTRY_CODE_TO_I18N[countryCode] ? t(COUNTRY_CODE_TO_I18N[countryCode]) : countryCode);
  const isNonVegetarian =
    hasAnyAlias(normalizedTokens, NON_VEGETARIAN_ALIASES) ||
    normalizedSection.includes("nonvegetarian");
  const isVegan = hasAnyAlias(normalizedTokens, VEGAN_ALIASES);
  const isVegetarian =
    !isNonVegetarian &&
    (hasAnyAlias(normalizedTokens, VEGETARIAN_ALIASES) ||
      (normalizedSection.includes("vegetarian") && !normalizedSection.includes("nonvegetarian")));
  const hasContainsEgg = hasAnyAlias(normalizedTokens, CONTAINS_EGG_ALIASES);
  const hasExtraHotTag = hasAnyAlias(normalizedTokens, EXTRA_HOT_ALIASES);
  const hasHotTag = hasAnyAlias(normalizedTokens, HOT_ALIASES);
  const numericSpiceLevel = item.spice_level ?? 0;
  const spiceLevel: CardSpiceLevel = hasExtraHotTag
    ? "hot"
    : hasHotTag
      ? "medium"
      : numericSpiceLevel >= 2
        ? "hot"
        : numericSpiceLevel >= 1
          ? "medium"
          : "mild";
  const showCalories =
    typeof item.calories === "string"
      ? !!item.calories && String(item.calories).trim() !== ""
      : typeof item.calories === "number" && item.calories >= 1;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.02 * index }}
      whileTap={{ scale: 0.98 }}
      style={{
        width: "100%",
        textAlign: "left",
        border: "none",
        background: "transparent",
        padding: 0,
      }}
    >
      <div className={`dish-item__card ${isChefSignature ? "dish-item__card--signature" : ""}`}>
        <div
          className="dish-item__image"
          style={{
            backgroundImage: item.image_url
              ? `url('${item.image_url}')`
              : "url('https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=600')",
          }}
        />
        <div className="dish-item__content">
          <div className="dish-item__title-row">
            <h3 className="dish-item__heading">{itemName}</h3>
            <div className="dish-item__price-wrap">
              <AppIcon name="price" size={14} strokeWidth={2} className="dish-item__price-icon" aria-hidden />
              <span className="price dish-item__price">
                {typeof item.price === "string" ? item.price : item.price.toFixed(0)}
              </span>
            </div>
          </div>
          {visibleTagKeys.length > 0 && (
            <div className="dish-item__pills">
              {visibleTagKeys.map((tag) => (
                <span
                  key={tag}
                  className={`dish-item__pill ${tag === "chefSignature" ? "dish-item__pill--signature" : ""}`}
                >
                  {tag === "chefSignature" && (
                    <AppIcon name="chefSignature" size={12} strokeWidth={2} className="dish-item__pill-icon" aria-hidden />
                  )}
                  {tagLabels[tag]}
                </span>
              ))}
            </div>
          )}
          <p className="dish-item__description">{itemDescription}</p>
          <div className="dish-item__meta">
            {(countryName || countryCode || resolvedCountryFlagUrl) && (
              <IconWithTooltip label={countryName || countryCode || ""}>
                <span className="dish-item__country-badge" aria-hidden>
                  {resolvedCountryFlagUrl ? (
                    <img
                      src={resolvedCountryFlagUrl}
                      alt=""
                      className="dish-item__country-flag"
                    />
                  ) : (
                    <span className="dish-item__country-code">{countryCode || "--"}</span>
                  )}
                </span>
              </IconWithTooltip>
            )}
            {isVegan && (
              <IconWithTooltip label={t("vegan")}>
                <span className="dish-item__diet-tag dish-item__diet-tag--vegan">
                  <AppIcon name="vegan" size={14} strokeWidth={2} aria-hidden />
                </span>
              </IconWithTooltip>
            )}
            {isVegetarian && (
              <IconWithTooltip label={t("vegetarian") || t("vegetarianDish")}>
                <span className="dish-item__diet-tag dish-item__diet-tag--veg">
                  <AppIcon name="vegetarian" size={14} strokeWidth={2} className="dish-item__veg-icon" aria-hidden />
                </span>
              </IconWithTooltip>
            )}
            {isNonVegetarian && (
              <IconWithTooltip label={t("nonVegetarian")}>
                <span className="dish-item__diet-tag dish-item__diet-tag--nonveg">
                  <AppIcon name="nonVegetarian" size={14} strokeWidth={2} aria-hidden />
                </span>
              </IconWithTooltip>
            )}
            {hasContainsEgg && (
              <IconWithTooltip label={t("containsEgg")}>
                <span className="dish-item__diet-tag dish-item__diet-tag--egg">
                  <AppIcon name="containsEgg" size={14} strokeWidth={2} aria-hidden />
                </span>
              </IconWithTooltip>
            )}
            {/* Spice Level (only if tag present) */}
            {(() => {
              if (hasExtraHotTag) {
                return (
                  <IconWithTooltip label={t("spiceLevelExtraHot") || "Extra Hot"}>
                    <span className="dish-item__spice dish-item__spice--hot" aria-hidden>
                      {[...Array(3)].map((_, idx) => (
                        <AppIcon key={`spice-hot-${idx}`} name="hot" size={12} strokeWidth={2} aria-hidden />
                      ))}
                      <span className="dish-item__spice-label">{t("spiceLevelExtraHot") || "Extra Hot"}</span>
                    </span>
                  </IconWithTooltip>
                );
              }
              if (hasHotTag) {
                return (
                  <IconWithTooltip label={t("spiceLevelHot") || "Hot"}>
                    <span className="dish-item__spice dish-item__spice--medium" aria-hidden>
                      {[...Array(2)].map((_, idx) => (
                        <AppIcon key={`spice-medium-${idx}`} name="hot" size={12} strokeWidth={2} aria-hidden />
                      ))}
                      <span className="dish-item__spice-label">{t("spiceLevelHot") || "Hot"}</span>
                    </span>
                  </IconWithTooltip>
                );
              }
              if (normalizedTokens.has("mild")) {
                return (
                  <IconWithTooltip label={t("spiceLevelMild") || "Mild"}>
                    <span className="dish-item__spice dish-item__spice--mild" aria-hidden>
                      <AppIcon name="hot" size={12} strokeWidth={2} aria-hidden />
                      <span className="dish-item__spice-label">{t("spiceLevelMild") || "Mild"}</span>
                    </span>
                  </IconWithTooltip>
                );
              }
              return null;
            })()}
            {showCalories && (
              <IconWithTooltip label={`${item.calories} ${t("calories")}`}>
                <span className="dish-item__calories-wrap">
                  <AppIcon name="calories" size={14} strokeWidth={2} className="dish-item__calories-icon" aria-hidden />
                  <span className="dish-item__calories">{item.calories} {t("calories")}</span>
                </span>
              </IconWithTooltip>
            )}
          </div>
          {allergenList.length > 0 && (
            <div className="dish-item__allergens">
              {allergenList.map((a) => (
                <AppIcon
                  key={a}
                  name={getDietaryIconName(a)}
                  size={14}
                  strokeWidth={2}
                  aria-hidden
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

