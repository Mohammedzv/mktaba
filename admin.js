
import {
  db,
  auth,
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./firebase.js";

// حساب المدير المصرح له
const ADMIN_UID = "cacAswSPTcU4AcXH9e7vSMQZweU2";

// عناصر الصفحة
const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const productForm = document.getElementById("productForm");
const productMessage = document.getElementById("productMessage");
const adminProducts = document.getElementById("adminProducts");
const logoutButton = document.getElementById("logoutButton");
const saveButton = document.getElementById("saveButton");
const cancelEdit = document.getElementById("cancelEdit");
const formTitle = document.getElementById("formTitle");

let products = {};
let editingId = null;

// رسائل الصفحة
function showMessage(element, message, success = false) {
  element.style.display = "block";
  element.textContent = message;
  element.style.background = success ? "#dcfce7" : "#fee2e2";
  element.style.color = success ? "#166534" : "#991b1b";
}

// إخفاء الرسائل
function hideMessage(element) {
  element.style.display = "none";
}

// قراءة بيانات المنتج من النموذج
function getProductData() {
  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const category = document.getElementById("productCategory").value;
  const image = document.getElementById("productImage").value.trim();
  const quantity = Number(document.getElementById("productQuantity").value);
  const active = document.getElementById("productActive").value === "true";

  if (!name || !Number.isFinite(price) || price <= 0) {
    throw new Error("اكتب اسم المنتج وسعر صحيح.");
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("الكمية لازم تكون رقم صحيح.");
  }

  if (image) {
    const url = new URL(image);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("رابط الصورة غير صالح.");
    }
  }

  return {
    name,
    price,
    category,
    image,
    quantity,
    active,
    updatedAt: Date.now()
  };
}

// إعادة النموذج لوضع الإضافة
function resetForm() {
  productForm.reset();
  editingId = null;

  document.getElementById("productQuantity").value = 1;
  document.getElementById("productActive").value = "true";

  formTitle.textContent = "➕ إضافة منتج جديد";
  saveButton.textContent = "حفظ المنتج";
  cancelEdit.hidden = true;
}

// تسجيل الدخول
loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  hideMessage(loginMessage);

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    if (credential.user.uid !== ADMIN_UID) {
      await signOut(auth);
      throw new Error("هذا الحساب ليس لديه صلاحية المدير.");
    }

    loginForm.reset();

  } catch (error) {
    console.error(error);

    showMessage(
      loginMessage,
      error.code === "auth/invalid-credential"
        ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
        : error.message || "تعذر تسجيل الدخول."
    );
  }
});

// مراقبة حالة الحساب
onAuthStateChanged(auth, user => {
  if (user && user.uid === ADMIN_UID) {
    loginSection.classList.add("admin-hidden");
    adminSection.classList.remove("admin-hidden");
    loadProducts();
  } else {
    loginSection.classList.remove("admin-hidden");
    adminSection.classList.add("admin-hidden");
  }
});

// تحميل المنتجات
function loadProducts() {
  onValue(ref(db, "products"), snapshot => {
    products = snapshot.val() || {};
    renderAdminProducts();
  }, error => {
    console.error(error);
    showMessage(productMessage, "تعذر تحميل المنتجات من قاعدة البيانات.");
  });
}

// عرض المنتجات في الجدول
function renderAdminProducts() {
  adminProducts.innerHTML = "";

  const entries = Object.entries(products);

  if (entries.length === 0) {
    adminProducts.innerHTML =
      '<tr><td colspan="6">لا توجد منتجات مسجلة حتى الآن.</td></tr>';
    return;
  }

  entries.forEach(([id, product]) => {
    const row = document.createElement("tr");

    const values = [
      product.name || "",
      `${Number(product.price || 0)} جنيه`,
      product.category || "أخرى",
      Number(product.quantity || 0),
      product.active === false ? "مخفي" : "ظاهر"
    ];

    values.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const actions = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.className = "action-btn edit-btn";
    editButton.textContent = "تعديل";
    editButton.addEventListener("click", () => editProduct(id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "action-btn delete-btn";
    deleteButton.textContent = "حذف";
    deleteButton.addEventListener("click", () => deleteProduct(id));

    actions.append(editButton, deleteButton);
    row.appendChild(actions);

    adminProducts.appendChild(row);
  });
}

// تعديل منتج
function editProduct(id) {
  const product = products[id];

  if (!product) return;

  editingId = id;

  document.getElementById("productName").value = product.name || "";
  document.getElementById("productPrice").value = product.price || "";
  document.getElementById("productCategory").value =
    product.category || "أخرى";
  document.getElementById("productImage").value = product.image || "";
  document.getElementById("productQuantity").value =
    product.quantity ?? 0;
  document.getElementById("productActive").value =
    product.active === false ? "false" : "true";

  formTitle.textContent = "✏️ تعديل المنتج";
  saveButton.textContent = "حفظ التعديلات";
  cancelEdit.hidden = false;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// حفظ منتج جديد أو تعديل موجود
productForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
    showMessage(productMessage, "ليس لديك صلاحية تنفيذ هذا الإجراء.");
    return;
  }

  hideMessage(productMessage);
  saveButton.disabled = true;

  try {
    const data = getProductData();

    if (editingId) {
      await update(ref(db, `products/${editingId}`), data);
      showMessage(productMessage, "تم تعديل المنتج بنجاح ❤️", true);
    } else {
      const newProduct = push(ref(db, "products"));
      await set(newProduct, {
        ...data,
        createdAt: Date.now()
      });

      showMessage(productMessage, "تم إضافة المنتج بنجاح ❤️", true);
    }

    resetForm();

  } catch (error) {
    console.error(error);
    showMessage(productMessage, error.message || "تعذر حفظ المنتج.");
  } finally {
    saveButton.disabled = false;
  }
});

// حذف منتج
async function deleteProduct(id) {
  if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
    showMessage(productMessage, "ليس لديك صلاحية حذف المنتجات.");
    return;
  }

  const confirmed = confirm("متأكد إنك عايز تحذف المنتج ده؟");

  if (!confirmed) return;

  try {
    await remove(ref(db, `products/${id}`));
    showMessage(productMessage, "تم حذف المنتج بنجاح.", true);

    if (editingId === id) {
      resetForm();
    }
  } catch (error) {
    console.error(error);
    showMessage(productMessage, "تعذر حذف المنتج.");
  }
}

// إلغاء التعديل
cancelEdit.addEventListener("click", resetForm);

// تسجيل الخروج
logoutButton.addEventListener("click", async () => {
  await signOut(auth);
  resetForm();
});
