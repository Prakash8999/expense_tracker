// ─── Default Expense Categories (30+) ────────────────────────
// Each has: name, Ionicons icon name, hex color

export interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { name: 'Shopping', icon: 'bag-handle', color: '#FF6B6B', type: 'expense' },
  { name: 'Food', icon: 'restaurant', color: '#FF8E53', type: 'expense' },
  { name: 'Phone', icon: 'phone-portrait', color: '#4FC3F7', type: 'expense' },
  { name: 'Entertainment', icon: 'game-controller', color: '#BA68C8', type: 'expense' },
  { name: 'Education', icon: 'school', color: '#64B5F6', type: 'expense' },
  { name: 'Beauty', icon: 'sparkles', color: '#F48FB1', type: 'expense' },
  { name: 'Sports', icon: 'football', color: '#81C784', type: 'expense' },
  { name: 'Social', icon: 'people', color: '#FFB74D', type: 'expense' },
  { name: 'Transport', icon: 'bus', color: '#4DB6AC', type: 'expense' },
  { name: 'Clothing', icon: 'shirt', color: '#9575CD', type: 'expense' },
  { name: 'Car', icon: 'car-sport', color: '#A1887F', type: 'expense' },
  { name: 'Alcohol', icon: 'wine', color: '#E57373', type: 'expense' },
  { name: 'Cigarettes', icon: 'bonfire', color: '#8D6E63', type: 'expense' },
  { name: 'Electronics', icon: 'laptop', color: '#7986CB', type: 'expense' },
  { name: 'Travel', icon: 'airplane', color: '#4DD0E1', type: 'expense' },
  { name: 'Health', icon: 'heart', color: '#EF5350', type: 'expense' },
  { name: 'Pets', icon: 'paw', color: '#FF7043', type: 'expense' },
  { name: 'Repairs', icon: 'construct', color: '#78909C', type: 'expense' },
  { name: 'Housing', icon: 'business', color: '#5C6BC0', type: 'expense' },
  { name: 'Home', icon: 'home', color: '#26A69A', type: 'expense' },
  { name: 'Gifts', icon: 'gift', color: '#EC407A', type: 'expense' },
  { name: 'Donations', icon: 'heart-half', color: '#AB47BC', type: 'expense' },
  { name: 'Lottery', icon: 'ticket', color: '#FFA726', type: 'expense' },
  { name: 'Snacks', icon: 'ice-cream', color: '#FFCA28', type: 'expense' },
  { name: 'Kids', icon: 'happy', color: '#66BB6A', type: 'expense' },
  { name: 'Vegetables', icon: 'leaf', color: '#43A047', type: 'expense' },
  { name: 'Fruits', icon: 'nutrition', color: '#FF7043', type: 'expense' },
  { name: 'Groceries', icon: 'cart', color: '#8BC34A', type: 'expense' },
  { name: 'Insurance', icon: 'shield-checkmark', color: '#42A5F5', type: 'expense' },
  { name: 'Taxes', icon: 'document-text', color: '#78909C', type: 'expense' },
  { name: 'Subscriptions', icon: 'card', color: '#7E57C2', type: 'expense' },
  { name: 'Medical', icon: 'medkit', color: '#EF5350', type: 'expense' },
  { name: 'Rent', icon: 'key', color: '#5C6BC0', type: 'expense' },
  { name: 'Utilities', icon: 'flash', color: '#FDD835', type: 'expense' },
  { name: 'Internet', icon: 'wifi', color: '#29B6F6', type: 'expense' },
  { name: 'Other', icon: 'ellipsis-horizontal-circle', color: '#90A4AE', type: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { name: 'Salary', icon: 'briefcase', color: '#66BB6A', type: 'income' },
  { name: 'Business', icon: 'storefront', color: '#42A5F5', type: 'income' },
  { name: 'Freelance', icon: 'code-working', color: '#AB47BC', type: 'income' },
  { name: 'Investments', icon: 'trending-up', color: '#26A69A', type: 'income' },
  { name: 'Rental Income', icon: 'home', color: '#5C6BC0', type: 'income' },
  { name: 'Gifts Received', icon: 'gift', color: '#EC407A', type: 'income' },
  { name: 'Refunds', icon: 'return-down-back', color: '#78909C', type: 'income' },
  { name: 'Interest', icon: 'cash', color: '#FFB74D', type: 'income' },
  { name: 'Dividends', icon: 'pie-chart', color: '#4FC3F7', type: 'income' },
  { name: 'Bonus', icon: 'star', color: '#FFA726', type: 'income' },
  { name: 'Other Income', icon: 'add-circle', color: '#90A4AE', type: 'income' },
];

// ─── Available Icons for User Custom Categories ──────────────
export const AVAILABLE_ICONS = [
  'bag-handle', 'restaurant', 'phone-portrait', 'game-controller', 'school',
  'sparkles', 'football', 'people', 'bus', 'shirt', 'car-sport', 'wine',
  'bonfire', 'laptop', 'airplane', 'heart', 'paw', 'construct', 'business',
  'home', 'gift', 'heart-half', 'ticket', 'ice-cream', 'happy', 'leaf',
  'nutrition', 'cart', 'shield-checkmark', 'document-text', 'card',
  'medkit', 'key', 'flash', 'wifi', 'briefcase', 'storefront', 'code-working',
  'trending-up', 'cash', 'pie-chart', 'star', 'add-circle', 'musical-notes',
  'camera', 'book', 'fitness', 'bicycle', 'bed', 'cafe', 'pizza',
  'beer', 'rocket', 'globe', 'map', 'compass', 'trail-sign', 'water',
  'umbrella', 'snow', 'sunny', 'moon', 'cloudy', 'rainy', 'thunderstorm',
  'barbell', 'basketball', 'tennisball', 'baseball',
  'desktop', 'tablet-portrait', 'watch', 'headset', 'tv',
  'print', 'hammer', 'color-palette', 'brush', 'cut',
  'diamond', 'rose', 'skull', 'fish', 'bug', 'earth',
  'flag', 'ribbon', 'trophy', 'medal',
];

// ─── Available Colors for User Custom Categories ─────────────
export const AVAILABLE_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFCA28', '#FFA726', '#FFB74D',
  '#66BB6A', '#81C784', '#43A047', '#8BC34A', '#4DB6AC',
  '#26A69A', '#4DD0E1', '#4FC3F7', '#42A5F5', '#64B5F6',
  '#29B6F6', '#5C6BC0', '#7986CB', '#7E57C2', '#9575CD',
  '#AB47BC', '#BA68C8', '#EC407A', '#F48FB1', '#EF5350',
  '#E57373', '#FF7043', '#8D6E63', '#A1887F', '#78909C',
  '#90A4AE',
];
