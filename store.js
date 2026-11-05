
import {
  db,
  ref,
  onValue
} from "./firebase.js";

// عناصر الصفحة
const productsContainer = document.getElementById("productsContainer");
const emptyProducts = document.getElementById("emptyProducts");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");

const categoryButtons = document.querySelectorAll(".category-card");

let allProducts = [];
let selectedCategory = "all";
let searchText = "";

// قراءة السلة
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("kapadaya_cart")) || [];
  } catch {
    return [];
  }
}

// تحديث عدد المنتجات في السلة
function updateCartCount() {
  const cart = getCart();

  const count = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  if (cartCount) {
    cartCount.textContent = count;
  }
}

// إضافة منتج للسلة
function addToCart(productId) {
  const product = allProducts.find(
    item => item.id === productId
  );

  if (!product) return;

  const cart = getCart();

  const existing = cart.find(
    item => item.id === productId
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image || "",
      quantity: 1
    });
  }

  localStorage.setItem(
    "kapadaya_cart",
    JSON.stringify(cart)
  );

  updateCartCount();

  alert("تمت إضافة " + product.name + " للسلة ❤️");
}

// حماية النصوص من إدخال HTML غير مقصود
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// عرض المنتجات
function renderProducts() {
  if (!productsContainer) return;

  const filteredProducts = allProducts.filter(product => {
    const categoryMatch =
      selectedCategory === "all" ||
      product.category === selectedCategory;

    const searchMatch =
      String(product.name || "")
        .toLowerCase()
        .includes(searchText.toLowerCase());

    return categoryMatch && searchMatch;
  });

  productsContainer.innerHTML = "";

  if (filteredProducts.length === 0) {
    emptyProducts.hidden = false;
    return;
  }

  emptyProducts.hidden = true;

  filteredProducts.forEach(product => {
    const card = document.createElement("article");

    card.className = "product-card";

    const image = product.image
      ? `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy">`
      : `<span style="font-size:55px">📦</span>`;

    card.innerHTML = `
      <div class="product-image">
        ${image}
      </div>

      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>

        <div class="product-price">
          ${Number(product.price).toLocaleString("ar-EG")} جنيه
        </div>

        <div class="product-category">
          ${escapeHTML(product.category || "أخرى")}
        </div>

        <button class="add-cart-button" type="button">
          🛒 أضف إلى السلة
        </button>
      </div>
    `;

    card.querySelector(".add-cart-button").addEventListener(
      "click",
      () => addToCart(product.id)
    );

    productsContainer.appendChild(card);
  });
}

// البحث
if (searchInput) {
  searchInput.addEventListener("input", event => {
    searchText = event.target.value.trim();
    renderProducts();
  });
}

// اختيار القسم
categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    categoryButtons.forEach(item =>
      item.classList.remove("active")
    );

    button.classList.add("active");

    selectedCategory = button.dataset.category;

    renderProducts();
  });
});

// قائمة الموبايل
const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });

  mobileNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
    });
  });
}

// الاتصال بقاعدة بيانات المنتجات
onValue(
  ref(db, "products"),
  snapshot => {
    const data = snapshot.val() || {};

    allProducts = Object.entries(data)
      .map(([id, product]) => ({
        id,
        ...product
      }))
      .filter(product =>
        product.active !== false
      );

    renderProducts();
  },
  error => {
    console.error("Firebase error:", error);

    productsContainer.innerHTML = `
      <div class="loading-message">
        <span>⚠️</span>
        <p>تعذر تحميل المنتجات. تأكد من اتصال قاعدة البيانات.</p>
      </div>
    `;
  }
);

// تشغيل عداد السلة
updateCartCount();
