const ARTICLE_STORAGE_KEY = 'tbd-article-library';
const ARTICLE_PREVIEW_KEY = 'tbd-article-preview';
const COOKIE_PREF_KEY = 'tbd-cookie-preferences';
const CATEGORY_OPTIONS = [
  'Marketing',
  'Finance',
  'Accounting',
  'Strategy',
  'Market Research',
  'Sales',
  'Operations',
  'Human Resources',
  'Product',
  'Technology',
  'AI',
  'Project Management',
  'Legal'
];
const CATEGORY_TRANSLATIONS = {
  'marketing & growth': 'Marketing',
  marketing: 'Marketing',
  growth: 'Marketing',
  finanzas: 'Finance',
  'finanzas y estrategia': 'Finance',
  'finance & strategy': 'Finance',
  finance: 'Finance',
  accounting: 'Accounting',
  contabilidad: 'Accounting',
  strategy: 'Strategy',
  estrategia: 'Strategy',
  'market research': 'Market Research',
  research: 'Market Research',
  technology: 'Technology',
  tech: 'Technology',
  tecnologia: 'Technology',
  'product & technology': 'Technology',
  ai: 'AI',
  'a.i.': 'AI',
  ia: 'AI',
  'inteligencia artificial': 'AI',
  ventas: 'Sales',
  sales: 'Sales',
  revenue: 'Sales',
  'sales & revenue operations': 'Sales',
  'revenue operations': 'Sales',
  operaciones: 'Operations',
  productivity: 'Operations',
  productividad: 'Operations',
  'productivity & operations': 'Operations',
  operations: 'Operations',
  'people & hr': 'Human Resources',
  people: 'Human Resources',
  hr: 'Human Resources',
  'recursos humanos': 'Human Resources',
  'product & technology': 'Product',
  product: 'Product',
  tecnologia: 'Product',
  technology: 'Product',
  producto: 'Product',
  'project management': 'Project Management',
  project: 'Project Management',
  juridico: 'Legal',
  legal: 'Legal',
  compliance: 'Legal',
  'legal & compliance': 'Legal'
};

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  renderDynamicBlogArticles();
  setupArticleSearch();
  setupContactForm();
  updateYear();
  setupAdminPanel();
  setupArticleEditor();
  setupDynamicArticleView();
  setupCookieConsent();
});

function setupMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!toggle || !menu) return;

  const setOpen = isOpen => {
    menu.dataset.open = String(isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  };

  toggle.addEventListener('click', () => {
    const isOpen = menu.dataset.open === 'true';
    setOpen(!isOpen);
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setOpen(false));
  });
}

function renderDynamicBlogArticles() {
  const blogList = document.querySelector('[data-blog-list]');
  if (!blogList) return;

  const articles = getArticleLibrary().filter(article => article.status === 'live');
  if (!articles.length) return;

  const fragment = document.createDocumentFragment();
  const sorted = [...articles].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || Date.now());
    const dateB = new Date(b.updatedAt || b.createdAt || Date.now());
    return dateB - dateA;
  });

  sorted.forEach(article => {
    const card = document.createElement('article');
    card.className = 'card article-card';
    card.dataset.article = '';
    card.dataset.keywords = buildKeywordString(article);
    const categories = normalizeCategories(article.categories || article.category);
    const displayCategory = formatCategoryDisplay(categories);
    const primaryCategory = categories[0] || 'Article';
    card.dataset.category = primaryCategory;
    card.dataset.categories = (categories.length ? categories : [primaryCategory]).join('|');

    const link = document.createElement('a');
    link.className = 'article-card-link';
    link.href = `article.html?id=${article.id}`;

    const tag = document.createElement('p');
    tag.className = 'card-tag';
    tag.textContent = displayCategory;

    const title = document.createElement('h3');
    title.textContent = article.title || 'Untitled article';

    const summary = document.createElement('p');
    summary.textContent = article.summary || 'Content added from the article panel.';

    link.append(tag, title, summary);
    card.appendChild(link);
    fragment.appendChild(card);
  });

  blogList.appendChild(fragment);
}

function setupArticleSearch() {
  const searchInput = document.querySelector('[data-search]');
  const resultsCount = document.querySelector('[data-results-count]');
  const emptyState = document.querySelector('[data-empty-state]');
  const categoryFilters = document.querySelector('[data-category-filters]');
  const filterPanel = document.querySelector('[data-filter-panel]');
  const clearFiltersBtn = document.querySelector('[data-clear-filters]');
  if (!searchInput && !categoryFilters) return;

  const selectedCategories = new Set();
  const getCardCategories = card => {
    if (!card?.dataset) return [];
    const raw = card.dataset.categories || card.dataset.category || '';
    return normalizeCategories(raw);
  };

  const syncClearButton = () => {
    if (!clearFiltersBtn) return;
    const disabled = selectedCategories.size === 0;
    clearFiltersBtn.disabled = disabled;
    clearFiltersBtn.setAttribute('aria-disabled', String(disabled));
  };

  const filterArticles = () => {
    const articleCards = document.querySelectorAll('[data-article]');
    if (!articleCards.length) {
      if (resultsCount) {
        resultsCount.textContent = '0';
      }
      if (emptyState) {
        emptyState.style.display = 'block';
      }
      return;
    }

    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
    let visibleCount = 0;

    articleCards.forEach(card => {
      const keywords = card.dataset.keywords || '';
      const matchesQuery = !query || keywords.includes(query);
      const categories = getCardCategories(card);
      const matchesCategory =
        !selectedCategories.size || categories.some(category => selectedCategories.has(category));
      const matches = matchesQuery && matchesCategory;
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount += 1;
    });

    if (resultsCount) {
      resultsCount.textContent = visibleCount;
    }

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  };

  const buildCategoryFilters = () => {
    if (!categoryFilters) return;

    const articleCards = document.querySelectorAll('[data-article]');
    const uniqueCategories = Array.from(
      new Set(
        Array.from(articleCards)
          .flatMap(card => getCardCategories(card))
          .filter(Boolean)
      )
    );

    const orderedCategories = CATEGORY_OPTIONS.filter(option =>
      uniqueCategories.includes(option)
    );
    const extraCategories = uniqueCategories
      .filter(category => !CATEGORY_OPTIONS.includes(category))
      .sort((a, b) => a.localeCompare(b));
    const categories = [...orderedCategories, ...extraCategories];

    categoryFilters.innerHTML = '';
    if (!categories.length) {
      if (filterPanel) {
        filterPanel.style.display = 'none';
      }
      return;
    }

    if (filterPanel) {
      filterPanel.style.display = '';
    }

    categories.forEach(category => {
      const label = document.createElement('label');
      label.className = 'filter-chip';
      label.dataset.active = selectedCategories.has(category);

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = category;
      input.className = 'filter-chip-input';
      input.checked = selectedCategories.has(category);
      input.setAttribute('aria-label', `Filter by ${category}`);

      const text = document.createElement('span');
      text.className = 'filter-chip-label';
      text.textContent = category;

      input.addEventListener('change', () => {
        if (input.checked) {
          selectedCategories.add(category);
          label.dataset.active = 'true';
        } else {
          selectedCategories.delete(category);
          label.dataset.active = 'false';
        }
        syncClearButton();
        filterArticles();
      });

      label.append(input, text);
      categoryFilters.appendChild(label);
    });
  };

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if (!selectedCategories.size) return;
      selectedCategories.clear();
      if (categoryFilters) {
        categoryFilters.querySelectorAll('.filter-chip-input').forEach(input => {
          input.checked = false;
          const parent = input.closest('.filter-chip');
          if (parent) parent.dataset.active = 'false';
        });
      }
      syncClearButton();
      filterArticles();
    });
  }

  buildCategoryFilters();
  syncClearButton();
  filterArticles();

  if (searchInput) {
    searchInput.addEventListener('input', filterArticles);
  }
}

function setupContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const hasEmptyField = Array.from(formData.values()).some(value => !String(value).trim());

    if (hasEmptyField) {
      status.textContent = 'Please complete all fields before sending.';
      status.style.color = '#c0392b';
      return;
    }

    status.textContent = 'Message sent! We will reply within 24 hours.';
    status.style.color = '#004c99';
    form.reset();
  });
}

function updateYear() {
  const year = document.getElementById('current-year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

function setupAdminPanel() {
  const adminPanel = document.querySelector('[data-admin-panel]');
  const lockLayer = document.getElementById('admin-lock');
  if (!adminPanel || !lockLayer) return;

  const ACCESS_KEY = 'tbd-admin-access';
  const PASS_HASH = '1375b6769ad8d035c64f7ca4b64d5bd0c4bf64410a8adf066b5ac612a938792f';
  const form = lockLayer.querySelector('form');
  const passwordInput = lockLayer.querySelector('input[type="password"]');
  const status = lockLayer.querySelector('[data-lock-status]');
  const syncButton = document.querySelector('[data-sync]');
  const syncStamp = document.querySelector('[data-sync-stamp]');

  const hasStoredAccess = () => {
    try {
      return sessionStorage.getItem(ACCESS_KEY) === PASS_HASH;
    } catch (error) {
      return false;
    }
  };

  const rememberAccess = () => {
    try {
      sessionStorage.setItem(ACCESS_KEY, PASS_HASH);
    } catch (error) {
      // Storage blocked
    }
  };

  const unlockPanel = () => {
    adminPanel.hidden = false;
    adminPanel.removeAttribute('aria-hidden');
    lockLayer.style.display = 'none';
    document.body.classList.remove('admin-locked');
    document.body.classList.add('admin-authenticated');
    rememberAccess();
  };

  document.body.classList.add('admin-locked');
  document.body.classList.remove('admin-authenticated');

  if (hasStoredAccess()) {
    unlockPanel();
  }

  if (syncButton && syncStamp) {
    syncButton.addEventListener('click', () => {
      const now = new Date();
      syncStamp.textContent = formatDateTime(now);
      syncButton.textContent = 'Updated';
      syncButton.disabled = true;
      setTimeout(() => {
        syncButton.textContent = 'Log update';
        syncButton.disabled = false;
      }, 2000);
    });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const value = passwordInput.value.trim();

    if (!value) {
      status.textContent = 'Enter the private code to continue.';
      status.style.color = '#c0392b';
      return;
    }

    status.textContent = 'Verifying...';
    status.style.color = 'var(--muted)';

    try {
      const hash = await hashString(value);
      if (hash === PASS_HASH) {
        status.textContent = 'Access granted. Unlocking...';
        status.style.color = '#006e3b';
        unlockPanel();
      } else {
        status.textContent = 'Incorrect code. Try again.';
        status.style.color = '#c0392b';
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch (error) {
      status.textContent = 'Your browser does not support secure validation.';
      status.style.color = '#c0392b';
    }
  });
}

function setupArticleEditor() {
  const editorSection = document.querySelector('[data-article-editor]');
  if (!editorSection) return;

  const form = document.getElementById('article-editor-form');
  const bodyCanvas = editorSection.querySelector('[data-editor-body]');
  if (!form || !bodyCanvas) return;

  const titleInput = document.getElementById('article-title');
  const slugInput = document.getElementById('article-slug');
  const categoryInputs = editorSection.querySelectorAll('input[name="categories"]');
  const statusInput = document.getElementById('article-status');
  const readTimeInput = document.getElementById('article-readtime');
  const ownerInput = document.getElementById('article-owner');
  const coverInput = document.getElementById('article-cover');
  const coverFileInput = editorSection.querySelector('[data-cover-input]');
  const coverTrigger = editorSection.querySelector('[data-cover-trigger]');
  const coverStatus = editorSection.querySelector('[data-cover-status]');
  const keywordsInput = document.getElementById('article-keywords');
  const summaryInput = document.getElementById('article-summary');
  const notesInput = document.getElementById('article-notes');
  const statusLabel = editorSection.querySelector('[data-editor-status]');
  const newButton = editorSection.querySelector('[data-editor-new]');
  const toolbarButtons = editorSection.querySelectorAll('[data-command]');
  const linkButton = editorSection.querySelector('[data-action="link"]');
  const colorButton = editorSection.querySelector('[data-action="color"]');
  const imageButton = editorSection.querySelector('[data-action="image"]');
  const imageUploadInput = editorSection.querySelector('[data-image-upload]');
  const colorPickerInput = editorSection.querySelector('[data-color-picker]');
  const colorSwatch = colorButton?.querySelector('.toolbar-icon.swatch');
  const categoryPanel = editorSection.querySelector('.category-options');
  const categoryToggle = editorSection.querySelector('[data-category-toggle]');

  const fontUpButton = editorSection.querySelector('[data-action="font-up"]');
  const fontDownButton = editorSection.querySelector('[data-action="font-down"]');
  const tabButton = editorSection.querySelector('[data-action="tab"]');
  const previewButton = editorSection.querySelector('[data-editor-preview]');
  const alignButtons = editorSection.querySelectorAll('[data-align]');
  const alignButtonsList = Array.from(alignButtons);
  const tableBody = document.querySelector('[data-article-table]');

  const getSelectedCategories = () => {
    if (!categoryInputs?.length) return [];
    return Array.from(categoryInputs)
      .filter(input => input.checked)
      .map(input => normalizeCategoryName(input.value))
      .filter(Boolean);
  };

  const setCategorySelection = categories => {
    if (!categoryInputs?.length) return;
    const normalized = normalizeCategories(categories);
    categoryInputs.forEach(input => {
      const value = normalizeCategoryName(input.value);
      input.checked = normalized.includes(value);
    });
    syncCategoryToggleState();
  };

  let activeId = null;
  let slugManuallyEdited = false;
  let selectedImage = null;
  let savedSelectionRange = null;

  const imageOverlay = document.createElement('div');
  imageOverlay.className = 'editor-image-overlay';
  imageOverlay.hidden = true;
  const resizeHandle = document.createElement('button');
  resizeHandle.type = 'button';
  resizeHandle.className = 'editor-image-resize';
  resizeHandle.setAttribute('aria-label', 'Resize image');
  imageOverlay.appendChild(resizeHandle);
  document.body.appendChild(imageOverlay);

  try {
    document.execCommand('defaultParagraphSeparator', false, 'p');
  } catch (error) {
    // Some browsers ignore this command
  }

  updateAdminDashboard();

  const setStatusMessage = (message, color = 'var(--deep-blue)') => {
    if (statusLabel) {
      statusLabel.textContent = message;
      statusLabel.style.color = color;
    }
  };

  const selectionBelongsToEditor = range => {
    if (!range) return false;
    const container = range.commonAncestorContainer;
    return container && bodyCanvas.contains(container.nodeType === 1 ? container : container.parentNode);
  };

  const saveSelection = () => {
    const selection = document.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!selectionBelongsToEditor(range)) return;
    savedSelectionRange = range.cloneRange();
  };

  const restoreSelection = () => {
    if (!savedSelectionRange) return false;
    const selection = document.getSelection();
    if (!selectionBelongsToEditor(savedSelectionRange)) return false;
    selection.removeAllRanges();
    selection.addRange(savedSelectionRange);
    return true;
  };

  const setActiveAlign = target => {
    if (!alignButtonsList.length || !target) return;
    alignButtonsList.forEach(button => {
      const isActive = button === target;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const setActiveAlignByCommand = command => {
    if (!command) return;
    const target = alignButtonsList.find(button => button.dataset.command === command);
    if (target) {
      setActiveAlign(target);
    }
  };

  const updateCoverStatus = (value, detailText) => {
    if (!coverStatus) return;
    if (value) {
      coverStatus.textContent = detailText || 'Image ready to publish';
      coverStatus.dataset.state = 'loaded';
    } else {
      coverStatus.textContent = 'No image uploaded';
      coverStatus.dataset.state = 'empty';
    }
  };

  const mapCommandToImageAlign = command => {
    switch (command) {
      case 'justifyCenter':
        return 'center';
      case 'justifyRight':
        return 'right';
      case 'justifyFull':
        return 'full';
      case 'justifyLeft':
      default:
        return 'left';
    }
  };

  const mapImageAlignToCommand = alignValue => {
    switch (alignValue) {
      case 'center':
        return 'justifyCenter';
      case 'right':
        return 'justifyRight';
      case 'full':
        return 'justifyFull';
      case 'left':
      default:
        return 'justifyLeft';
    }
  };

  const findImageFromNode = node => {
    if (!node) return null;
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IMG') {
      return node;
    }
    if (node.parentElement) {
      return node.parentElement.closest('img');
    }
    return null;
  };

  const getImageFromSelection = () => {
    const selection = document.getSelection();
    if (!selection || !selection.rangeCount) return null;
    return findImageFromNode(selection.focusNode);
  };

  const updateImageOverlay = () => {
    if (!selectedImage || imageOverlay.hidden) return;
    if (!bodyCanvas.contains(selectedImage)) {
      hideImageOverlay();
      return;
    }
    const rect = selectedImage.getBoundingClientRect();
    imageOverlay.style.width = `${rect.width}px`;
    imageOverlay.style.height = `${rect.height}px`;
    imageOverlay.style.top = `${window.scrollY + rect.top}px`;
    imageOverlay.style.left = `${window.scrollX + rect.left}px`;
  };

  const hideImageOverlay = () => {
    if (selectedImage) {
      selectedImage.classList.remove('is-selected');
    }
    selectedImage = null;
    imageOverlay.hidden = true;
  };

  const showImageOverlay = image => {
    if (!image || !bodyCanvas.contains(image)) return;
    if (selectedImage && selectedImage !== image) {
      selectedImage.classList.remove('is-selected');
    }
    selectedImage = image;
    selectedImage.classList.add('is-selected');
    imageOverlay.hidden = false;
    updateImageOverlay();
  };

  const alignSelectedImage = command => {
    const image = getImageFromSelection() || selectedImage;
    if (!image || !bodyCanvas.contains(image)) return false;
    const alignValue = mapCommandToImageAlign(command);
    if (!alignValue) return false;
    image.dataset.align = alignValue;
    if (alignValue === 'full') {
      image.style.width = '100%';
      image.style.height = 'auto';
    }
    showImageOverlay(image);
    return true;
  };

  const startImageResize = event => {
    if (!selectedImage) return;
    event.preventDefault();
    const startPoint = event.touches?.[0] || event;
    const startX = startPoint.clientX;
    const startWidth = selectedImage.getBoundingClientRect().width;

    const handleMove = moveEvent => {
      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }
      const point = moveEvent.touches?.[0] || moveEvent;
      const deltaX = point.clientX - startX;
      const newWidth = Math.max(60, startWidth + deltaX);
      selectedImage.style.width = `${newWidth}px`;
      selectedImage.style.height = 'auto';
      updateImageOverlay();
    };

    const stopResize = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('touchend', stopResize);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('touchend', stopResize);
  };

  resizeHandle.addEventListener('mousedown', startImageResize);
  resizeHandle.addEventListener('touchstart', startImageResize, { passive: false });

  const syncCategoryToggleState = () => {
    if (!categoryToggle || !categoryPanel) return;
    const isOpen = !categoryPanel.hasAttribute('hidden');
    categoryToggle.setAttribute('aria-expanded', String(isOpen));
    categoryToggle.textContent = isOpen ? 'Hide categories' : 'Select categories';
  };

  categoryToggle?.addEventListener('click', () => {
    if (!categoryPanel) return;
    if (categoryPanel.hasAttribute('hidden')) {
      categoryPanel.removeAttribute('hidden');
    } else {
      categoryPanel.setAttribute('hidden', '');
    }
    syncCategoryToggleState();
  });

  const mapTextAlignToCommand = alignValue => {
    switch (alignValue) {
      case 'center':
        return 'justifyCenter';
      case 'right':
      case 'end':
        return 'justifyRight';
      case 'justify':
        return 'justifyFull';
      default:
        return 'justifyLeft';
    }
  };

  const updateAlignFromSelection = () => {
    const selection = document.getSelection();
    if (!selection || !selection.anchorNode) {
      hideImageOverlay();
      return;
    }
    if (!bodyCanvas.contains(selection.anchorNode)) {
      hideImageOverlay();
      return;
    }
    const image = findImageFromNode(selection.focusNode);
    if (image && bodyCanvas.contains(image)) {
      const command = mapImageAlignToCommand(image.dataset.align || 'left');
      setActiveAlignByCommand(command);
      showImageOverlay(image);
      return;
    }
    hideImageOverlay();
    const block = getCurrentBlockNode(bodyCanvas);
    if (!block) return;
    const computed = window.getComputedStyle(block);
    const command = mapTextAlignToCommand(computed.textAlign);
    setActiveAlignByCommand(command);
  };

  if (alignButtonsList.length) {
    setActiveAlign(alignButtonsList[0]);
  }
  updateCoverStatus(coverInput?.value || '');

  const resetEditor = () => {
    form.reset();
    bodyCanvas.innerHTML = '';
    activeId = null;
    slugManuallyEdited = false;
    if (readTimeInput) readTimeInput.value = 8;
    if (statusInput) statusInput.value = 'draft';
    setStatusMessage('Editor ready for a new article.');
    if (alignButtonsList.length) {
    setActiveAlign(alignButtonsList[0]);
    }
    setCategorySelection([]);
    if (categoryPanel) {
      categoryPanel.setAttribute('hidden', '');
    }
    syncCategoryToggleState();
    if (coverInput) {
      coverInput.value = '';
    }
    if (coverFileInput) {
      coverFileInput.value = '';
    }
    updateCoverStatus('');
    hideImageOverlay();
  };

  resetEditor();

  const buildArticlePayload = () => {
    const categories = getSelectedCategories();
    if (!categories.length) {
      setStatusMessage('Select at least one category.', '#c0392b');
      return null;
    }

    const payload = {
      id: activeId || generateArticleId(),
      title: titleInput?.value.trim() || 'Untitled article',
      slug: slugify(slugInput?.value || titleInput?.value || ''),
      categories,
      category: categories[0] || 'Article',
      status: statusInput?.value || 'draft',
      readTime: Number(readTimeInput?.value) || 8,
      owner: ownerInput?.value.trim() || 'TBD team',
      coverImage: coverInput?.value.trim() || '',
      keywords: keywordsInput?.value.trim() || '',
      summary: summaryInput?.value.trim() || '',
      notes: notesInput?.value.trim() || '',
      content: bodyCanvas.innerHTML.trim()
    };

    if (!payload.summary) {
      setStatusMessage('Summary is required.', '#c0392b');
      return null;
    }

    if (!bodyCanvas.textContent.trim()) {
      setStatusMessage('Content cannot be empty.', '#c0392b');
      return null;
    }

    if (!payload.slug) {
      payload.slug = slugify(payload.title);
    }

    const previous = activeId ? getArticleById(activeId) : null;
    payload.createdAt = previous?.createdAt || new Date().toISOString();
    payload.updatedAt = new Date().toISOString();
    return payload;
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    const payload = buildArticlePayload();
    if (!payload) return;

    const updatedLibrary = upsertArticle(payload);
    activeId = payload.id;
    slugManuallyEdited = true;
    updateAdminDashboard(updatedLibrary);
    setStatusMessage(
      payload.status === 'live'
        ? 'Article saved and published to the blog.'
        : 'Article saved as an internal draft.',
      '#006e3b'
    );
  });

  toolbarButtons.forEach(button => {
    button.addEventListener('click', () => {
      const command = button.dataset.command;
      const value = button.dataset.value || null;
      if (command === 'formatBlock') {
        applyBlockFormat(value, bodyCanvas);
      } else {
        if (command && command.startsWith('justify')) {
          const handled = alignSelectedImage(command);
          if (handled) {
            setActiveAlignByCommand(command);
            focusEditorCanvas(bodyCanvas);
            return;
          }
        }
        document.execCommand(command, false, value);
        if ('align' in button.dataset) {
          setActiveAlign(button);
        }
        focusEditorCanvas(bodyCanvas);
      }
    });
  });

  linkButton?.addEventListener('click', () => {
    const selection = document.getSelection();
    if (!selection || !selection.toString().trim()) {
      setStatusMessage('Select the text you want to link.', '#c0392b');
      return;
    }
    const url = prompt('Paste the link URL:');
    if (url) {
      document.execCommand('createLink', false, url.trim());
      focusEditorCanvas(bodyCanvas);
    }
  });

  imageButton?.addEventListener('click', () => {
    if (imageUploadInput) {
      imageUploadInput.click();
    }
  });

  imageUploadInput?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      setStatusMessage('Select a valid image file.', '#c0392b');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = loadEvent => {
      const dataUrl = loadEvent.target?.result;
      if (typeof dataUrl === 'string') {
        document.execCommand('insertImage', false, dataUrl);
        focusEditorCanvas(bodyCanvas);
        setStatusMessage('Image inserted into the content.', '#006e3b');
      }
    };
    reader.onerror = () => {
      setStatusMessage('We could not read the selected image.', '#c0392b');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  });

  const applyColorToSelection = color => {
    if (!color) return;
    if (!restoreSelection()) {
      focusEditorCanvas(bodyCanvas);
    }
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch (error) {
      // Some browsers ignore this command
    }
    document.execCommand('foreColor', false, color);
    try {
      document.execCommand('styleWithCSS', false, false);
    } catch (error) {
      // Ignorado
    }
    focusEditorCanvas(bodyCanvas);
    setStatusMessage(`Color aplicado: ${color}`, '#006e3b');
    if (colorSwatch) {
      colorSwatch.style.background = color;
      colorSwatch.style.borderColor = color;
    }
  };

  colorButton?.addEventListener('click', () => {
    saveSelection();
    if (!colorPickerInput) return;
    if (colorPickerInput.showPicker) {
      colorPickerInput
        .showPicker()
        .catch(() => {
          colorPickerInput.click();
        });
    } else {
      colorPickerInput.click();
    }
  });

  const handleColorSelection = event => {
    applyColorToSelection(event.target.value);
  };

  colorPickerInput?.addEventListener('input', handleColorSelection);
  colorPickerInput?.addEventListener('change', handleColorSelection);

  coverTrigger?.addEventListener('click', () => {
    coverFileInput?.click();
  });

  coverFileInput?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      setStatusMessage('Select a valid image file for the cover.', '#c0392b');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = loadEvent => {
      const dataUrl = loadEvent.target?.result;
      if (typeof dataUrl === 'string' && coverInput) {
        coverInput.value = dataUrl;
        updateCoverStatus(dataUrl, file.name ? `Image uploaded (${file.name})` : undefined);
        setStatusMessage('Cover updated for the article.', '#006e3b');
      }
    };
    reader.onerror = () => {
      setStatusMessage('We could not read the selected cover image.', '#c0392b');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  });

  fontUpButton?.addEventListener('click', () => {
    adjustFontSize(bodyCanvas, 'up');
  });

  fontDownButton?.addEventListener('click', () => {
    adjustFontSize(bodyCanvas, 'down');
  });

  tabButton?.addEventListener('click', () => {
    document.execCommand('indent', false, null);
    focusEditorCanvas(bodyCanvas);
  });

  bodyCanvas.addEventListener('keydown', event => {
    handleEditorKeydown(event, bodyCanvas, {
      onAlignCommand: command => setActiveAlignByCommand(command),
      onSave: () => form.requestSubmit(),
      onImageAlign: command => alignSelectedImage(command)
    });
  });
  bodyCanvas.addEventListener('keyup', updateAlignFromSelection);
  bodyCanvas.addEventListener('mouseup', updateAlignFromSelection);
  document.addEventListener('selectionchange', updateAlignFromSelection);
  bodyCanvas.addEventListener('input', () => {
    if (selectedImage && !bodyCanvas.contains(selectedImage)) {
      hideImageOverlay();
    }
  });
  bodyCanvas.addEventListener('click', event => {
    const image = event.target.closest('img');
    if (image) {
      showImageOverlay(image);
    } else {
      hideImageOverlay();
    }
  });
  bodyCanvas.addEventListener('scroll', updateImageOverlay);
  document.addEventListener(
    'click',
    event => {
      if (bodyCanvas.contains(event.target) || imageOverlay.contains(event.target)) {
        return;
      }
      hideImageOverlay();
    },
    true
  );
  window.addEventListener('resize', updateImageOverlay);
  document.addEventListener('scroll', updateImageOverlay, true);

  newButton?.addEventListener('click', () => {
    resetEditor();
    bodyCanvas.focus();
  });

  previewButton?.addEventListener('click', () => {
    const payload = buildArticlePayload();
    if (!payload) return;

    const stored = setPreviewArticle(payload);
    if (!stored) {
      setStatusMessage('Your browser blocked the preview. Check browser permissions.', '#c0392b');
      return;
    }

    setStatusMessage('Opening preview in another tab...', 'var(--accent)');
    window.open('article.html?preview=1', '_blank', 'noopener');
  });

  titleInput?.addEventListener('input', () => {
    if (!slugManuallyEdited && slugInput) {
      slugInput.value = slugify(titleInput.value);
    }
  });

  slugInput?.addEventListener('input', () => {
    slugManuallyEdited = true;
    slugInput.value = slugify(slugInput.value);
  });

  tableBody?.addEventListener('click', event => {
    const editButton = event.target.closest('button[data-edit]');
    const deleteButton = event.target.closest('button[data-delete]');

    if (editButton) {
      const article = getArticleById(editButton.dataset.edit);
      if (article) {
        activeId = article.id;
        slugManuallyEdited = true;
        titleInput.value = article.title || '';
        slugInput.value = article.slug || '';
        setCategorySelection(article.categories || article.category || []);
        statusInput.value = article.status || 'draft';
        readTimeInput.value = article.readTime || 8;
        ownerInput.value = article.owner || '';
        if (coverInput) {
          coverInput.value = article.coverImage || '';
          updateCoverStatus(coverInput.value, coverInput.value ? 'Image ready to publish' : '');
        }
        keywordsInput.value = article.keywords || '';
        summaryInput.value = article.summary || '';
        notesInput.value = article.notes || '';
        bodyCanvas.innerHTML = article.content || '';
        setStatusMessage(`Editando: ${article.title}`, 'var(--accent)');
        editorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    if (deleteButton) {
      const id = deleteButton.dataset.delete;
      const confirmation = confirm('Delete this article from the panel?');
      if (!confirmation) return;
      const updated = removeArticle(id);
      if (id === activeId) {
        resetEditor();
      }
      updateAdminDashboard(updated);
      setStatusMessage('Article deleted.', '#c0392b');
    }
  });
}

function setupDynamicArticleView() {
  const articleLayout = document.querySelector('[data-dynamic-article]');
  if (!articleLayout) return;

  const params = new URLSearchParams(window.location.search);
  const articleId = params.get('id');
  const previewMode = params.get('preview') === '1' || params.get('preview') === 'true';
  let article = null;

  if (previewMode) {
    article = getPreviewArticle();
    if (!article && articleId) {
      article = getArticleById(articleId);
    }
  } else if (articleId) {
    article = getArticleById(articleId);
  }

  const emptyState = articleLayout.querySelector('[data-article-empty]');
  const contentWrapper = articleLayout.querySelector('[data-article-content]');

  if (!article) {
    if (emptyState) {
      emptyState.style.display = 'block';
    }
    if (contentWrapper) {
      contentWrapper.style.display = 'none';
    }
    return;
  }

  articleLayout.querySelector('[data-article-title]').textContent = article.title || 'Article';
  const displayCategory = formatCategoryDisplay(article.categories || article.category || 'Article');
  articleLayout.querySelector('[data-article-category]').textContent = displayCategory;
  articleLayout.querySelector('[data-article-summary]').textContent = article.summary || '';
  const ownerField = articleLayout.querySelector('[data-article-owner]');
  if (ownerField) {
    ownerField.textContent = article.owner || 'TBD team';
  }

  const readTimeField = articleLayout.querySelector('[data-article-readtime]');
  if (readTimeField) {
    readTimeField.textContent = `${article.readTime || 8} min`;
  }

  const cover = articleLayout.querySelector('[data-article-cover]');
  if (cover) {
    if (article.coverImage) {
      cover.innerHTML = `<img src="${article.coverImage}" alt="Featured image for the article">`;
      cover.style.display = '';
    } else {
      cover.style.display = 'none';
    }
  }

  const body = articleLayout.querySelector('[data-article-body]');
  if (body) {
    body.innerHTML = article.content || '';
  }

  if (contentWrapper) {
    contentWrapper.style.display = 'block';
  }
  if (emptyState) {
    emptyState.style.display = 'none';
  }

  applyArticleSeoMetadata(article);
}

async function hashString(value) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('crypto API unavailable');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatDateTime(date) {
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function formatDateShort(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function getArticleLibrary() {
  try {
    const raw = localStorage.getItem(ARTICLE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Could not read the article library.', error);
    return [];
  }
}

function setArticleLibrary(list) {
  try {
    localStorage.setItem(ARTICLE_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.warn('Could not save the article library.', error);
  }
}

function setPreviewArticle(article) {
  try {
    localStorage.setItem(ARTICLE_PREVIEW_KEY, JSON.stringify(article));
    return true;
  } catch (error) {
    console.warn('Could not save the article preview.', error);
    return false;
  }
}

function getPreviewArticle() {
  try {
    const stored = localStorage.getItem(ARTICLE_PREVIEW_KEY);
    if (!stored) return null;
    localStorage.removeItem(ARTICLE_PREVIEW_KEY);
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Could not retrieve the article preview.', error);
    return null;
  }
}

function upsertArticle(article) {
  const articles = getArticleLibrary();
  const index = articles.findIndex(item => item.id === article.id);
  if (index >= 0) {
    articles[index] = article;
  } else {
    articles.push(article);
  }
  setArticleLibrary(articles);
  return articles;
}

function removeArticle(id) {
  const filtered = getArticleLibrary().filter(article => article.id !== id);
  setArticleLibrary(filtered);
  return filtered;
}

function getArticleById(id) {
  return getArticleLibrary().find(article => article.id === id);
}

function generateArticleId() {
  if (window.crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `article-${Date.now()}`;
}

function slugify(value) {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeCategoryName(category) {
  if (!category) return '';
  const key = category.toString().trim().toLowerCase();
  const mapped = CATEGORY_TRANSLATIONS[key];
  if (mapped) return mapped;
  const canonical = CATEGORY_OPTIONS.find(option => option.toLowerCase() === key);
  if (canonical) return canonical;
  const cleaned = key.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function normalizeCategories(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(/[|,]/);
  const normalized = list
    .map(value => normalizeCategoryName(value))
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function formatCategoryDisplay(raw) {
  const normalized = normalizeCategories(raw);
  if (!normalized.length) return 'Article';
  if (normalized.length === 1) return normalized[0];
  return normalized.join(' · ');
}

function buildKeywordString(article) {
  const normalizedCategories = normalizeCategories(article.categories || article.category);
  return [article.title, normalizedCategories.join(' '), article.keywords, article.summary]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function focusEditorCanvas(canvas) {
  if (canvas) {
    canvas.focus();
  }
}

function adjustFontSize(canvas, direction) {
  if (!canvas) return;
  const sizeValue = direction === 'up' ? 5 : 2;
  document.execCommand('fontSize', false, sizeValue);
  convertFontTags(canvas, direction);
  focusEditorCanvas(canvas);
}

function convertFontTags(canvas, direction) {
  const sizeValue = direction === 'up' ? '5' : '2';
  const spanSize = direction === 'up' ? '1.25em' : '0.85em';
  const fonts = canvas.querySelectorAll(`font[size="${sizeValue}"]`);
  fonts.forEach(node => {
    const span = document.createElement('span');
    span.style.fontSize = spanSize;
    span.innerHTML = node.innerHTML;
    node.replaceWith(span);
  });
}

function handleEditorKeydown(event, canvas, handlers = {}) {
  if (!canvas) return;
  const { onAlignCommand, onSave, onImageAlign } = handlers;

  if (event.key === 'Backspace') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!range.collapsed) return;
    const block = getCurrentBlockNode(canvas);
    if (!block) return;
    if (!isCursorAtBlockStart(range, block)) return;

    if (shouldOutdent(block)) {
      event.preventDefault();
      document.execCommand('outdent');
      focusEditorCanvas(canvas);
      return;
    }
  }

  if (event.key === 'Tab') {
    event.preventDefault();
    const command = event.shiftKey ? 'outdent' : 'indent';
    document.execCommand(command, false, null);
    focusEditorCanvas(canvas);
    return;
  }

  const isMac = /Mac|iPod|iPhone|iPad/i.test(navigator.platform);
  const metaPressed = isMac ? event.metaKey : event.ctrlKey;
  if (!metaPressed) return;

  const key = event.key.toLowerCase();
  if (key === 's') {
    event.preventDefault();
    if (typeof onSave === 'function') {
      onSave();
    }
    return;
  }
  const handledCommands = {
    b: 'bold',
    i: 'italic',
    u: 'underline'
  };

  if (handledCommands[key]) {
    event.preventDefault();
    document.execCommand(handledCommands[key], false, null);
    focusEditorCanvas(canvas);
    return;
  }

  const alignmentShortcuts = {
    e: 'justifyCenter',
    j: 'justifyFull'
  };

  if (alignmentShortcuts[key]) {
    event.preventDefault();
    const command = alignmentShortcuts[key];
    const imageHandled = typeof onImageAlign === 'function' ? onImageAlign(command) : false;
    if (!imageHandled) {
      document.execCommand(command, false, null);
    }
    if (typeof onAlignCommand === 'function') {
      onAlignCommand(command);
    }
    focusEditorCanvas(canvas);
    return;
  }

  const blockShortcuts = {
    '1': 'H1',
    '2': 'H2',
    '3': 'H3',
    q: 'blockquote'
  };

  if (blockShortcuts[key]) {
    event.preventDefault();
    applyBlockFormat(blockShortcuts[key], canvas);
  }
}

function applyBlockFormat(tagName, canvas) {
  if (!tagName || !canvas) return;
  const currentBlock = getCurrentBlockNode(canvas);
  const normalized = tagName.toUpperCase();
  const isSameBlock = currentBlock?.nodeName === normalized;
  document.execCommand('formatBlock', false, isSameBlock ? 'P' : normalized);
  focusEditorCanvas(canvas);
}

function getCurrentBlockNode(canvas) {
  if (!canvas) return null;
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return null;

  let node = selection.anchorNode;
  while (node && node.nodeType !== 1) {
    node = node.parentNode;
  }

  while (node && node !== canvas) {
    if (/^(P|H1|H2|H3|H4|H5|H6|BLOCKQUOTE|DIV|LI)$/i.test(node.nodeName)) {
      return node;
    }
    node = node.parentNode;
  }

  return null;
}

function isCursorAtBlockStart(range, block) {
  if (!range || !block) return false;
  const preRange = range.cloneRange();
  preRange.selectNodeContents(block);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().trim().length === 0;
}

function shouldOutdent(block) {
  if (!block) return false;
  if (block.nodeName === 'LI') return true;
  if (block.closest && block.closest('blockquote')) return true;
  const computed = window.getComputedStyle(block);
  const marginLeft = parseFloat(computed.marginLeft) || 0;
  const paddingLeft = parseFloat(computed.paddingLeft) || 0;
  return marginLeft > 1 || paddingLeft > 1;
}

function updateAdminDashboard(articles = getArticleLibrary()) {
  updateAdminCounters(articles);
  populateAdminTable(articles);
}

function updateAdminCounters(articles) {
  const counters = {
    published: document.querySelector('[data-count="published"]'),
    editing: document.querySelector('[data-count="editing"]'),
    draft: document.querySelector('[data-count="draft"]')
  };

  const summary = articles.reduce(
    (acc, article) => {
      if (article.status === 'live') acc.published += 1;
      if (article.status === 'editing' || article.status === 'qa') acc.editing += 1;
      if (article.status === 'draft') acc.draft += 1;
      return acc;
    },
    { published: 0, editing: 0, draft: 0 }
  );

  Object.entries(counters).forEach(([key, node]) => {
    if (node) {
      node.textContent = summary[key];
    }
  });
}

function populateAdminTable(articles) {
  const tableBody = document.querySelector('[data-article-table]');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (!articles.length) {
    const emptyRow = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.style.textAlign = 'center';
    cell.style.padding = '2rem';
    cell.style.color = 'var(--muted)';
    cell.textContent = 'No articles saved from this panel yet.';
    emptyRow.appendChild(cell);
    tableBody.appendChild(emptyRow);
    return;
  }

  const sorted = [...articles].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || Date.now());
    const dateB = new Date(b.updatedAt || b.createdAt || Date.now());
    return dateB - dateA;
  });

  sorted.forEach(article => {
    const row = document.createElement('tr');

    const articleCell = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = article.title || 'Untitled article';
    const small = document.createElement('small');
    small.textContent = article.slug || article.id;
    articleCell.append(strong, small);

    const categoryCell = document.createElement('td');
    categoryCell.textContent = formatCategoryDisplay(article.categories || article.category || 'Article');

    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    const statusMap = mapStatusToBadge(article.status);
    statusBadge.className = `status-badge ${statusMap.className}`;
    statusBadge.textContent = statusMap.label;
    statusCell.appendChild(statusBadge);

    const ownerCell = document.createElement('td');
    ownerCell.textContent = article.owner || 'TBD team';

    const updatedCell = document.createElement('td');
    updatedCell.textContent = formatDateShort(article.updatedAt || article.createdAt);

    const notesCell = document.createElement('td');
    notesCell.textContent = article.notes || '—';

    const actionsCell = document.createElement('td');
    actionsCell.className = 'admin-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.dataset.edit = article.id;
    editButton.textContent = 'Editar';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.dataset.delete = article.id;
    deleteButton.textContent = 'Eliminar';
    actionsCell.append(editButton, deleteButton);

    row.append(articleCell, categoryCell, statusCell, ownerCell, updatedCell, notesCell, actionsCell);
    tableBody.appendChild(row);
  });
}

function mapStatusToBadge(status) {
  switch (status) {
    case 'live':
      return { className: 'status-live', label: 'Published' };
    case 'editing':
      return { className: 'status-edit', label: 'Editing' };
    case 'qa':
      return { className: 'status-review', label: 'QA' };
    case 'draft':
    default:
      return { className: 'status-draft', label: 'Draft' };
  }
}

function applyArticleSeoMetadata(article) {
  if (!article) return;
  const baseTitle = 'The Business Doer';
  const articleTitle = article.title || 'Article';
  const fullTitle = `${articleTitle} | ${baseTitle}`;
  const summary =
    article.summary || "Content generated from The Business Doer's article panel.";
  const currentUrl = window.location.href;
  const keywords = normalizeKeywords(article.keywords);

  document.title = fullTitle;

  updateMetaContent('description', summary);
  updateMetaContent('keywords', keywords.join(', '));
  updateMetaContent('og:title', fullTitle);
  updateMetaContent('og:description', summary);
  updateMetaContent('og:url', currentUrl);
  updateMetaContent('og:image', article.coverImage || '');
  updateMetaContent('twitter:title', fullTitle);
  updateMetaContent('twitter:description', summary);
  updateMetaContent('twitter:image', article.coverImage || '');

  const schemaNode = document.querySelector('[data-article-schema]');
  if (schemaNode) {
    const primaryCategory = normalizeCategories(article.categories || article.category)[0] || 'Article';
    const schemaPayload = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: articleTitle,
      description: summary,
      articleSection: primaryCategory,
      datePublished: article.createdAt || article.updatedAt || new Date().toISOString(),
      dateModified: article.updatedAt || article.createdAt || new Date().toISOString(),
      author: { '@type': 'Person', name: article.owner || 'TBD team' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': currentUrl }
    };
    if (article.coverImage) {
      schemaPayload.image = article.coverImage;
    }
    if (keywords.length) {
      schemaPayload.keywords = keywords;
    }
    schemaNode.textContent = JSON.stringify(schemaPayload, null, 2);
  }
}

const ARTICLE_META_SELECTORS = {
  description: '[data-article-meta="description"]',
  keywords: '[data-article-meta="keywords"]',
  'og:title': '[data-article-meta="og:title"]',
  'og:description': '[data-article-meta="og:description"]',
  'og:url': '[data-article-meta="og:url"]',
  'og:image': '[data-article-meta="og:image"]',
  'twitter:title': '[data-article-meta="twitter:title"]',
  'twitter:description': '[data-article-meta="twitter:description"]',
  'twitter:image': '[data-article-meta="twitter:image"]'
};

function updateMetaContent(key, value) {
  const selector = ARTICLE_META_SELECTORS[key];
  if (!selector) return;
  const node = document.querySelector(selector);
  if (!node) return;
  if (value) {
    node.setAttribute('content', value);
  } else {
    node.removeAttribute('content');
  }
}

function normalizeKeywords(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map(keyword => keyword.trim())
    .filter(Boolean);
}

function setupCookieConsent() {
  ensureCookieMarkup();

  const banner = document.querySelector('[data-cookie-banner]');
  const modal = document.querySelector('[data-cookie-modal]');
  const statusText = document.querySelector('[data-cookie-status]');
  const analyticsToggle = document.getElementById('cookie-analytics');
  const marketingToggle = document.getElementById('cookie-marketing');
  const acceptButtons = document.querySelectorAll('[data-cookie-accept]');
  const rejectButtons = document.querySelectorAll('[data-cookie-reject]');
  const personalizeButtons = document.querySelectorAll('[data-cookie-personalize]');
  const saveButton = document.querySelector('[data-cookie-save]');
  const closeButtons = document.querySelectorAll('[data-cookie-close]');
  const openSettingsButtons = document.querySelectorAll('[data-open-cookie-settings]');

  if (!banner || !modal || !analyticsToggle || !marketingToggle) return;

  const DEFAULT_PREFS = { necessary: true, analytics: false, marketing: false };

  const readPrefs = () => {
    try {
      const stored = localStorage.getItem(COOKIE_PREF_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFS, ...parsed };
    } catch (error) {
      return null;
    }
  };

  const storePrefs = prefs => {
    const payload = { ...DEFAULT_PREFS, ...prefs, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(COOKIE_PREF_KEY, JSON.stringify(payload));
    } catch (error) {
      // Storage might be blocked; fail silently
    }
    return payload;
  };

  const showBanner = () => {
    banner.hidden = false;
  };

  const hideBanner = () => {
    banner.hidden = true;
  };

  const openModal = () => {
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeModal = () => {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  const syncCheckboxes = prefs => {
    analyticsToggle.checked = !!prefs.analytics;
    marketingToggle.checked = !!prefs.marketing;
  };

  const setStatus = message => {
    if (statusText) {
      statusText.textContent = message;
    }
  };

  const handleDecision = prefs => {
    const saved = storePrefs(prefs);
    syncCheckboxes(saved);
    hideBanner();
    closeModal();
    setStatus('Preferences saved.');
  };

  const existing = readPrefs();
  if (existing) {
    syncCheckboxes(existing);
    hideBanner();
  } else {
    showBanner();
  }

  acceptButtons.forEach(button => {
    button.addEventListener('click', () => {
      handleDecision({ necessary: true, analytics: true, marketing: true });
    });
  });

  rejectButtons.forEach(button => {
    button.addEventListener('click', () => {
      handleDecision({ necessary: true, analytics: false, marketing: false });
    });
  });

  personalizeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const prefs = readPrefs() || DEFAULT_PREFS;
      syncCheckboxes(prefs);
      openModal();
    });
  });

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      handleDecision({
        necessary: true,
        analytics: analyticsToggle.checked,
        marketing: marketingToggle.checked
      });
    });
  }

  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      closeModal();
    });
  });

  openSettingsButtons.forEach(button => {
    button.addEventListener('click', () => {
      const prefs = readPrefs() || DEFAULT_PREFS;
      syncCheckboxes(prefs);
      openModal();
    });
  });
}

