const state = {
  products: [],
  category: "Все",
  season: "Все",
  sort: "featured",
  query: "",
  activeProduct: null,
  selectedSize: null,
  cart: JSON.parse(localStorage.getItem("alma-demo-cart") || "[]"),
};

const familyOrder = [
  "Все",
  "Верхняя одежда",
  "Пиджаки и костюмы",
  "Сорочки",
  "Брюки",
  "Трикотаж",
  "Обувь",
  "Сумки",
  "Аксессуары",
];

const els = {
  grid: document.querySelector("#product-grid"),
  count: document.querySelector("#result-count"),
  filters: document.querySelector("#category-filters"),
  sort: document.querySelector("#sort-select"),
  empty: document.querySelector("#empty-state"),
  productDialog: document.querySelector("#product-dialog"),
  productDetail: document.querySelector("#product-detail"),
  searchDialog: document.querySelector("#search-dialog"),
  searchInput: document.querySelector("#search-input"),
  searchResults: document.querySelector("#search-results"),
  cartDialog: document.querySelector("#cart-dialog"),
  cartItems: document.querySelector("#cart-items"),
  cartSummary: document.querySelector("#cart-summary"),
  cartCount: document.querySelector("#cart-count"),
  catalogTrigger: document.querySelector(".catalog-trigger"),
  catalogMenu: document.querySelector("#catalog-menu"),
  menuToggle: document.querySelector("#menu-toggle"),
  mobileNav: document.querySelector("#mobile-nav"),
  toast: document.querySelector("#toast"),
};

