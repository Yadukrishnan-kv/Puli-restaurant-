require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MenuItem = require('./models/MenuItem');
const Category = require('./models/Category');
const SubCategory = require('./models/SubCategory');
const Country = require('./models/Country');
const Classification = require('./models/Classification');
const MenuSection = require('./models/MenuSection');
const FilterTag = require('./models/FilterTag');
const Banner = require('./models/Banner');
const Story = require('./models/Story');
const Settings = require('./models/Settings');
const User = require('./models/User');
const ActivityLog = require('./models/ActivityLog');
const MediaItem = require('./models/MediaItem');
const Customer = require('./models/Customer');

const authMiddleware = require('./middleware/auth');
const logActivity = require('./middleware/logging');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// ============ HELPER FUNCTIONS ============

const toPlain = (doc) => {
  return doc ? { ...doc.toObject(), id: doc._id } : null;
};

const getIdValue = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return value._id.toString();
  return null;
};

const attachCountrySnapshot = async (body) => {
  const countryId = getIdValue(body.country_id);

  if (!countryId) {
    body.country_id = null;
    body.country_name_en = null;
    body.country_name_ar = null;
    body.country_flag_url = null;
    return;
  }

  const country = await Country.findById(countryId);
  if (!country) {
    throw new Error('Invalid country_id');
  }

  body.country_id = country._id;
  body.country_name_en = country.name_en;
  body.country_name_ar = country.name_ar;
  body.country_flag_url = country.flag_image || null;
};

const normalizeTagToken = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '');

// Coerce an incoming price to a non-negative number.
// Blank / null / non-numeric / negative values become 0, which the customer
// menu renders as "As Per Size".
const normalizeMenuItemPrice = (body) => {
  if (!Object.prototype.hasOwnProperty.call(body, 'price')) return;
  const raw = body.price;
  if (raw === '' || raw === null || raw === undefined) {
    body.price = 0;
    return;
  }
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  body.price = Number.isFinite(num) && num > 0 ? num : 0;
};

const normalizeMenuItemTags = (body) => {
  const tagList = Array.isArray(body.tags)
    ? body.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : [];

  const indexByToken = new Map();
  tagList.forEach((tag, idx) => {
    indexByToken.set(normalizeTagToken(tag), idx);
  });

  const upsertTag = (label, tokens, enabled) => {
    const matchingIndexes = [];
    tokens.forEach((token) => {
      const idx = indexByToken.get(token);
      if (typeof idx === 'number') matchingIndexes.push(idx);
    });

    if (enabled) {
      if (matchingIndexes.length === 0) {
        tagList.push(label);
        indexByToken.set(normalizeTagToken(label), tagList.length - 1);
      } else {
        const first = matchingIndexes[0];
        tagList[first] = label;
      }
      return;
    }

    if (matchingIndexes.length > 0) {
      const removeIndexSet = new Set(matchingIndexes);
      const filtered = tagList.filter((_, idx) => !removeIndexSet.has(idx));
      tagList.length = 0;
      filtered.forEach((tag) => tagList.push(tag));
      indexByToken.clear();
      tagList.forEach((tag, idx) => {
        indexByToken.set(normalizeTagToken(tag), idx);
      });
    }
  };

  const hasBadgeFlags =
    Object.prototype.hasOwnProperty.call(body, 'chef_special') ||
    Object.prototype.hasOwnProperty.call(body, 'popular') ||
    Object.prototype.hasOwnProperty.call(body, 'recommended');

  if (hasBadgeFlags) {
    upsertTag('Chef Special', ['chefspecial', 'chefsignature', 'chefspecialty', 'chefspeciality'], Boolean(body.chef_special));
    upsertTag('Popular', ['popular'], Boolean(body.popular));
    upsertTag('Recommended', ['recommended', 'chefselection', 'chefsselection'], Boolean(body.recommended));
  }

  body.tags = tagList;
};

const normalizeCategoryBody = (input) => {
  const body = { ...(input || {}) };

  if (Object.prototype.hasOwnProperty.call(body, 'description') && !Object.prototype.hasOwnProperty.call(body, 'description_en')) {
    body.description_en = String(body.description ?? '');
  }

  delete body.description;
  return body;
};

