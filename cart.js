
import { WHATSAPP_NUMBER } from "./firebase.js";

const CART_KEY = "kapadaya_cart";

const cartItems = document.getElementById("cartItems");
const emptyCart = document.getElementById("emptyCart");
const cartLayout = document.getElementById("cartLayout");
const totalQuantity = document.getElementById("totalQuantity");
const totalPrice = document.getElementById("totalPrice");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutButton = document.getElementById("checkoutButton");

function getCart() {
  try {
    const data = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function money(value) {
  return Number(value).toLocaleString("ar-EG") + " جنيه";
}

function renderCart() {
  const cart = getCart();

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    emptyCart.hidden = false;
    cartLayout.hidden = true;
    return;
  }

  emptyCart.hidden = true;
  cartLayout.hidden = false;

  let quantity = 0;
  let total = 0;

  cart.forEach((item, index) => {
    const price = Number(item.price) || 0;
    const count = Number(item.quantity) || 1;

    quantity += count;
    total += price * count;

    const row = document.createElement("div");
    row.className = "cart-item";

    const imageBox = document.createElement("div");

    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name || "منتج";
      img.loading = "lazy";
      img.onerror = () => {
        imageBox.innerHTML = '<div class="cart-placeholder">📦</div>';
      };
      imageBox.appendChild(img);
    } else {
      imageBox.innerHTML = '<div class="cart-placeholder">📦</div>';
    }

    const info = document.createElement("div");

    const name = document.createElement("h3");
    name.textContent = item.name || "منتج";

    const priceText = document.createElement("p");
    priceText.className = "cart-item-price";
    priceText.textContent = money(price * count);

    const controls = document.createElement("div");
    controls.className = "quantity-controls";

    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", "تقليل الكمية");

    const amount = document.createElement("strong");
    amount.textContent = count;

    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", "زيادة الكمية");

    decrease.addEventListener("click", () => changeQuantity(index, -1));
    increase.addEventListener("click", () => changeQuantity(index, 1));

    controls.append(decrease, amount, increase);
    info.append(name, priceText, controls);

    const actions = document.createElement("div");

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-button";
    removeButton.textContent = "حذف";

    removeButton.addEventListener("click", () => removeItem(index));

    actions.appendChild(removeButton);

    row.append(imageBox, info, actions);
    cartItems.appendChild(row);
  });

  totalQuantity.textContent = quantity;
  totalPrice.textContent = money(total);
  checkoutButton.disabled = quantity === 0;
}

function changeQuantity(index, change) {
  const cart = getCart();

  if (!cart[index]) return;

  const next = Number(cart[index].quantity) + change;

  if (next <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = next;
  }

  saveCart(cart);
  renderCart();
}

function removeItem(index) {
  const cart = getCart();

  cart.splice(index, 1);

  saveCart(cart);
  renderCart();
}

checkoutForm.addEventListener("submit", event => {
  event.preventDefault();

  const cart = getCart();

  if (cart.length === 0) {
    alert("السلة فارغة!");
    return;
  }

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();
  const notes = document.getElementById("customerNotes").value.trim();

  if (!name || !phone || !address) {
    alert("من فضلك أكمل بيانات الطلب.");
    return;
  }

  let total = 0;
  let lines = [];

  cart.forEach((item, index) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;
    const subtotal = price * quantity;

    total += subtotal;

    lines.push(
      `${index + 1}- ${item.name}\nالكمية: ${quantity}\nالسعر: ${money(subtotal)}`
    );
  });

  const message = [
    "📚 *طلب جديد من مكتبة قبضايا*",
    "",
    `👤 الاسم: ${name}`,
    `📞 الهاتف: ${phone}`,
    `📍 العنوان: ${address}`,
    "",
    "🛒 *تفاصيل الطلب:*",
    ...lines,
    "",
    `💰 *الإجمالي: ${money(total)}*`,
    "",
    `📝 ملاحظات: ${notes || "لا يوجد"}`,
    "",
    "شكراً لثقتكم في مكتبة قبضايا ❤️"
  ].join("\n");

  const url =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");
});

renderCart();
