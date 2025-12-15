//
// Copyright (c) 2011 Frank Kohlhepp
// https://github.com/frankkohlhepp/store-js
// License: MIT-license
//
(function () {
    var storageCache = {};
    var hasChromeStorage = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local);
    var storageReady = new Promise(function (resolve) {
        if (!hasChromeStorage) {
            resolve();
            return;
        }

        chrome.storage.local.get(null, function (items) {
            storageCache = items || {};
            resolve();
        });
    });

    if (hasChromeStorage) {
        chrome.storage.onChanged.addListener(function (changes, areaName) {
            if (areaName !== "local") { return; }

            for (var key in changes) {
                if (changes.hasOwnProperty(key)) {
                    if (changes[key].newValue === undefined) {
                        delete storageCache[key];
                    } else {
                        storageCache[key] = changes[key].newValue;
                    }
                }
            }
        });
    }

    function buildKey(name, key) {
        return "store." + name + "." + key;
    }

    function getItem(key) {
        if (hasChromeStorage) {
            if (!storageCache.hasOwnProperty(key)) { return null; }
            return storageCache[key];
        }

        return localStorage.getItem(key);
    }

    function setItem(key, value) {
        if (hasChromeStorage) {
            storageCache[key] = value;
            chrome.storage.local.set((function () { var obj = {}; obj[key] = value; return obj; })());
            return;
        }

        localStorage.setItem(key, value);
    }

    function removeItem(key) {
        if (hasChromeStorage) {
            delete storageCache[key];
            chrome.storage.local.remove(key);
            return;
        }

        localStorage.removeItem(key);
    }

    function listKeys(prefix) {
        var keys = [];

        if (hasChromeStorage) {
            for (var key in storageCache) {
                if (storageCache.hasOwnProperty(key) && key.substring(0, prefix.length) === prefix) {
                    keys.push(key);
                }
            }
        } else {
            for (var i = (localStorage.length - 1); i >= 0; i--) {
                if (localStorage.key(i).substring(0, prefix.length) === prefix) {
                    keys.push(localStorage.key(i));
                }
            }
        }

        return keys;
    }

    var Store = this.Store = function (name, defaults) {
        var key;
        this.name = name;
        this.ready = storageReady.then(function () {
            if (defaults !== undefined) {
                for (key in defaults) {
                    if (defaults.hasOwnProperty(key) && this.get(key) === undefined) {
                        this.set(key, defaults[key]);
                    }
                }
            }
        }.bind(this));
    };

    Store.prototype.get = function (name) {
        name = buildKey(this.name, name);
        var raw = getItem(name);
        if (raw === null || raw === undefined) { return undefined; }
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    };

    Store.prototype.set = function (name, value) {
        if (value === undefined) {
            this.remove(name);
        } else {
            if (typeof value === "function") {
                value = null;
            } else {
                try {
                    value = JSON.stringify(value);
                } catch (e) {
                    value = null;
                }
            }

            setItem(buildKey(this.name, name), value);
        }

        return this;
    };

    Store.prototype.remove = function (name) {
        removeItem(buildKey(this.name, name));
        return this;
    };

    Store.prototype.removeAll = function () {
        var name = "store." + this.name + ".";
        var keys = listKeys(name);

        for (var i = (keys.length - 1); i >= 0; i--) {
            removeItem(keys[i]);
        }

        return this;
    };

    Store.prototype.toObject = function () {
        var values = {},
            name,
            key,
            value,
            keys,
            i;

        name = "store." + this.name + ".";
        keys = listKeys(name);
        for (i = (keys.length - 1); i >= 0; i--) {
            key = keys[i].substring(name.length);
            value = this.get(key);
            if (value !== undefined) { values[key] = value; }
        }

        return values;
    };

    Store.prototype.fromObject = function (values, merge) {
        if (merge !== true) { this.removeAll(); }
        for (var key in values) {
            if (values.hasOwnProperty(key)) {
                this.set(key, values[key]);
            }
        }

        return this;
    };
}());
