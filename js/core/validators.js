export const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isPassword = v => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
