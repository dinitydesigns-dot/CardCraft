// ─── Demo ─────────────────────────────────────────────────────────────────────
export const DEMO_MAX_TRIES = 3;
export const DEMO_TEMPLATES: BuiltInTemplateId[] = ['elegant-dark', 'fresh-gradient', 'minimal-white'];

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center';
export type LogoSize = 'small' | 'medium' | 'large';
export type BadgeLabel = 'none' | 'new' | 'sale' | 'best-seller' | 'limited' | 'hot' | 'trending';
export type CardSize = 'square' | 'story' | 'landscape';
export type BgPattern = 'none' | 'dots' | 'grid' | 'waves' | 'diagonal' | 'circles';
export type CardFont = 'inter' | 'playfair' | 'montserrat' | 'poppins' | 'raleway' | 'oswald';

export interface ActivityEntry {
  type: 'edit' | 'download' | 'login';
  timestamp: number;
  detail?: string;
}

export interface ProductData {
  productName: string;
  price: string;
  description: string;
  contactNumber: string;
  imageUrl: string;
  extraImages: string[];          // up to 3 additional images
  ctaText: string;
  logoUrl: string;
  logoPosition: LogoPosition;
  logoSize: LogoSize;
  logoBgVisible: boolean;
  badge: BadgeLabel;              // sticker overlay
  accentColorOverride: string;    // client accent color ('' = use template default)
  cardSize: CardSize;
  font: CardFont;
  bgPattern: BgPattern;
}

export type BuiltInTemplateId = 'elegant-dark' | 'fresh-gradient' | 'minimal-white' | 'bold-vibrant' | 'pastel-soft';
export type TemplateId = BuiltInTemplateId | string;

// ─── Custom Template Config ────────────────────────────────────────────────────
export type LayoutStyle =
  | 'classic'
  | 'card-float'
  | 'side-accent'
  | 'full-bleed'
  | 'banner';

export interface CustomTemplateConfig {
  id: string;
  name: string;
  description: string;
  layout: LayoutStyle;
  bgColor: string;
  bgColor2: string;
  accentColor: string;
  textColor: string;
  subTextColor: string;
  priceColor: string;
  btnBgColor: string;
  btnTextColor: string;
  useGradientBg: boolean;
  imageRounded: boolean;
  showAccentBar: boolean;
  cardStyle: 'flat' | 'raised' | 'glass';
  createdAt: number;
}

export const DEFAULT_CUSTOM_CONFIG: Omit<CustomTemplateConfig, 'id' | 'name' | 'description' | 'createdAt'> = {
  layout: 'classic',
  bgColor: '#1e1b4b',
  bgColor2: '#312e81',
  accentColor: '#818cf8',
  textColor: '#ffffff',
  subTextColor: '#a5b4fc',
  priceColor: '#fbbf24',
  btnBgColor: '#6366f1',
  btnTextColor: '#ffffff',
  useGradientBg: true,
  imageRounded: true,
  showAccentBar: true,
  cardStyle: 'flat',
};

export interface BuiltInTemplate {
  id: BuiltInTemplateId;
  name: string;
  description: string;
  previewColor: string;
  isCustom?: false;
}

export interface CustomTemplateEntry {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  isCustom: true;
  config: CustomTemplateConfig;
}

export type AnyTemplate = BuiltInTemplate | CustomTemplateEntry;

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  { id: 'elegant-dark',    name: 'Elegant Dark',    description: 'Sleek dark theme with gold accents',          previewColor: 'from-gray-900 to-gray-800' },
  { id: 'fresh-gradient',  name: 'Fresh Gradient',  description: 'Vibrant gradient for modern brands',          previewColor: 'from-emerald-500 to-teal-600' },
  { id: 'minimal-white',   name: 'Minimal White',   description: 'Clean minimalist layout',                     previewColor: 'from-gray-50 to-white' },
  { id: 'bold-vibrant',    name: 'Bold Vibrant',    description: 'Eye-catching colors for food & fashion',      previewColor: 'from-orange-500 to-pink-600' },
  { id: 'pastel-soft',     name: 'Pastel Soft',     description: 'Soft pastel tones for beauty & wellness',     previewColor: 'from-pink-200 to-purple-200' },
];

export const TEMPLATES = BUILT_IN_TEMPLATES;

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  assignedTemplate: TemplateId;
  productData: ProductData;
  role: 'client' | 'admin';
  activity: ActivityEntry[];
}

// ─── Demo Session ─────────────────────────────────────────────────────────────
export interface DemoSession {
  id: string;                      // random UUID-style id
  triesUsed: number;               // how many downloads/previews used
  currentTemplateIndex: number;    // which demo template is active (0‑2)
  productData: ProductData;
  startedAt: number;
  expired: boolean;
}

export const DEFAULT_PRODUCT_DATA: ProductData = {
  productName: 'Premium Product',
  price: '$49.99',
  description: 'High quality product crafted with care. Perfect for everyday use.',
  contactNumber: '+1 234 567 8900',
  imageUrl: '',
  extraImages: [],
  ctaText: 'Order Now',
  logoUrl: '',
  logoPosition: 'top-left',
  logoSize: 'medium',
  logoBgVisible: true,
  badge: 'none',
  accentColorOverride: '',
  cardSize: 'square',
  font: 'inter',
  bgPattern: 'none',
};

