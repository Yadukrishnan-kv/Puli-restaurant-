/**
 * Data Migration Script
 * 
 * This script helps migrate data from the old backend to the new backend.
 * Run this AFTER the new backend is set up and MongoDB is connected.
 * 
 * Usage: node migrate-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Old backend models would be imported here if needed
// For now, we'll create documents directly

// Models for new backend
const MenuItem = require('./models/MenuItem');
const Category = require('./models/Category');
const Classification = require('./models/Classification');
const MenuSection = require('./models/MenuSection');
const FilterTag = require('./models/FilterTag');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to new database');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Transform old menu item to new format
 */
function transformMenuItem(oldItem) {
  return {
    // Copy basic fields
    name_en: oldItem.name || oldItem.name_en,
    name_ar: oldItem.nameAr || oldItem.name_ar,
    description_en: oldItem.description || oldItem.description_en,
    description_ar: oldItem.descriptionAr || oldItem.description_ar,
    price: oldItem.price,
    
    // References (will need to be mapped by ID)
    category_id: oldItem.mainSectionId || oldItem.category_id,
    classification_id: oldItem.classificationId || oldItem.classification_id,
    
    // Media
    image: oldItem.imageUrl || oldItem.image,
    
    // Nutrition
    calories: oldItem.calories,
    allergens: oldItem.allergens || [],
    
    // Tags - convert old tags to new format
    tags: (oldItem.tags || []).map(tag => {
      // Map old tag format to new format
      if (tag === 'chef_special') return 'chef_special';
      if (tag === 'popular') return 'popular';
      if (tag === 'recommended') return 'recommended';
      return tag;
    }),
    
    // New fields - use defaults if not present
    country_code: oldItem.country_code || oldItem.countryCode,
    spice_level: oldItem.spice_level || oldItem.spiceLevel || 0,
    available_from: oldItem.available_from,
    available_to: oldItem.available_to,
    available_days: oldItem.available_days || [0, 1, 2, 3, 4, 5, 6], // All days by default
    
    // Status
    visible: oldItem.visible !== false && oldItem.isActive !== false,
    order: oldItem.order || 0,
  };
}

/**
 * Initialize default menu structure if needed
 */
async function initializeDefaultStructure() {
  try {
    // Check if sections exist
    const sectionCount = await MenuSection.countDocuments();
    
    if (sectionCount === 0) {
      console.log('Creating default menu sections...');
      
      const sections = [
        { name_en: 'Main Menu', name_ar: 'القائمة الرئيسية', order: 0, visible: true },
        { name_en: 'Special Menu', name_ar: 'قائمة خاصة', order: 1, visible: true },
      ];
      
      await MenuSection.insertMany(sections);
      console.log('✓ Default sections created');
    }
    
    // Check if filter tags exist
    const tagCount = await FilterTag.countDocuments();
    
    if (tagCount === 0) {
      console.log('Creating default filter tags...');
      
      const tags = [
        { label_en: 'Chef Special', label_ar: 'طبق الشيف', type: 'badge', enabled: true, order: 0 },
        { label_en: 'Popular', label_ar: 'الأكثر شعبية', type: 'badge', enabled: true, order: 1 },
        { label_en: 'Recommended', label_ar: 'موصى به', type: 'badge', enabled: true, order: 2 },
        { label_en: 'New Item', label_ar: 'صنف جديد', type: 'badge', enabled: true, order: 3 },
        { label_en: 'Dairy', label_ar: 'ألبان', type: 'allergen', enabled: true, order: 4 },
        { label_en: 'Nuts', label_ar: 'مكسرات', type: 'allergen', enabled: true, order: 5 },
        { label_en: 'Gluten', label_ar: 'غلوتين', type: 'allergen', enabled: true, order: 6 },
        { label_en: 'Honey', label_ar: 'عسل', type: 'allergen', enabled: true, order: 7 },
        { label_en: 'Vegan', label_ar: 'نباتي', type: 'badge', enabled: true, order: 8 },
        { label_en: 'Vegetarian', label_ar: 'خضري', type: 'badge', enabled: true, order: 9 },
      ];
      
      await FilterTag.insertMany(tags);
      console.log('✓ Default filter tags created');
    }
  } catch (error) {
    console.error('Error initializing structure:', error);
  }
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    await connectDB();
    
    console.log('\n=== PULI Backend Migration ===\n');
    
    // Step 1: Initialize structure
    await initializeDefaultStructure();
    
    // Step 2: Import data from old system
    // This depends on your specific old backend structure
    // For now, we're just setting up the new system
    
    console.log('\n✓ Migration completed!');
    console.log('\nNext steps:');
    console.log('1. Log in to admin panel with credentials from .env');
    console.log('2. Add menu sections and categories');
    console.log('3. Add menu items');
    console.log('4. Set up banners and stories');
    console.log('\nOr import data from old backend if available');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
