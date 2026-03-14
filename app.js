// ---- DOM References ----

const landing = document.getElementById('landing');
const app = document.getElementById('app');
const getStartedBtn = document.getElementById('get-started-btn');
const addFigureBtn = document.getElementById('add-figure-btn');
const collectionGrid = document.getElementById('collection-grid');
const emptyMessage = document.getElementById('empty-message');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const figureForm = document.getElementById('figure-form');

// Form fields
const figId = document.getElementById('fig-id');
const figName = document.getElementById('fig-name');
const figBrand = document.getElementById('fig-brand');
const figSeries = document.getElementById('fig-series');
const figYear = document.getElementById('fig-year');
const figType = document.getElementById('fig-type');
const figNotes = document.getElementById('fig-notes');
const figCondition = document.getElementById('fig-condition');
const figPurchasePrice = document.getElementById('fig-purchase-price');
const figCurrentValue = document.getElementById('fig-current-value');
const figPurchaseDate = document.getElementById('fig-purchase-date');
const figPurchaseLocation = document.getElementById('fig-purchase-location');
const figImage = document.getElementById('fig-image');
const imagePreview = document.getElementById('image-preview');
const imagePreviewImg = document.getElementById('image-preview-img');
const removeImageBtn = document.getElementById('remove-image-btn');

// Wishlist form fields
const figWishlist = document.getElementById('fig-wishlist');
const wishlistFields = document.getElementById('wishlist-fields');
const ownedFields = document.getElementById('owned-fields');
const figPriority = document.getElementById('fig-priority');
const figTargetPrice = document.getElementById('fig-target-price');

// View tabs
const tabCollection = document.getElementById('tab-collection');
const tabWishlist = document.getElementById('tab-wishlist');

// Tracks which view is active: 'collection' or 'wishlist'
var currentView = 'collection';

// Filter controls
const searchInput = document.getElementById('search-input');
const filterType = document.getElementById('filter-type');
const filterBrand = document.getElementById('filter-brand');
const resultsCount = document.getElementById('results-count');

// Holds the current image data URL while the form is open
let pendingImage = null;

// ---- Landing / App Toggle ----

getStartedBtn.addEventListener('click', function (e) {
  e.preventDefault();
  landing.classList.add('hidden');
  app.classList.remove('hidden');
});

// ---- Modal Controls ----

function openModal(editFigure) {
  figureForm.reset();
  figId.value = '';
  pendingImage = null;
  imagePreview.classList.add('hidden');
  figWishlist.checked = false;
  wishlistFields.classList.add('hidden');
  ownedFields.classList.remove('hidden');

  if (editFigure) {
    modalTitle.textContent = 'Edit Figure';
    figId.value = editFigure.id;
    figName.value = editFigure.name;
    figBrand.value = editFigure.brand || '';
    figSeries.value = editFigure.series || '';
    figYear.value = editFigure.year != null ? editFigure.year : '';
    figType.value = editFigure.type || '';
    figNotes.value = editFigure.notes || '';
    figCondition.value = editFigure.condition || '';
    figPurchasePrice.value = editFigure.purchasePrice != null ? editFigure.purchasePrice : '';
    figCurrentValue.value = editFigure.currentValue != null ? editFigure.currentValue : '';
    figPurchaseDate.value = editFigure.purchaseDate || '';
    figPurchaseLocation.value = editFigure.purchaseLocation || '';

    // Wishlist state
    figWishlist.checked = editFigure.isWishlist || false;
    if (editFigure.isWishlist) {
      wishlistFields.classList.remove('hidden');
      ownedFields.classList.add('hidden');
      figPriority.value = editFigure.priority || '';
      figTargetPrice.value = editFigure.targetPrice != null ? editFigure.targetPrice : '';
    }

    // Show existing image if the figure has one
    if (editFigure.image) {
      pendingImage = editFigure.image;
      imagePreviewImg.src = editFigure.image;
      imagePreview.classList.remove('hidden');
    }
  } else {
    modalTitle.textContent = 'Add Figure';
    // Default to wishlist if currently on the wishlist tab
    if (currentView === 'wishlist') {
      figWishlist.checked = true;
      wishlistFields.classList.remove('hidden');
      ownedFields.classList.add('hidden');
    }
  }

  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

addFigureBtn.addEventListener('click', function () {
  openModal(null);
});

modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);

