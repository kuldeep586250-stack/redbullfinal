// script.js - merged and cleaned (Redbull)
// Authentication + users stored in localStorage + plans + dashboard items
// Merged versions: kept all features, removed duplicates, preserved behavior.

const STORAGE = {
  USERS: "lp_users_v1",
  SESSION: "lp_session_v1",
  DASHBOARD: "lp_dashboard_items_v1",
};

// Auto-detect API base
const API_BASE = (function () {
  try {
    const host = location.hostname;
    const port = location.port || "";
    if (
      (host === "127.0.0.1" || host === "localhost") &&
      port &&
      port !== "4000"
    ) {
      return "http://localhost:4000";
    }
  } catch (e) { }
  return "";
})();

/* ========= PLANS CONFIG (6 Daily + 3 VIP) ========= */
/* type startsWith('daily') => Daily income tab
   type startsWith('vip')   => VIP income tab
   type.includes('timer')   => timer based unlock with countdown */
let PLANS_CONFIG = [];

async function fetchUser() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const res = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success && data.user) {
      syncUserToLocal(data.user);
      pageInit();
    }
  } catch (e) {
    console.error("Failed to fetch user", e);
  }
}

async function fetchPlans() {
  try {
    const res = await fetch(`${API_BASE}/api/plans`);
    const data = await res.json();
    if (data.success) {
      PLANS_CONFIG = data.plans.map((p) => ({
        id: p._id,
        name: p.name,
        price: p.price,
        daily: p.daily,
        days: p.days,
        type:
          (p.isVip ? "vip" : "daily") +
          "-" +
          (p.type === "timer" ? "timer" : "basic"),
        image: p.image
          ? p.image.replace("Frontend/", "")
          : "assets/images/sa.jpg",
        timerHours: p.timerHours,
        diamond: p.isVip,
      }));
      populatePlansList();
    }
  } catch (e) {
    console.error("Failed to fetch plans", e);
  }
}

// active tab for home page (Daily / VIP)
let ACTIVE_PLAN_TAB = "daily";

/* ---------- Withdraw requests storage ---------- */
const WITHDRAW_KEY = "lp_withdraw_requests_v1";
function readWithdrawRequests() {
  return JSON.parse(localStorage.getItem(WITHDRAW_KEY) || "[]");
}
function writeWithdrawRequests(list) {
  localStorage.setItem(WITHDRAW_KEY, JSON.stringify(list));
}

/* ---------- Persistent plan timers storage ---------- */
const PLAN_TIMERS_KEY = "lp_plan_timers_v1"; // stores deadlines for plan-specific timers
function readPlanTimers() {
  return JSON.parse(localStorage.getItem(PLAN_TIMERS_KEY) || "{}");
}
function writePlanTimers(obj) {
  localStorage.setItem(PLAN_TIMERS_KEY, JSON.stringify(obj));
}

/* ---------- Basic localStorage helpers ---------- */
function readUsers() {
  return JSON.parse(localStorage.getItem(STORAGE.USERS) || "[]");
}
function writeUsers(u) {
  localStorage.setItem(STORAGE.USERS, JSON.stringify(u));
}

function setSession(phone) {
  localStorage.setItem(STORAGE.SESSION, JSON.stringify({ phone }));
}
function clearSession() {
  localStorage.removeItem(STORAGE.SESSION);
}
function getSession() {
  return JSON.parse(localStorage.getItem(STORAGE.SESSION) || "null");
}

function findUser(phone) {
  return readUsers().find((u) => u.phone === phone);
}

/* ---------- ADMIN SYNC HELPERS ---------- */
function recordPurchaseToAdmin(userId, planId, price) {
  const purchases = JSON.parse(localStorage.getItem("purchases") || "[]");
  purchases.push({
    id: "p-" + Date.now() + "-" + Math.floor(Math.random() * 900 + 100),
    userId: userId,
    planId: planId,
    price: Number(price),
    createdAt: new Date().toISOString(),
    status: "pending",
  });
  localStorage.setItem("purchases", JSON.stringify(purchases));
  try {
    localStorage.setItem("adminNewPurchase", Date.now().toString());
  } catch (e) { }
}