export const CARD_SIZES: Record<CardSize, { width: number; height: number; label: string; desc: string; icon: string }> = {
  square:    { width: 400, height: 400, label: 'Square',    desc: 'Instagram Post · 1:1',      icon: '□' },
  story:     { width: 360, height: 640, label: 'Story',     desc: 'Instagram Story · 9:16',    icon: '▯' },
  landscape: { width: 520, height: 340, label: 'Landscape', desc: 'Facebook Cover · 3:2',      icon: '▭' },
};

export const FONTS: Record<CardFont, { label: string; family: string }> = {
  inter:      { label: 'Inter',       family: "'Inter', sans-serif" },
  playfair:   { label: 'Playfair',    family: "'Playfair Display', serif" },
  montserrat: { label: 'Montserrat',  family: "'Montserrat', sans-serif" },
  poppins:    { label: 'Poppins',     family: "'Poppins', sans-serif" },
  raleway:    { label: 'Raleway',     family: "'Raleway', sans-serif" },
  oswald:     { label: 'Oswald',      family: "'Oswald', sans-serif" },
};

export const BG_PATTERNS: Record<BgPattern, { label: string; icon: string }> = {
  none:     { label: 'None',     icon: '✕' },
  dots:     { label: 'Dots',     icon: '⠿' },
  grid:     { label: 'Grid',     icon: '⊞' },
  waves:    { label: 'Waves',    icon: '≈' },
  diagonal: { label: 'Diagonal', icon: '╱' },
  circles:  { label: 'Circles',  icon: '◎' },
};

export const BADGE_OPTIONS: { id: BadgeLabel; label: string; color: string; bg: string }[] = [
  { id: 'none',        label: 'None',        color: '#6b7280', bg: '#f3f4f6' },
  { id: 'new',         label: '🆕 New',       color: '#ffffff', bg: '#3b82f6' },
  { id: 'sale',        label: '🏷️ Sale',      color: '#ffffff', bg: '#ef4444' },
  { id: 'best-seller', label: '⭐ Best Seller',color: '#1f2937', bg: '#f59e0b' },
  { id: 'limited',     label: '⏳ Limited',   color: '#ffffff', bg: '#8b5cf6' },
  { id: 'hot',         label: '🔥 Hot',       color: '#ffffff', bg: '#f97316' },
  { id: 'trending',    label: '📈 Trending',  color: '#ffffff', bg: '#10b981' },
];

export const INITIAL_USERS: User[] = [
  {
    id: '1', username: 'admin', password: 'admin123', displayName: 'Admin',
    assignedTemplate: 'elegant-dark', productData: { ...DEFAULT_PRODUCT_DATA }, role: 'admin', activity: [],
  },
  {
    id: '2', username: 'client1', password: 'pass123', displayName: 'Bella Boutique',
    assignedTemplate: 'elegant-dark',
    productData: {
      productName: 'Silk Evening Dress', price: '$189.00',
      description: 'Luxurious silk dress for special occasions. Available in 5 colors.',
      contactNumber: '+1 555 123 4567', imageUrl: '', extraImages: [], ctaText: 'Order Now',
      logoUrl: '', logoPosition: 'top-left', logoSize: 'medium', logoBgVisible: true,
      badge: 'new', accentColorOverride: '', cardSize: 'square', font: 'playfair', bgPattern: 'none',
    },
    role: 'client', activity: [],
  },
  {
    id: '3', username: 'client2', password: 'pass123', displayName: 'Fresh Bites Café',
    assignedTemplate: 'fresh-gradient',
    productData: {
      productName: 'Avocado Toast Special', price: '$12.99',
      description: 'Fresh avocado on artisan bread with cherry tomatoes & microgreens.',
      contactNumber: '+1 555 987 6543', imageUrl: '', extraImages: [], ctaText: 'Order on WhatsApp',
      logoUrl: '', logoPosition: 'top-left', logoSize: 'medium', logoBgVisible: true,
      badge: 'hot', accentColorOverride: '', cardSize: 'square', font: 'poppins', bgPattern: 'none',
    },
    role: 'client', activity: [],
  },
  {
    id: '4', username: 'client3', password: 'pass123', displayName: 'Glow Skincare',
    assignedTemplate: 'pastel-soft',
    productData: {
      productName: 'Vitamin C Serum', price: '$34.50',
      description: 'Brighten your skin with our organic vitamin C serum. 30ml bottle.',
      contactNumber: '+1 555 456 7890', imageUrl: '', extraImages: [], ctaText: 'Shop Now',
      logoUrl: '', logoPosition: 'top-left', logoSize: 'medium', logoBgVisible: true,
      badge: 'best-seller', accentColorOverride: '', cardSize: 'square', font: 'raleway', bgPattern: 'none',
    },
    role: 'client', activity: [],
  },
];
