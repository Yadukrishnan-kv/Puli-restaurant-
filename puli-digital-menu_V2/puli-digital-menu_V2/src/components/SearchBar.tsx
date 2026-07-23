import { useTranslation } from "react-i18next";
import { forwardRef } from "react";
import { AppIcon } from "./AppIcon";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
}

export const SearchBar = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onFocus }, inputRef) => {
  const { t } = useTranslation();

  return (
    <div className="search-bar">
      <span
        aria-hidden
        className="search-bar__icon"
      >
        <AppIcon name="search" className="search-bar__icon-svg" />
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={t("searchPlaceholder")}
        className="search-bar__input"
      />
    </div>
  );
},
);

SearchBar.displayName = "SearchBar";