function mirrorWithdrawToAdmin(localReq) {
  const adminWithdrawals = JSON.parse(
    localStorage.getItem("withdrawals") || "[]"
  );
  if (!adminWithdrawals.find((w) => w.id === localReq.id)) {
    adminWithdrawals.unshift({
      id: localReq.id,
      userId: localReq.phone,
      amount: Number(localReq.amount),
      createdAt: new Date(localReq.createdAt).toISOString(),
      status: "requested",
    });
    localStorage.setItem("withdrawals", JSON.stringify(adminWithdrawals));
    try {
      localStorage.setItem("adminNewWithdraw", Date.now().toString());
    } catch (e) { }
  }
}

/* ---------- NETWORK HELPERS (minimal, safe) ---------- */
function syncUserToLocal(backendData) {
  const users = readUsers();
  const phone = backendData.phone;
  if (!phone) return;
  const index = users.findIndex((u) => u.phone === phone);
  const existing = index !== -1 ? users[index] : {};
  const newUser = {
    ...existing,
    phone: phone,
    wallet:
      backendData.wallet !== undefined
        ? backendData.wallet
        : existing.wallet || 0,
    referralCode: backendData.referralCode || existing.referralCode,
    referredBy: backendData.referredBy || existing.referredBy,
    plans: backendData.plans || existing.plans || [],
    pass: existing.pass || "",
    withdrawPass: existing.withdrawPass || "",
  };
  if (index !== -1) users[index] = newUser;
  else users.push(newUser);
  writeUsers(users);
}