function categoryFamily(category) {
  if (category.startsWith("Верхняя одежда")) return "Верхняя одежда";
  if (category.includes("Пиджаки") || category.includes("Блейзеры") || category === "Костюмы") return "Пиджаки и костюмы";
  if (category.includes("Сорочки")) return "Сорочки";
  if (category.includes("Брюки") || category === "Джинсы") return "Брюки";
  if (category === "Трикотаж" || category.includes("Футболки") || category.includes("Спортивная")) return "Трикотаж";
  if (category === "Обувь") return "Обувь";
  if (category === "Сумки") return "Сумки";
  if (category.includes("Аксессуары")) return "Аксессуары";
  return "Другое";
}

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function filteredProducts() {
  const query = state.query.trim().toLocaleLowerCase("ru");
  let result = state.products.filter((product) => {
    const matchesCategory = state.category === "Все" || categoryFamily(product.category) === state.category;
    const matchesSeason = state.season === "Все" || product.season.includes(state.season);
    const haystack = [product.title, product.subtitle, product.materials, product.color, product.category].join(" ").toLocaleLowerCase("ru");
    return matchesCategory && matchesSeason && (!query || haystack.includes(query));
  });

  if (state.sort === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
  return result;
}

function renderFilters() {
  const available = familyOrder.filter((family) => family === "Все" || state.products.some((product) => categoryFamily(product.category) === family));
  els.filters.innerHTML = available.map((family) => `
    <button class="filter-chip${state.category === family ? " active" : ""}" type="button" data-category="${escapeHtml(family)}">
      ${escapeHtml(family)}
    </button>
  `).join("");
}

function productCard(product) {
  const family = categoryFamily(product.category);
  return `
    <article class="product-card">
      <button class="product-image-button" type="button" data-product-id="${product.id}" aria-label="Открыть ${escapeHtml(product.title)}">
        <img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.subtitle)}" loading="lazy">
        <span class="product-badge">${escapeHtml(product.season)}</span>
      </button>
      <div class="product-info">
        <div class="product-meta"><span>${escapeHtml(family)}</span><span>${escapeHtml(product.colorGroup)}</span></div>
        <button class="product-title-button" type="button" data-product-id="${product.id}">
          <h3>${escapeHtml(product.title)}</h3>
        </button>
        <p class="product-subtitle">${escapeHtml(product.subtitle)}</p>
        <p class="product-price">${formatMoney(product.price)}</p>
      </div>
    </article>
  `;
}

function renderCatalog({ scroll = false } = {}) {
  const products = filteredProducts();
  renderFilters();
  els.grid.innerHTML = products.map(productCard).join("");
  els.count.textContent = `${products.length} ${productWord(products.length)}`;
  els.empty.hidden = products.length !== 0;
  els.grid.hidden = products.length === 0;
  if (scroll) document.querySelector("#catalog").scrollIntoView({ behavior: "smooth", block: "start" });
}

function productWord(count) {
  const value = Math.abs(count) % 100;
  const last = value % 10;
  if (value > 10 && value < 20) return "товаров";
  if (last === 1) return "товар";
  if (last > 1 && last < 5) return "товара";
  return "товаров";
}

function openProduct(id, updateHash = true) {
  const product = state.products.find((item) => item.id === Number(id));
  if (!product) return;
  state.activeProduct = product;
  state.selectedSize = product.sizes[0];
  renderProductDetail(product);
  if (!els.productDialog.open) els.productDialog.showModal();
  document.body.classList.add("no-scroll");
  if (updateHash) history.replaceState(null, "", `#item-${product.id}`);
}

function renderProductDetail(product) {
  const attributes = [
    ["Материал", product.materials],
    ["Посадка", product.fit],
    ["Цвет", product.color],
    ["Состояние", product.condition],
    ...(product.measurements ? [["Замеры", product.measurements]] : []),
  ];

  els.productDetail.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-gallery">
        <div class="gallery-thumbs">
          ${product.images.map((image, index) => `
            <button class="gallery-thumb${index === 0 ? " active" : ""}" type="button" data-gallery-image="${escapeHtml(image)}" aria-label="Фотография ${index + 1}">
              <img src="${escapeHtml(image)}" alt="">
            </button>
          `).join("")}
        </div>
        <div class="gallery-main-wrap">
          <img class="gallery-main" id="gallery-main" src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.subtitle)}">
        </div>
      </div>
      <div class="product-detail-copy">
        <p class="detail-category">${escapeHtml(product.category)} · ${escapeHtml(product.season)}</p>
        <h2>${escapeHtml(product.title)}</h2>
        <p class="detail-subtitle">${escapeHtml(product.subtitle)}</p>
        <p class="detail-price">${formatMoney(product.price)}</p>
        <p class="detail-description">${escapeHtml(product.description)}</p>
        <p class="option-label"><span>Размер</span><span>${escapeHtml(state.selectedSize)}</span></p>
        <div class="size-options">
          ${product.sizes.map((size, index) => `
            <button class="size-button${index === 0 ? " active" : ""}" type="button" data-size="${escapeHtml(size)}">${escapeHtml(size)}</button>
          `).join("")}
        </div>
        <button class="button button-green" type="button" id="add-to-cart">Добавить в корзину</button>
        <dl class="detail-attributes">
          ${attributes.map(([label, value]) => `<div class="attribute-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>
      </div>
    </div>
  `;
}

function closeDialog(dialog) {
  dialog.close();
  document.body.classList.remove("no-scroll");
  if (dialog === els.productDialog && location.hash.startsWith("#item-")) history.replaceState(null, "", location.pathname + location.search);
}

function addToCart() {
  if (!state.activeProduct) return;
  const key = `${state.activeProduct.id}:${state.selectedSize}`;
  const existing = state.cart.find((item) => item.key === key);
  if (existing) existing.quantity += 1;
  else state.cart.push({ key, productId: state.activeProduct.id, size: state.selectedSize, quantity: 1 });
  persistCart();
  showToast("Товар добавлен в корзину");
}

function persistCart() {
  localStorage.setItem("alma-demo-cart", JSON.stringify(state.cart));
  updateCartCount();
}

function updateCartCount() {
  els.cartCount.textContent = state.cart.reduce((total, item) => total + item.quantity, 0);
}

function renderCart() {
  const rows = state.cart.map((item) => ({ ...item, product: state.products.find((product) => product.id === item.productId) })).filter((item) => item.product);
  if (!rows.length) {
    els.cartItems.innerHTML = `<div class="cart-empty"><h3>Корзина пока пуста</h3><p>Добавьте понравившиеся вещи из коллекции.</p></div>`;
    els.cartSummary.innerHTML = `<button class="button button-dark" type="button" data-close="cart-dialog">Вернуться к товарам</button>`;
    return;
  }

  els.cartItems.innerHTML = rows.map((item) => `
    <article class="cart-item">
      <img src="${escapeHtml(item.product.images[0])}" alt="${escapeHtml(item.product.title)}">
      <div>
        <h3>${escapeHtml(item.product.title)}</h3>
        <p>Размер: ${escapeHtml(item.size)}</p>
        <p>${item.quantity} × ${formatMoney(item.product.price)}</p>
      </div>
      <button class="remove-item" type="button" data-remove-key="${escapeHtml(item.key)}">Убрать</button>
    </article>
  `).join("");

  const total = rows.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  els.cartSummary.innerHTML = `
    <div class="cart-total"><span>Итого</span><span>${formatMoney(total)}</span></div>
    <a class="button button-green" href="https://t.me/alma_tessuti" target="_blank" rel="noreferrer">Открыть Telegram</a>
    <p class="cart-disclaimer">Это демонстрация. Состав корзины и персональные данные никуда не отправляются.</p>
  `;
}

function openCart() {
  renderCart();
  els.cartDialog.showModal();
  document.body.classList.add("no-scroll");
}

function renderSearchResults() {
  const query = els.searchInput.value.trim().toLocaleLowerCase("ru");
  const results = state.products.filter((product) => {
    const text = [product.title, product.subtitle, product.materials, product.color, product.category].join(" ").toLocaleLowerCase("ru");
    return !query || text.includes(query);
  }).slice(0, 10);

  els.searchResults.innerHTML = results.map((product) => `
    <button class="search-result" type="button" data-product-id="${product.id}">
      <img src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.title)}">
      <strong>${escapeHtml(product.title)}</strong>
      <span>${formatMoney(product.price)}</span>
    </button>
  `).join("");
}

function openSearch() {
  renderSearchResults();
  els.searchDialog.showModal();
  document.body.classList.add("no-scroll");
  els.searchInput.focus();
}

function setCategory(category) {
  state.category = category;
  state.season = "Все";
  state.query = "";
  closeMenus();
  renderCatalog({ scroll: true });
}

function setSeason(season) {
  state.season = season;
  state.category = "Все";
  closeMenus();
  renderCatalog({ scroll: true });
}

function closeMenus() {
  els.catalogMenu.hidden = true;
  els.catalogTrigger.setAttribute("aria-expanded", "false");
  els.mobileNav.hidden = true;
  els.menuToggle.setAttribute("aria-expanded", "false");
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  toastTimer = setTimeout(() => els.toast.classList.remove("visible"), 2600);
}

document.addEventListener("click", (event) => {
  const productButton = event.target.closest("[data-product-id]");
  if (productButton) {
    if (els.searchDialog.open) els.searchDialog.close();
    openProduct(productButton.dataset.productId);
    return;
  }

  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) {
    setCategory(categoryButton.dataset.category);
    return;
  }

  const familyButton = event.target.closest("[data-family]");
  if (familyButton) {
    setSeason(familyButton.dataset.family);
    return;
  }

  const closeButton = event.target.closest("[data-close]");
  if (closeButton) {
    const dialog = document.querySelector(`#${closeButton.dataset.close}`);
    if (dialog?.open) closeDialog(dialog);
    return;
  }

  const galleryButton = event.target.closest("[data-gallery-image]");
  if (galleryButton) {
    document.querySelector("#gallery-main").src = galleryButton.dataset.galleryImage;
    document.querySelectorAll(".gallery-thumb").forEach((button) => button.classList.toggle("active", button === galleryButton));
    return;
  }

  const sizeButton = event.target.closest("[data-size]");
  if (sizeButton) {
    state.selectedSize = sizeButton.dataset.size;
    document.querySelectorAll(".size-button").forEach((button) => button.classList.toggle("active", button === sizeButton));
    document.querySelector(".option-label span:last-child").textContent = state.selectedSize;
    return;
  }

  const removeButton = event.target.closest("[data-remove-key]");
  if (removeButton) {
    state.cart = state.cart.filter((item) => item.key !== removeButton.dataset.removeKey);
    persistCart();
    renderCart();
    return;
  }

  if (event.target.id === "add-to-cart") addToCart();
  if (!event.target.closest("#catalog-menu") && !event.target.closest(".catalog-trigger")) {
    els.catalogMenu.hidden = true;
    els.catalogTrigger.setAttribute("aria-expanded", "false");
  }
});