// ---- Wishlist Checkbox Toggle ----

figWishlist.addEventListener('change', function () {
  if (figWishlist.checked) {
    wishlistFields.classList.remove('hidden');
    ownedFields.classList.add('hidden');
  } else {
    wishlistFields.classList.add('hidden');
    ownedFields.classList.remove('hidden');
  }
});

// ---- View Tabs ----

tabCollection.addEventListener('click', function () {
  currentView = 'collection';
  tabCollection.classList.add('active');
  tabWishlist.classList.remove('active');
  searchInput.value = '';
  filterType.value = '';
  filterBrand.value = '';
  renderCollection();
});

tabWishlist.addEventListener('click', function () {
  currentView = 'wishlist';
  tabWishlist.classList.add('active');
  tabCollection.classList.remove('active');
  searchInput.value = '';
  filterType.value = '';
  filterBrand.value = '';
  renderCollection();
});

// ---- Image Upload Handling ----

figImage.addEventListener('change', function () {
  const file = figImage.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    // Resize the image to save localStorage space
    resizeImage(e.target.result, 400, function (resized) {
      pendingImage = resized;
      imagePreviewImg.src = resized;
      imagePreview.classList.remove('hidden');
    });
  };
  reader.onerror = function () {
    alert('Could not read this file. Please try again.');
  };
  reader.readAsDataURL(file);
});

removeImageBtn.addEventListener('click', function () {
  pendingImage = null;
  figImage.value = '';
  imagePreview.classList.add('hidden');
});

// Close modal when clicking the dark overlay background
modalOverlay.addEventListener('click', function (e) {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
    closeModal();
  }
});

// ---- Save Figure (Add or Edit) ----

figureForm.addEventListener('submit', function (e) {
  e.preventDefault();

  var editingId = figId.value;

  var figureData = {
    name: figName.value.trim(),
    brand: figBrand.value.trim(),
    series: figSeries.value.trim(),
    year: figYear.value !== '' ? Number(figYear.value) : null,
    type: figType.value,
    notes: figNotes.value.trim(),
    image: pendingImage,
    condition: figCondition.value,
    purchasePrice: figPurchasePrice.value !== '' ? Number(figPurchasePrice.value) : null,
    currentValue: figCurrentValue.value !== '' ? Number(figCurrentValue.value) : null,
    purchaseDate: figPurchaseDate.value,
    purchaseLocation: figPurchaseLocation.value.trim(),
    isWishlist: figWishlist.checked,
    priority: figWishlist.checked ? figPriority.value : '',
    targetPrice: figWishlist.checked && figTargetPrice.value !== '' ? Number(figTargetPrice.value) : null
  };

  var success;
  if (editingId) {
    success = Store.figures.update(Number(editingId), figureData);
  } else {
    success = Store.figures.create(figureData);
  }

  // If save failed (e.g. storage full), keep the modal open so the user
  // doesn't lose their input
  if (!success) return;

  renderCollection();
  closeModal();
});

// ---- Delete Figure ----

function deleteFigure(id) {
  if (!confirm('Delete this figure from your collection?')) return;

  Store.figures.delete(id);
  renderCollection();
}

// ---- Search & Filter ----

function getFilteredFigures(allFigures) {
  var search = searchInput.value.toLowerCase().trim();
  var selectedType = filterType.value;
  var selectedBrand = filterBrand.value;

  return allFigures.filter(function (fig) {
    // Text search: matches name, brand, or series
    var matchesSearch = !search ||
      fig.name.toLowerCase().includes(search) ||
      (fig.brand && fig.brand.toLowerCase().includes(search)) ||
      (fig.series && fig.series.toLowerCase().includes(search));

    // Dropdown filters
    var matchesType = !selectedType || fig.type === selectedType;
    var matchesBrand = !selectedBrand || fig.brand === selectedBrand;

    return matchesSearch && matchesType && matchesBrand;
  });
}