async function tryRegisterBackend({ phone, pass, withdraw, invite }) {
  try {
    const body = {
      phone,
      password: pass,
      withdrawPassword: withdraw,
    };
    if (invite) body.inviteCode = invite;

    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

async function tryLoginBackend({ phone, pass }) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password: pass }),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// Backend call for buying plan – uses JWT token if available
async function tryBuyBackend({ planId, price, name, daily, days }) {
  try {
    const token = localStorage.getItem("authToken");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    const res = await fetch(`${API_BASE}/api/purchases/buy`, {
      method: "POST",
      headers,
      body: JSON.stringify({ planId, price, name, daily, days }),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

/* ---------- Razorpay placeholders (unused with UPI flow) ---------- */
async function tryCreateOrder({ planId, price }) {
  try {
    const res = await fetch(`${API_BASE}/api/purchases/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, price }),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

async function tryVerifyPayment(razorpayResponse) {
  try {
    const res = await fetch(`${API_BASE}/api/purchases/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(razorpayResponse),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

/* ---------- USER REGISTER / LOGIN (old fallback, mostly unused now) ---------- */
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "registerBtn") {
    const phoneEl = document.getElementById("regPhone");
    const passEl = document.getElementById("regPass");
    const pass2El = document.getElementById("regPass2");
    const withdrawEl = document.getElementById("regWithdraw");
    const inviteEl = document.getElementById("regInvite");

    const phone = phoneEl ? phoneEl.value.trim() : "";
    const pass = passEl ? passEl.value : "";
    const pass2 = pass2El ? pass2El.value : "";
    const withdraw = withdrawEl ? withdrawEl.value : "";
    const invite = inviteEl ? inviteEl.value.trim() : "";

    if (!phone || !pass) {
      return alert("Enter phone and password");
    }
    if (pass !== pass2) {
      return alert("Passwords do not match");
    }
    if (findUser(phone)) {
      return alert("User already exists");
    }

    (async () => {
      const backend = await tryRegisterBackend({
        phone,
        pass,
        withdraw,
        invite,
      });
      if (backend && backend.ok) {
        if (backend.data && backend.data.user)
          syncUserToLocal(backend.data.user);
        try {
          setSession(phone);
        } catch (e) { }
        alert("Registered via backend. Redirecting to Home.");
        window.location.href = "home.html";
        return;
      } else {
        try {
          const users = readUsers();
          const newUser = {
            phone,
            pass,
            withdrawPass: withdraw,
            wallet: 0,
            plans: [],
            team: [],
            inviteCode: invite,
          };
          users.push(newUser);
          writeUsers(users);
          setSession(phone);
          alert("Registered (local fallback). Redirecting to Home.");
          window.location.href = "home.html";
        } catch (err) {
          console.error("Register fallback failed", err);
          alert("Registration failed.");
        }
      }
    })();
  }

  if (e.target && e.target.id === "loginBtn") {
    const phoneEl = document.getElementById("loginPhone");
    const passEl = document.getElementById("loginPass");
    const phone = phoneEl ? phoneEl.value.trim() : "";
    const pass = passEl ? passEl.value : "";

    if (!phone || !pass) return alert("Enter phone and password");

    (async () => {
      const backend = await tryLoginBackend({ phone, pass });
      if (backend && backend.ok && backend.data && backend.data.success) {
        if (backend.data.user) syncUserToLocal(backend.data.user);
        try {
          setSession(phone);
        } catch (e) { }
        alert("Login successful (backend). Redirecting...");
        window.location.href = "home.html";
        return;
      } else {
        const user = findUser(phone);
        if (!user || user.pass !== pass) return alert("Invalid credentials");
        setSession(phone);
        window.location.href = "home.html";
      }
    })();
  }
});

/* ---------- Header, wallet, profile updates ---------- */
function pageInit() {
  const session = getSession();
  const phone = session ? session.phone : null;
  const user = phone ? findUser(phone) : null;

  document.querySelectorAll("[id^=walletDisplay]").forEach((el) => {
    el.textContent =
      "Wallet: ₹" + (user ? Number((user.wallet || 0).toFixed(2)) : "0");
  });

  const profilePhone = document.getElementById("profilePhone");
  if (profilePhone) {
    if (user) {
      profilePhone.textContent = "Phone: " + user.phone;
      const balEl = document.getElementById("profileBalance");
      if (balEl)
        balEl.textContent =
          "Balance: ₹" + Number((user.wallet || 0).toFixed(2));
    } else {
      profilePhone.textContent = "Not logged in";
      const balEl = document.getElementById("profileBalance");
      if (balEl) balEl.textContent = "";
    }
  }

  const inviteInput = document.getElementById("inviteLink");
  if (inviteInput) {
    const code = user
      ? user.referralCode || user.inviteCode || "f6c05036"
      : "f6c05036";
    try {
      inviteInput.value = location.origin + "/?invite=" + code;
    } catch (e) {
      inviteInput.value = "/?invite=" + code;
    }
  }

  const teamList = document.getElementById("teamList");
  if (teamList) {
    if (!user) teamList.textContent = "Login to see your team.";
    else
      teamList.innerHTML =
        user.team && user.team.length
          ? user.team.map((t) => `<div>${t}</div>`).join("")
          : "You have no referrals.";
  }
}

/* ---------- Local-only purchase helper (fallback) ---------- */
function performLocalPurchase(
  userObj,
  price,
  name = "Redbull Plan",
  daily = 120,
  days = 180
) {
  const users = readUsers();
  const uIndex = users.findIndex((x) => x.phone === userObj.phone);
  if (uIndex === -1) return alert("User not found");

  let u = users[uIndex];
  u.wallet = Number(((u.wallet || 0) - Number(price)).toFixed(2));
  if (u.wallet < 0) u.wallet = 0;

  const now = Date.now();
  u.plans = u.plans || [];
  u.plans.push({
    name,
    price,
    daily,
    days,
    start: now,
    lastCredited: now,
    totalCredited: 0,
  });

  users[uIndex] = u;
  writeUsers(users);

  try {
    recordPurchaseToAdmin(u.phone, name, price);
  } catch (e) { }

  alert(`${name} purchased for ₹${price}.`);
  try {
    pageInit();
  } catch (e) { }
}

/* ---------- Buy plan: calls backend first, fallback to local ---------- */
function buyPlanByPrice(price, name = "Redbull Plan", daily = 120, days = 180) {
  const session = getSession();
  if (!session) return alert("Please login first");

  // If some page defines its own buyPlan (backend aware), use that
  if (window.buyPlan && typeof window.buyPlan === "function") {
    const cfg = PLANS_CONFIG.find(
      (p) => p.name === name || p.price === price || p.id === name
    );
    const planId = cfg ? cfg.id || cfg.name : name;
    window.buyPlan(planId, price, name, daily, days);
    return;
  }

  // Fallback: local + backend attempt
  const users = readUsers();
  const u = users.find((x) => x.phone === session.phone);
  if (!u) return alert("User not found");

  if ((u.wallet || 0) < price)
    return alert("Insufficient balance. Please recharge.");

  (async () => {
    try {
      const cfg = PLANS_CONFIG.find(
        (p) => p.name === name || p.price === price || p.id === name
      );
      const planId = cfg ? cfg.id || cfg.name : "client-purchase";

      const backend = await tryBuyBackend({
        planId,
        price,
        name,
        daily,
        days,
      });
      if (backend && backend.data) {
        if (backend.data.success) {
          const resp = backend.data;
          const updateData = {
            phone: u.phone,
            wallet: resp.wallet !== undefined ? resp.wallet : u.wallet,
            plans: resp.plans || u.plans,
            referralCode: resp.referralCode || u.referralCode,
            referredBy: resp.referredBy || u.referredBy,
          };
          syncUserToLocal(updateData);

          alert(resp.message || "Purchase successful!");
          pageInit();
        } else {
          alert(backend.data.message || "Purchase failed");
        }
      } else {
        alert("Connection failed. Please try again.");
      }
    } catch (e) {
      console.error("Purchase error", e);
      alert("Purchase error");
    }
  })();
}

/* ---------- HOME: populate plans (6 daily + 3 vip) ---------- */
function populatePlansList() {
  const plansList = document.getElementById("plansList");
  if (!plansList) return;
  plansList.innerHTML = "";

  const timers = readPlanTimers();

  // FILTER PLANS BASED ON ACTIVE TAB
  const filteredPlans =
    ACTIVE_PLAN_TAB === "daily"
      ? PLANS_CONFIG.filter((p) => p.type.startsWith("daily"))
      : PLANS_CONFIG.filter((p) => p.type.startsWith("vip"));

  if (!filteredPlans.length) {
    plansList.innerHTML =
      '<p style="text-align:center;color:#666;">No plans available</p>';
    return;
  }

  filteredPlans.forEach((p) => {
    const card = document.createElement("article");
    card.className = "plan-card";
    card.setAttribute("data-plan-id", p.id);

    const header = document.createElement("div");
    header.className = "plan-header";
    header.innerHTML = `<h3 class="plan-heading">${p.name}${p.diamond ? " 💎" : ""
      }</h3>`;
    card.appendChild(header);

    const imgWrap = document.createElement("div");
    imgWrap.className = "plan-image-wrap";
    imgWrap.innerHTML = `<img class="plan-image" src="${p.image}" alt="${p.name}">`;
    card.appendChild(imgWrap);

    const info = document.createElement("div");
    info.className = "plan-info";
    const totalProfit = p.daily * p.days;

    info.innerHTML = `
      <div class="plan-grid">
        <div class="price-box"><div class="price-value">₹${p.price}</div><div class="price-label">Price</div></div>
        <div class="price-box"><div class="price-value">₹${p.daily}</div><div class="price-label">Daily</div></div>
        <div class="price-box"><div class="price-value">${p.days}</div><div class="price-label">Days</div></div>
        <div class="price-box"><div class="price-value">₹${totalProfit}</div><div class="price-label">Total</div></div>
      </div>
    `;
    card.appendChild(info);

    const buyRow = document.createElement("div");
    buyRow.className = "plan-buy-row";

    let deadline = readPlanTimers()[p.id];

    if (p.type.includes("timer")) {
      if (!deadline) {
        deadline = Date.now() + (p.timerHours || 24) * 3600000;
        const t = readPlanTimers();
        t[p.id] = deadline;
        writePlanTimers(t);
      }

      const box = document.createElement("div");
      box.innerHTML = `
        <div style="font-weight:700;color:#0b3d91;">Unlocks in:</div>
        <div class="plan-timer-time" style="font-size:17px;font-weight:700;"></div>
      `;
      buyRow.appendChild(box);

      startCountdown(p.id, deadline, box, () => {
        buyRow.innerHTML = `<button class="plan-buy">Buy now</button>`;
        buyRow.querySelector("button").onclick = () =>
          buyPlanByPrice(p.price, p.name, p.daily, p.days);

        const t = readPlanTimers();
        delete t[p.id];
        writePlanTimers(t);
      });
    } else {
      const btn = document.createElement("button");
      btn.className = "plan-buy";
      btn.textContent = "Buy now";
      btn.onclick = () => buyPlanByPrice(p.price, p.name, p.daily, p.days);
      buyRow.appendChild(btn);
    }

    card.appendChild(buyRow);
    plansList.appendChild(card);
  });
}

/* ---------- Countdown utilities ---------- */
const ACTIVE_COUNTDOWNS = {};
function startCountdown(planId, deadline, containerEl, onFinish) {
  if (ACTIVE_COUNTDOWNS[planId]) clearInterval(ACTIVE_COUNTDOWNS[planId]);

  function tick() {
    const now = Date.now();
    let diff = deadline - now;
    if (diff <= 0) {
      if (ACTIVE_COUNTDOWNS[planId]) clearInterval(ACTIVE_COUNTDOWNS[planId]);
      delete ACTIVE_COUNTDOWNS[planId];
      if (typeof onFinish === "function") onFinish();
      return;
    }
    const hrs = Math.floor(diff / 3600000);
    diff -= hrs * 3600000;
    const mins = Math.floor(diff / 60000);
    diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);

    const hh = String(hrs).padStart(2, "0");
    const mm = String(mins).padStart(2, "0");
    const ss = String(secs).padStart(2, "0");

    const timeEl = containerEl.querySelector(".plan-timer-time");
    if (timeEl) timeEl.textContent = `${hh}:${mm}:${ss}`;
  }

  tick();
  ACTIVE_COUNTDOWNS[planId] = setInterval(tick, 1000);
}

/* ---------- Recharge & Withdraw logic ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const rechargeBtn = document.getElementById("rechargeBtn");
  if (rechargeBtn) {
    rechargeBtn.addEventListener("click", () => {
      const amount = parseFloat(
        document.getElementById("rechargeAmount").value || 0
      );
      if (!amount || amount <= 0) return alert("Enter valid amount");
      const session = getSession();
      if (!session) return alert("Login first");
      const users = readUsers();
      const u = users.find((x) => x.phone === session.phone);
      u.wallet = Number(((u.wallet || 0) + amount).toFixed(2));
      writeUsers(users);
      alert("Recharge successful. ₹" + amount + " added to wallet.");
      pageInit();
    });
  }

  const withdrawBtn = document.getElementById("withdrawBtn");
  if (withdrawBtn) {
    withdrawBtn.addEventListener("click", () => {
      const amount = parseFloat(
        document.getElementById("withdrawAmount").value || 0
      );
      const pass = document.getElementById("withdrawPass").value || "";
      const session = getSession();
      if (!session) return alert("Login first");

      const users = readUsers();
      const u = users.find((x) => x.phone === session.phone);
      if (!u) return alert("User not found");
      if (!pass || pass !== (u.withdrawPass || ""))
        return alert("Invalid withdrawal password");
      if (amount <= 0 || amount > (u.wallet || 0))
        return alert("Invalid amount");

      const reqs = readWithdrawRequests();
      const id =
        "wr-" + Date.now() + "-" + Math.floor(Math.random() * 900 + 100);
      const req = {
        id,
        phone: u.phone,
        amount,
        status: "pending",
        createdAt: Date.now(),
        processedAt: null,
        processedBy: null,
        note: "",
      };
      reqs.unshift(req);
      writeWithdrawRequests(reqs);
      try {
        mirrorWithdrawToAdmin(req);
      } catch (e) { }
      alert(
        "Withdrawal request placed for ₹" +
        amount +
        ". It will be processed by admin."
      );
      const waEl = document.getElementById("withdrawAmount");
      const wpEl = document.getElementById("withdrawPass");
      if (waEl) waEl.value = "";
      if (wpEl) wpEl.value = "";
      pageInit();
    });
  }

  const logout = document.getElementById("logoutBtn");
  if (logout) {
    logout.addEventListener("click", () => {
      clearSession();
      alert("Logged out");
      window.location.href = "index.html";
    });
  }

  const copyInvite = document.getElementById("copyInvite");
  if (copyInvite) {
    copyInvite.addEventListener("click", () => {
      const el = document.getElementById("inviteLink");
      if (!el) return;
      try {
        if (el.select) {
          el.select();
          document.execCommand("copy");
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(el.value);
        }
      } catch (e) { }
      alert("Invite link copied");
    });
  }

  pageInit();
  pageInit();
  fetchPlans();
  fetchUser();

  // Home tabs (Daily / VIP) wiring
  const dailyTab = document.getElementById("dailyTab");
  const vipTab = document.getElementById("vipTab");
  if (dailyTab && vipTab) {
    dailyTab.addEventListener("click", () => {
      ACTIVE_PLAN_TAB = "daily";
      dailyTab.classList.add("active");
      vipTab.classList.remove("active");
      populatePlansList();
    });
    vipTab.addEventListener("click", () => {
      ACTIVE_PLAN_TAB = "vip";
      vipTab.classList.add("active");
      dailyTab.classList.remove("active");
      populatePlansList();
    });
  }

  typeof setupDashboardScroll === "function" && setupDashboardScroll();
  typeof setupAddItem === "function" && setupAddItem();

  const timers = readPlanTimers();
  const cards = document.querySelectorAll(".plan-card[data-plan-id]");
  cards.forEach((card) => {
    const pid = card.getAttribute("data-plan-id");
    if (!pid) return;
    const countdownEl = card.querySelector(".plan-timer");
    if (countdownEl && timers[pid]) {
      startCountdown(pid, timers[pid], countdownEl, () => {
        const action = card.querySelector(".plan-buy-row > div");
        if (action) {
          action.innerHTML = "";
          const cfg = PLANS_CONFIG.find((x) => x.id === pid);
          const buyBtn = document.createElement("button");
          buyBtn.className = "plan-buy";
          buyBtn.textContent = "🛒 Buy now";
          if (cfg)
            buyBtn.addEventListener("click", () =>
              buyPlanByPrice(cfg.price, cfg.name, cfg.daily, cfg.days)
            );
          action.appendChild(buyBtn);
        }
        const t = readPlanTimers();
        delete t[pid];
        writePlanTimers(t);
      });
    }
  });

  autoCreditPlanEarnings();
  syncAdminWithdrawResponses();
  setInterval(syncAdminWithdrawResponses, 15000);
});

/* ---------- Dashboard items ---------- */
const defaultDashboardItems = (() => {
  const arr = [];
  const baseImgs = [
    "assets/images/sa.jpg",
    "assets/images/re.jpg",
    "assets/images/ga.jpg",
    "assets/images/ma.jpg",
  ];
  for (let i = 1; i <= 16; i++) {
    arr.push({
      id: "item-" + i,
      title: "Featured Plan " + i,
      desc: "Quick plan description for plan " + i,
      price: 480 + (i - 1) * 10,
      image: baseImgs[i % baseImgs.length] || "assets/images/sa.jpg",
    });
  }
  return arr;
})();

function readDashboard() {
  return (
    JSON.parse(localStorage.getItem(STORAGE.DASHBOARD) || "null") ||
    defaultDashboardItems
  );
}

function writeDashboard(list) {
  localStorage.setItem(STORAGE.DASHBOARD, JSON.stringify(list));
}

const DASH_PAGE_SIZE = 6;
let dashIndex = 0;

function renderDashItem(item) {
  const el = document.createElement("div");
  el.className = "dash-item";

  const img = document.createElement("img");
  img.className = "dash-thumb";
  img.alt = item.title;
  img.loading = "lazy";
  img.decoding = "async";
  img.src = item.image || "assets/images/sa.jpg";
  img.onerror = function () {
    this.onerror = null;
    this.src = "assets/images/sa.jpg";
  };

  const body = document.createElement("div");
  body.className = "dash-body";
  body.innerHTML = `
    <div class="dash-title">${item.title}</div>
    <div class="dash-desc">${item.desc}</div>
    <div class="dash-meta"><div class="dash-price">₹ ${item.price}</div></div>
  `;

  el.appendChild(img);
  el.appendChild(body);
  return el;
}

function loadMoreDashboardItems() {
  const listEl = document.getElementById("dashboardList");
  const loading = document.getElementById("loadingIndicator");
  const allItems = readDashboard();
  if (!listEl || dashIndex >= allItems.length) return;

  if (loading) loading.hidden = false;
  setTimeout(() => {
    const slice = allItems.slice(dashIndex, dashIndex + DASH_PAGE_SIZE);
    slice.forEach((item) => listEl.appendChild(renderDashItem(item)));
    dashIndex += slice.length;
    if (loading) loading.hidden = true;
  }, 300);
}

function setupDashboardScroll() {
  const listEl = document.getElementById("dashboardList");
  if (!listEl) return;
  listEl.innerHTML = "";
  dashIndex = 0;
  loadMoreDashboardItems();

  listEl.addEventListener("scroll", () => {
    const thresholdPx = 160;
    if (
      listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight <
      thresholdPx
    ) {
      loadMoreDashboardItems();
    }
  });
}

/* Add new item to dashboard */
function setupAddItem() {
  const addBtn = document.getElementById("addItemBtn");
  if (!addBtn) return;
  addBtn.addEventListener("click", () => {
    const title = document.getElementById("newItemTitle").value.trim();
    const price = parseFloat(
      document.getElementById("newItemPrice").value || 0
    );
    const image =
      document.getElementById("newItemImage").value.trim() ||
      "assets/images/sa.jpg";

    if (!title) return alert("Enter title");
    if (!price || price <= 0) return alert("Enter valid price");

    const items = readDashboard();
    const newItem = {
      id: "item-" + Date.now(),
      title,
      desc: "User added item",
      price,
      image,
    };
    items.unshift(newItem);
    writeDashboard(items);

    const listEl = document.getElementById("dashboardList");
    if (listEl) {
      listEl.innerHTML = "";
      dashIndex = 0;
      loadMoreDashboardItems();
      setTimeout(() => {
        listEl.scrollTop = 0;
      }, 80);
    }

    document.getElementById("newItemTitle").value = "";
    document.getElementById("newItemPrice").value = "";
    document.getElementById("newItemImage").value = "";

    alert("Item added to dashboard.");
  });
}

/* ---------- Earnings & withdraw sync ---------- */
function autoCreditPlanEarnings() {
  try {
    const users = readUsers();
    const nowTs = Date.now();
    let changed = false;

    users.forEach((u) => {
      if (!u.plans || !u.plans.length) return;
      u.plans.forEach((plan) => {
        const last = plan.lastCredited || plan.start || nowTs;
        const daysPassed = Math.floor((nowTs - last) / (24 * 3600 * 1000));
        if (daysPassed > 0 && plan.totalCredited < plan.daily * plan.days) {
          const creditAmount =
            plan.daily *
            Math.min(
              daysPassed,
              Math.max(0, plan.days - (plan.totalCredited / plan.daily || 0))
            );
          plan.totalCredited = (plan.totalCredited || 0) + creditAmount;
          plan.lastCredited = nowTs;
          u.wallet = (Number(u.wallet) || 0) + Number(creditAmount);
          changed = true;
        }
      });
    });

    if (changed) {
      writeUsers(users);
      pageInit();
    }
  } catch (e) {
    console.warn("autoCreditPlanEarnings error", e);
  }
}

function syncAdminWithdrawResponses() {
  try {
    const adminWithdraws = JSON.parse(
      localStorage.getItem("withdrawals") || "[]"
    );
    const localReqs = readWithdrawRequests();
    let changed = false;
    adminWithdraws.forEach((a) => {
      const local = localReqs.find(
        (l) => l.id === a.id || (l.phone === a.userId && l.amount === a.amount)
      );
      if (local && local.status !== a.status) {
        local.status =
          a.status === "accepted"
            ? "processed"
            : a.status === "declined"
              ? "declined"
              : local.status;
        local.processedAt = a.processedAt || Date.now();
        changed = true;
      }
    });
    if (changed) writeWithdrawRequests(localReqs);
  } catch (e) {
    // ignore sync errors
  }
}

/* ---------- Export to window ---------- */
window.BUY_FLOW = {
  buyPlanByPrice,
  performLocalPurchase,
  populatePlansList,
  pageInit,
};
