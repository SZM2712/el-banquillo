/*
 * Polyfill de window.storage para navegador (localStorage), con la misma
 * forma async que la API de window.storage del entorno de artifacts de
 * Claude.ai: get(key) -> {value}|null, set(key, value), delete(key), list(prefix?).
 */
if (typeof window !== "undefined" && !window.storage) {
  const PREFIX = "elbanquillo:";

  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? null : { value: raw };
    },
    async set(key, value) {
      localStorage.setItem(PREFIX + key, value);
    },
    async delete(key) {
      localStorage.removeItem(PREFIX + key);
    },
    async list(prefix = "") {
      const full = PREFIX + prefix;
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(full)) keys.push(k.slice(PREFIX.length));
      }
      return { keys };
    },
  };
}
