import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useMenuContext } from "../context/MenuContext";
import { slugify } from "@/lib/dataConverters";
import type { MenuItemData, CategoryData } from "@/lib/customerAPI";
import { DishItem } from "../components/DishItem";
import { DishModal } from "../components/DishModal";
import { Footer } from "../components/Footer";
import { AppIcon } from "../components/AppIcon";
import { CustomDropdown, type CustomDropdownOption } from "../components/CustomDropdown";
import { useFilter } from "../context/FilterContext";

type SubCategoryPayload = {
  _id?: string;
  id?: string;
  name_en?: string;
  name_ar?: string;
  category_id?: string;
  order?: number;
};

type CountryPayload = {
  _id?: string;
  id?: string;
  name_en?: string;
  name_ar?: string;
  flag_image?: string;
};

const FILTER_ALIAS_MAP: Record<string, string[]> = {
  chefsignature: ["chefsignature", "chefspecial", "chefspecialty", "chefspeciality", "chefspecials"],
  chefspecial: ["recommended", "recommend", "chefselection", "chefsselection"],
  popular: ["popular"],
  new: ["new"],
  vegan: ["vegan"],
  vegetarian: ["vegetarian", "veg"],
  containsegg: ["containsegg", "egg", "eggs"],
  nonvegetarian: ["nonvegetarian", "nonveg", "nveg", "nv"],
  hot: ["hot", "spicy"],
  spicy: ["hot", "spicy"],
  extrahot: ["extrahot", "veryhot", "superhot", "extraspicy"],
  extraspicy: ["extrahot", "veryhot", "superhot", "extraspicy"],
  japan: ["japan", "jp"],
  china: ["china", "cn"],
  thailand: ["thailand", "thai", "th"],
  southkorea: ["southkorea", "korea", "kr"],
  malaysia: ["malaysia", "my"],
  indonesia: ["indonesia", "id"],
  vietnam: ["vietnam", "vn"],
  hawaii: ["hawaii", "us"],
  singapore: ["singapore", "sg"],
  india: ["india", "in"],
  lebanon: ["lebanon", "lb"],
};

const ALLERGEN_ALIAS_MAP: Record<string, string[]> = {
  dairy: ["dairy", "diary", "milk", "cheese", "butter"],
  diary: ["dairy", "diary", "milk", "cheese", "butter"],
  nuts: ["nuts", "nut", "peanut", "almond", "cashew", "walnut", "pistachio"],
  gluten: ["gluten", "wheat"],
  honey: ["honey"],
};

const COUNTRY_CODE_ALIAS_MAP: Record<string, string[]> = {
  JP: ["japan", "jp"],
  CN: ["china", "cn"],
  TH: ["thailand", "thai", "th"],
  KR: ["southkorea", "korea", "kr"],
  MY: ["malaysia", "my"],
  ID: ["indonesia", "id"],
  VN: ["vietnam", "vn"],
  US: ["hawaii", "us"],
  SG: ["singapore", "sg"],
  IN: ["india", "in"],
  LB: ["lebanon", "lb"],
};

