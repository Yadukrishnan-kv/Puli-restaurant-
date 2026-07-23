import { useEffect, useState } from "react";
import { customerAPI, type MenuData, type MenuItemData, type CategoryData, type FilterTagData } from "@/lib/customerAPI";

/**
 * Hook to fetch menu data from backend
 * Usage: const { menu, loading, error } = useMenuData()
 */
export function useMenuData() {
  const [menu, setMenu] = useState<MenuData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await customerAPI.getMenu();
        setMenu(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load menu";
        setError(message);
        console.error("Error loading menu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return { menu, loading, error };
}

/**
 * Hook to fetch all menu items in flat list
 * Useful for filtering and searching
 */
export function useAllMenuItems() {
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await customerAPI.getAllMenuItems();
        setItems(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load items";
        setError(message);
        console.error("Error loading items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return { items, loading, error };
}

/**
 * Hook to fetch categories
 */
export function useCategories() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await customerAPI.getCategories();
        setCategories(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load categories";
        setError(message);
        console.error("Error loading categories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

/**
 * Hook to fetch filter tags
 */
export function useFilterTags() {
  const [tags, setTags] = useState<FilterTagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await customerAPI.getFilterTags();
        setTags(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load tags";
        setError(message);
        console.error("Error loading tags:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, loading, error };
}

/**
 * Hook to handle filtering and searching
 */
export function useMenuFilter(items: MenuItemData[]) {
  const [filteredItems, setFilteredItems] = useState<MenuItemData[]>(items);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredItems(items);
      return;
    }
    const results = customerAPI.searchItems(items, query);
    setFilteredItems(results);
  };

  const handleFilterAllergens = (allergens: string[]) => {
    let results = items;
    if (searchQuery) {
      results = customerAPI.searchItems(results, searchQuery);
    }
    setFilteredItems(customerAPI.filterByAllergens(results, allergens));
  };

  const handleFilterTags = (tags: string[]) => {
    let results = items;
    if (searchQuery) {
      results = customerAPI.searchItems(results, searchQuery);
    }
    setFilteredItems(customerAPI.filterByTags(results, tags));
  };

  const handleFilterSpiceLevel = (maxLevel: number) => {
    let results = items;
    if (searchQuery) {
      results = customerAPI.searchItems(results, searchQuery);
    }
    setFilteredItems(customerAPI.filterBySpiceLevel(results, maxLevel));
  };

  const handleSort = (sortBy: "name" | "price-asc" | "price-desc" | "popularity" | "order") => {
    setFilteredItems(customerAPI.sortItems(filteredItems, sortBy));
  };

  return {
    filteredItems,
    searchQuery,
    handleSearch,
    handleFilterAllergens,
    handleFilterTags,
    handleFilterSpiceLevel,
    handleSort,
  };
}

/**
 * Hook to get featured items (popular, chef specials, etc.)
 */
export function useFeaturedItems(items: MenuItemData[]) {
  const [popularItems, setPopularItems] = useState<MenuItemData[]>([]);
  const [chefSpecials, setChefSpecials] = useState<MenuItemData[]>([]);
  const [vegetarianItems, setVegetarianItems] = useState<MenuItemData[]>([]);

  useEffect(() => {
    setPopularItems(customerAPI.getPopularItems(items));
    setChefSpecials(customerAPI.getChefSpecials(items));
    setVegetarianItems(customerAPI.getVegetarianItems(items));
  }, [items]);

  return { popularItems, chefSpecials, vegetarianItems };
}
