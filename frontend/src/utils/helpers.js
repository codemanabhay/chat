// String Utilities
export const stringUtils = {
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
  lowercase: (str) => str.toLowerCase(),
  uppercase: (str) => str.toUpperCase(),
  trim: (str) => str.trim(),
  truncate: (str, length = 50) => str.length > length ? str.slice(0, length) + '...' : str,
  slug: (str) => str.toLowerCase().replace(/\s+/g, '-'),
  camelCase: (str) => str.replace(/([-_][a-z])/g, (g) => g[1].toUpperCase()),
  pascalCase: (str) => str.replace(/([-_][a-z])/g, (g) => g[1].toUpperCase()).charAt(0).toUpperCase() + str.slice(1),
  reverse: (str) => str.split('').reverse().join('')
};

// Array Utilities
export const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  flatten: (arr) => arr.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? arrayUtils.flatten(toFlatten) : toFlatten), []),
  shuffle: (arr) => [...arr].sort(() => Math.random() - 0.5),
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size)),
  intersection: (arr1, arr2) => arr1.filter(item => arr2.includes(item)),
  difference: (arr1, arr2) => arr1.filter(item => !arr2.includes(item)),
  groupBy: (arr, key) => arr.reduce((acc, obj) => (acc[obj[key]] = [...(acc[obj[key]] || []), obj], acc), {}),
  sortBy: (arr, key) => [...arr].sort((a, b) => a[key] > b[key] ? 1 : -1),
  removeDuplicates: (arr) => [...new Map(arr.map(item => [item.id, item])).values()]
};

// Object Utilities
export const objectUtils = {
  isEmpty: (obj) => Object.keys(obj).length === 0,
  keys: (obj) => Object.keys(obj),
  values: (obj) => Object.values(obj),
  entries: (obj) => Object.entries(obj),
  merge: (...objs) => Object.assign({}, ...objs),
  deepMerge: (target, source) => {
    Object.keys(source).forEach(key => {
      if (source[key] instanceof Object && !(source[key] instanceof Array)) {
        target[key] = objectUtils.deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    });
    return target;
  },
  clone: (obj) => JSON.parse(JSON.stringify(obj)),
  pick: (obj, keys) => keys.reduce((res, key) => (res[key] = obj[key], res), {}),
  omit: (obj, keys) => Object.keys(obj).reduce((res, key) => !keys.includes(key) && (res[key] = obj[key]), {})
};

// Number Utilities
export const numberUtils = {
  isEven: (num) => num % 2 === 0,
  isOdd: (num) => num % 2 !== 0,
  isPrime: (num) => {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) if (num % i === 0) return false;
    return true;
  },
  round: (num, decimal = 0) => Math.round(num * Math.pow(10, decimal)) / Math.pow(10, decimal),
  format: (num, decimal = 2) => num.toFixed(decimal),
  random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  clamp: (num, min, max) => Math.max(min, Math.min(max, num)),
  percentage: (value, total) => (value / total) * 100
};

// Date Utilities
export const dateUtils = {
  now: () => new Date(),
  format: (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const map = {
      YYYY: d.getFullYear(),
      MM: String(d.getMonth() + 1).padStart(2, '0'),
      DD: String(d.getDate()).padStart(2, '0'),
      HH: String(d.getHours()).padStart(2, '0'),
      mm: String(d.getMinutes()).padStart(2, '0'),
      ss: String(d.getSeconds()).padStart(2, '0')
    };
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match]);
  },
  addDays: (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  },
  difference: (date1, date2) => Math.abs(date1 - date2) / (1000 * 60 * 60 * 24),
  isToday: (date) => dateUtils.format(date) === dateUtils.format(new Date()),
  isPast: (date) => new Date(date) < new Date(),
  isFuture: (date) => new Date(date) > new Date()
};

// Validation Utilities
export const validationUtils = {
  isEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  isPhone: (phone) => /^[0-9\-\+\(\)\s]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10,
  isUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  isStrongPassword: (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password),
  isUsername: (username) => /^[a-zA-Z0-9_-]{3,16}$/.test(username),
  isEmpty: (value) => value === null || value === undefined || value === '',
  isNumber: (value) => !isNaN(parseFloat(value)) && isFinite(value),
  isInteger: (value) => Number.isInteger(value)
};

// Storage Utilities
export const storageUtils = {
  set: (key, value, storage = localStorage) => storage.setItem(key, JSON.stringify(value)),
  get: (key, storage = localStorage) => {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  remove: (key, storage = localStorage) => storage.removeItem(key),
  clear: (storage = localStorage) => storage.clear(),
  keys: (storage = localStorage) => Object.keys(storage),
  getAll: (storage = localStorage) => {
    const items = {};
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      items[key] = storageUtils.get(key, storage);
    }
    return items;
  }
};

// Debounce & Throttle
export const functionUtils = {
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  throttle: (func, limit) => {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
  memoize: (func) => {
    const cache = {};
    return (...args) => {
      const key = JSON.stringify(args);
      if (key in cache) return cache[key];
      const result = func.apply(this, args);
      cache[key] = result;
      return result;
    };
  },
  retry: async (func, attempts = 3) => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await func();
      } catch (error) {
        if (i === attempts - 1) throw error;
      }
    }
  }
};

// Color Utilities
export const colorUtils = {
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  rgbToHex: (r, g, b) => '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join(''),
  lighten: (hex, amount) => {
    const usePound = hex[0] === '#';
    hex = hex.replace(/^#/, '');
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return (usePound ? '#' : '') + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
};

export default {
  stringUtils,
  arrayUtils,
  objectUtils,
  numberUtils,
  dateUtils,
  validationUtils,
  storageUtils,
  functionUtils,
  colorUtils
};