function populateFilterDropdowns(figures) {
  // Gather unique types and brands from the full collection
  var types = [];
  var brands = [];

  figures.forEach(function (fig) {
    if (fig.type && types.indexOf(fig.type) === -1) types.push(fig.type);
    if (fig.brand && brands.indexOf(fig.brand) === -1) brands.push(fig.brand);
  });

  types.sort();
  brands.sort();

  // Preserve current selection
  var currentType = filterType.value;
  var currentBrand = filterBrand.value;

  // Rebuild type dropdown
  filterType.innerHTML = '<option value="">All Types</option>';
  types.forEach(function (t) {
    filterType.innerHTML += '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>';
  });
  filterType.value = currentType;

  // Rebuild brand dropdown
  filterBrand.innerHTML = '<option value="">All Brands</option>';
  brands.forEach(function (b) {
    filterBrand.innerHTML += '<option value="' + escapeHtml(b) + '">' + escapeHtml(b) + '</option>';
  });
  filterBrand.value = currentBrand;
}

// Re-render whenever any filter control changes
searchInput.addEventListener('input', function () { renderCollection(); });
filterType.addEventListener('change', function () { renderCollection(); });
filterBrand.addEventListener('change', function () { renderCollection(); });

// ---- Render Collection Grid ----

function renderCollection() {
  var allFigures = Store.figures.getAll();
  collectionGrid.innerHTML = '';

  // Filter by current view tab first
  var viewFigures = allFigures.filter(function (fig) {
    return currentView === 'wishlist' ? fig.isWishlist : !fig.isWishlist;
  });

  if (allFigures.length === 0) {
    emptyMessage.innerHTML = 'No figures yet. Click <strong>+ Add Figure</strong> to start your collection!';
    emptyMessage.classList.remove('hidden');
    resultsCount.classList.add('hidden');
    return;
  }

  if (viewFigures.length === 0 && !searchInput.value.trim() && !filterType.value && !filterBrand.value) {
    emptyMessage.innerHTML = currentView === 'wishlist'
      ? 'Your wishlist is empty. Add figures you want to find!'
      : 'No figures in your collection yet. Click <strong>+ Add Figure</strong> to start!';
    emptyMessage.classList.remove('hidden');
    resultsCount.classList.add('hidden');
    return;
  }

  emptyMessage.classList.add('hidden');

  // Update filter dropdowns with figures from this view
  populateFilterDropdowns(viewFigures);

  // Apply search + filters
  var filtered = getFilteredFigures(viewFigures);

  // Show results count when filters are active
  var filtersActive = searchInput.value.trim() || filterType.value || filterBrand.value;
  if (filtersActive) {
    resultsCount.textContent = 'Showing ' + filtered.length + ' of ' + viewFigures.length + ' figures';
    resultsCount.classList.remove('hidden');
  } else {
    resultsCount.classList.add('hidden');
  }

  if (filtered.length === 0) {
    collectionGrid.innerHTML = '<p class="empty-message">No figures match your filters.</p>';
    return;
  }

  filtered.forEach(function (fig) {
    const card = document.createElement('div');
    card.className = 'figure-card';

    // Build detail lines
    let details = '';
    if (fig.brand) details += '<p class="card-detail">' + escapeHtml(fig.brand) + '</p>';
    if (fig.series) details += '<p class="card-detail">' + escapeHtml(fig.series) + '</p>';

    const meta = [];
    if (fig.year) meta.push(fig.year);
    if (fig.type) meta.push(fig.type);
    if (meta.length) details += '<p class="card-detail">' + escapeHtml(meta.join(' | ')) + '</p>';

    if (fig.isWishlist) {
      // Wishlist card: show priority badge and target price
      if (fig.priority) {
        var prioClass = 'priority-' + fig.priority.toLowerCase();
        details += '<span class="priority-badge ' + prioClass + '">' + escapeHtml(fig.priority) + ' Priority</span>';
      }
      if (fig.targetPrice != null) {
        details += '<p class="card-target-price">Target: $' + fig.targetPrice.toFixed(2) + '</p>';
      }
    } else {
      // Collection card: show condition badge and price info
      if (fig.condition) {
        var condClass = 'condition-' + fig.condition.toLowerCase().replace(' ', '-');
        details += '<span class="condition-badge ' + condClass + '">' + escapeHtml(fig.condition) + '</span>';
      }
      if (fig.purchasePrice != null || fig.currentValue != null) {
        var priceText = '';
        if (fig.purchasePrice != null) priceText += 'Paid $' + fig.purchasePrice.toFixed(2);
        if (fig.purchasePrice != null && fig.currentValue != null) priceText += ' · ';
        if (fig.currentValue != null) priceText += 'Value $' + fig.currentValue.toFixed(2);
        details += '<p class="card-price">' + priceText + '</p>';
      }
    }

    // Show uploaded photo or placeholder icon
    var cardImageContent = fig.image
      ? '<div class="card-image"><img src="' + fig.image + '" alt="' + escapeHtml(fig.name) + '"></div>'
      : '<div class="card-image">&#128126;</div>';

    // Build action buttons
    var actionButtons =
      '<button class="card-btn card-btn-edit" data-id="' + fig.id + '">Edit</button>' +
      '<button class="card-btn card-btn-delete" data-id="' + fig.id + '">Delete</button>';

    // Wishlist cards get a "Mark as Owned" button
    if (fig.isWishlist) {
      actionButtons = '<button class="card-btn card-btn-own" data-id="' + fig.id + '">Mark as Owned</button>' + actionButtons;
    }

    card.innerHTML =
      cardImageContent +
      '<div class="card-body">' +
        '<h3>' + escapeHtml(fig.name) + '</h3>' +
        details +
        '<div class="card-actions">' + actionButtons + '</div>' +
      '</div>';

    // Edit button
    card.querySelector('.card-btn-edit').addEventListener('click', function (e) {
      e.stopPropagation();
      openModal(fig);
    });

    // Delete button
    card.querySelector('.card-btn-delete').addEventListener('click', function (e) {
      e.stopPropagation();
      deleteFigure(fig.id);
    });

    // Mark as Owned button (wishlist only)
    var ownBtn = card.querySelector('.card-btn-own');
    if (ownBtn) {
      ownBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        markAsOwned(fig.id);
      });
    }

    collectionGrid.appendChild(card);
  });
}

