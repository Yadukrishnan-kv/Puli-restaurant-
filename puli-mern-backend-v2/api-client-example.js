/**
 * API Integration Helper
 * 
 * This file demonstrates how to integrate your frontend with the new backend.
 * Place this in your frontend's utils or lib folder and adapt to your needs.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = this.getStoredToken();
  }

  /**
   * Store and retrieve JWT token
   */
  getStoredToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  /**
   * Helper to make authenticated requests
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      // Redirect to login or refresh token
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============ AUTHENTICATION ============

  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  // ============ ADMIN: MENU SECTIONS ============

  async getMenuSections() {
    return this.request('/api/menu-sections');
  }

  async createMenuSection(section) {
    return this.request('/api/menu-sections', {
      method: 'POST',
      body: JSON.stringify(section),
    });
  }

  async updateMenuSection(id, section) {
    return this.request(`/api/menu-sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(section),
    });
  }

  async deleteMenuSection(id) {
    return this.request(`/api/menu-sections/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ ADMIN: CATEGORIES ============

  async getCategories() {
    return this.request('/api/categories');
  }

  async createCategory(category) {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id, category) {
    return this.request(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id) {
    return this.request(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ ADMIN: CLASSIFICATIONS ============

  async getClassifications() {
    return this.request('/api/classifications');
  }

  async createClassification(classification) {
    return this.request('/api/classifications', {
      method: 'POST',
      body: JSON.stringify(classification),
    });
  }

  async updateClassification(id, classification) {
    return this.request(`/api/classifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classification),
    });
  }

  async deleteClassification(id) {
    return this.request(`/api/classifications/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ ADMIN: MENU ITEMS ============

  async getMenuItems() {
    return this.request('/api/menu-items');
  }

  async getMenuItem(id) {
    return this.request(`/api/menu-items/${id}`);
  }

  async createMenuItem(item) {
    return this.request('/api/menu-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateMenuItem(id, item) {
    return this.request(`/api/menu-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteMenuItem(id) {
    return this.request(`/api/menu-items/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ ADMIN: FILTER TAGS ============

  async getFilterTags() {
    return this.request('/api/filter-tags');
  }

  async createFilterTag(tag) {
    return this.request('/api/filter-tags', {
      method: 'POST',
      body: JSON.stringify(tag),
    });
  }

  async updateFilterTag(id, tag) {
    return this.request(`/api/filter-tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tag),
    });
  }

  async deleteFilterTag(id) {
    return this.request(`/api/filter-tags/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ ADMIN: BANNER & STORY ============

  async getBanner() {
    return this.request('/api/banner');
  }

  async updateBanner(id, banner) {
    return this.request(`/api/banner/${id}`, {
      method: 'PUT',
      body: JSON.stringify(banner),
    });
  }

  async getStory() {
    return this.request('/api/story');
  }

  async updateStory(id, story) {
    return this.request(`/api/story/${id}`, {
      method: 'PUT',
      body: JSON.stringify(story),
    });
  }

  // ============ ADMIN: SETTINGS ============

  async getSettings() {
    return this.request('/api/settings');
  }

  async updateSettings(id, settings) {
    return this.request(`/api/settings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ============ ADMIN: AUDIT LOG ============

  async getActivityLog() {
    return this.request('/api/audit-log');
  }

  // ============ PUBLIC: CUSTOMER MENU ============

  async getPublicMenu() {
    return this.request('/api/public/menu');
  }

  async getPublicMenuItems() {
    return this.request('/api/public/menu-items');
  }

  async getPublicCategories() {
    return this.request('/api/public/categories');
  }

  async getPublicFilterTags() {
    return this.request('/api/public/filter-tags');
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Also export the class for testing/custom instances
export default APIClient;

/**
 * USAGE EXAMPLES
 */

/*
// Admin Frontend - Login
import { apiClient } from './api/client';

async function handleLogin() {
  try {
    const response = await apiClient.login('admin@puli.com', 'password');
    console.log('Logged in:', response.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Admin Frontend - Fetch menu items
async function loadMenuItems() {
  try {
    const items = await apiClient.getMenuItems();
    setItems(items);
  } catch (error) {
    console.error('Failed to load items:', error);
  }
}

// Admin Frontend - Create menu item
async function createItem(itemData) {
  try {
    const item = await apiClient.createMenuItem(itemData);
    setItems([...items, item]);
  } catch (error) {
    console.error('Failed to create item:', error);
  }
}

// Customer Frontend - Fetch public menu
async function loadMenu() {
  try {
    const menu = await apiClient.getPublicMenu();
    setMenu(menu);
  } catch (error) {
    console.error('Failed to load menu:', error);
  }
}

// Customer Frontend - Fetch all items for filtering
async function loadAllItems() {
  try {
    const items = await apiClient.getPublicMenuItems();
    setAllItems(items);
  } catch (error) {
    console.error('Failed to load items:', error);
  }
}
*/
