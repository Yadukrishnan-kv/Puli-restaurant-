import type React from "react";
import {
  Search,
  Filter,
  ArrowLeft,
  SunLight,
  HalfMoon,
  Facebook,
  Instagram,
  Youtube,
  BreadSlice,
  Egg,
  Vegan,
  Heart,
  Star,
  Sparks,
  FireFlame,
  Leaf,
  Hat,
  GlassHalf,
  Cookie,
  Flower,
  Globe,
  Xmark,
  Activity,
  ViewGrid,
  List,
  TaskList,
  Check,
  Circle,
  Plus,
  Minus,
} from "iconoir-react";
import type { DietaryTag, HighlightTag } from "../types/filters";
import { SaudiRiyalIcon } from "./SaudiRiyalIcon";
import { GiChickenOven } from "react-icons/gi";

/** Default size and stroke for uniform icons across the app */
const DEFAULT_SIZE = 20;
const DEFAULT_STROKE = 2;

/** Props applied globally via IconoirProvider for uniform look */
export const iconDefaultProps: {
  width: number;
  height: number;
  strokeWidth: number;
} = {
  width: DEFAULT_SIZE,
  height: DEFAULT_SIZE,
  strokeWidth: DEFAULT_STROKE,
};

export interface AppIconProps extends Partial<React.SVGProps<SVGSVGElement>> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export type IconName =
  | "search"
  | "filter"
  | "arrowLeft"
  | "xmark"
  | "sun"
  | "moon"
  | "facebook"
  | "instagram"
  | "youtube"
  | "dairy"
  | "nuts"
  | "gluten"
  | "honey"
  | "chefSignature"
  | "chefSpecial"
  | "popular"
  | "new"
  | "vegan"
  | "vegetarian"
  | "containsEgg"
  | "nonVegetarian"
  | "hot"
  | "extraHot"
  | "cuisine"
  | "price"
  | "calories"
  | "viewGrid"
  | "viewList"
  | "categoryList"
  | "plus"
  | "minus";

const ICON_MAP: Record<IconName, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  search: Search,
  filter: Filter,
  arrowLeft: ArrowLeft,
  xmark: Xmark,
  sun: SunLight,
  moon: HalfMoon,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  dairy: GlassHalf,
  nuts: Cookie,
  gluten: BreadSlice,
  honey: Flower,
  chefSignature: Hat,
  chefSpecial: Star,
  popular: Heart,
  new: Sparks,
  vegan: Vegan,
  vegetarian: Leaf,
  containsEgg: Egg,
  nonVegetarian: GiChickenOven as unknown as React.ComponentType<React.SVGProps<SVGSVGElement>>,
  hot: FireFlame,
  extraHot: FireFlame,
  cuisine: Globe,
  price: SaudiRiyalIcon,
  calories: Activity,
  viewGrid: ViewGrid,
  viewList: List,
  categoryList: TaskList,
  check: Check,
  circle: Circle,
  plus: Plus,
  minus: Minus,
};

export function AppIcon({
  name,
  size = DEFAULT_SIZE,
  strokeWidth = DEFAULT_STROKE,
  className,
  ...rest
}: AppIconProps) {
  const IconComponent = ICON_MAP[name];
  if (!IconComponent) return null;
  return (
    <IconComponent
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={className ?? "app-icon"}
      {...rest}
    />
  );
}

/** Icon name for dietary (allergen) tags */
export function getDietaryIconName(tag: DietaryTag): IconName {
  const map: Record<DietaryTag, IconName> = {
    dairy: "dairy",
    nuts: "nuts",
    gluten: "gluten",
    honey: "honey",
  };
  return map[tag] ?? "cuisine";
}

/** Icon name for highlight tags */
export function getHighlightIconName(tag: HighlightTag): IconName {
  const map: Partial<Record<HighlightTag, IconName>> = {
    chefSignature: "chefSignature",
    chefSpecial: "chefSpecial",
    popular: "popular",
    new: "new",
    vegan: "vegan",
    vegetarian: "vegetarian",
    containsEgg: "containsEgg",
    nonVegetarian: "nonVegetarian",
    hot: "hot",
    extraHot: "extraHot",
    japan: "cuisine",
    china: "cuisine",
    thailand: "cuisine",
    southKorea: "cuisine",
    india: "cuisine",
    vietnam: "cuisine",
    malaysia: "cuisine",
    indonesia: "cuisine",
    hawaii: "cuisine",
    singapore: "cuisine",
    lebanon: "cuisine",
  };
  return (map[tag] ?? "cuisine") as IconName;
}
