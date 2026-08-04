// ─── Default Expense Categories (30+) ────────────────────────
// Each has: name, Ionicons icon name, hex color

export interface DefaultSubCategory {
  name: string;
  icon: string;
}

export interface DefaultParentCategory {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  subcategories: DefaultSubCategory[];
}

export const DEFAULT_EXPENSE_CATEGORIES: DefaultParentCategory[] = [
  {
    name: 'Food & Dining', icon: 'restaurant', color: '#FF8E53', type: 'expense',
    subcategories: [
      { name: 'Groceries', icon: 'cart' },
      { name: 'Restaurants', icon: 'pizza' },
      { name: 'Coffee & Cafes', icon: 'cafe' },
      { name: 'Fast Food', icon: 'fast-food' },
      { name: 'Delivery / Takeout', icon: 'bicycle' },
      { name: 'Alcohol & Bars', icon: 'wine' },
      { name: 'Snacks & Sweets', icon: 'ice-cream' },
      { name: 'Breakfast', icon: 'sunny' },
    ]
  },
  {
    name: 'Transportation', icon: 'car-sport', color: '#4FC3F7', type: 'expense',
    subcategories: [
      { name: 'Fuel / Gas', icon: 'water' },
      { name: 'Public Transit', icon: 'bus' },
      { name: 'Taxi / Rideshare', icon: 'car' },
      { name: 'Car Maintenance', icon: 'construct' },
      { name: 'Parking', icon: 'business' },
      { name: 'Tolls', icon: 'trail-sign' },
      { name: 'Flights', icon: 'airplane' },
      { name: 'Vehicle Registration', icon: 'document-text' },
    ]
  },
  {
    name: 'Housing', icon: 'home', color: '#5C6BC0', type: 'expense',
    subcategories: [
      { name: 'Rent', icon: 'key' },
      { name: 'Mortgage', icon: 'home' },
      { name: 'Electricity', icon: 'flash' },
      { name: 'Water', icon: 'water' },
      { name: 'Internet / WiFi', icon: 'wifi' },
      { name: 'Home Maintenance', icon: 'hammer' },
      { name: 'Property Tax', icon: 'document-text' },
      { name: 'Furniture', icon: 'bed' },
      { name: 'Cleaning Services', icon: 'sparkles' },
    ]
  },
  {
    name: 'Entertainment', icon: 'game-controller', color: '#BA68C8', type: 'expense',
    subcategories: [
      { name: 'Movies & Cinema', icon: 'film' },
      { name: 'Video Games', icon: 'game-controller' },
      { name: 'Sports Events', icon: 'football' },
      { name: 'Concerts / Music', icon: 'musical-notes' },
      { name: 'Streaming Services', icon: 'tv' },
      { name: 'Hobbies', icon: 'color-palette' },
      { name: 'Books & Magazines', icon: 'book' },
      { name: 'Night Out', icon: 'moon' },
      { name: 'Trips & Travel', icon: 'map' },
      { name: 'Group Contribution', icon: 'people' },
    ]
  },
  {
    name: 'Shopping', icon: 'bag-handle', color: '#FF6B6B', type: 'expense',
    subcategories: [
      { name: 'Clothing & Apparel', icon: 'shirt' },
      { name: 'Shoes', icon: 'walk' },
      { name: 'Electronics', icon: 'laptop' },
      { name: 'Home Goods', icon: 'bed' },
      { name: 'Gifts', icon: 'gift' },
      { name: 'Accessories', icon: 'watch' },
      { name: 'Toys', icon: 'happy' },
    ]
  },
  {
    name: 'Personal Care', icon: 'sparkles', color: '#F48FB1', type: 'expense',
    subcategories: [
      { name: 'Haircut & Salon', icon: 'cut' },
      { name: 'Cosmetics', icon: 'brush' },
      { name: 'Spa & Massage', icon: 'flower' },
      { name: 'Toiletries', icon: 'water' },
      { name: 'Laundry', icon: 'shirt' },
    ]
  },
  {
    name: 'Health & Fitness', icon: 'medkit', color: '#EF5350', type: 'expense',
    subcategories: [
      { name: 'Doctor / Medical', icon: 'medkit' },
      { name: 'Pharmacy / Meds', icon: 'medical' },
      { name: 'Gym / Fitness', icon: 'barbell' },
      { name: 'Health Insurance', icon: 'shield-checkmark' },
      { name: 'Dental', icon: 'happy' },
      { name: 'Vision / Eyecare', icon: 'eye' },
    ]
  },
  {
    name: 'Investments & Savings', icon: 'trending-up', color: '#10B981', type: 'expense',
    subcategories: [
      { name: 'Goals', icon: 'flag' },
      { name: 'Stocks', icon: 'stats-chart' },
      { name: 'Crypto', icon: 'logo-bitcoin' },
      { name: 'Mutual Funds', icon: 'pie-chart' },
      { name: 'Emergency Fund', icon: 'shield-checkmark' },
    ]
  },
  {
    name: 'Education', icon: 'school', color: '#64B5F6', type: 'expense',
    subcategories: [
      { name: 'Tuition', icon: 'school' },
      { name: 'Books & Supplies', icon: 'book' },
      { name: 'Online Courses', icon: 'laptop' },
      { name: 'Student Loan', icon: 'cash' },
    ]
  },
  {
    name: 'Family & Pets', icon: 'people', color: '#FFB74D', type: 'expense',
    subcategories: [
      { name: 'Childcare', icon: 'happy' },
      { name: 'Kids Activities', icon: 'football' },
      { name: 'Pet Food', icon: 'paw' },
      { name: 'Vet Bills', icon: 'medkit' },
      { name: 'Pet Toys', icon: 'tennisball' },
    ]
  },
  {
    name: 'Financial & Taxes', icon: 'cash', color: '#78909C', type: 'expense',
    subcategories: [
      { name: 'Taxes', icon: 'document-text' },
      { name: 'Bank Fees', icon: 'card' },
      { name: 'Life Insurance', icon: 'shield-checkmark' },
      { name: 'Fines / Penalties', icon: 'alert-circle' },
      { name: 'Donations', icon: 'heart' },
    ]
  }
];

export const DEFAULT_INCOME_CATEGORIES: DefaultParentCategory[] = [
  {
    name: 'Active Income', icon: 'briefcase', color: '#66BB6A', type: 'income',
    subcategories: [
      { name: 'Salary', icon: 'cash' },
      { name: 'Freelance / Contract', icon: 'code-working' },
      { name: 'Business Revenue', icon: 'storefront' },
      { name: 'Bonus', icon: 'star' },
      { name: 'Overtime', icon: 'time' },
      { name: 'Tips / Commission', icon: 'cash' },
    ]
  },
  {
    name: 'Passive Income', icon: 'trending-up', color: '#26A69A', type: 'income',
    subcategories: [
      { name: 'Investments', icon: 'pie-chart' },
      { name: 'Rental Income', icon: 'home' },
      { name: 'Dividends', icon: 'stats-chart' },
      { name: 'Capital Gains', icon: 'trending-up' },
      { name: 'Royalties', icon: 'musical-notes' },
    ]
  },
  {
    name: 'Other Income', icon: 'add-circle', color: '#90A4AE', type: 'income',
    subcategories: [
      { name: 'Gifts Received', icon: 'gift' },
      { name: 'Refunds / Returns', icon: 'return-down-back' },
      { name: 'Interest', icon: 'cash' },
      { name: 'Government Aid', icon: 'business' },
      { name: 'Sale of Items', icon: 'cart' },
      { name: 'Lottery / Gambling', icon: 'ticket' },
    ]
  }
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