const mapCategoryForAdmin = (req, category) => ({
  ...toPlain(category),
  description: category.description_en || category.description_ar || '',
  image: makeAbsoluteUrl(req, category.image),
});

const mapCountryForAdmin = (req, country) => ({
  ...toPlain(country),
  flag_image: makeAbsoluteUrl(req, country.flag_image),
});

const ensureDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      const hashedPassword = await bcryptjs.hash(process.env.ADMIN_PASSWORD, 10);
      await User.create({
        email: process.env.ADMIN_EMAIL,
        passwordHash: hashedPassword,
        isActive: true,
      });
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error ensuring admin:', error);
  }
};

const ensureDefaultFilterTags = async () => {
  try {
    const count = await FilterTag.countDocuments();
    if (count === 0) {
      const defaults = [
        { label_en: 'Chef Special', label_ar: 'مميز الشيف', type: 'badge', order: 0 },
        { label_en: 'Popular', label_ar: 'شائع', type: 'badge', order: 1 },
        { label_en: 'Recommended', label_ar: 'موصى به', type: 'badge', order: 2 },
        { label_en: 'Vegetarian', label_ar: 'نباتي', type: 'badge', order: 3 },
        { label_en: 'Gluten Free', label_ar: 'خالي من الغلوتين', type: 'allergen', order: 10 },
        { label_en: 'Dairy Free', label_ar: 'خالٍ من الألبان', type: 'allergen', order: 11 },
        { label_en: 'Nut Free', label_ar: 'خالٍ من المكسرات', type: 'allergen', order: 12 },
        { label_en: 'Contains Honey', label_ar: 'يحتوي على عسل', type: 'allergen', order: 13 },
      ];
      await FilterTag.insertMany(defaults);
      console.log('Default filter tags created');
    }
  } catch (error) {
    console.error('Error ensuring default filter tags:', error);
  }
};

const UPLOADS_DIR = path.join(__dirname, 'uploads');

const ensureUploadsDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
};

const saveBase64Image = async (dataUrl, subfolder = '') => {
  // Accepts data URL strings like "data:image/png;base64,..." and writes to /uploads
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return dataUrl;
  }

  const matches = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!matches) {
    return dataUrl;
  }

  const [, mimeType, base64Data] = matches;
  const extension = mimeType.split('/')[1] || 'png';
  const folderPath = path.join(UPLOADS_DIR, subfolder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extension}`;
  const filePath = path.join(folderPath, fileName);
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.promises.writeFile(filePath, buffer);

  // Return a web-accessible URL
  const urlPath = `/uploads/${subfolder ? `${subfolder}/` : ''}${fileName}`;
  return urlPath;
};

const DEFAULT_DISH_IMAGE = '/uploads/menu-items/no-image-available-icon-vector.jpg';

const makeAbsoluteUrl = (req, url) => {
  if (!url || typeof url !== 'string') return url;
  // If the URL already looks absolute, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Only prefix backend host for uploads; leave other relative assets untouched
  if (url.startsWith('/uploads')) {
    const configuredBaseUrl = process.env.PUBLIC_BASE_URL;
    if (configuredBaseUrl) {
      return `${configuredBaseUrl.replace(/\/$/, '')}${url}`;
    }

    const forwardedProto = req.get('x-forwarded-proto');
    const forwardedHost = req.get('x-forwarded-host');
    const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
    const host = forwardedHost ? forwardedHost.split(',')[0].trim() : req.get('host');
    return `${protocol}://${host}${url}`;
  }
  return url;
};

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ AUTHENTICATION ROUTES ============

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'puli-dev-secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: toPlain(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - MENU SECTIONS ============