els.catalogTrigger.addEventListener("click", () => {
  const willOpen = els.catalogMenu.hidden;
  closeMenus();
  els.catalogMenu.hidden = !willOpen;
  els.catalogTrigger.setAttribute("aria-expanded", String(willOpen));
});

els.menuToggle.addEventListener("click", () => {
  const willOpen = els.mobileNav.hidden;
  closeMenus();
  els.mobileNav.hidden = !willOpen;
  els.menuToggle.setAttribute("aria-expanded", String(willOpen));
});

els.sort.addEventListener("change", () => {
  state.sort = els.sort.value;
  renderCatalog();
});

els.searchInput.addEventListener("input", renderSearchResults);
document.querySelector("#search-open").addEventListener("click", openSearch);
document.querySelector("#mobile-search-open").addEventListener("click", () => {
  closeMenus();
  openSearch();
});
document.querySelector("#cart-open").addEventListener("click", openCart);
document.querySelector("#reset-filters").addEventListener("click", () => setCategory("Все"));

[els.productDialog, els.searchDialog, els.cartDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog(dialog);
  });
  dialog.addEventListener("close", () => document.body.classList.remove("no-scroll"));
});

window.addEventListener("hashchange", () => {
  const match = location.hash.match(/^#item-(\d+)$/);
  if (match) openProduct(match[1], false);
});

async function initialize() {
  try {
    const response = await fetch("assets/catalog.json");
    if (!response.ok) throw new Error("Catalog request failed");
    const payload = await response.json();
    state.products = payload.products;
    renderCatalog();
    updateCartCount();
    const match = location.hash.match(/^#item-(\d+)$/);
    if (match) openProduct(match[1], false);
  } catch (error) {
    els.grid.innerHTML = `<div class="empty-state"><h3>Каталог временно недоступен</h3><p>Обновите страницу немного позже.</p></div>`;
    console.error(error);
  }
}

initialize();
