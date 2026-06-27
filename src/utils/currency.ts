import { NativeModules, Platform } from 'react-native';

// ─── Complete World Currency Database ────────────────────────
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  decimalDigits: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', decimalDigits: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimalDigits: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimalDigits: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalDigits: 0 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalDigits: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalDigits: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalDigits: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalDigits: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimalDigits: 2 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimalDigits: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimalDigits: 2 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimalDigits: 2 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimalDigits: 0 },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimalDigits: 2 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimalDigits: 2 },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', decimalDigits: 2 },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', decimalDigits: 2 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimalDigits: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalDigits: 2 },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimalDigits: 2 },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', decimalDigits: 2 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', decimalDigits: 2 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimalDigits: 0 },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', decimalDigits: 0 },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', decimalDigits: 2 },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', decimalDigits: 2 },
  { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso', decimalDigits: 0 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimalDigits: 2 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimalDigits: 2 },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', decimalDigits: 0 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', decimalDigits: 2 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimalDigits: 2 },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', decimalDigits: 2 },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', decimalDigits: 2 },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', decimalDigits: 2 },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimalDigits: 2 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimalDigits: 0 },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', decimalDigits: 2 },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', decimalDigits: 2 },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', decimalDigits: 2 },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', decimalDigits: 2 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', decimalDigits: 2 },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', decimalDigits: 2 },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', decimalDigits: 2 },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', decimalDigits: 0 },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', decimalDigits: 0 },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', decimalDigits: 2 },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimalDigits: 2 },
  { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol', decimalDigits: 2 },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', decimalDigits: 2 },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', decimalDigits: 3 },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', decimalDigits: 3 },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', decimalDigits: 3 },
  { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar', decimalDigits: 3 },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', decimalDigits: 2 },
  { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', decimalDigits: 2 },
  { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat', decimalDigits: 0 },
  { code: 'GEL', symbol: '₾', name: 'Georgian Lari', decimalDigits: 2 },
  { code: 'KZT', symbol: '₸', name: 'Kazakh Tenge', decimalDigits: 2 },
  { code: 'UZS', symbol: 'сўм', name: 'Uzbek Som', decimalDigits: 0 },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat', decimalDigits: 2 },
  { code: 'RSD', symbol: 'din', name: 'Serbian Dinar', decimalDigits: 2 },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna', decimalDigits: 2 },
  { code: 'ISK', symbol: 'kr', name: 'Icelandic Krona', decimalDigits: 0 },
  { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', decimalDigits: 2 },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso', decimalDigits: 2 },
  { code: 'BOB', symbol: 'Bs', name: 'Bolivian Boliviano', decimalDigits: 2 },
  { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal', decimalDigits: 2 },
  { code: 'CRC', symbol: '₡', name: 'Costa Rican Colon', decimalDigits: 0 },
  { code: 'HNL', symbol: 'L', name: 'Honduran Lempira', decimalDigits: 2 },
  { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa', decimalDigits: 2 },
  { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', decimalDigits: 2 },
  { code: 'TTD', symbol: 'TT$', name: 'Trinidad Dollar', decimalDigits: 2 },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA', decimalDigits: 0 },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA', decimalDigits: 0 },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', decimalDigits: 2 },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', decimalDigits: 2 },
  { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha', decimalDigits: 2 },
  { code: 'RWF', symbol: 'RF', name: 'Rwandan Franc', decimalDigits: 0 },
  { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical', decimalDigits: 2 },
  { code: 'BWP', symbol: 'P', name: 'Botswana Pula', decimalDigits: 2 },
  { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee', decimalDigits: 2 },
  { code: 'NAD', symbol: 'N$', name: 'Namibian Dollar', decimalDigits: 2 },
  { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar', decimalDigits: 3 },
  { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar', decimalDigits: 2 },
  { code: 'LBP', symbol: 'L£', name: 'Lebanese Pound', decimalDigits: 0 },
  { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar', decimalDigits: 0 },
  { code: 'IRR', symbol: '﷼', name: 'Iranian Rial', decimalDigits: 0 },
  { code: 'AFN', symbol: '؋', name: 'Afghan Afghani', decimalDigits: 2 },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel', decimalDigits: 2 },
  { code: 'LAK', symbol: '₭', name: 'Lao Kip', decimalDigits: 0 },
  { code: 'MNT', symbol: '₮', name: 'Mongolian Tugrik', decimalDigits: 0 },
  { code: 'BND', symbol: 'B$', name: 'Brunei Dollar', decimalDigits: 2 },
  { code: 'FJD', symbol: 'FJ$', name: 'Fiji Dollar', decimalDigits: 2 },
  { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina', decimalDigits: 2 },
  { code: 'WST', symbol: 'WS$', name: 'Samoan Tala', decimalDigits: 2 },
  { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga', decimalDigits: 2 },
  { code: 'SBD', symbol: 'SI$', name: 'Solomon Islands Dollar', decimalDigits: 2 },
  { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu', decimalDigits: 0 },
  { code: 'XPF', symbol: '₣', name: 'CFP Franc', decimalDigits: 0 },
  { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble', decimalDigits: 2 },
  { code: 'MDL', symbol: 'L', name: 'Moldovan Leu', decimalDigits: 2 },
  { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar', decimalDigits: 2 },
  { code: 'ALL', symbol: 'Lek', name: 'Albanian Lek', decimalDigits: 2 },
  { code: 'BAM', symbol: 'KM', name: 'Bosnian Mark', decimalDigits: 2 },
  { code: 'AMD', symbol: '֏', name: 'Armenian Dram', decimalDigits: 0 },
  { code: 'KGS', symbol: 'сом', name: 'Kyrgyz Som', decimalDigits: 2 },
  { code: 'TJS', symbol: 'SM', name: 'Tajik Somoni', decimalDigits: 2 },
  { code: 'TMT', symbol: 'T', name: 'Turkmen Manat', decimalDigits: 2 },
  { code: 'BTC', symbol: '₿', name: 'Bitcoin', decimalDigits: 8 },
  { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', decimalDigits: 8 },
];

// ─── Locale → Currency Mapping ───────────────────────────────
const LOCALE_CURRENCY_MAP: Record<string, string> = {
  'en_US': 'USD', 'en_GB': 'GBP', 'en_AU': 'AUD', 'en_CA': 'CAD', 'en_NZ': 'NZD',
  'en_SG': 'SGD', 'en_HK': 'HKD', 'en_IN': 'INR', 'en_PH': 'PHP', 'en_ZA': 'ZAR',
  'en_KE': 'KES', 'en_NG': 'NGN', 'en_GH': 'GHS',
  'hi_IN': 'INR', 'ta_IN': 'INR', 'te_IN': 'INR', 'kn_IN': 'INR', 'ml_IN': 'INR',
  'mr_IN': 'INR', 'gu_IN': 'INR', 'bn_IN': 'INR', 'pa_IN': 'INR',
  'ja_JP': 'JPY', 'ko_KR': 'KRW', 'zh_CN': 'CNY', 'zh_TW': 'TWD', 'zh_HK': 'HKD',
  'de_DE': 'EUR', 'de_AT': 'EUR', 'de_CH': 'CHF',
  'fr_FR': 'EUR', 'fr_CA': 'CAD', 'fr_CH': 'CHF', 'fr_BE': 'EUR',
  'es_ES': 'EUR', 'es_MX': 'MXN', 'es_AR': 'ARS', 'es_CO': 'COP', 'es_CL': 'CLP',
  'es_PE': 'PEN', 'es_UY': 'UYU', 'es_BO': 'BOB', 'es_GT': 'GTQ', 'es_CR': 'CRC',
  'es_HN': 'HNL', 'es_PA': 'PAB', 'es_DO': 'DOP',
  'pt_BR': 'BRL', 'pt_PT': 'EUR',
  'it_IT': 'EUR', 'nl_NL': 'EUR', 'nl_BE': 'EUR',
  'pl_PL': 'PLN', 'cs_CZ': 'CZK', 'hu_HU': 'HUF', 'ro_RO': 'RON', 'bg_BG': 'BGN',
  'hr_HR': 'EUR', 'sk_SK': 'EUR', 'sl_SI': 'EUR',
  'sv_SE': 'SEK', 'nb_NO': 'NOK', 'da_DK': 'DKK', 'fi_FI': 'EUR', 'is_IS': 'ISK',
  'tr_TR': 'TRY', 'ru_RU': 'RUB', 'uk_UA': 'UAH', 'ka_GE': 'GEL',
  'ar_SA': 'SAR', 'ar_AE': 'AED', 'ar_EG': 'EGP', 'ar_QA': 'QAR', 'ar_KW': 'KWD',
  'ar_BH': 'BHD', 'ar_OM': 'OMR', 'ar_JO': 'JOD', 'ar_LB': 'LBP', 'ar_IQ': 'IQD',
  'ar_MA': 'MAD', 'ar_TN': 'TND', 'ar_DZ': 'DZD',
  'he_IL': 'ILS', 'fa_IR': 'IRR',
  'th_TH': 'THB', 'vi_VN': 'VND', 'id_ID': 'IDR', 'ms_MY': 'MYR',
  'bn_BD': 'BDT', 'ne_NP': 'NPR', 'si_LK': 'LKR', 'ur_PK': 'PKR',
  'km_KH': 'KHR', 'lo_LA': 'LAK', 'my_MM': 'MMK', 'mn_MN': 'MNT',
  'kk_KZ': 'KZT', 'uz_UZ': 'UZS', 'az_AZ': 'AZN', 'hy_AM': 'AMD',
  'ky_KG': 'KGS', 'tg_TJ': 'TJS', 'tk_TM': 'TMT',
  'sr_RS': 'RSD', 'mk_MK': 'MKD', 'sq_AL': 'ALL', 'bs_BA': 'BAM',
  'be_BY': 'BYN', 'mo_MD': 'MDL',
  'sw_KE': 'KES', 'sw_TZ': 'TZS', 'am_ET': 'ETB', 'rw_RW': 'RWF',
};

/**
 * Detects the user's currency from device locale settings.
 * Works completely offline — no API calls needed.
 */
export function detectCurrencyFromLocale(): CurrencyInfo {
  let locale = 'en_US';

  try {
    if (Platform.OS === 'ios') {
      locale = (
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'en_US'
      );
    } else if (Platform.OS === 'android') {
      locale = NativeModules.I18nManager?.localeIdentifier || 'en_US';
    }
  } catch {
    locale = 'en_US';
  }

  // Normalize locale format: "en-US" → "en_US"
  locale = locale.replace('-', '_');

  // Try exact match first
  let currencyCode = LOCALE_CURRENCY_MAP[locale];

  // Try language + country from longer locales (e.g. "en_US_POSIX" → "en_US")
  if (!currencyCode && locale.length > 5) {
    currencyCode = LOCALE_CURRENCY_MAP[locale.substring(0, 5)];
  }

  // Try just language match (first two chars)
  if (!currencyCode) {
    const langPrefix = locale.substring(0, 2);
    const fallbackKey = Object.keys(LOCALE_CURRENCY_MAP).find(k => k.startsWith(langPrefix));
    if (fallbackKey) {
      currencyCode = LOCALE_CURRENCY_MAP[fallbackKey];
    }
  }

  // Final fallback
  if (!currencyCode) {
    currencyCode = 'USD';
  }

  return getCurrencyByCode(currencyCode);
}

/**
 * Get currency info by ISO code
 */
export function getCurrencyByCode(code: string): CurrencyInfo {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0]; // fallback to USD
}

/**
 * Format an amount with the correct currency symbol and decimal places
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toFixed(currency.decimalDigits);

  // Add thousand separators
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const sign = amount < 0 ? '-' : '';
  return `${sign}${currency.symbol}${parts.join('.')}`;
}

/**
 * Search currencies by name or code
 */
export function searchCurrencies(query: string): CurrencyInfo[] {
  const q = query.toLowerCase().trim();
  if (!q) return CURRENCIES;
  return CURRENCIES.filter(
    c => c.code.toLowerCase().includes(q) ||
         c.name.toLowerCase().includes(q) ||
         c.symbol.includes(q)
  );
}
