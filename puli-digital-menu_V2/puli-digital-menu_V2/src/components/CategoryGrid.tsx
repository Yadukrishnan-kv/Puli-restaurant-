import { useTranslation } from "react-i18next";
import { useMenuContext } from "../context/MenuContext";
import { CategoryCard } from "./CategoryCard";

export const CategoryGrid: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { categories, loading, error, settings } = useMenuContext();
  const isArabic = i18n.language === "ar";

  if (loading) {
    return (
      <section className="category-grid__section">
        <div className="container">
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <div style={{ display: "inline-block", marginBottom: "1rem" }}>
              <div style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</div>
            </div>
            <p style={{ color: "var(--color-text-secondary)" }}>Loading menus...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="category-grid__section">
        <div className="container">
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-error)" }}>
            <p>Failed to load menus: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  // Contact details from admin settings, falling back to defaults.
  const phone = settings?.phone || "+966 593 332 904";
  const telephone = settings?.telephone || "+966 133 615 222";
  const email = settings?.email || "info@puli.rest";
  const telHref = (value: string) => `tel:${value.replace(/[^\d+]/g, "")}`;

  const mainCategories = categories.filter((c) => c.category_id !== 'special' && c.category_id !== 'festive');
  const specialCategories = categories.filter((c) => c.category_id === 'special');
  const festiveCategories = categories.filter((c) => c.category_id === 'festive');

  return (
    <>
      <section className="category-grid__section">
        <div className="container">
          {mainCategories.length > 0 && (
          <>
            <h2 className="heading-lg category-grid__heading">
              {t("menus")}
            </h2>
            <div className="category-grid__row">
              {mainCategories.map((category, index) => (
                <div key={category._id} className="category-grid__item">
                  <CategoryCard category={category} index={index} />
                </div>
              ))}
            </div>
          </>
        )}

          {specialCategories.length > 0 && (
          <>
            <h3 className="heading-lg category-grid__heading">
              {t("specialMenus")}
            </h3>
            <div className="category-grid__row">
              {specialCategories.map((category, index) => (
                <div key={category._id} className="category-grid__item">
                  <CategoryCard category={category} index={index} />
                </div>
              ))}
            </div>
          </>
        )}

          {festiveCategories.length > 0 && (
          <>
            <h3 className="heading-lg category-grid__heading">
              {t("festiveMenus")}
            </h3>
            <div className="category-grid__row">
              {festiveCategories.map((category, index) => (
                <div key={category._id} className="category-grid__item">
                  <CategoryCard category={category} index={index} />
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </section>
      <section className="category-grid__section">
        <div className="container">
          <div
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              padding: "2rem 1.8rem",
              backgroundColor: "var(--color-background-secondary)",
              marginInline: "auto",
            }}
          >
            <h2
              className="heading-lg"
              style={{
                margin: 0,
                fontSize: "1.1rem",
              }}
            >
              {(isArabic ? settings?.restaurant_name_ar : settings?.restaurant_name) || settings?.restaurant_name || settings?.restaurant_name_ar || "PULI Jubail"}
            </h2>
            <div
              className="info-grid"
              style={{
                marginTop: "0.8rem",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.1fr)",
                gap: "1.5rem",
                fontSize: "0.85rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ fontWeight: 600 }}>{t("openingHours")}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {[
                    {
                      days: "FRIDAY & SATURDAY",
                      meals: [
                        "Breakfast: 7.00am to 10.00am",
                        "Lunch: 11.30am to 3.30pm",
                        "Chaat: 4.00pm to 6.00pm",
                        "Dinner: 6.00pm to 11.45pm",
                      ],
                    },
                    {
                      days: "SUNDAY TO THURSDAY",
                      meals: [
                        "Lunch: 11.30am to 3.30pm",
                        "Chaat: 4.00pm to 6.00pm",
                        "Dinner: 6.00pm to 11.45pm",
                      ],
                    },
                  ].map(({ days, meals }) => (
                    <div key={days} style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                      <span style={{ fontWeight: 600 }}>{days}</span>
                      {meals.map((meal) => (
                        <span key={meal}>{meal}</span>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ fontWeight: 600, marginTop: "0.6rem" }}>{t("website")}</div>
                <a href="https://www.puli.rest" target="_blank" rel="noreferrer">
                  www.puli.rest
                </a>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ fontWeight: 600 }}>{t("address")}</div>
                <div style={{ whiteSpace: "pre-line" }}>
                  {(isArabic ? settings?.address_ar : settings?.address_en) || settings?.address_en || settings?.address_ar || t("defaultAddress")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", marginTop: "0.6rem" }}>
                  {phone && <a href={telHref(phone)} dir="ltr">Mob: {phone}</a>}
                  {telephone && <a href={telHref(telephone)} dir="ltr">Tel: {telephone}</a>}
                  {email && <a href={`mailto:${email}`} dir="ltr">{email}</a>}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: "1.2rem",
                fontSize: "0.75rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {t("calorieNotice")}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