function normalizeFilterToken(value?: string | null): string {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

function getAliasesForFilter(filterValue: string): string[] {
  const normalized = normalizeFilterToken(filterValue);
  return FILTER_ALIAS_MAP[normalized] ?? [normalized];
}

function getAliasesForAllergen(allergenValue: string): string[] {
  const normalized = normalizeFilterToken(allergenValue);
  return ALLERGEN_ALIAS_MAP[normalized] ?? [normalized];
}

function getItemFilterTokens(item: MenuItemData, countryNamesById: Map<string, string>): string[] {
  const tokens = new Set<string>();

  const addToken = (value?: string | null) => {
    const normalized = normalizeFilterToken(value);
    if (!normalized) return;
    tokens.add(normalized);
  };

  item.tags?.forEach(addToken);
  item.allergens?.forEach(addToken);
  addToken(item.country_code);
  addToken(item.country_name_en);
  addToken(item.country_name_ar);

  const countryNameFromId = countryNamesById.get((item.country_id || "").trim());
  addToken(countryNameFromId);

  const countryAliases = COUNTRY_CODE_ALIAS_MAP[(item.country_code || "").toUpperCase()] ?? [];
  countryAliases.forEach(addToken);

  if ((item.spice_level ?? 0) >= 2) {
    addToken("hot");
    addToken("spicy");
  }

  if ((item.spice_level ?? 0) >= 3) {
    addToken("extra hot");
  }

  return Array.from(tokens);
}

function itemMatchesSelectedFilter(
  item: MenuItemData,
  selectedFilter: string,
  countryNamesById: Map<string, string>,
): boolean {
  const aliases = getAliasesForFilter(selectedFilter);
  const tokens = getItemFilterTokens(item, countryNamesById);

  return aliases.some((alias) => tokens.includes(alias));
}

function itemMatchesHiddenAllergen(item: MenuItemData, allergen: string): boolean {
  const allergenAliases = getAliasesForAllergen(allergen);

  const itemAllergenTokens = new Set<string>();
  const addAllergenToken = (value?: string | null) => {
    const token = normalizeFilterToken(value);
    if (!token) return;
    itemAllergenTokens.add(token);
  };

  item.allergens?.forEach(addAllergenToken);
  item.tags?.forEach(addAllergenToken);

  return allergenAliases.some((alias) => itemAllergenTokens.has(alias));
}

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { categories, menuItems, loading, error } = useMenuContext();
  
  // Find category by slug
  const category = useMemo(() => {
    if (!slug) return undefined;
    return categories.find((c) => slugify(c.name_en) === slug);
  }, [categories, slug]);

  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const { highlightFilters, hiddenAllergens, clearFilters } = useFilter();

  const [query, setQuery] = useState("");
  const [activeItem, setActiveItem] = useState<MenuItemData | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [floatingNavOpen, setFloatingNavOpen] = useState(false);
  const [subCategoryNamesById, setSubCategoryNamesById] = useState<Map<string, string>>(new Map());
  const [subCategoryOrderById, setSubCategoryOrderById] = useState<Map<string, number>>(new Map());
  const [countryNamesById, setCountryNamesById] = useState<Map<string, string>>(new Map());
  const [countryFlagsById, setCountryFlagsById] = useState<Map<string, string>>(new Map());
  const [countryFlagsByName, setCountryFlagsByName] = useState<Map<string, string>>(new Map());
  const [subCategoriesLoaded, setSubCategoriesLoaded] = useState(false);

  const subCategoryOptions = useMemo<CustomDropdownOption[]>(() => {
    const entries = Array.from(subCategoryNamesById.entries()).sort((a, b) => {
      const orderA = subCategoryOrderById.get(a[0]) ?? 9999;
      const orderB = subCategoryOrderById.get(b[0]) ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a[1].localeCompare(b[1], isArabic ? "ar" : "en", { sensitivity: "base" });
    });

    return [
      { value: null, label: t("allClassifications") },
      ...entries.map(([id, label]) => ({ value: id, label })),
    ];
  }, [subCategoryNamesById, subCategoryOrderById, t, isArabic]);

  // Get items for this category
  const items = useMemo(() => {
    if (!category) return [];
    return menuItems.filter((item) => item.category_id === category._id);
  }, [category, menuItems]);

  const floatingNavEntries = useMemo(() => {
    const countsBySubCategoryId = new Map<string, { label: string; count: number }>();

    items.forEach((item) => {
      const subCategoryId = (item.subcategory_id || "").trim();
      if (!subCategoryId) return;

      const label = subCategoryNamesById.get(subCategoryId) || (subCategoriesLoaded ? "Other Items" : "");
      if (!label) return;

      const current = countsBySubCategoryId.get(subCategoryId);
      if (current) {
        current.count += 1;
      } else {
        countsBySubCategoryId.set(subCategoryId, { label, count: 1 });
      }
    });

    return Array.from(countsBySubCategoryId.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => {
        const orderA = subCategoryOrderById.get(a.id) ?? 9999;
        const orderB = subCategoryOrderById.get(b.id) ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.label.localeCompare(b.label, isArabic ? "ar" : "en", { sensitivity: "base" });
      });
  }, [items, subCategoryNamesById, subCategoryOrderById, subCategoriesLoaded, isArabic]);

  const handleSelectSubCategory = (subCategoryId: string | null) => {
    setSelectedSubCategoryId(subCategoryId);
    setFloatingNavOpen(false);

    const resultsShell = document.querySelector(".category-page__list-shell");
    if (resultsShell instanceof HTMLElement) {
      resultsShell.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const itemsByClassification = useMemo(() => {
    return items.filter((item) => {
      if (selectedSubCategoryId) {
        const itemSubCategoryId = (item.subcategory_id || "").trim();
        if (itemSubCategoryId !== selectedSubCategoryId) {
          return false;
        }
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        const nameEn = (item.name_en || "").toLowerCase();
        const nameAr = (item.name_ar || "").toLowerCase();
        const descriptionEn = (item.description_en || "").toLowerCase();
        const descriptionAr = (item.description_ar || "").toLowerCase();
        if (
          !nameEn.includes(q) &&
          !nameAr.includes(q) &&
          !descriptionEn.includes(q) &&
          !descriptionAr.includes(q)
        ) {
          return false;
        }
      }
      if (hiddenAllergens.length > 0) {
        const allergenFilters = hiddenAllergens;
        const matchesSelectedAllergen = allergenFilters.some((allergen) =>
          itemMatchesHiddenAllergen(item, allergen),
        );

        if (!matchesSelectedAllergen) {
          return false;
        }
      }
      if (highlightFilters.length > 0) {
        const spiceFilters = highlightFilters.filter((tag) => tag === "hot" || tag === "extraHot");
        const badgeFilters = highlightFilters.filter(
          (tag) => tag === "chefSignature" || tag === "chef_special" || tag === "popular" || tag === "new",
        );
        const baseTagFilters = highlightFilters.filter(
          (tag) =>
            tag !== "hot" &&
            tag !== "extraHot" &&
            tag !== "chefSignature" &&
            tag !== "chef_special" &&
            tag !== "popular" &&
            tag !== "new",
        );

        if (baseTagFilters.length > 0) {
          const matchesBaseTags = baseTagFilters.some((selectedFilter) =>
            itemMatchesSelectedFilter(item, selectedFilter, countryNamesById),
          );
          if (!matchesBaseTags) return false;
        }

        if (badgeFilters.length > 0) {
          const matchesBadges = badgeFilters.some((selectedFilter) =>
            itemMatchesSelectedFilter(item, selectedFilter, countryNamesById),
          );
          if (!matchesBadges) return false;
        }

        if (spiceFilters.length > 0) {
          const matchesSpice = spiceFilters.some((selectedFilter) =>
            itemMatchesSelectedFilter(item, selectedFilter, countryNamesById),
          );
          if (!matchesSpice) return false;
        }
      }
      return true;
    });
  }, [items, selectedSubCategoryId, query, hiddenAllergens, highlightFilters, countryNamesById]);

  const sections = useMemo(() => {
    const bySection = new Map<string, { title: string; items: MenuItemData[] }>();
    itemsByClassification.forEach((item) => {
      const subCategoryId = (item.subcategory_id || "").trim();
      const sectionId = (item.section_id || "").trim();
      const rawSection = subCategoryId || sectionId;
      const sectionKey = rawSection || "other-items";
      const mappedSubCategoryName = subCategoryId
        ? subCategoryNamesById.get(subCategoryId)
        : undefined;
      const sectionTitle = subCategoryId
        ? (mappedSubCategoryName || (subCategoriesLoaded ? "Other Items" : ""))
        : (rawSection || "Other Items");

      if (!bySection.has(sectionKey)) {
        bySection.set(sectionKey, { title: sectionTitle, items: [] });
      }

      bySection.get(sectionKey)!.items.push(item);
    });

    const entries = Array.from(bySection.entries());
    entries.sort(([keyA], [keyB]) => {
      const orderA = subCategoryOrderById.get(keyA) ?? 9999;
      const orderB = subCategoryOrderById.get(keyB) ?? 9999;
      return orderA - orderB;
    });
    return entries;
  }, [itemsByClassification, subCategoryNamesById, subCategoryOrderById, subCategoriesLoaded]);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) setSubCategoriesLoaded(false);

    const loadSubCategories = async () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "http://localhost:5000";
        const response = await fetch(`${baseUrl}/api/subcategories`);
        if (!response.ok) return;

        const payload = await response.json();
        const list: SubCategoryPayload[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        const mapping = new Map<string, string>();
        const orderMapping = new Map<string, number>();
        list.forEach((entry) => {
          const id = (entry._id || entry.id || "").trim();
          const name = ((isArabic ? entry.name_ar : entry.name_en) || entry.name_en || entry.name_ar || "").trim();
          if (!id || !name) return;

          if (!category || !entry.category_id || String(entry.category_id) === String(category._id)) {
            mapping.set(id, name);
            orderMapping.set(id, typeof entry.order === "number" ? entry.order : 9999);
          }
        });

        if (isMounted) {
          setSubCategoryNamesById(mapping);
          setSubCategoryOrderById(orderMapping);
          setSubCategoriesLoaded(true);
        }
      } catch {
        if (isMounted) {
          setSubCategoryNamesById(new Map());
          setSubCategoryOrderById(new Map());
          setSubCategoriesLoaded(true);
        }
      }
    };

    loadSubCategories();
    return () => {
      isMounted = false;
    };
  }, [category, isArabic]);

  useEffect(() => {
    let isMounted = true;

    const loadCountries = async () => {
      try {
        const baseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "http://localhost:5000";
        const response = await fetch(`${baseUrl}/api/countries`);
        if (!response.ok) return;

        const payload = await response.json();
        const list: CountryPayload[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        const mapping = new Map<string, string>();
        const flagMapping = new Map<string, string>();
        const flagByNameMapping = new Map<string, string>();
        list.forEach((entry) => {
          const id = (entry._id || entry.id || "").trim();
          const name = ((isArabic ? entry.name_ar : entry.name_en) || entry.name_en || entry.name_ar || "").trim();
          if (!id || !name) return;
          mapping.set(id, name);

          const rawFlag = (entry.flag_image || "").trim();
          if (rawFlag) {
            const absoluteFlag = rawFlag.startsWith("http://") || rawFlag.startsWith("https://")
              ? rawFlag
              : `${baseUrl.replace(/\/$/, "")}${rawFlag.startsWith("/") ? rawFlag : `/${rawFlag}`}`;
            flagMapping.set(id, absoluteFlag);
            if ((entry.name_en || "").trim()) flagByNameMapping.set((entry.name_en || "").toLowerCase().trim(), absoluteFlag);
            if ((entry.name_ar || "").trim()) flagByNameMapping.set((entry.name_ar || "").toLowerCase().trim(), absoluteFlag);
          }
        });

        if (isMounted) {
          setCountryNamesById(mapping);
          setCountryFlagsById(flagMapping);
          setCountryFlagsByName(flagByNameMapping);
        }
      } catch {
        if (isMounted) {
          setCountryNamesById(new Map());
          setCountryFlagsById(new Map());
          setCountryFlagsByName(new Map());
        }
      }
    };

    loadCountries();
    return () => {
      isMounted = false;
    };
  }, [isArabic]);

  useEffect(() => {
    const persistedQuery = window.sessionStorage.getItem("puli-search-query") || "";
    setQuery(persistedQuery);
    setSelectedSubCategoryId(null);
    setFloatingNavOpen(false);
    clearFilters();

    const handleSearchQuery = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const nextQuery = custom.detail ?? "";
      setQuery(nextQuery);
      window.sessionStorage.setItem("puli-search-query", nextQuery);
    };

    window.addEventListener("puli-search-query", handleSearchQuery as EventListener);

    return () => {
      window.removeEventListener("puli-search-query", handleSearchQuery as EventListener);
    };
  }, [slug, clearFilters]);

  if (loading) {
    return (
      <main className="layout">
        <div className="layout__content" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>{t("loading") || "Loading..."}</p>
        </div>
      </main>
    );
  }

  if (error || !category) {
    return (
      <main className="layout">
        <div className="layout__content" style={{ padding: "3rem 1rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-error)" }}>
            {error ? `Error: ${error}` : "Category not found"}
          </p>
        </div>
      </main>
    );
  }

  const hasActiveFilters = highlightFilters.length > 0 || hiddenAllergens.length > 0;

  return (
    <main className="layout">
      <div className="layout__content">
      <section className="category-page__header">
        <div className="container">
          <div className="category-page__heading-block">
            <div className="category-page__heading-row">
              <header>
                <h1
                  className="heading-xl"
                  style={{ margin: "0 0 0.15rem", fontSize: "1.35rem" }}
                >
                  {(isArabic ? category.name_ar : category.name_en) || category.name_en || category.name_ar}
                </h1>
                <p
                  className="body-sm-muted"
                  style={{ margin: 0, fontSize: "0.88rem" }}
                >
                  {(isArabic ? category.description_ar : category.description_en) || category.description_en || category.description_ar}
                </p>
              </header>

              <div className="category-page__header-actions">
                <div className="category-page__section-dropdown-wrap">
                  <span className="category-page__section-dropdown-label">{t("selectCategory")}</span>
                  <CustomDropdown
                    options={subCategoryOptions}
                    value={selectedSubCategoryId}
                    onChange={setSelectedSubCategoryId}
                    placeholder={t("allClassifications")}
                    aria-label={t("selectCategory")}
                  />
                </div>

                <div className="category-page__view-toggle-wrap">
                  <span className="category-page__view-toggle-label">{t("changeView")}</span>
                  <div className="category-page__view-toggle" role="group" aria-label={t("viewMode")}>
                  <button
                    type="button"
                    className={`category-page__view-btn ${viewMode === "list" ? "category-page__view-btn--active" : ""}`}
                    onClick={() => setViewMode("list")}
                    title={t("listView")}
                    aria-label={t("listView")}
                    aria-pressed={viewMode === "list"}
                  >
                    <AppIcon name="viewList" size={18} strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={`category-page__view-btn ${viewMode === "grid" ? "category-page__view-btn--active" : ""}`}
                    onClick={() => setViewMode("grid")}
                    title={t("gridView")}
                    aria-label={t("gridView")}
                    aria-pressed={viewMode === "grid"}
                  >
                    <AppIcon name="viewGrid" size={18} strokeWidth={2} aria-hidden />
                  </button>
                  </div>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="category-page__chips">
                {hiddenAllergens.map((a) => (
                  <span
                    key={a}
                    className="badge-outline"
                    style={{ borderColor: "rgba(255,255,255,0.18)" }}
                  >
                    ✕ {t(a)}
                  </span>
                ))}
                {highlightFilters.map((h) => (
                  <span
                    key={h}
                    className="badge-outline"
                    style={{ borderColor: "rgba(201,164,108,0.9)" }}
                  >
                    ★ {t(h)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="scroll-y-soft category-page__list-shell">
            {itemsByClassification.length === 0 ? (
              <p className="body-sm-muted" style={{ padding: "1rem 0.25rem" }}>
                {query.trim() || hasActiveFilters
                  ? t("noResultsWithFilters")
                  : t("noItemsInCategory")}
              </p>
            ) : (
              sections.map(([sectionKey, sectionData]) => (
                <section
                  key={sectionKey}
                  id={`section-${sectionKey.replace(/\s+/g, "-")}`}
                  className="category-page__section"
                >
                  {sectionData.title && (
                    <h2 className="category-page__section-title">{sectionData.title}</h2>
                  )}
                  <div
                    className={`category-page__section-grid ${viewMode === "list" ? "category-page__section-grid--list" : ""}`}
                  >
                    {sectionData.items.map((item, index) => (
                      <DishItem
                        key={item._id}
                        item={item}
                        index={index}
                        resolvedCountryName={countryNamesById.get((item.country_id || "").trim())}
                        resolvedCountryFlagUrl={
                          countryFlagsById.get((item.country_id || "").trim()) ||
                          countryFlagsByName.get((item.country_name_en || "").toLowerCase().trim()) ||
                          countryFlagsByName.get((item.country_name_ar || "").toLowerCase().trim())
                        }
                        onOpen={() => setActiveItem(item)}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </section>

      {items.length > 0 && (
        <div className="category-page__floating-nav-wrap">
          {floatingNavOpen && (
            <button
              type="button"
              className="category-page__floating-nav-backdrop"
              aria-label={t("close") || "Close"}
              onClick={() => setFloatingNavOpen(false)}
            />
          )}

          {floatingNavOpen && (
            <div id="category-floating-nav" className="category-page__floating-nav" role="dialog" aria-label={t("selectCategory")}>
              <div className="category-page__floating-nav-inner scroll-y-soft">
                <div className="category-page__floating-nav-header">
                  <span className="category-page__floating-nav-title">
                    {(isArabic ? category.name_ar : category.name_en) || category.name_en || category.name_ar}
                  </span>
                  <span className="category-page__floating-nav-count">{items.length}</span>
                </div>

                <ul className="category-page__floating-nav-list">
                  <li>
                    <button
                      type="button"
                      className={`category-page__floating-nav-item ${selectedSubCategoryId === null ? "category-page__floating-nav-item--active" : ""}`}
                      onClick={() => handleSelectSubCategory(null)}
                    >
                      <span>{t("allClassifications")}</span>
                      <span className="category-page__floating-nav-item-count">{items.length}</span>
                    </button>
                  </li>

                  {floatingNavEntries.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className={`category-page__floating-nav-item ${selectedSubCategoryId === entry.id ? "category-page__floating-nav-item--active" : ""}`}
                        onClick={() => handleSelectSubCategory(entry.id)}
                      >
                        <span>{entry.label}</span>
                        <span className="category-page__floating-nav-item-count">{entry.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <button
            type="button"
            className="category-page__floating-nav-fab"
            aria-label={t("selectCategory")}
            onClick={() => setFloatingNavOpen((prev) => !prev)}
            aria-expanded={floatingNavOpen}
            aria-controls="category-floating-nav"
          >
            <AppIcon name="categoryList" size={22} className="category-page__floating-nav-fab-icon" aria-hidden />
          </button>
        </div>
      )}

      <DishModal item={activeItem} onClose={() => setActiveItem(null)} category={category} />

      </div>
      <Footer />
    </main>
  );
};
