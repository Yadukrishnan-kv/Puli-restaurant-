import { motion } from "framer-motion";
import type { CategoryData } from "@/lib/customerAPI";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Props {
  category: CategoryData;
  index: number;
}

export const CategoryCard: React.FC<Props> = ({ category, index }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const categoryName = (isArabic ? category.name_ar : category.name_en) || category.name_en || category.name_ar;
  const categoryDescription =
    (isArabic ? category.description_ar : category.description_en) || category.description_en || category.description_ar;

  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.03 * index }}
      className="category-card"
    >
      <Link
        to={`/category/${category.name_en.toLowerCase().replace(/\s+/g, '-')}`}
        className="category-card__link"
        aria-label={categoryName}
      >
        <div
          className="category-card__media"
          style={{
            backgroundImage: category.image_url
              ? `url('${category.image_url}')`
              : "url('https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=800')",
          }}
        >
          {/* image only, no overlay text */}
        </div>
        <div
          className="category-card__body"
        >
          <h3
            className="heading-lg category-card__title"
          >
            {categoryName}
          </h3>
          <p
            className="body-sm-muted category-card__description"
          >
            {categoryDescription}
          </p>
        </div>
      </Link>
    </motion.article>
  );
};

