/**
 * dashboard.js
 * - Adds infinite scroll to dashboardList
 * - Persists items in localStorage under key DASH_ITEMS_V1
 * - Allows adding new items from form
 */

const DASH_KEY = "DASH_ITEMS_V1";
const BATCH_SIZE = 4;        // how many cards to append per scroll
let loadedCount = 0;
let isLoading = false;
let allItems = [];

// simple helpers
function readDashItems() {
  return JSON.parse(localStorage.getItem(DASH_KEY) || "[]");
}
function writeDashItems(items) {
  localStorage.setItem(DASH_KEY, JSON.stringify(items));
}

// fallback: if there are no items yet, generate dummy items
function ensureInitialItems() {
  let items = readDashItems();
  if (items.length >= 1) { allItems = items; return; }

  // create 16 demo items (you can change content)
  items = [];
  for (let i = 1; i <= 16; i++) {
    items.push({
      id: `item_${Date.now()}_${i}`,
      title: `Lipton Plan ${i}`,
      price: 480 + (i - 1) * 20,
      daily: 120 + Math.floor(i / 2) * 5,
      days: 180,
      image: (i % 2 === 0) ? "images/redbull.png" : "images/banner1.jpg",
      created: Date.now() - i * 1000
    });
  }
  writeDashItems(items);
  allItems = items;
}

// render a single card element (same look as plan-card)
function renderCard(item) {
  const card = document.createElement("article");
  card.className = "plan-card";
  card.style.opacity = "0";
  card.style.transform = "translateY(10px)";
  card.style.transition = "all 260ms ease";

  const img = document.createElement("img");
  img.className = "plan-image";
  img.src = item.image || "images/redbull.png";
  img.alt = item.title || "item";
  img.onerror = () => img.src = "https://i.imgur.com/OwS5faT.jpeg";

  const info = document.createElement("div");
  info.className = "plan-info";
  info.innerHTML = `
    <div class="plan-title">${item.title}</div>
    <div class="plan-grid">
      <div class="price-box">₹ ${item.price}<small>Price</small></div>
      <div class="price-box">₹ ${item.daily}<small>Daily profit</small></div>
      <div class="price-box">${item.days}<small>Day</small></div>
      <div class="price-box">₹ ${item.daily * item.days}<small>Total profit</small></div>
    </div>
  `;

  const buyRow = document.createElement("div");
  buyRow.className = "plan-buy-row";
  buyRow.innerHTML = `<button class="plan-buy">🛒 Buy now</button>`;

  // buy button behavior: reuse buyPlanByPrice if present; fallback alert
  buyRow.querySelector("button").addEventListener("click", () => {
    if (typeof buyPlanByPrice === "function") {
      buyPlanByPrice(item.price, item.title, item.daily, item.days);
    } else {
      alert(`Buy ${item.title} for ₹${item.price}`);
    }
  });

  card.appendChild(img);
  card.appendChild(info);
  card.appendChild(buyRow);

  // reveal animation
  setTimeout(() => {
    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  }, 30);

  return card;
}

// render next batch
function renderNextBatch() {
  if (isLoading) return;
  isLoading = true;
  const list = document.getElementById("dashboardList");
  const loader = document.getElementById("loader");
  loader.style.display = "block";

  // simulate small delay for UX
  setTimeout(() => {
    const start = loadedCount;
    const end = Math.min(allItems.length, loadedCount + BATCH_SIZE);
    for (let i = start; i < end; i++) {
      const el = renderCard(allItems[i]);
      list.appendChild(el);
    }
    loadedCount = end;
    loader.style.display = "none";
    isLoading = false;

    // if we've shown all, optionally show message
    if (loadedCount >= allItems.length) {
      // load more button could be shown to generate new items
      // nothing needed for now
    }
  }, 250);
}

// scroll event handler
function onScrollHandler() {
  if (isLoading) return;
  // when user is near bottom
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
  if (nearBottom) {
    if (loadedCount < allItems.length) {
      renderNextBatch();
    } else {
      // no more saved items: option to auto-generate some demo items
      // here do nothing (or you could call generateMoreDummy())
    }
  }
}

// sort utilities
function sortItems(mode) {
  if (mode === "price_low") {
    allItems.sort((a, b) => a.price - b.price);
  } else if (mode === "price_high") {
    allItems.sort((a, b) => b.price - a.price);
  } else {
    allItems.sort((a, b) => b.created - a.created); // newest first
  }
  // re-render
  const list = document.getElementById("dashboardList");
  list.innerHTML = "";
  loadedCount = 0;
  renderNextBatch();
}

// Add item (from form)
function addNewItemFromForm() {
  const title = document.getElementById("newItemTitle").value.trim();
  const price = parseFloat(document.getElementById("newItemPrice").value || 0);
  const daily = parseFloat(document.getElementById("newItemDaily").value || 0);
  let image = document.getElementById("newItemImg").value.trim();

  if (!title || !price || !daily) {
    return alert("Please enter title, price and daily");
  }
  if (!image) image = "images/redbull.png";

  const item = {
    id: `item_${Date.now()}`,
    title,
    price,
    daily,
    days: 180,
    image,
    created: Date.now()
  };

  // insert to top of list and persist
  allItems.unshift(item);
  writeDashItems(allItems);

  // clear form
  document.getElementById("newItemTitle").value = "";
  document.getElementById("newItemPrice").value = "";
  document.getElementById("newItemDaily").value = "";
  document.getElementById("newItemImg").value = "";

  // re-render sorted view (keep sort)
  const sortMode = document.getElementById("sortSelect").value;
  sortItems(sortMode);
  // scroll to top of new item
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// small helper to ensure images exist: if /images/... not present it will fallback on render
// Initialize dashboard
function dashboardInit() {
  ensureInitialItems();
  // optionally apply default sort
  sortItems(document.getElementById("sortSelect").value);

  // initial render
  if (loadedCount === 0) renderNextBatch();

  // event listeners
  window.addEventListener('scroll', onScrollHandler);
  document.getElementById("addItemBtn").addEventListener("click", addNewItemFromForm);
  document.getElementById("sortSelect").addEventListener("change", (e) => sortItems(e.target.value));
}

// Run when DOM ready
document.addEventListener("DOMContentLoaded", dashboardInit);