// ---- Mark as Owned (Wishlist → Collection) ----

function markAsOwned(id) {
  var fig = Store.figures.getById(id);
  if (!fig) return;

  // Move from wishlist to collection
  fig.isWishlist = false;
  fig.priority = '';
  fig.targetPrice = null;
  Store.figures.update(id, fig);

  // Switch to collection view and open the edit modal
  currentView = 'collection';
  tabCollection.classList.add('active');
  tabWishlist.classList.remove('active');
  renderCollection();
  openModal(fig);
}

// ---- Helpers ----

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Resize an image to fit within maxWidth, then return as compressed JPEG data URL.
// This keeps localStorage usage manageable (~30-50KB per image instead of 3-4MB).
function resizeImage(dataUrl, maxWidth, callback) {
  var isPng = dataUrl.indexOf('data:image/png') === 0;
  var img = new Image();

  img.onload = function () {
    var width = img.width;
    var height = img.height;

    // Only shrink, never enlarge
    if (width > maxWidth) {
      height = Math.round(height * (maxWidth / width));
      width = maxWidth;
    }

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // Preserve PNG transparency; compress everything else as JPEG
    if (isPng) {
      callback(canvas.toDataURL('image/png'));
    } else {
      callback(canvas.toDataURL('image/jpeg', 0.7));
    }
  };

  img.onerror = function () {
    alert('Could not load this image. Please try a different file.');
  };

  img.src = dataUrl;
}

// ---- Initial Render ----

renderCollection();