app.get('/api/menu-sections', async (req, res) => {
  try {
    const sections = await MenuSection.find().sort({ order: 1 });
    res.json(sections.map(toPlain));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu-sections', authMiddleware, async (req, res) => {
  try {
    const section = await MenuSection.create(req.body);
    await logActivity(req, req.user.email, 'menu-sections', 'create', section._id, section);
    res.status(201).json(toPlain(section));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/menu-sections/:id', authMiddleware, async (req, res) => {
  try {
    const section = await MenuSection.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    await logActivity(req, req.user.email, 'menu-sections', 'update', section._id, req.body);
    res.json(toPlain(section));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/menu-sections/:id', authMiddleware, async (req, res) => {
  try {
    const section = await MenuSection.findByIdAndDelete(req.params.id);
    await logActivity(req, req.user.email, 'menu-sections', 'delete', req.params.id, {});
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - CATEGORIES ============

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json(categories.map((category) => mapCategoryForAdmin(req, category)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  try {
    const body = normalizeCategoryBody(req.body);
    if (body.image) {
      body.image = await saveBase64Image(body.image, 'categories');
    }
    const category = await Category.create(body);
    await logActivity(req, req.user.email, 'categories', 'create', category._id, category);
    res.status(201).json(mapCategoryForAdmin(req, category));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const body = normalizeCategoryBody(req.body);
    if (body.image) {
      body.image = await saveBase64Image(body.image, 'categories');
    }
    const category = await Category.findByIdAndUpdate(req.params.id, body, { returnDocument: 'after' });
    await logActivity(req, req.user.email, 'categories', 'update', category._id, body);
    res.json(mapCategoryForAdmin(req, category));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    await logActivity(req, req.user.email, 'categories', 'delete', req.params.id, {});
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - SUB-CATEGORIES ============

app.get('/api/subcategories', async (req, res) => {
  try {
    const subcategories = await SubCategory.find().sort({ order: 1 });
    res.json(subcategories.map(toPlain));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subcategories', authMiddleware, async (req, res) => {
  try {
    const subcategory = await SubCategory.create(req.body);
    await logActivity(req, req.user.email, 'subcategories', 'create', subcategory._id, subcategory);
    res.status(201).json(toPlain(subcategory));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/subcategories/:id', authMiddleware, async (req, res) => {
  try {
    // Capture the previous parent category so we can detect a change.
    const existing = await SubCategory.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    const previousCategoryId = existing.category_id ? existing.category_id.toString() : null;

    const subcategory = await SubCategory.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    const newCategoryId = subcategory.category_id ? subcategory.category_id.toString() : null;

    // If the subcategory was moved to a different parent category, keep every
    // menu item that belongs to this subcategory in sync with the new parent.
    let movedItems = 0;
    if (newCategoryId && previousCategoryId !== newCategoryId) {
      const result = await MenuItem.updateMany(
        { subcategory_id: subcategory._id },
        { $set: { category_id: subcategory.category_id } }
      );
      movedItems = result.modifiedCount ?? result.nModified ?? 0;
    }

    await logActivity(req, req.user.email, 'subcategories', 'update', subcategory._id, {
      ...req.body,
      moved_menu_items: movedItems,
    });
    res.json({ ...toPlain(subcategory), moved_menu_items: movedItems });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/subcategories/:id', authMiddleware, async (req, res) => {
  try {
    await SubCategory.findByIdAndDelete(req.params.id);
    await logActivity(req, req.user.email, 'subcategories', 'delete', req.params.id, {});
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - COUNTRIES ============

app.get('/api/countries', async (req, res) => {
  try {
    const countries = await Country.find().sort({ order: 1 });
    res.json(countries.map((country) => mapCountryForAdmin(req, country)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/countries', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.flag_image) {
      body.flag_image = await saveBase64Image(body.flag_image, 'countries');
    }
    const country = await Country.create(body);
    await logActivity(req, req.user.email, 'countries', 'create', country._id, country);
    res.status(201).json(mapCountryForAdmin(req, country));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/countries/:id', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.flag_image) {
      body.flag_image = await saveBase64Image(body.flag_image, 'countries');
    }
    const country = await Country.findByIdAndUpdate(req.params.id, body, { returnDocument: 'after' });
    await logActivity(req, req.user.email, 'countries', 'update', country._id, body);
    res.json(mapCountryForAdmin(req, country));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/countries/:id', authMiddleware, async (req, res) => {
  try {
    await Country.findByIdAndDelete(req.params.id);
    await logActivity(req, req.user.email, 'countries', 'delete', req.params.id, {});
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - CLASSIFICATIONS ============

app.get('/api/classifications', async (req, res) => {
  try {
    const classifications = await Classification.find().sort({ order: 1 });
    res.json(classifications.map(toPlain));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/classifications', authMiddleware, async (req, res) => {
  try {
    const classification = await Classification.create(req.body);
    await logActivity(req, req.user.email, 'classifications', 'create', classification._id, classification);
    res.status(201).json(toPlain(classification));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/classifications/:id', authMiddleware, async (req, res) => {
  try {
    const classification = await Classification.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    await logActivity(req, req.user.email, 'classifications', 'update', classification._id, req.body);
    res.json(toPlain(classification));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/classifications/:id', authMiddleware, async (req, res) => {
  try {
    await Classification.findByIdAndDelete(req.params.id);
    await logActivity(req, req.user.email, 'classifications', 'delete', req.params.id, {});
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - MENU ITEMS ============

app.get('/api/menu-items', async (req, res) => {
  try {
    const items = await MenuItem.find()
      .populate('category_id')
      .populate('subcategory_id')
      .populate('classification_id')
      .populate('country_id')
      .sort({ order: 1 });
    res.json(items.map((item) => ({
      ...toPlain(item),
      image: makeAbsoluteUrl(req, item.image),
      country_flag_url: makeAbsoluteUrl(req, item.country_flag_url),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/menu-items/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id)
      .populate('category_id')
      .populate('subcategory_id')
      .populate('classification_id')
      .populate('country_id');
    res.json({
      ...toPlain(item),
      image: makeAbsoluteUrl(req, item.image),
      country_flag_url: makeAbsoluteUrl(req, item.country_flag_url),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu-items', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.subcategory_id && body.classification_id) {
      body.subcategory_id = body.classification_id;
    }
    if (body.image) {
      body.image = await saveBase64Image(body.image, 'menu-items');
    }
    normalizeMenuItemTags(body);
    normalizeMenuItemPrice(body);
    await attachCountrySnapshot(body);
    const item = await MenuItem.create(body);
    await logActivity(req, req.user.email, 'menu-items', 'create', item._id, item);
    res.status(201).json({
      ...toPlain(item),
      image: makeAbsoluteUrl(req, item.image),
      country_flag_url: makeAbsoluteUrl(req, item.country_flag_url),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/menu-items/:id', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.subcategory_id && body.classification_id) {
      body.subcategory_id = body.classification_id;
    }
    if (body.image) {
      body.image = await saveBase64Image(body.image, 'menu-items');
    }
    normalizeMenuItemTags(body);
    normalizeMenuItemPrice(body);
    if (Object.prototype.hasOwnProperty.call(body, 'country_id')) {
      await attachCountrySnapshot(body);
    }
    const item = await MenuItem.findByIdAndUpdate(req.params.id, body, { returnDocument: 'after' });
    await logActivity(req, req.user.email, 'menu-items', 'update', item._id, body);
    res.json({
      ...toPlain(item),
      image: makeAbsoluteUrl(req, item.image),
      country_flag_url: makeAbsoluteUrl(req, item.country_flag_url),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/menu-items/:id', authMiddleware, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    await logActivity(req, req.user.email, 'menu-items', 'delete', req.params.id, {});
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - FILTER TAGS ============

app.get('/api/filter-tags', async (req, res) => {
  try {
    const tags = await FilterTag.find().sort({ order: 1 });
    res.json(tags.map(toPlain));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/filter-tags', authMiddleware, async (req, res) => {
  try {
    const tag = await FilterTag.create(req.body);
    await logActivity(req, req.user.email, 'filter-tags', 'create', tag._id, tag);
    res.status(201).json(toPlain(tag));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/filter-tags/:id', authMiddleware, async (req, res) => {
  try {
    const tag = await FilterTag.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    await logActivity(req, req.user.email, 'filter-tags', 'update', tag._id, req.body);
    res.json(toPlain(tag));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/filter-tags/:id', authMiddleware, async (req, res) => {
  try {
    await FilterTag.findByIdAndDelete(req.params.id);
    await logActivity(req, req.user.email, 'filter-tags', 'delete', req.params.id, {});
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - BANNER & STORY ============

app.get('/api/banner', async (req, res) => {
  try {
    let banner = await Banner.findOne();
    if (!banner) {
      banner = await Banner.create({
        title_en: 'PULI Digital Menu',
        subtitle_en: 'Pan Asian cuisine in Jubail',
        title_ar: 'قائمة سايو الرقمية',
        subtitle_ar: 'المطبخ الآسيوي في الجبيل',
        enabled: true,
      });
    }
    const plain = toPlain(banner);
    res.json({
      id: plain.id,
      title: plain.title_en,
      subtitle: plain.subtitle_en,
      background_image: plain.background_image,
      enabled: plain.enabled,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/banner/:id', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };

    // Map to internal fields
    if (body.title) body.title_en = body.title;
    if (body.subtitle) body.subtitle_en = body.subtitle;

    if (body.background_image) {
      body.background_image = await saveBase64Image(body.background_image, 'banners');
    }

    const banner = await Banner.findByIdAndUpdate(req.params.id, body, { returnDocument: 'after' });
    await logActivity(req, req.user.email, 'banner', 'update', banner._id, body);
    const plain = toPlain(banner);
    res.json({
      id: plain.id,
      title: plain.title_en,
      subtitle: plain.subtitle_en,
      background_image: plain.background_image,
      enabled: plain.enabled,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/story', async (req, res) => {
  try {
    let story = await Story.findOne();
    if (!story) {
      story = await Story.create({
        title_en: 'Our Story',
        title_ar: 'قصتنا',
        description_en: 'PULI is a name inspired by the initials of its visionary founders.',
        description_ar: 'سايو اسم مستوحى من أحرف مؤسسيها الرائدين.',
      });
    }
    const plain = toPlain(story);
    res.json({
      id: plain.id,
      title: plain.title_en,
      description: plain.description_en,
      background_image: plain.background_image,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/story/:id', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.title) body.title_en = body.title;
    if (body.description) body.description_en = body.description;
    if (body.background_image) {
      body.background_image = await saveBase64Image(body.background_image, 'stories');
    }
    const story = await Story.findByIdAndUpdate(req.params.id, body, { returnDocument: 'after' });
    await logActivity(req, req.user.email, 'story', 'update', story._id, body);
    const plain = toPlain(story);
    res.json({
      id: plain.id,
      title: plain.title_en,
      description: plain.description_en,
      background_image: plain.background_image,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - SETTINGS ============

// Default restaurant opening hours used to seed/backfill settings.
const DEFAULT_OPENING_HOURS = [
  { days: 'SATURDAY TO WEDNESDAY', meals: ['Restaurant: 11.30am to 11.30pm'] },
  { days: 'THURSDAY & FRIDAY', meals: ['Restaurant: 11.30am to 12.00am'] },
  { days: 'BREAKFAST (FRIDAY & SATURDAY)', meals: ['8.00am to 11.00am'] },
];

app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        restaurant_name: 'PULI Jubail',
        restaurant_name_ar: 'سايو الجبيل',
        address_en: 'Al Fanater District, Jubail, Saudi Arabia',
        address_ar: 'حي الفناتير، الجبيل، المملكة العربية السعودية',
        logo_url: '',
        logo_dark_url: '',
        logo_light_url: '',
        favicon_url: '/assets/Favicon.svg',
        theme_mode: 'light',
        opening_hours: DEFAULT_OPENING_HOURS,
      });
    }

    const needsLogoBackfill =
      settings.logo_dark_url === undefined || settings.logo_light_url === undefined;

    if (needsLogoBackfill) {
      settings.logo_dark_url = settings.logo_dark_url ?? '/assets/Logo_EN.svg';
      settings.logo_light_url = settings.logo_light_url ?? '/assets/Logo_lgt_EN.svg';
      await settings.save();
    }

    // Backfill opening hours for records created before this field existed.
    if (!Array.isArray(settings.opening_hours) || settings.opening_hours.length === 0) {
      settings.opening_hours = DEFAULT_OPENING_HOURS;
      await settings.save();
    }

    res.json({
      id: settings._id.toString(),
      restaurant_name: settings.restaurant_name,
      restaurant_name_ar: settings.restaurant_name_ar,
      address_en: settings.address_en,
      address_ar: settings.address_ar,
      phone: settings.phone,
      telephone: settings.telephone,
      email: settings.email,
      logo_url: makeAbsoluteUrl(req, settings.logo_url),
      logo_dark_url: makeAbsoluteUrl(req, settings.logo_dark_url),
      logo_light_url: makeAbsoluteUrl(req, settings.logo_light_url),
      logo_dark_ar_url: makeAbsoluteUrl(req, settings.logo_dark_ar_url),
      logo_light_ar_url: makeAbsoluteUrl(req, settings.logo_light_ar_url),
      favicon_url: makeAbsoluteUrl(req, settings.favicon_url),
      theme_mode: settings.theme_mode,
      opening_hours: (settings.opening_hours || []).map((g) => ({
        days: g.days,
        meals: g.meals || [],
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings/:id', authMiddleware, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.logo_url) {
      body.logo_url = await saveBase64Image(body.logo_url, 'settings');
    }
    if (body.logo_dark_url) {
      body.logo_dark_url = await saveBase64Image(body.logo_dark_url, 'settings');
    }
    if (body.logo_light_url) {
      body.logo_light_url = await saveBase64Image(body.logo_light_url, 'settings');
    }
    if (body.logo_dark_ar_url) {
      body.logo_dark_ar_url = await saveBase64Image(body.logo_dark_ar_url, 'settings');
    }
    if (body.logo_light_ar_url) {
      body.logo_light_ar_url = await saveBase64Image(body.logo_light_ar_url, 'settings');
    }
    if (body.favicon_url) {
      body.favicon_url = await saveBase64Image(body.favicon_url, 'settings');
    }
    const settings = await Settings.findByIdAndUpdate(req.params.id, body, { returnDocument: 'after' });
    await logActivity(req, req.user.email, 'settings', 'update', settings._id, body);
    res.json(toPlain(settings));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - MEDIA / UPLOADS ============

app.get('/api/media', async (req, res) => {
  try {
    const items = await MediaItem.find().sort({ createdAt: -1 });
    res.json(items.map(toPlain));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/media', authMiddleware, async (req, res) => {
  try {
    const { dataUrl, name, size } = req.body;
    const url = await saveBase64Image(dataUrl, 'media');
    const item = await MediaItem.create({ url, name, size });
    await logActivity(req, req.user.email, 'media', 'create', item._id, item);
    res.status(201).json(toPlain(item));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const item = await MediaItem.findByIdAndDelete(req.params.id);
    await logActivity(req, req.user.email, 'media', 'delete', req.params.id, item);
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - AUDIT LOG ============

app.get('/api/audit-log', async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(logs.map(toPlain));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES - CUSTOMERS ============

app.post('/api/customers', async (req, res) => {
  try {
    const { fullName, contactNumber, email, dateOfBirth, anniversaryDate } = req.body;

    if (!fullName || !contactNumber || !email) {
      return res.status(400).json({ error: 'fullName, contactNumber, and email are required' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const customer = await Customer.create({
      fullName: String(fullName).trim(),
      contactNumber: String(contactNumber).trim(),
      email: String(email).trim().toLowerCase(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      anniversaryDate: anniversaryDate ? new Date(anniversaryDate) : undefined,
    });

    res.status(201).json(toPlain(customer));
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));

    const total = await Customer.countDocuments();
    const customers = await Customer.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      data: customers.map(toPlain),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PUBLIC ROUTES - CUSTOMER MENU ============

const mapCategoryForPublic = (req, category) => ({
  _id: category._id.toString(),
  name_en: category.name_en,
  name_ar: category.name_ar,
  description_en: category.description_en || category.description || '',
  description_ar: category.description_ar || category.description_en || category.description || '',
  description: category.description_en || category.description_ar || category.description || '',
  image_url: makeAbsoluteUrl(req, category.image || DEFAULT_DISH_IMAGE),
  slug: category.slug,
  group: category.group,
  category_id: category.group,
  section_id: category.section_id ? category.section_id.toString() : null,
  visible: category.visible,
  order: category.order,
});

const mapMenuItemForPublic = (req, item) => ({
  _id: item._id.toString(),
  name_en: item.name_en,
  name_ar: item.name_ar,
  description_en: item.description_en,
  description_ar: item.description_ar,
  price: Number.isFinite(item.price) ? item.price : 0,
  image_url: makeAbsoluteUrl(req, item.image || DEFAULT_DISH_IMAGE),
  calories: item.calories,
  allergens: item.allergens,
  tags: item.tags,
  country_code: item.country_code,
  country_name_en: item.country_name_en,
  country_name_ar: item.country_name_ar,
  country_flag_url: makeAbsoluteUrl(req, item.country_flag_url),
  spice_level: item.spice_level,
  visible: item.visible,
  order: item.order,
  category_id: item.category_id ? item.category_id.toString() : null,
  subcategory_id: item.subcategory_id ? (typeof item.subcategory_id === 'object' ? item.subcategory_id._id.toString() : item.subcategory_id.toString()) : null,
  classification_id: item.classification_id ? item.classification_id.toString() : null,
  country_id: item.country_id ? (typeof item.country_id === 'object' ? item.country_id._id.toString() : item.country_id.toString()) : null,
  section_id: item.section_id ? item.section_id.toString() : null,
  available_from: item.available_from,
  available_to: item.available_to,
  available_days: item.available_days,
});

app.get('/api/public/menu', async (req, res) => {
  try {
    const sections = await MenuSection.find().sort({ order: 1 });

    const formattedMenu = await Promise.all(
      sections.map(async (section) => {
        const categories = await Category.find({
          section_id: section._id,
          visible: true,
        }).sort({ order: 1 });

        const categoriesWithItems = await Promise.all(
          categories.map(async (category) => {
            const items = await MenuItem.find({
              category_id: category._id,
              visible: true,
            })
              .sort({ order: 1 });

            return {
              ...mapCategoryForPublic(req, category),
              items: items.map((item) => mapMenuItemForPublic(req, item)),
            };
          })
        );

        return {
          _id: section._id.toString(),
          name_en: section.name_en,
          name_ar: section.name_ar,
          order: section.order,
          categories: categoriesWithItems,
        };
      })
    );

    res.json(formattedMenu);
  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all items in flat structure for filtering
app.get('/api/public/menu-items', async (req, res) => {
  try {
    const items = await MenuItem.find({ visible: true })
      .populate('subcategory_id')
      .populate('country_id')
      .sort({ order: 1 });

    res.json(items.map((item) => mapMenuItemForPublic(req, item)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories for navigation
app.get('/api/public/categories', async (req, res) => {
  try {
    const categories = await Category.find({ visible: true }).sort({ order: 1 });

    res.json(categories.map((category) => mapCategoryForPublic(req, category)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get filter tags for UI
app.get('/api/public/filter-tags', async (req, res) => {
  try {
    const tags = await FilterTag.find({ enabled: true }).sort({ order: 1 });

    res.json(tags.map(toPlain));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PUBLIC ROUTES - BANNER / STORY / SETTINGS / LAYOUT ============

app.get('/api/banners', async (req, res) => {
  try {
    const banners = await Banner.find({ enabled: true });
    const mapped = banners.map((b) => ({
      id: b._id.toString(),
      title: b.title_en,
      subtitle: b.subtitle_en,
      background_image: makeAbsoluteUrl(req, b.background_image),
      enabled: b.enabled,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stories', async (req, res) => {
  try {
    let story = await Story.findOne();
    if (!story) {
      story = await Story.create({
        title_en: 'Our Story',
        title_ar: 'قصتنا',
        description_en: 'PULI is a name inspired by the initials of its visionary founders.',
        description_ar: 'سايو اسم مستوحى من أحرف مؤسسيها الرائدين.',
      });
    }
    res.json({
      id: story._id.toString(),
      title: story.title_en,
      title_ar: story.title_ar,
      description: story.description_en,
      description_ar: story.description_ar,
      background_image: makeAbsoluteUrl(req, story.background_image),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/menu-layout', async (req, res) => {
  try {
    const sections = await MenuSection.find().sort({ order: 1 });
    const mapped = sections.map((section) => ({
      id: section._id.toString(),
      name_en: section.name_en,
      name_ar: section.name_ar,
      order: section.order,
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ============ SERVER STARTUP ============

const startServer = async () => {
  await connectDB();
  ensureUploadsDir();
  await ensureDefaultAdmin();
  await ensureDefaultFilterTags();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
