/**
 * Type definitions for customer frontend
 * Extracted from menuData.ts but without static data
 */

export type DietaryTag = "dairy" | "nuts" | "gluten" | "honey";

export type HighlightTag =
  | "chef_special"
  | "chefSignature"
  | "popular"
  | "new"
  | "chefSignature"
  | "vegan"
  | "vegetarian"
  | "containsEgg"
  | "nonVegetarian"
  | "hot"
  | "extraHot"
  | "japan"
  | "china"
  | "thailand"
  | "southKorea"
  | "malaysia"
  | "indonesia"
  | "vietnam"
  | "hawaii"
  | "singapore"
  | "india"
  | "lebanon";

/**
 * Helper function: Get country code for highlight tag
 * Maps country name tags to ISO codes
 */
export function getCountryCodeForHighlightTag(tag: HighlightTag | string): string | undefined {
  const tagMap: Record<string, string> = {
    japan: "JP",
    china: "CN",
    thailand: "TH",
    southKorea: "KR",
    malaysia: "MY",
    indonesia: "ID",
    vietnam: "VN",
    hawaii: "US",
    singapore: "SG",
    india: "IN",
    lebanon: "LB",
  };
  return tagMap[tag];
}

/**
 * Convert country code to flag emoji
 */
export function countryCodeToFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
