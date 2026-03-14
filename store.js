// ---- Store: localStorage wrapper with JSON parsing and CRUD operations ----
//
// Provides a single, reusable interface for persisting data.
// All reads/writes go through this module so the rest of the app
// never touches localStorage directly.

var Store = (function () {

  // ---- Low-level helpers ----

  // Safe getter: returns parsed JSON or a fallback value.
  // Handles missing keys, corrupt data, and quota errors.
  function get(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Store.get: failed to parse "' + key + '"', e);
      return fallback;
    }
  }

  // Safe setter: stringifies and writes to localStorage.
  // Returns true on success, false if storage is full or unavailable.
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Store.set: failed to write "' + key + '"', e);
      alert('Storage is full. Try removing some figures or photos.');
      return false;
    }
  }

  // Remove a key entirely
  function remove(key) {
    localStorage.removeItem(key);
  }

  // ---- Data structure defaults ----
  // Every figure should have these fields. When loading older data that
  // may be missing newer fields (e.g. priority, targetPrice), we merge
  // each record against this template so the rest of the app can safely
  // access any property without checking for undefined.

  var FIGURE_DEFAULTS = {
    id: 0,
    name: '',
    brand: '',
    series: '',
    year: null,
    type: '',
    notes: '',
    image: null,
    condition: '',
    purchasePrice: null,
    currentValue: null,
    purchaseDate: '',
    purchaseLocation: '',
    isWishlist: false,
    priority: '',
    targetPrice: null
  };

  // Merge a raw object with defaults so every field is present
  function applyDefaults(raw) {
    var result = {};
    for (var key in FIGURE_DEFAULTS) {
      result[key] = (raw[key] !== undefined)
        ? raw[key]
        : FIGURE_DEFAULTS[key];
    }
    // Always keep the id from the raw data
    result.id = raw.id;
    return result;
  }

  // ---- CRUD operations for figures ----

  var STORAGE_KEY = 'figures';

  // READ all — returns the full array with defaults applied
  function getAll() {
    var figures = get(STORAGE_KEY, []);
    return figures.map(applyDefaults);
  }

  // READ one — find a figure by id, or null if not found
  function getById(id) {
    var figures = getAll();
    var found = null;
    for (var i = 0; i < figures.length; i++) {
      if (figures[i].id === id) { found = figures[i]; break; }
    }
    return found;
  }

  // CREATE — add a new figure, returns the created figure or null on failure
  function create(data) {
    var figures = getAll();
    var figure = applyDefaults(data);
    figure.id = Date.now();
    figures.push(figure);
    if (!set(STORAGE_KEY, figures)) return null;
    return figure;
  }

  // UPDATE — replace an existing figure by id, returns true/false
  function update(id, data) {
    var figures = getAll();
    var index = -1;
    for (var i = 0; i < figures.length; i++) {
      if (figures[i].id === id) { index = i; break; }
    }
    if (index === -1) return false;
    var updated = applyDefaults(data);
    updated.id = id;
    figures[index] = updated;
    return set(STORAGE_KEY, figures);
  }

  // DELETE — remove a figure by id, returns true/false
  function deleteFigure(id) {
    var figures = getAll();
    var filtered = figures.filter(function (f) { return f.id !== id; });
    if (filtered.length === figures.length) return false; // not found
    return set(STORAGE_KEY, filtered);
  }

  // ---- Public API ----

  return {
    // Low-level (for non-figure data if needed later)
    get: get,
    set: set,
    remove: remove,

    // Figure CRUD
    figures: {
      getAll: getAll,
      getById: getById,
      create: create,
      update: update,
      delete: deleteFigure
    },

    // Expose defaults for reference
    FIGURE_DEFAULTS: FIGURE_DEFAULTS
  };

})();
