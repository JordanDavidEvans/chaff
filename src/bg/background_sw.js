const storageCache = {};

function dispatchStorageEvent(key, newValue) {
  const event = new Event("storage");
  event.key = key;
  event.newValue = newValue;
  self.dispatchEvent(event);
}

function cacheKeys() {
  return Object.keys(storageCache);
}

async function bootstrapStorage() {
  await new Promise(resolve => {
    chrome.storage.local.get(null, items => {
      Object.assign(storageCache, items || {});
      resolve();
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    Object.entries(changes).forEach(([key, change]) => {
      if (change.newValue === undefined) {
        delete storageCache[key];
      } else {
        storageCache[key] = change.newValue;
      }
      dispatchStorageEvent(key, change.newValue);
    });
  });

  const localStoragePolyfill = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(storageCache, key)
        ? storageCache[key]
        : null;
    },
    setItem(key, value) {
      storageCache[key] = value;
      chrome.storage.local.set({ [key]: value });
    },
    removeItem(key) {
      delete storageCache[key];
      chrome.storage.local.remove(key);
    },
    clear() {
      const keys = cacheKeys();
      keys.forEach(key => delete storageCache[key]);
      chrome.storage.local.clear();
    },
    key(index) {
      return cacheKeys()[index] || null;
    },
    get length() {
      return cacheKeys().length;
    }
  };

  self.localStorage = localStoragePolyfill;
}

(async () => {
  // Provide a window alias for scripts that expect it.
  self.window = self;
  await bootstrapStorage();
  importScripts("../options_custom/lib/store.js", "../../js/constants.js", "seed.js", "background.js");
})();