function ensureCookieMarkup() {
  if (document.querySelector('[data-cookie-banner]')) return;
  const template = `
    <div class="cookie-banner" data-cookie-banner hidden>
      <div class="cookie-text">
        <p class="cookie-title">We use cookies to run this site.</p>
        <p>Accept all, reject non-essential, or customize your choices.</p>
      </div>
      <div class="cookie-actions">
        <button type="button" class="btn-secondary" data-cookie-reject>Reject</button>
        <button type="button" class="btn-secondary ghost" data-cookie-personalize>Customize</button>
        <button type="button" class="btn-primary" data-cookie-accept>Accept</button>
      </div>
    </div>

    <div class="cookie-modal" data-cookie-modal hidden aria-hidden="true" role="dialog" aria-labelledby="cookie-modal-title">
      <div class="cookie-modal-card">
        <div class="cookie-modal-head">
          <div>
            <p class="cookie-title">Cookie preferences</p>
            <h3 id="cookie-modal-title">Choose what to enable</h3>
            <p class="cookie-subtitle">We always keep the necessary cookies on to make the site work.</p>
          </div>
          <button type="button" class="cookie-close" data-cookie-close aria-label="Close">×</button>
        </div>
        <form class="cookie-options">
          <label class="cookie-option">
            <div>
              <strong>Necessary</strong>
              <p>Security, consent storage, and basic navigation. Always on.</p>
            </div>
            <input type="checkbox" checked disabled>
          </label>
          <label class="cookie-option">
            <div>
              <strong>Analytics</strong>
              <p>Aggregated insights to see which content is most useful.</p>
            </div>
            <input type="checkbox" id="cookie-analytics" name="cookie-analytics">
          </label>
          <label class="cookie-option">
            <div>
              <strong>Marketing</strong>
              <p>Remarketing or personalized messages (off by default).</p>
            </div>
            <input type="checkbox" id="cookie-marketing" name="cookie-marketing">
          </label>
        </form>
        <p class="cookie-status" data-cookie-status role="status" aria-live="polite"></p>
        <div class="cookie-actions">
          <button type="button" class="btn-secondary" data-cookie-reject>Reject</button>
          <button type="button" class="btn-secondary ghost" data-cookie-close>Close</button>
          <button type="button" class="btn-primary" data-cookie-save>Save choices</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', template);
}
