(function () {
  "use strict";

  var DB_NAME = "sea-workbench-db";
  var DB_VER = 1;
  var DB_STORE = "kv";
  var KEY = "state";

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function round2(n) { return Math.round(n * 100) / 100; }
  function money(n) { return "¥" + (n || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function ic(name, size) { return PixIcon(name, size || 18); }
  function sticker(name, size) {
    var s = size || 26;
    return '<img class="stick" src="./icons/stickers/' + name + '.png" alt="" width="' + s + '" height="' + s + '">';
  }
  function todayStr() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function shortDate(s) { return s ? String(s).slice(5) : ""; }

  var CURRENCIES = {
    TH: { code: "THB", name: "泰铢", sym: "฿" },
    VN: { code: "VND", name: "越南盾", sym: "₫" },
    PH: { code: "PHP", name: "菲律宾比索", sym: "₱" }
  };
  var CURRENCY_LIST = [
    { code: "THB", name: "泰铢", sym: "฿", rate: 4.9 },
    { code: "VND", name: "越南盾", sym: "₫", rate: 3500 },
    { code: "PHP", name: "菲律宾比索", sym: "₱", rate: 7.8 },
    { code: "USD", name: "美元", sym: "$", rate: 7.2 },
    { code: "JPY", name: "日元", sym: "¥", rate: 21.5 },
    { code: "EUR", name: "欧元", sym: "€", rate: 0.13 },
    { code: "KRW", name: "韩元", sym: "₩", rate: 190 },
    { code: "MYR", name: "马来西亚林吉特", sym: "RM", rate: 0.62 },
    { code: "SGD", name: "新加坡元", sym: "S$", rate: 0.19 },
    { code: "TWD", name: "新台币", sym: "NT$", rate: 4.3 }
  ];
  function curDef(code) {
    return CURRENCY_LIST.find(function (c) { return c.code === code; }) || CURRENCY_LIST[0];
  }
  var LEDGER_CATS = {
    expense: ["餐饮", "交通", "购物", "居住", "娱乐", "医疗", "教育", "通讯", "其他"],
    income: ["工资", "兼职", "投资理财", "二手出售", "报销", "红包", "奖金", "其他"]
  };
  var COUNTRIES = { TH: "泰国", VN: "越南", PH: "菲律宾" };
  var LS_STATUS = ["待下单", "海外发货", "转运仓入库", "国际运输", "清关中", "国内派送", "已签收"];
  var STOCK_STATUS = { waiting: "待到货", instock: "库存现货", sold: "已售出" };
  var CARRIERS = ["Flash Express", "J&T Express", "Giao Hàng Nhanh (GHN)", "LBC Express", "Ninja Van", "Kerry Express", "Viettel Post", "其他"];
  var CARRIER_URL = {
    "Flash Express": "https://www.flashexpress.co.th/",
    "J&T Express": "https://www.jtexpress.com/",
    "Giao Hàng Nhanh (GHN)": "https://giaohangnhanh.vn/",
    "LBC Express": "https://www.lbcexpress.com/",
    "Ninja Van": "https://www.ninjavan.co/",
    "Kerry Express": "https://th.kerryexpress.com/",
    "Viettel Post": "https://viettelpost.com.vn/"
  };
  var THEMES = [
    { id: "farm", name: "清新原野", colors: ["#f8fbff", "#a8c9e0", "#7fa9c9"] },
    { id: "night", name: "柔蓝夜雾", colors: ["#eef2f8", "#93a9c4", "#5c7394"] },
    { id: "beach", name: "蜜桃浅滩", colors: ["#fff6f2", "#f7b9b9", "#e88f9d"] },
    { id: "vintage", name: "奶油复古", colors: ["#fdf8ec", "#e6c79a", "#c9a27a"] },
    { id: "dark", name: "黑夜", colors: ["#12151d", "#2a3447", "#8fb2d0"] },
    { id: "eyecare", name: "护眼", colors: ["#d5e3d2", "#6f9d6e", "#c8ddb8"] }
  ];

  var STOCK_CLS = { waiting: "gray", instock: "green", sold: "gold" };
  var LS_CLS = {
    "待下单": "gray", "海外发货": "sky", "转运仓入库": "tan",
    "国际运输": "blue", "清关中": "yellow", "国内派送": "green", "已签收": "green"
  };

  var state = load();
  var ui = { view: "home", q: "", country: "", ls: "", stock: "", selected: null, rightTab: "detail", ledgerMonth: "" };

  function defaultState() {
    return { v: 1, theme: "farm", purchases: [], sales: [], tracks: [], ledger: [], meta: { created: Date.now() } };
  }

  function idbOpen() {
    return new Promise(function (res, rej) {
      var rq = indexedDB.open(DB_NAME, DB_VER);
      rq.onupgradeneeded = function () { rq.result.createObjectStore(DB_STORE); };
      rq.onsuccess = function () { res(rq.result); };
      rq.onerror = function () { rej(rq.error); };
    });
  }
  function idbGet(k) {
    return idbOpen().then(function (db) {
      return new Promise(function (res, rej) {
        var rq = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(k);
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = function () { rej(rq.error); };
      });
    });
  }
  function idbSet(k, v) {
    return idbOpen().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).put(v, k);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }
  function idbDel(k) {
    return idbOpen().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).delete(k);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }

  function load() {
    var s = null;
    try {
      var ls = localStorage.getItem(KEY);
      if (ls) s = JSON.parse(ls);
    } catch (e) { s = null; }
    if (s && s.v === 1) {
      s.purchases = s.purchases || [];
      s.sales = s.sales || [];
      s.tracks = s.tracks || [];
      s.ledger = s.ledger || [];
      s.theme = s.theme || "farm";
      return s;
    }
    idbGet(KEY).then(function (d) {
      if (d && d.v === 1) {
        state = d;
        state.purchases = state.purchases || [];
        state.sales = state.sales || [];
        state.tracks = state.tracks || [];
        state.ledger = state.ledger || [];
        state.theme = state.theme || "farm";
        applyTheme(state.theme);
        renderAll();
      }
    }).catch(function () {});
    return defaultState();
  }

  function save() {
    var data = JSON.parse(JSON.stringify(state));
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    idbSet(KEY, data).catch(function () {});
  }

  function totalCost(p) {
    if (!p) return 0;
    var c = p.cost || {};
    return round2((c.priceCNY || 0) + (c.lF || 0) + (c.iF || 0) + (c.sF || 0));
  }
  function trackOf(p) {
    if (!p || !p.trackId) return null;
    return state.tracks.find(function (t) { return t.id === p.trackId; }) || null;
  }
  function pStatus(p) {
    var t = trackOf(p);
    return t ? t.status : (p.lsStatus || "");
  }
  function purchaseOf(s) {
    return s && s.purchaseId ? state.purchases.find(function (p) { return p.id === s.purchaseId; }) || null : null;
  }
  function saleOf(p) {
    return p && p.saleId ? state.sales.find(function (s) { return s.id === p.saleId; }) || null : null;
  }
  function saleProfit(s) {
    if (!s) return 0;
    var p = purchaseOf(s);
    var cost = p ? totalCost(p) : 0;
    return round2((s.price || 0) - cost - (s.shipFee || 0) - (s.platformFee || 0));
  }
  function stockCount(c) {
    return state.purchases.filter(function (p) { return p.stockStatus === c; }).length;
  }
  function sumPurchases() {
    return round2(state.purchases.reduce(function (a, p) { return a + totalCost(p); }, 0));
  }
  function sumSales() {
    return round2(state.sales.reduce(function (a, s) { return a + (s.price || 0); }, 0));
  }
  function sumProfit() {
    return round2(state.sales.reduce(function (a, s) { return a + saleProfit(s); }, 0));
  }
  function inTransitCount() {
    return state.tracks.filter(function (t) { return t.status !== "已签收"; }).length;
  }
  var BACK_CN = ["清关中", "国内派送", "已签收"];
  function isBackCn(t) { return BACK_CN.indexOf(t.status) >= 0; }

  function optsArr(arr, sel) {
    return arr.map(function (o) { return '<option value="' + esc(o) + '"' + (o === sel ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("");
  }
  function optsMap(map, sel) {
    return Object.keys(map).map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(map[k]) + "</option>"; }).join("");
  }
  function optsCountries(sel) {
    return Object.keys(COUNTRIES).map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(COUNTRIES[k]) + "</option>"; }).join("");
  }

  function statusTagHtml(st) {
    var cls = LS_CLS[st] || "gray";
    return '<span class="tag ' + cls + '">' + esc(st) + "</span>";
  }
  function stockTagHtml(s) {
    return '<span class="tag ' + (STOCK_CLS[s] || "gray") + '">' + esc(STOCK_STATUS[s] || "待到货") + "</span>";
  }

  function mediaHtml(img, emptyHint) {
    if (img) {
      return '<div class="card-media" data-img="' + img + '"><img src="' + img + '" alt="" loading="lazy"><span class="media-badge">点图放大</span></div>';
    }
    return '<div class="card-media" data-empty="1"><div class="ph">' + ic("box", 44) + "<span>" + esc(emptyHint || "暂无图片 · 点击卡片编辑上传") + "</span></div></div>";
  }

  function purchaseCard(p) {
    var t = trackOf(p);
    var st = pStatus(p);
    return '<article class="card' + (isSel("purchase", p.id) ? " selected" : "") + '" data-type="purchase" data-id="' + p.id + '">' +
      mediaHtml(p.image, "暂无图片 · 点击上传商品截图") +
      '<div class="media-tag">' + stockTagHtml(p.stockStatus) + "</div>" +
      '<div class="card-body">' +
      '<div class="card-title-row"><h3 class="item-name" title="点击编辑可改名">' + esc(p.brand || "") + (p.brand ? " · " : "") + esc(p.name) + "</h3>" +
      '<div class="card-actions">' +
      '<button class="icon-btn" data-act="edit" title="编辑">' + ic("pencil", 16) + "</button>" +
      '<button class="icon-btn" data-act="sell" title="登记售卖">' + ic("coin", 16) + "</button>" +
      '<button class="icon-btn" data-act="del" title="删除">' + ic("trash", 16) + "</button>" +
      "</div></div>" +
      '<div class="kv"><span class="k">购买日期</span><span class="v">' + esc(p.date || "—") + "</span></div>" +
      '<div class="kv"><span class="k">购入国家</span><span class="v"><span class="tag country ' + esc(p.country || "") + '">' + esc(COUNTRIES[p.country] || "—") + "</span></span></div>" +
      '<div class="kv"><span class="k">卖家</span><span class="v">' + esc(p.seller || "—") + "</span></div>" +
      '<div class="block"><div class="block-h"><span class="dot"></span>成本核算</div>' +
      '<div class="kv"><span class="k">外币原价</span><span class="v">' + (CURRENCIES[p.country] ? CURRENCIES[p.country].sym : "") + " " + money((p.cost && p.cost.price) || 0) + ' <em style="font-size:11px;color:var(--text2)">' + esc((p.cost && p.cost.currency) || "") + "</em></span></div>" +
      '<div class="kv"><span class="k">代付汇率</span><span class="v">' + ((p.cost && p.cost.fx) != null ? p.cost.fx : "—") + "</span></div>" +
      '<div class="kv total"><span class="k">采购总成本</span><span class="v">' + money(totalCost(p)) + "</span></div>" +
      "</div>" +
      '<div class="block"><div class="block-h"><span class="dot"></span>物流</div>' +
      '<div class="kv"><span class="k">服务商</span><span class="v">' + esc(t ? t.carrier : (p.carrier || "—")) + "</span></div>" +
      '<div class="kv"><span class="k">单号</span><span class="v mono">' + esc(t ? t.trackingNo : (p.trackingNo || "—")) + "</span></div>" +
      '<div class="kv"><span class="k">状态</span><span class="v">' + (st ? statusTagHtml(st) : '<span class="tag gray">未登记</span>') + "</span></div>" +
      (t && t.history && t.history.length ? '<div class="mini-track">' + t.history.slice(-2).map(function (h) {
        return '<div class="mt"><span class="mt-d">' + esc(shortDate(h.date)) + "</span><span>" + esc(h.note) + "</span></div>";
      }).join("") + "</div>" : "") +
      "</div>" +
      (p.remark ? '<div class="remark">' + esc(p.remark) + "</div>" : "") +
      "</div></article>";
  }

  function saleCard(s) {
    var p = purchaseOf(s);
    var profit = saleProfit(s);
    var cost = p ? totalCost(p) : 0;
    return '<article class="card' + (isSel("sale", s.id) ? " selected" : "") + '" data-type="sale" data-id="' + s.id + '">' +
      mediaHtml(s.image, "暂无图片") +
      '<div class="media-tag">' + '<span class="tag gold">已售出</span>' + "</div>" +
      '<div class="card-body">' +
      '<div class="card-title-row"><h3 class="item-name">' + esc(s.brand || "") + (s.brand ? " · " : "") + esc(s.name) + "</h3>" +
      '<div class="card-actions">' +
      '<button class="icon-btn" data-act="edit" title="编辑">' + ic("pencil", 16) + "</button>" +
      '<button class="icon-btn" data-act="del" title="删除">' + ic("trash", 16) + "</button>" +
      "</div></div>" +
      '<div class="block"><div class="block-h"><span class="dot"></span>收支明细</div>' +
      '<div class="kv"><span class="k">售出价格</span><span class="v">' + money(s.price) + "</span></div>" +
      '<div class="kv sub"><span class="k">寄出运费</span><span class="v">-' + money(s.shipFee) + "</span></div>" +
      '<div class="kv sub"><span class="k">平台手续费</span><span class="v">-' + money(s.platformFee) + "</span></div>" +
      '<div class="kv sub"><span class="k">采购总成本</span><span class="v">-' + money(cost) + (p ? "" : '<em style="font-size:11px;color:var(--warn)">(未关联)</em>') + "</span></div>" +
      "</div>" +
      '<div class="profit-row"><span class="pl">单品纯利润</span><span class="profit ' + (profit >= 0 ? "pos" : "neg") + '">' + money(profit) + "</span></div>" +
      '<div class="kv" style="margin-top:7px"><span class="k">关联采购</span><span class="v">' + (p ? esc(p.brand || "") + " · " + esc(p.name) : '<span class="tag red">未关联</span>') + "</span></div>" +
      "</div></article>";
  }

  function isSel(type, id) {
    return ui.selected && ui.selected.type === type && ui.selected.id === id;
  }

  function filteredPurchases() {
    var q = ui.q.toLowerCase();
    return state.purchases.filter(function (p) {
      if (ui.country && p.country !== ui.country) return false;
      if (ui.ls && pStatus(p) !== ui.ls) return false;
      if (ui.stock && p.stockStatus !== ui.stock) return false;
      if (q) {
        var hay = [p.name, p.brand, p.seller, p.carrier, p.trackingNo, p.remark, pStatus(p)].join(" ").toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }
  function filteredSales() {
    var q = ui.q.toLowerCase();
    return state.sales.filter(function (s) {
      var p = purchaseOf(s);
      if (q) {
        var hay = [s.name, s.brand, s.buyer, s.shipNo, s.remark, p ? p.name : "", p ? p.brand : ""].join(" ").toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }
  function filteredTracks() {
    var q = ui.q.toLowerCase();
    return state.tracks.slice().sort(function (a, b) { return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0); }).filter(function (t) {
      if (ui.country && t.country !== ui.country) return false;
      if (ui.ls && t.status !== ui.ls) return false;
      if (q) {
        var p = t.purchaseId ? state.purchases.find(function (x) { return x.id === t.purchaseId; }) : null;
        var hay = [t.carrier, t.trackingNo, t.status, p ? p.name : "", p ? p.brand : ""].join(" ").toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function ledgerMonth() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }
  function ledgerEntries() {
    var q = ui.q.toLowerCase();
    var m = ui.ledgerMonth || ledgerMonth();
    return state.ledger.filter(function (e) {
      var em = String(e.date || "").slice(0, 7);
      if (m && em !== m) return false;
      if (q) {
        var hay = [e.category, e.remark, e.amount].join(" ").toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
  }
  function ledgerSums(list) {
    var inc = 0, exp = 0;
    list.forEach(function (e) { if (e.type === "income") inc += num(e.amount); else exp += num(e.amount); });
    return { income: round2(inc), expense: round2(exp), balance: round2(inc - exp) };
  }
  var CHART_COLORS = ["#f2b84b", "#f2a3b3", "#9ed6b4", "#7fb3c9", "#e2c3a0", "#b7a6dd"];
  var BAR_GRAD = 0;
  function chartMoney(v) { return "¥" + Math.round(v).toLocaleString("zh-CN"); }
  function donutHtml(income, expense, centerK, centerVal, incLabel, expLabel, emptyTxt) {
    var total = income + expense;
    if (total <= 0) return '<div class="chart-empty">' + (emptyTxt || "本月暂无收支数据") + "</div>";
    var R = 38, SW = 17, C = 50;
    var circ = 2 * Math.PI * R;
    var pInc = income / total, pExp = expense / total;
    var seg = function (len, off, color) {
      return '<circle cx="50" cy="50" r="' + R + '" fill="none" stroke="' + color + '" stroke-width="' + SW + '" stroke-dasharray="' + len.toFixed(2) + ' ' + circ.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '" transform="rotate(-90 50 50)"/>';
    };
    return '<svg class="chart-svg" viewBox="0 0 100 120" width="100%" height="auto" aria-hidden="true">' +
      '<g filter="drop-shadow(0 4px 6px rgba(90,120,160,.22))">' +
      '<circle cx="50" cy="53.5" r="' + R + '" fill="none" stroke="rgba(90,120,160,.16)" stroke-width="' + SW + '"/>' +
      seg(circ * pExp, 0, "var(--pink)") +
      seg(circ * pInc, -circ * pExp, "var(--accent)") +
      '<circle cx="50" cy="50" r="' + R + '" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + (circ * 0.16).toFixed(2) + ' ' + circ.toFixed(2) + '" stroke-dashoffset="' + (circ * 0.05).toFixed(2) + '" transform="rotate(-90 50 50)"/>' +
      "</g>" +
      '<text x="50" y="45" text-anchor="middle" class="chart-center-k">' + centerK + "</text>" +
      '<text x="50" y="63" text-anchor="middle" class="chart-center-v">' + chartMoney(centerVal) + "</text>" +
      "</svg>" +
      '<div class="chart-legend">' +
      '<div class="lg-item"><i style="background:var(--accent)"></i><span>' + incLabel + "</span><b>" + money(income) + "</b><em>" + Math.round(pInc * 100) + "%</em></div>" +
      '<div class="lg-item"><i style="background:var(--pink)"></i><span>' + expLabel + "</span><b>" + money(expense) + "</b><em>" + Math.round(pExp * 100) + "%</em></div>" +
      "</div>";
  }
  function donutChartHtml(income, expense) {
    return donutHtml(income, expense, "本月结余", income - expense, "收入", "支出");
  }
  function dailyLineSeries() {
    var map = {};
    ledgerEntries().forEach(function (e) {
      var d = String(e.date || "");
      var k = d.length >= 10 ? d.slice(8, 10) : "00";
      if (!map[k]) map[k] = { inc: 0, exp: 0 };
      var a = num(e.amount);
      if (e.type === "income") map[k].inc += a; else map[k].exp += a;
    });
    var now = new Date();
    var m = ui.ledgerMonth || ledgerMonth();
    var yp = m.split("-"), y = +yp[0], mo = +yp[1];
    var dim = new Date(y, mo, 0).getDate();
    var endDay = (y === now.getFullYear() && mo === now.getMonth() + 1) ? now.getDate() : dim;
    var pts = [];
    for (var d = 1; d <= endDay; d++) {
      var rec = map[String(d).padStart(2, "0")] || { inc: 0, exp: 0 };
      pts.push({ d: d + "日", inc: rec.inc, exp: rec.exp });
    }
    return pts;
  }
  function seaLineSeries() {
    var arr = [], idx = {}, today = new Date();
    for (var i = 29; i >= 0; i--) {
      var dt = new Date(today.getTime() - i * 86400000);
      var iso = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
      idx[iso] = arr.length;
      arr.push({ d: (dt.getMonth() + 1) + "/" + dt.getDate(), inc: 0, exp: 0 });
    }
    state.purchases.forEach(function (p) {
      var iso = String(p.date || "").slice(0, 10);
      if (idx[iso] == null) return;
      arr[idx[iso]].exp += totalCost(p);
    });
    state.sales.forEach(function (s) {
      var iso = String(s.date || "").slice(0, 10);
      if (idx[iso] == null) return;
      arr[idx[iso]].inc += num(s.price || 0);
    });
    return arr;
  }
  function lineHtml(pts, incLabel, expLabel, emptyTxt) {
    var max = 0;
    pts.forEach(function (p) { max = Math.max(max, p.inc, p.exp); });
    if (max <= 0) return '<div class="chart-empty">' + (emptyTxt || "本月暂无收支数据") + "</div>";
    var W = 320, H = 140, pl = 8, pr = 8, pt = 10, pb = 18;
    var iw = W - pl - pr, ih = H - pt - pb;
    var maxV = Math.max(1, Math.ceil(max / 100) * 100);
    var x = function (i) { return pl + (pts.length === 1 ? iw / 2 : i / (pts.length - 1) * iw); };
    var y = function (v) { return pt + ih - v / maxV * ih; };
    var ptsOf = function (key) { return pts.map(function (p, i) { return x(i) + "," + y(p[key]).toFixed(1); }).join(" "); };
    var incP = ptsOf("inc"), expP = ptsOf("exp");
    var grid = [0, 0.5, 1].map(function (g) {
      var yy = y(maxV * g);
      return '<line x1="' + pl + '" y1="' + yy + '" x2="' + (W - pr) + '" y2="' + yy + '" class="chart-gridline"/><text x="' + (W - pr - 3) + '" y="' + (yy + 3) + '" text-anchor="end" class="chart-ytick">' + chartMoney(maxV * g) + "</text>";
    }).join("");
    var idxs = [0, Math.floor((pts.length - 1) / 2), pts.length - 1];
    var ticks = idxs.map(function (i) { return '<text x="' + x(i).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle" class="chart-xtick">' + pts[i].d + "</text>"; }).join("");
    var nodes = function (str, color) {
      return str.split(" ").map(function (c) {
        var xy = c.split(",");
        return '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="3" fill="' + color + '" class="chart-node"/><circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="1.2" fill="#ffffff"/>';
      }).join("");
    };
    return '<svg class="chart-svg" viewBox="0 0 ' + W + " " + H + '" width="100%" height="auto" aria-hidden="true">' +
      grid +
      '<g filter="drop-shadow(0 3px 4px rgba(90,120,160,.25))">' +
      '<polyline points="' + expP + '" fill="none" stroke="rgba(150,100,120,.3)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,2)"/>' +
      '<polyline points="' + expP + '" fill="none" stroke="var(--pink)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<polyline points="' + incP + '" fill="none" stroke="rgba(90,140,190,.3)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,2)"/>' +
      '<polyline points="' + incP + '" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      nodes(expP, "var(--pink)") + nodes(incP, "var(--accent)") +
      "</g>" +
      ticks +
      "</svg>" +
      '<div class="chart-legend">' +
      '<div class="lg-item"><i style="background:var(--accent)"></i><span>' + incLabel + "</span></div>" +
      '<div class="lg-item"><i style="background:var(--pink)"></i><span>' + expLabel + "</span></div>" +
      "</div>";
  }
  function lineChartHtml() {
    return lineHtml(dailyLineSeries(), "每日收入", "每日支出");
  }
  function barHtml(items, legendText, emptyTxt) {
    items = items.slice().sort(function (a, b) { return b.value - a.value; }).slice(0, 5);
    if (!items.length) return '<div class="chart-empty">' + (emptyTxt || "暂无分类数据") + "</div>";
    var maxV = Math.max.apply(null, items.map(function (it) { return it.value; }));
    maxV = Math.max(1, Math.ceil(maxV / 100) * 100);
    var W = 320, H = 150, pl = 8, pr = 8, pt = 20, pb = 26;
    var iw = W - pl - pr, ih = H - pt - pb;
    var step = iw / items.length, bw = Math.min(34, step * 0.56);
    var gid = "bg" + (++BAR_GRAD);
    var bars = items.map(function (it, i) {
      var h = Math.max(4, it.value / maxV * ih);
      var xc = pl + step * i + (step - bw) / 2;
      var yc = pt + ih - h;
      var col = CHART_COLORS[i % CHART_COLORS.length];
      return '<g>' +
        '<rect x="' + (xc + 2) + '" y="' + (yc + 3) + '" width="' + bw + '" height="' + h + '" rx="7" fill="' + col + '" opacity=".28"/>' +
        '<rect x="' + xc + '" y="' + yc + '" width="' + bw + '" height="' + h + '" rx="7" fill="' + col + '" filter="drop-shadow(0 4px 5px rgba(90,120,160,.18))"/>' +
        '<rect x="' + xc + '" y="' + yc + '" width="' + bw + '" height="' + h + '" rx="7" fill="url(#' + gid + ')"/>' +
        '<rect x="' + (xc + 2.5) + '" y="' + (yc + 2.5) + '" width="' + (bw - 5) + '" height="' + Math.max(3, h - 3) + '" rx="6" fill="rgba(255,255,255,.32)"/>' +
        '<text x="' + (xc + bw / 2) + '" y="' + (yc - 5) + '" text-anchor="middle" class="chart-vtick">' + chartMoney(it.value) + "</text>" +
        '<text x="' + (xc + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle" class="chart-xtick">' + esc(it.name) + "</text>" +
        "</g>";
    }).join("");
    return '<svg class="chart-svg" viewBox="0 0 ' + W + " " + H + '" width="100%" height="auto" aria-hidden="true">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#ffffff" stop-opacity=".5"/>' +
      '<stop offset=".45" stop-color="#ffffff" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000000" stop-opacity=".12"/>' +
      "</linearGradient></defs>" +
      bars +
      "</svg>" +
      '<div class="chart-legend">' +
      '<div class="lg-item"><span>' + legendText + "</span></div>" +
      "</div>";
  }
  function barChartHtml() {
    var cat = {};
    ledgerEntries().forEach(function (e) {
      if (e.type === "expense") { var c = e.category || "其他"; cat[c] = (cat[c] || 0) + num(e.amount); }
    });
    var items = Object.keys(cat).map(function (k) { return { name: k, value: cat[k] }; });
    return barHtml(items, "支出分类（柱顶为金额）", "本月暂无支出分类数据");
  }
  function seaDonutChartHtml() {
    return donutHtml(sumSales(), sumPurchases(), "总净利润", sumProfit(), "销售收入", "采购投入", "暂无海淘收支数据");
  }
  function seaLineChartHtml() {
    return lineHtml(seaLineSeries(), "每日销售收入", "每日采购投入", "近30天暂无海淘收支数据");
  }
  function seaBarChartHtml() {
    var cat = {};
    state.purchases.forEach(function (p) {
      var c = COUNTRIES[p.country] || p.country || "其他";
      cat[c] = (cat[c] || 0) + totalCost(p);
    });
    var items = Object.keys(cat).map(function (k) { return { name: k, value: cat[k] }; });
    return barHtml(items, "采购投入按国家（柱顶为金额）", "暂无海淘采购数据");
  }
  function ledgerChartsHtml() {
    var st = ledgerSums(ledgerEntries());
    return '<div class="chart-grid2">' +
      '<div class="panel chart-panel"><h3>' + ic("chart", 16) + "收支占比</h3>" + donutChartHtml(st.income, st.expense) + "</div>" +
      '<div class="panel chart-panel"><h3>' + ic("chart", 16) + "每日趋势</h3>" + lineChartHtml() + "</div>" +
      '</div><div class="panel chart-panel"><h3>' + ic("chart", 16) + "支出分类排行</h3>" + barChartHtml() + "</div>";
  }
  function seaTradeChartsHtml() {
    return '<div class="chart-grid2">' +
      '<div class="panel chart-panel"><h3>' + ic("backpack", 16) + "海淘收支占比</h3>" + seaDonutChartHtml() + "</div>" +
      '<div class="panel chart-panel"><h3>' + ic("chart", 16) + "海淘收支趋势</h3>" + seaLineChartHtml() + "</div>" +
      '</div><div class="panel chart-panel"><h3>' + ic("chart", 16) + "采购投入国家排行</h3>" + seaBarChartHtml() + "</div>";
  }
  function renderLedger() {
    var list = ledgerEntries();
    var sums = ledgerSums(list);
    var cat = {};
    list.forEach(function (e) {
      if (e.type === "expense") cat[e.category || "其他"] = (cat[e.category || "其他"] || 0) + num(e.amount);
    });
    var topCats = Object.keys(cat).sort(function (a, b) { return cat[b] - cat[a]; }).slice(0, 4);
    var summary =
      '<div class="ledger-sum">' +
      '<div class="ls-card inc"><span class="ls-k">本月收入</span><span class="ls-v">' + money(sums.income) + "</span></div>" +
      '<div class="ls-card exp"><span class="ls-k">本月支出</span><span class="ls-v">' + money(sums.expense) + "</span></div>" +
      '<div class="ls-card bal"><span class="ls-k">本月结余</span><span class="ls-v ' + (sums.balance >= 0 ? "pos" : "neg") + '">' + money(sums.balance) + "</span></div>" +
      "</div>";
    var topHtml = topCats.length ? '<div class="ledger-top"><span class="lt-k">支出分类 TOP</span>' + topCats.map(function (c) {
      return '<span class="lt-item"><b>' + esc(c) + '</b><i>' + money(cat[c]) + "</i></span>";
    }).join("") + "</div>" : "";
    var rows = list.length ? list.map(ledgerRowHtml).join("") : "";
    return summary + topHtml + ledgerChartsHtml() +
      (list.length ? '<div class="ledger-list">' + rows + "</div>" : '<div class="empty-state">' + ic("book", 56) + "<div>本月还没有账目<br>点下方工具栏「记一笔收入 / 支出」开始记录<br><em style=\"font-size:11px\">日常账本与海淘采购成本相互独立，互不混淆</em></div></div>");
  }
  function ledgerRowHtml(e) {
    var inc = e.type === "income";
    return '<div class="ledger-row" data-lrow="' + e.id + '">' +
      (e.image ? '<img class="lr-img" src="' + e.image + '" alt="" data-act="lightbox" data-img="' + e.image + '">' : '<span class="lr-img ph">' + ic("box", 22) + "</span>") +
      '<span class="lr-tag ' + (inc ? "inc" : "exp") + '">' + (inc ? "收" : "支") + "</span>" +
      '<span class="lr-txt"><b>' + esc(e.category || (inc ? "收入" : "支出")) + '</b><i>' + esc(e.remark || "—") + '<em>' + esc(e.date || "") + "</em></i></span>" +
      '<span class="lr-amt ' + (inc ? "inc" : "exp") + '">' + (inc ? "+" : "-") + money(e.amount) + "</span>" +
      '<span class="lr-ops">' +
      '<button class="icon-btn" data-lact="ledit" data-id="' + e.id + '" title="编辑">' + ic("pencil", 15) + "</button>" +
      '<button class="icon-btn" data-lact="ldel" data-id="' + e.id + '" title="删除">' + ic("trash", 15) + "</button>" +
      "</span></div>";
  }
  function ledgerForm(rec) {
    rec = rec || {};
    var type = rec.type || "expense";
    var cats = LEDGER_CATS[type] || LEDGER_CATS.expense;
    var opts = cats.map(function (c) { return '<option value="' + esc(c) + '"' + (rec.category === c ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("");
    return '<form id="frmLedger" class="frm">' +
      '<input type="hidden" id="lid" value="' + (rec.id || "") + '">' +
      '<div class="f-grid">' +
      '<label>收支类型<select id="ltype"><option value="expense"' + (type === "expense" ? " selected" : "") + '>日常支出</option><option value="income"' + (type === "income" ? " selected" : "") + '>日常收入</option></select></label>' +
      '<label>消费分类<select id="lcat">' + opts + "</select></label>" +
      "</div>" +
      '<div class="f-grid">' +
      '<label>金额（人民币）<input type="number" step="0.01" min="0" id="lamt" required value="' + (rec.amount || "") + '" placeholder="0.00"></label>' +
      '<label>日期<input type="date" id="ldate" value="' + esc(rec.date || todayStr()) + '"></label>' +
      "</div>" +
      "<label>备注<textarea id=\"lremark\" rows=\"2\" placeholder=\"这笔钱花到哪 / 收入来源\">" + esc(rec.remark || "") + "</textarea></label>" +
      imageFieldHtml("limg", rec.image, "凭证截图") +
      '<div class="frm-actions"><button type="submit" class="btn primary">保存账目</button><button type="button" class="btn" data-close>取消</button></div>' +
      "</form>";
  }
  function openLedger(rec) {
    openModal(rec && rec.id ? "编辑账目" : (rec && rec.type === "income" ? "记一笔收入" : "记一笔支出"), ledgerForm(rec || {}), function () {
      var d = readLedgerForm();
      if (num(d.amount) <= 0) { toast("请填写金额"); return; }
      if (d.id) {
        var idx = state.ledger.findIndex(function (x) { return x.id === d.id; });
        if (idx >= 0) { d.createdAt = state.ledger[idx].createdAt; state.ledger[idx] = d; }
      } else {
        d.id = uid();
        d.createdAt = Date.now();
        state.ledger.unshift(d);
      }
      save();
      closeModal();
      renderAll();
      renderSheet();
      toast("账目已保存");
    });
  }
  function readLedgerForm() {
    var t = $("#ltype").value;
    var cat = $("#lcat").value;
    var opts = LEDGER_CATS[t] || LEDGER_CATS.expense;
    if (opts.indexOf(cat) < 0) cat = opts[0];
    return {
      id: $("#lid").value,
      type: t,
      category: cat,
      amount: num($("#lamt").value),
      date: $("#ldate").value,
      remark: $("#lremark").value.trim(),
      image: $("#limg-data").value
    };
  }
  function delLedger(id) {
    if (!confirm("删除这笔账目？")) return;
    var idx = state.ledger.findIndex(function (x) { return x.id === id; });
    if (idx >= 0) state.ledger.splice(idx, 1);
    save();
    renderAll();
    renderSheet();
    toast("账目已删除");
  }

  function statHtml(s) {
    return '<div class="stat"><span class="ico">' + ic(s.i, 26) + "</span><div><span class=\"v\">" + s.v + '</span><span class="k">' + s.k + "</span></div></div>";
  }
  function seaTradeSections() {
    var haul = [
      { i: "backpack", v: money(sumPurchases()), k: "总采购投入" },
      { i: "coin", v: money(sumSales()), k: "总销售收入" },
      { i: "star", v: money(sumProfit()), k: "总净利润" },
      { i: "box", v: stockCount("instock"), k: "库存现货" }
    ];
    return '<div class="sec"><div class="sec-h">' + sticker("sec-haul", 26) + "<span>海淘进销利润</span></div>" +
      '<div class="stat-grid">' + haul.map(statHtml).join("") + "</div></div>";
  }
  function dailySections() {
    var st = ledgerSums(ledgerEntries());
    var daily = [
      { i: "coin", v: money(st.income), k: "本月收入" },
      { i: "heart", v: money(st.expense), k: "本月支出" },
      { i: "star", v: money(st.balance), k: "本月结余" },
      { i: "book", v: ledgerEntries().length, k: "本月笔数" }
    ];
    return '<div class="sec"><div class="sec-h">' + sticker("sec-daily", 26) + "<span>日常生活收支</span></div>" +
      '<div class="stat-grid">' + daily.map(statHtml).join("") + "</div></div>";
  }
  function renderStats() {
    var el = $("#statsBar");
    if (ui.view !== "home") { el.innerHTML = ""; return; }
    el.innerHTML = seaTradeSections();
  }
  function renderStatsView() {
    $("#rightContent").innerHTML = dailySections() +
      '<div class="sec"><div class="sec-h">' + sticker("sec-haul", 26) + "<span>海淘收支图表</span></div>" + seaTradeChartsHtml() + "</div>";
  }

  function renderMore() {
    $("#rightContent").innerHTML = renderData();
  }

  function openSheet() { $("#detailSheet").hidden = false; }
  function closeSheet() { $("#detailSheet").hidden = true; }
  function renderSheet() {
    var tabs = $("#rightTabs");
    if (ui.view === "stats") { tabs.hidden = true; openSheet(); renderStatsView(); return; }
    if (ui.view === "more") { tabs.hidden = true; openSheet(); renderMore(); return; }
    tabs.hidden = false;
    if (ui.view !== "purchases" && ui.view !== "sales") { closeSheet(); return; }
    renderRight();
  }

  function renderBottomNav() {
    var items = [
      { v: "home", s: "nav-home", t: "首页" },
      { v: "purchases", s: "nav-purchase", t: "采购" },
      { v: "sales", s: "nav-sale", t: "售卖" },
      { v: "ledger", s: "nav-daily", t: "日常" },
      { v: "stats", s: "nav-stats", t: "统计" },
      { v: "more", s: "nav-more", t: "更多" }
    ];
    $("#bottomNav").innerHTML = items.map(function (it) {
      return '<button class="nav' + (ui.view === it.v ? " on" : "") + '" data-view="' + it.v + '">' +
        '<span class="nav-ico">' + sticker(it.s, 26) + "</span>" +
        "<span>" + it.t + "</span></button>";
    }).join("");
  }

  function renderToolbar() {
    var t = $("#toolbar");
    if (ui.view === "stats" || ui.view === "more") { t.innerHTML = ""; return; }
    if (ui.view === "home") {
      t.innerHTML =
        '<div class="search-box">' + ic("search", 18) +
        '<input id="searchInput" type="search" placeholder="搜索商品 / 品牌 / 卖家 / 单号…" value="' + esc(ui.q) + '"></div>' +
        '<div class="toolbar-actions">' +
        '<button class="btn gold" id="btnTemplatePurchase">' + ic("plus", 14) + "采购模板</button>" +
        '<button class="btn" id="btnTemplateSale">' + ic("plus", 14) + "售卖模板</button>" +
        "</div>";
      bindToolbarEvents();
      return;
    }
    if (ui.view === "ledger") {
      t.innerHTML =
        '<div class="search-box">' + ic("search", 18) +
        '<input id="searchInput" type="search" placeholder="搜索账本：分类 / 备注…" value="' + esc(ui.q) + '"></div>' +
        '<label class="month-input">' + ic("chart", 14) + '<input type="month" id="ledgerMonth" value="' + esc(ledgerMonth()) + '"></label>' +
        '<span class="result-count" id="resultCount"></span>' +
        '<div class="toolbar-actions">' +
        '<button class="btn gold" id="btnLedgerIncome">' + ic("plus", 14) + "记一笔收入</button>" +
        '<button class="btn" id="btnLedgerExpense">' + ic("plus", 14) + "记一笔支出</button>" +
        "</div>";
      bindToolbarEvents();
      return;
    }
    var showFilters = ui.view === "purchases" || ui.view === "logistics";
    t.innerHTML =
      '<div class="search-box">' + ic("search", 18) +
      '<input id="searchInput" type="search" placeholder="全局搜索：商品 / 品牌 / 卖家 / 单号…" value="' + esc(ui.q) + '"></div>' +
      (showFilters ? '<select id="fCountry"><option value="">全部国家</option>' + optsCountries(ui.country) + "</select>" : "") +
      '<select id="fLs"><option value="">物流状态</option>' + optsArr(LS_STATUS, ui.ls) + "</select>" +
      '<select id="fStock"><option value="">现货状态</option>' + optsMap(STOCK_STATUS, ui.stock) + "</select>" +
      '<span class="result-count" id="resultCount"></span>' +
      '<div class="toolbar-actions">' +
      '<button class="btn primary" id="btnTemplatePurchase">' + ic("plus", 14) + "采购模板</button>" +
      '<button class="btn gold" id="btnTemplateSale">' + ic("plus", 14) + "售卖模板</button>" +
      "</div>";
    bindToolbarEvents();
  }

  function bindToolbarEvents() {
    var si = $("#searchInput");
    si.addEventListener("input", function () {
      ui.q = si.value;
      renderMain();
    });
    si.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && ui.view === "home" && si.value.trim()) {
        ui.view = "purchases";
        renderBottomNav();
        renderStats();
        renderToolbar();
        renderMain();
        renderSheet();
      }
    });
    var fc = $("#fCountry");
    if (fc) fc.addEventListener("change", function () { ui.country = fc.value; renderMain(); });
    var fl = $("#fLs");
    if (fl) fl.addEventListener("change", function () { ui.ls = fl.value; renderMain(); });
    var fs = $("#fStock");
    if (fs) fs.addEventListener("change", function () { ui.stock = fs.value; renderMain(); });
    var bp = $("#btnTemplatePurchase");
    if (bp) bp.addEventListener("click", function () { openPurchase(); });
    var bs = $("#btnTemplateSale");
    if (bs) bs.addEventListener("click", function () { openSale(); });
    var lm = $("#ledgerMonth");
    if (lm) lm.addEventListener("change", function () { ui.ledgerMonth = lm.value; renderMain(); renderSheet(); });
    var bi = $("#btnLedgerIncome");
    if (bi) bi.addEventListener("click", function () { openLedger({ type: "income" }); });
    var be = $("#btnLedgerExpense");
    if (be) be.addEventListener("click", function () { openLedger({ type: "expense" }); });
  }

  function renderMain() {
    var grid = $("#cardGrid");
    var html = "";
    var count = 0;
    if (ui.view === "home") {
      html = renderHome();
    } else if (ui.view === "purchases") {
      var ps = filteredPurchases();
      count = ps.length;
      html = ps.map(purchaseCard).join("");
      if (!html) html = emptyGrid("还没有采购记录，点击右上角「采购模板」一键开始");
    } else if (ui.view === "sales") {
      var ss = filteredSales();
      count = ss.length;
      html = ss.map(saleCard).join("");
      if (!html) html = emptyGrid("还没有售卖记录，点击右上角「售卖模板」登记第一笔交易");
    } else if (ui.view === "ledger") {
      html = renderLedger();
      count = ledgerEntries().length;
    } else if (ui.view === "logistics") {
      html = renderLogistics();
      count = filteredTracks().length;
    } else if (ui.view === "data") {
      html = renderData();
    }
    grid.innerHTML = html;
    if (ui.view === "logistics") bindLogisticsFast();
    var rc = $("#resultCount");
    if (rc && (ui.view === "purchases" || ui.view === "sales" || ui.view === "ledger" || ui.view === "logistics")) {
      rc.textContent = "共 " + count + " 条";
    }
  }

  function emptyGrid(msg) {
    return '<div class="empty-state">' + ic("box", 56) + "<div>" + esc(msg) + "</div></div>";
  }

  function ledgerMini(items) {
    if (!items.length) return '<div class="empty-state">暂无账目</div>';
    return '<div class="mini-list">' + items.map(function (e) {
      var inc = e.type === "income";
      return '<div class="mini-item" data-jump="ledger:' + e.id + '">' +
        (e.image ? '<img src="' + e.image + '" alt="">' : '<div class="ph">' + ic("box", 24) + "</div>") +
        '<div class="mi-txt"><div class="mi-n">' + esc(e.category || (inc ? "收入" : "支出")) + '</div><div class="mi-m">' + esc(e.remark || "—") + "</div></div>" +
        '<div class="mi-v ' + (inc ? "inc" : "exp") + '">' + (inc ? "+" : "-") + money(e.amount) + "</div></div>";
    }).join("") + "</div>";
  }

  function renderHome() {
    var recentP = state.purchases.slice().sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, 4);
    var recentS = state.sales.slice().sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, 4);
    return '<div class="home-grid">' +
      '<section class="panel full"><h3>' + sticker("sec-recent", 22) + "最近记录</h3>" +
      '<div class="recent-block"><h4>' + ic("backpack", 16) + "最近采购</h4>" + miniList(recentP, "purchase") + "</div>" +
      '<div class="recent-block"><h4>' + ic("coin", 16) + "最近售卖</h4>" + miniList(recentS, "sale") + "</div>" +
      "</section></div>";
  }

  function miniList(items, type) {
    if (!items.length) return '<div class="empty-state">暂无记录</div>';
    return '<div class="mini-list">' + items.map(function (it) {
      var img = it.image ? '<img src="' + it.image + '" alt="">' : '<div class="ph">' + ic("box", 24) + "</div>";
      var name = (it.brand || "") + " · " + (it.name || "—");
      var meta = type === "purchase" ? (it.date || "") + " · " + (COUNTRIES[it.country] || "") : (it.date || "") + (it.buyer ? " · " + it.buyer : "");
      var val = type === "purchase" ? money(totalCost(it)) : (it.price != null ? money(it.price) : "");
      return '<div class="mini-item" data-jump="' + type + ":" + it.id + '">' + img +
        '<div class="mi-txt"><div class="mi-n">' + esc(name) + '</div><div class="mi-m">' + esc(meta) + "</div></div>" +
        '<div class="mi-v">' + val + "</div></div>";
    }).join("") + "</div>";
  }

  function aiInsights() {
    var arr = [];
    var net = sumProfit();
    var rev = sumSales();
    var cost = sumPurchases();
    if (state.sales.length) {
      var margin = rev > 0 ? (net / rev * 100) : 0;
      arr.push("<b>" + money(net) + "</b> 累计净利润" + (margin >= 0 ? "，整体毛利率 <b>" + margin.toFixed(1) + "%</b>" : "，整体仍亏损 <b>" + Math.abs(margin).toFixed(1) + "%</b>") + '<span class="sub">共 ' + state.sales.length + " 笔交易 · 累计销售 " + money(rev) + " · 累计采购 " + money(cost) + "</span>");
      var best = state.sales.map(function (s) { return { s: s, p: saleProfit(s) }; }).sort(function (a, b) { return b.p - a.p; })[0];
      if (best && best.p > 0) {
        arr.push("最赚钱的一单是 <b>" + esc(best.s.name) + "</b>，单笔利润 <b>" + money(best.p) + "</b><span class=\"sub\">售出于 " + esc(best.s.date || "—") + "</span>");
      }
    } else {
      arr.push("还没有卖出记录。<span class=\"sub\">当前累计采购投入 " + money(cost) + "，售出后这里会自动统计净利润</span>");
    }
    var instock = state.purchases.filter(function (p) { return p.stockStatus === "instock"; });
    if (instock.length) {
      var iv = round2(instock.reduce(function (a, p) { return a + totalCost(p); }, 0));
      var suggest = round2(iv / instock.length * 1.35);
      arr.push("在库现货 <b>" + instock.length + "</b> 件，占用资金 <b>" + money(iv) + "</b><span class=\"sub\">按 35% 毛利率估算，平均建议售价约 " + money(suggest) + " / 件</span>");
    }
    var waiting = state.purchases.filter(function (p) { return p.stockStatus === "waiting"; });
    if (waiting.length) {
      var daysMax = waiting.reduce(function (m, p) { return Math.max(m, p.date ? Math.floor((Date.now() - new Date(p.date + "T00:00:00")) / 86400000) : 0); }, 0);
      arr.push("有 <b>" + waiting.length + "</b> 件待到货，最久已等 <b>" + daysMax + "</b> 天<span class=\"sub\">可到「物流追踪」查看包裹进度</span>");
    }
    var customs = state.tracks.filter(function (t) { return t.status === "清关中"; });
    if (customs.length) arr.push("有 <b>" + customs.length + "</b> 个包裹正在清关<span class=\"sub\">注意把控时效，以免买家等待过久</span>");
    var inTr = state.tracks.filter(function (t) { return t.status !== "已签收"; }).length;
    if (inTr) arr.push("共 <b>" + inTr + "</b> 个包裹在途 / 待处理<span class=\"sub\">及时登记轨迹，方便核对到手时间</span>");
    var byC = {};
    state.purchases.forEach(function (p) { byC[p.country] = (byC[p.country] || 0) + totalCost(p); });
    var top = Object.keys(byC).sort(function (a, b) { return byC[b] - byC[a]; })[0];
    if (top) arr.push("采购投入最多的是 <b>" + COUNTRIES[top] + "</b>，累计 " + money(byC[top]) + '<span class="sub">泰国 / 越南 / 菲律宾 三国投入占比一览</span>');
    return arr;
  }

  function renderLogistics() {
    var tracks = filteredTracks();
    var back = tracks.filter(isBackCn);
    var notBack = tracks.filter(function (t) { return !isBackCn(t); });
    var form =
      '<div class="logi-card" style="grid-column:1/-1;margin-bottom:4px">' +
      '<h3 style="display:flex;align-items:center;gap:8px;font-size:15px;margin-bottom:10px">' + ic("truck", 20) + "登记 / 查询物流</h3>" +
      '<form id="frmTrackFast" class="frm">' +
      '<div class="f-grid">' +
      '<label>物流服务商<select id="tf-carrier">' + optsArr(CARRIERS, "") + "</select></label>" +
      '<label>物流单号<input id="tf-no" placeholder="输入快递单号" required></label>' +
      '<label>购入国家<select id="tf-country">' + optsCountries("TH") + "</select></label>" +
      '<label>包裹状态<select id="tf-status">' + optsArr(LS_STATUS, "海外发货") + "</select></label>" +
      "</div>" +
      '<label>首条轨迹备注<input id="tf-note" placeholder="如：已从曼谷发出，等待抵达转运仓"></label>' +
      '<div class="frm-actions"><button type="submit" class="btn primary">' + ic("check", 14) + "登记物流</button></div>" +
      "</form></div>";
    var sec = function (title, icon, list, hint) {
      return '<div style="grid-column:1/-1">' +
        '<h3 class="section-title">' + ic(icon, 18) + esc(title) + '<span class="section-count">' + list.length + " 单</span></h3>" +
        (list.length ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">' + list.map(trackFullCard).join("") + "</div>"
          : '<div class="empty-state" style="padding:16px 0">' + esc(hint) + "</div>") +
        "</div>";
    };
    return form +
      sec("未回国 · 在路上", "truck", notBack, "暂无未回国包裹，全部均已到达") +
      sec("已回国 · 抵达中国", "home", back, "暂无已回国包裹，仍在前方运输中");
  }

  function bindLogisticsFast() {
    var form = $("#frmTrackFast");
    if (!form || form._bound) return;
    form._bound = true;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var no = $("#tf-no").value.trim();
      if (!no) { toast("请填写物流单号"); return; }
      var note = $("#tf-note").value.trim();
      var rec = {
        id: uid(),
        carrier: $("#tf-carrier").value,
        trackingNo: no,
        country: $("#tf-country").value,
        status: $("#tf-status").value,
        history: note ? [{ date: todayStr(), note: note }] : [],
        purchaseId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      state.tracks.unshift(rec);
      save();
      renderAll();
      toast("物流单号已登记");
    });
  }

  function trackFullCard(t) {
    var p = t.purchaseId ? state.purchases.find(function (x) { return x.id === t.purchaseId; }) : null;
    var idx = LS_STATUS.indexOf(t.status);
    var stepper = '<div class="stepper">' + LS_STATUS.map(function (s, i) {
      return '<span class="step' + (i <= idx ? " on" : "") + '"><i></i><em>' + s + "</em></span>";
    }).join("") + "</div>";
    var hist = (t.history && t.history.length) ? '<div class="logi-history">' + t.history.slice().reverse().map(function (h) {
      return '<div class="lh"><span class="ld">' + esc(h.date || "") + '</span><span class="ln">' + esc(h.note || "") + "</span></div>";
    }).join("") + "</div>" : '<div class="hint" style="padding:6px 0">暂无轨迹记录</div>';
    return '<div class="logi-card">' +
      '<div class="logi-head">' + ic("truck", 20) +
      '<h3>' + esc(t.carrier || "—") + "</h3>" +
      '<span class="logi-no">' + esc(t.trackingNo) + "</span>" +
      statusTagHtml(t.status) +
      (t.country ? '<span class="tag country ' + esc(t.country) + '">' + esc(COUNTRIES[t.country]) + "</span>" : "") +
      "</div>" +
      (p ? '<div class="kv" style="margin-top:7px"><span class="k">绑定采购</span><span class="v">' + esc(p.brand || "") + " · " + esc(p.name) + "</span></div>" : "") +
      stepper +
      hist +
      '<div class="logi-actions">' +
      '<select data-setstatus data-track="' + t.id + '" style="flex:1;min-width:120px">' + optsArr(LS_STATUS, t.status) + "</select>" +
      '<button class="btn small" data-act="edittrack" data-track="' + t.id + '">' + ic("pencil", 13) + "编辑</button>" +
      '<button class="btn small" data-act="link" data-carrier="' + esc(t.carrier) + '">' + ic("link", 13) + "官网查询</button>" +
      '<select data-bindtrack data-track="' + t.id + '" style="flex:1;min-width:130px">' +
      '<option value="">绑定采购卡片…</option>' +
      state.purchases.map(function (pp) { return '<option value="' + pp.id + '"' + (t.purchaseId === pp.id ? " selected" : "") + ">" + esc((pp.brand ? pp.brand + " · " : "") + pp.name) + "</option>"; }).join("") +
      "</select>" +
      '<button class="btn small danger" data-act="deltrack" data-track="' + t.id + '">' + ic("trash", 13) + "删除</button>" +
      "</div></div>";
  }

  function renderData() {
    return '<div class="data-grid">' +
      '<section class="panel"><h3>' + ic("box", 18) + "备份与迁移</h3>" +
      '<div class="desc">数据保存在本浏览器（IndexedDB / localStorage）。换手机、换电脑时用「导出」带走 JSON 备份，再用「导入」还原，图片会一并包含。</div>' +
      '<div class="data-actions">' +
      '<button class="btn primary" id="btnExport">' + ic("box", 15) + "导出全部数据（JSON 备份）</button>" +
      '<button class="btn gold" id="btnShare">' + ic("link", 15) + "生成二维码 / 分享码（小数据）</button>" +
      '<button class="btn" id="btnImportFile">' + ic("plus", 15) + "从 JSON 文件导入</button>" +
      '<button class="btn" id="btnImportClip">' + ic("copy", 15) + "从剪贴板粘贴导入</button>" +
      "</div>" +
      '<input type="file" id="importFile" accept="application/json,.json" hidden>' +
      '<div class="qr-box" id="qrBox" hidden></div>' +
      "</section>" +
      '<section class="panel"><h3>' + ic("chart", 18) + "数据统计</h3>" +
      '<div class="kv"><span class="k">采购卡片</span><span class="v">' + state.purchases.length + " 张</span></div>" +
      '<div class="kv"><span class="k">售卖记录</span><span class="v">' + state.sales.length + " 条</span></div>" +
      '<div class="kv"><span class="k">物流单</span><span class="v">' + state.tracks.length + " 单</span></div>" +
      '<div class="kv"><span class="k">日常账目</span><span class="v">' + state.ledger.length + " 笔</span></div>" +
      '<div class="kv"><span class="k">总采购投入</span><span class="v">' + money(sumPurchases()) + "</span></div>" +
      '<div class="kv"><span class="k">总销售收入</span><span class="v">' + money(sumSales()) + "</span></div>" +
      '<div class="kv"><span class="k">总净利润</span><span class="v">' + money(sumProfit()) + "</span></div>" +
      "</section>" +
      '<section class="panel"><h3>' + ic("palette", 18) + "主题皮肤</h3>" +
      '<div class="desc">一键切换星露谷像素田园风格的四款皮肤，设置会自动保存。</div>' +
      '<div class="data-actions">' +
      THEMES.map(function (t) { return '<button class="btn theme-set" data-theme="' + t.id + '"><span class="theme-swatch" style="background:' + t.colors[0] + '"></span>' + t.name + "</button>"; }).join("") +
      "</div></section>" +
      '<section class="panel"><h3>' + ic("trash", 18) + "危险区</h3>" +
      '<div class="desc">清空本设备上的全部工作台数据，无法撤销，请先导出备份。</div>' +
      '<button class="btn danger" id="btnClearAll">' + ic("trash", 15) + "清空全部数据</button>" +
      "</section>" +
      '<section class="panel" style="grid-column:1/-1"><h3>' + ic("eye", 18) + "使用说明</h3>" +
      '<div class="desc">' +
      "· 首页看板：汇总「海淘进销利润」4 项数据，下方为最近采购 / 售卖记录；「日常」与「统计」页独立展示日常生活收支，两域完全独立、互不打扰。<br>" +
      "· 底部导航：首页、采购（买入）、售卖（卖出+自动利润）、日常（生活收支账本）、统计、更多。<br>" +
      "· 采购 / 售卖：点右上角「模板」一键预填快速录入，卡片点击后从底部弹出详情与物流工具。<br>" +
      "· 日常账本：独立记录日常收入 / 支出，支持分类、金额、日期、备注、截图，按月度统计收支结余；与海淘采购成本分开核算、互不混淆。<br>" +
      "· 搜索：首页顶部搜索框全局检索商品名、品牌、卖家、物流单号，修改名称后实时生效。<br>" +
      "· 物流工具：详情面板内「物流工具」标签可登记泰/越/菲快递单号，并绑定到采购卡片。<br>" +
      "· 图片：采购卡片支持上传商品截图，点图放大。<br>" +
      "· 数据管理：更多页可导出 / 导入 JSON 备份、生成分享码、清空数据。" +
      "</div></section>" +
      "</div>";
  }

  function renderRight() {
    if (ui.view === "ledger") { renderLedgerRight(); return; }
    if (ui.rightTab === "tool") { renderTool(); return; }
    var sel = ui.selected;
    if (!sel) {
      $("#rightContent").innerHTML = '<div class="empty-state">' + ic("eye", 56) + "<div>点击卡片查看详情<br><br>「物流工具」标签可登记快递单号</div></div>";
      return;
    }
    if (sel.type === "purchase") {
      var p = state.purchases.find(function (x) { return x.id === sel.id; });
      $("#rightContent").innerHTML = p ? purchaseDetail(p) : emptyStateText();
    } else if (sel.type === "sale") {
      var s = state.sales.find(function (x) { return x.id === sel.id; });
      $("#rightContent").innerHTML = s ? saleDetail(s) : emptyStateText();
    } else {
      $("#rightContent").innerHTML = emptyStateText();
    }
  }

  function emptyStateText() {
    return '<div class="empty-state">' + ic("box", 56) + "<div>记录已被删除</div></div>";
  }

  function renderLedgerRight() {
    var list = ledgerEntries();
    var sums = ledgerSums(list);
    var incCats = {}, expCats = {};
    list.forEach(function (e) {
      var c = e.category || "其他";
      if (e.type === "income") incCats[c] = (incCats[c] || 0) + num(e.amount);
      else expCats[c] = (expCats[c] || 0) + num(e.amount);
    });
    var catHtml = function (map, isInc) {
      var keys = Object.keys(map).sort(function (a, b) { return map[b] - map[a]; }).slice(0, 6);
      if (!keys.length) return '<div class="hint">暂无' + (isInc ? "收入" : "支出") + "分类记录</div>";
      return keys.map(function (k) {
        var pct = (isInc ? sums.income : sums.expense) > 0 ? Math.round(map[k] / (isInc ? sums.income : sums.expense) * 100) : 0;
        return '<div class="bar-row"><span class="br-k">' + esc(k) + "</span><span class=\"br-bar\"><i style=\"width:" + pct + "%\"></i></span><span class=\"br-v\">" + money(map[k]) + "</span></div>";
      }).join("");
    };
    var m = ui.ledgerMonth || ledgerMonth();
    var html =
      '<div class="panel"><h3>' + ic("book", 18) + "月度日常收支 · " + esc(m) + "</h3>" +
      '<div class="kv"><span class="k">本月收入</span><span class="v" style="color:var(--accent-dark)">' + money(sums.income) + "</span></div>" +
      '<div class="kv"><span class="k">本月支出</span><span class="v" style="color:var(--danger)">' + money(sums.expense) + "</span></div>" +
      '<div class="kv total"><span class="k">本月结余</span><span class="v ' + (sums.balance >= 0 ? "" : "neg") + '">' + money(sums.balance) + "</span></div>" +
      "</div>" +
      '<div class="panel"><h3>' + ic("chart", 18) + "支出分类占比</h3>" + catHtml(expCats, false) + "</div>" +
      '<div class="panel"><h3>' + ic("coin", 18) + "收入分类占比</h3>" + catHtml(incCats, true) + "</div>" +
      '<div class="panel"><h3>' + ic("eye", 18) + "独立核算说明</h3>" +
      '<div class="desc">本模块仅统计日常生活收支，与「采购入库 / 售卖台账」的海淘成本完全独立，两边数据互不混淆。</div></div>';
    $("#rightContent").innerHTML = html;
  }

  function purchaseDetail(p) {
    var t = trackOf(p);
    var cost = totalCost(p);
    var hist = (t && t.history && t.history.length) ? '<div class="track-list">' + t.history.slice().reverse().map(function (h) {
      return '<div class="track-item"><span class="tt">' + esc(h.date || "") + '</span><span class="tn">' + esc(h.note || "") + "</span></div>";
    }).join("") + "</div>" : '<div class="hint">暂无轨迹记录</div>';
    var c = p.cost || {};
    return '<div class="detail-title"><h3 style="font-size:17px">' + esc(p.brand || "") + (p.brand ? " · " : "") + esc(p.name) + "</h3>" +
      stockTagHtml(p.stockStatus) + " " + (pStatus(p) ? statusTagHtml(pStatus(p)) : "") + "</div>" +
      (p.image ? '<div class="detail-media" data-act="lightbox" data-img="' + p.image + '"><img src="' + p.image + '" alt=""></div>' : "") +
      '<div class="panel"><h3>' + ic("backpack", 18) + '基本信息</h3><div class="detail-kv">' +
      '<div class="kv"><span class="k">购买日期</span><span class="v">' + esc(p.date || "—") + "</span></div>" +
      '<div class="kv"><span class="k">购入国家</span><span class="v"><span class="tag country ' + esc(p.country || "") + '">' + esc(COUNTRIES[p.country] || "—") + "</span></span></div>" +
      '<div class="kv"><span class="k">卖家 / 店铺</span><span class="v">' + esc(p.seller || "—") + "</span></div>" +
      '<div class="kv"><span class="k">现货状态</span><span class="v">' + stockTagHtml(p.stockStatus) + "</span></div>" +
      "</div></div>" +
      '<div class="panel"><h3>' + ic("coin", 18) + '成本核算</h3><div class="detail-kv">' +
      '<div class="kv"><span class="k">外币原价</span><span class="v">' + (CURRENCIES[p.country] ? CURRENCIES[p.country].sym : "") + " " + money(c.price) + " (" + esc(c.currency || "—") + ")</span></div>" +
      '<div class="kv"><span class="k">代付汇率</span><span class="v">' + (c.fx != null ? c.fx : "—") + "</span></div>" +
      '<div class="kv"><span class="k">折合人民币</span><span class="v">' + money(c.priceCNY) + "</span></div>" +
      '<div class="kv total"><span class="k">采购总成本</span><span class="v">' + money(cost) + "</span></div>" +
      "</div></div>" +
      '<div class="panel"><h3>' + ic("truck", 18) + '物流信息</h3><div class="detail-kv">' +
      '<div class="kv"><span class="k">服务商</span><span class="v">' + esc(t ? t.carrier : (p.carrier || "—")) + "</span></div>" +
      '<div class="kv"><span class="k">物流单号</span><span class="v mono">' + esc(t ? t.trackingNo : (p.trackingNo || "—")) + (t ? ' <button class="icon-btn" style="vertical-align:middle" data-act="copy" data-no="' + esc(t.trackingNo) + '" title="复制单号">' + ic("copy", 14) + "</button>" : "") + "</span></div>" +
      (t && CARRIER_URL[t.carrier] ? '<div class="kv"><span class="k">官网查询</span><span class="v"><button class="btn small" data-act="link" data-carrier="' + esc(t.carrier) + '">打开快递官网</button></span></div>' : "") +
      '<div class="kv"><span class="k">更新状态</span><span class="v"><select class="q-status" data-track="' + (t ? t.id : "") + '" data-purchase="' + p.id + '">' + optsArr(LS_STATUS, t ? t.status : (p.lsStatus || "待下单")) + "</select></span></div>" +
      hist +
      '<div class="track-add"><input type="date" id="th-date" value="' + todayStr() + '"><input type="text" id="th-note" placeholder="轨迹描述，如：已到达国内派送点"><button class="btn small primary" data-act="addtrack" data-id="' + p.id + '">+ 登记轨迹</button></div>' +
      "</div></div>" +
      (p.remark ? '<div class="panel"><h3>' + ic("pencil", 18) + '备注</h3><div class="desc">' + esc(p.remark) + "</div></div>" : "") +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn primary" data-act="edit" data-type="purchase" data-id="' + p.id + '">编辑卡片</button>' +
      '<button class="btn gold" data-act="sell" data-id="' + p.id + '">登记售卖</button>' +
      '<button class="btn danger" data-act="del" data-type="purchase" data-id="' + p.id + '">删除</button>' +
      "</div>";
  }

  function saleDetail(s) {
    var p = purchaseOf(s);
    var profit = saleProfit(s);
    return '<div class="detail-title"><h3 style="font-size:17px">' + esc(s.brand || "") + (s.brand ? " · " : "") + esc(s.name) + '</h3><span class="tag gold">已售出</span></div>' +
      '<div class="panel"><h3>' + ic("list", 18) + '交易信息</h3><div class="detail-kv">' +
      '<div class="kv"><span class="k">关联采购</span><span class="v">' + (p ? esc(p.brand || "") + " · " + esc(p.name) + '<br><em style="font-size:11px;color:var(--text2)">采购成本 ' + money(totalCost(p)) + "</em>" : '<span class="tag red">未关联</span>') + "</span></div>" +
      "</div></div>" +
      '<div class="panel"><h3>' + ic("coin", 18) + '收支明细</h3><div class="detail-kv">' +
      '<div class="kv"><span class="k">售出价格</span><span class="v">' + money(s.price) + "</span></div>" +
      '<div class="kv sub"><span class="k">寄出运费</span><span class="v">-' + money(s.shipFee) + "</span></div>" +
      '<div class="kv sub"><span class="k">平台手续费</span><span class="v">-' + money(s.platformFee) + "</span></div>" +
      '<div class="kv sub"><span class="k">采购总成本</span><span class="v">-' + money(p ? totalCost(p) : 0) + "</span></div>" +
      "</div>" +
      '<div class="profit-row"><span class="pl">单品纯利润</span><span class="profit ' + (profit >= 0 ? "pos" : "neg") + '">' + money(profit) + "</span></div>" +
      "</div>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button class="btn primary" data-act="edit" data-type="sale" data-id="' + s.id + '">编辑记录</button>' +
      '<button class="btn danger" data-act="del" data-type="sale" data-id="' + s.id + '">删除</button>' +
      "</div>";
  }

  function renderTool() {
    if (ui.view === "stats") { renderStatsView(); return; }
    if (ui.view === "more") { renderMore(); return; }
    var tracks = state.tracks.slice().sort(function (a, b) { return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0); }).slice(0, 12);
    var html = '<div class="tool-intro">支持泰国 Flash Express / J&amp;T、越南 GHN、菲律宾 LBC 等主流快递。登记单号后可随时记录轨迹，并绑定到对应采购卡片，实现「一单到底」追踪。</div>' +
      '<form id="frmTrackTool" class="frm">' +
      '<div class="f-grid">' +
      '<label>服务商<select id="tt-carrier">' + optsArr(CARRIERS, "") + "</select></label>" +
      '<label>单号<input id="tt-no" required placeholder="快递单号"></label>' +
      "</div>" +
      '<div class="f-grid">' +
      '<label>国家<select id="tt-country">' + optsCountries("TH") + "</select></label>" +
      '<label>状态<select id="tt-status">' + optsArr(LS_STATUS, "海外发货") + "</select></label>" +
      "</div>" +
      '<label>备注轨迹<input id="tt-note" placeholder="如：已交寄，等待分拣"></label>' +
      '<div class="frm-actions"><button type="submit" class="btn primary">' + ic("plus", 14) + "登记物流</button></div>" +
      "</form>";
    var back = tracks.filter(isBackCn);
    var notBack = tracks.filter(function (t) { return !isBackCn(t); });
    var row = function (t) {
      var p = t.purchaseId ? state.purchases.find(function (x) { return x.id === t.purchaseId; }) : null;
      return '<div class="track-item" style="flex-wrap:wrap"><span class="tt">' + esc(t.carrier) + "</span>" +
        '<span class="tn mono">' + esc(t.trackingNo) + '</span>' + statusTagHtml(t.status) +
        '<button class="btn small" data-act="copy" data-no="' + esc(t.trackingNo) + '">复制</button>' +
        '<select data-bindtrack data-track="' + t.id + '" style="flex:1;min-width:110px"><option value="">绑定采购…</option>' +
        state.purchases.map(function (pp) { return '<option value="' + pp.id + '"' + (t.purchaseId === pp.id ? " selected" : "") + ">" + esc((pp.brand ? pp.brand + " · " : "") + pp.name) + "</option>"; }).join("") +
        "</select></div>";
    };
    var group = function (title, icon, list) {
      if (!list.length) return "";
      return '<div class="panel" style="margin-top:12px"><h3>' + ic(icon, 18) + esc(title) + '<span class="section-count">' + list.length + " 单</span></h3>" +
        list.map(row).join("") + "</div>";
    };
    html += group("未回国 · 在路上", "truck", notBack);
    html += group("已回国 · 抵达中国", "home", back);
    if (!tracks.length) {
      html += '<div class="empty-state" style="padding:20px 0">' + ic("truck", 44) + "<div>还没有物流单，先在上面登记一条</div></div>";
    }
    html += '<div class="panel" style="margin-top:12px"><h3>' + ic("link", 18) + '快递官网</h3><div class="desc">点击前往对应国家快递官网手动查询轨迹：</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
      Object.keys(CARRIER_URL).map(function (c) { return '<button class="btn small" data-act="link" data-carrier="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") +
      "</div></div>";
    $("#rightContent").innerHTML = html;
    bindToolForm("#frmTrackTool", "#tt-carrier", "#tt-no", "#tt-country", "#tt-status", "#tt-note");
  }

  function bindToolForm(sel, carrierSel, noSel, countrySel, statusSel, noteSel) {
    var form = $(sel);
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var no = $(noSel).value.trim();
      if (!no) { toast("请填写物流单号"); return; }
      var rec = {
        id: uid(),
        carrier: $(carrierSel).value,
        trackingNo: no,
        country: $(countrySel).value,
        status: $(statusSel).value,
        history: $(noteSel).value.trim() ? [{ date: todayStr(), note: $(noteSel).value.trim() }] : [],
        purchaseId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      state.tracks.unshift(rec);
      save();
      $(noSel).value = "";
      $(noteSel).value = "";
      toast("物流单号已登记");
      renderAll();
    });
  }

  function setTrackStatus(trackId, status) {
    var t = state.tracks.find(function (x) { return x.id === trackId; });
    if (!t) return;
    t.status = status;
    t.updatedAt = Date.now();
    if (status === "已签收") {
      var p = t.purchaseId ? state.purchases.find(function (x) { return x.id === t.purchaseId; }) : null;
      if (p && p.stockStatus === "waiting") { p.stockStatus = "instock"; }
    }
    save();
    renderAll();
    toast("状态已更新为「" + status + "」");
  }

  function openEditTrack(trackId) {
    var t = state.tracks.find(function (x) { return x.id === trackId; });
    if (!t) return;
    openModal("编辑物流单", '<form id="frmTrackEdit" class="frm">' +
      '<div class="f-grid"><label>服务商<select id="te-carrier">' + optsArr(CARRIERS, t.carrier) + "</select></label>" +
      '<label>单号<input id="te-no" required value="' + esc(t.trackingNo) + '"></label></div>' +
      '<div class="f-grid"><label>国家<select id="te-country">' + optsCountries(t.country) + "</select></label>" +
      '<label>状态<select id="te-status">' + optsArr(LS_STATUS, t.status) + "</select></label></div>" +
      '<label>轨迹备注<input id="te-note" placeholder="新增一条轨迹（可留空）"></label>' +
      '<div class="frm-actions"><button type="submit" class="btn primary">保存</button><button type="button" class="btn" data-close>取消</button></div></form>',
      function () {
        var no = $("#te-no").value.trim();
        if (!no) { toast("请填写单号"); return; }
        t.carrier = $("#te-carrier").value;
        t.trackingNo = no;
        t.country = $("#te-country").value;
        t.status = $("#te-status").value;
        var note = $("#te-note").value.trim();
        if (note) { t.history = t.history || []; t.history.push({ date: todayStr(), note: note }); }
        t.updatedAt = Date.now();
        var p = t.purchaseId ? state.purchases.find(function (x) { return x.id === t.purchaseId; }) : null;
        if (p) { p.carrier = t.carrier; p.trackingNo = t.trackingNo; p.lsStatus = t.status; }
        save();
        closeModal();
        renderAll();
        toast("物流单已更新");
      });
  }

  function openModal(title, html, onsubmit) {
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = html;
    $("#modalMask").hidden = false;
    var form = $("#modalBody").querySelector("form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (onsubmit) onsubmit(e);
      });
    }
    $$("#modalBody [data-close]").forEach(function (b) { b.addEventListener("click", closeModal); });
    bindImageFields();
  }
  function closeModal() { $("#modalMask").hidden = true; $("#modalBody").innerHTML = ""; }

  function imageFieldHtml(id, cur, label) {
    return '<label class="img-field"><span>' + label + '</span>' +
      '<div class="img-upload" id="' + id + '-box">' +
      (cur ? '<img src="' + cur + '" alt="">' : '<div class="img-upload-placeholder">' + ic("box", 36) + "<span>点击上传图片</span></div>") +
      "</div>" +
      '<input type="file" accept="image/*" class="img-file" data-target="' + id + '-box" data-out="' + id + '-data" hidden>' +
      '<input type="hidden" id="' + id + '-data" value="' + (cur || "") + '">' +
      "</label>";
  }

  function bindImageFields() {
    $$(".img-file").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        readImage(f, function (dataURL) {
          $("#" + inp.dataset.out).value = dataURL;
          $("#" + inp.dataset.target).innerHTML = '<img src="' + dataURL + '" alt="">';
        });
      });
    });
  }

  function readImage(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 900;
        var w = img.width, h = img.height;
        if (w > max) { h = Math.round(h * max / w); w = max; }
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        cb(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () { cb(fr.result); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  function purchaseForm(rec) {
    rec = rec || {};
    var country = rec.country || "TH";
    var c = rec.cost || {};
    var curCode = c.currency || (CURRENCIES[country] ? CURRENCIES[country].code : "THB");
    var cur = curDef(curCode);
    var fx = c.fx != null ? c.fx : cur.rate;
    var cny = c.priceCNY != null ? c.priceCNY : round2((c.price || 0) / (fx || 1));
    var t = trackOf(rec);
    var lsSt = t ? t.status : (rec.lsStatus || "待下单");
    var carrier = t ? t.carrier : (rec.carrier || "Flash Express");
    var trkNo = t ? t.trackingNo : (rec.trackingNo || "");
    return '<form id="frmPurchase" class="frm">' +
      '<input type="hidden" id="pid" value="' + (rec.id || "") + '">' +
      '<div class="f-grid">' +
      '<label>商品名称 *<input id="pname" required value="' + esc(rec.name || "") + '" placeholder="如：古着衬衫"></label>' +
      '<label>品牌<input id="pbrand" value="' + esc(rec.brand || "") + '" placeholder="如：Uniqlo / 无品牌"></label>' +
      '<label>购买日期<input type="date" id="pdate" value="' + esc(rec.date || todayStr()) + '"></label>' +
      '<label>购入国家<select id="pcountry">' + optsCountries(country) + "</select></label>" +
      '<label>现货状态<select id="pstock">' + optsMap(STOCK_STATUS, rec.stockStatus || "waiting") + "</select></label>" +
      "</div>" +
      '<div class="block"><div class="block-h"><span class="dot"></span>成本核算</div>' +
      '<div class="f-grid">' +
      '<label>外币原价<input type="number" step="0.01" min="0" id="pprice" value="' + (c.price != null ? c.price : "") + '" placeholder="0"></label>' +
      '<label>代付汇率（1 元人民币 ≈ ? 外币）<input type="number" step="any" min="0" id="pfx" value="' + fx + '"></label>' +
      "</div>" +
      '<div class="cur-wrap"><span class="cur-label">币种 · 左右滑动选择</span>' +
      '<div class="cur-slider" id="curSlider">' + CURRENCY_LIST.map(function (cu) {
        return '<button type="button" class="cur-chip' + (cu.code === curCode ? " on" : "") + '" data-cur="' + cu.code + '" data-rate="' + cu.rate + '">' + esc(cu.sym) + " " + esc(cu.code) + "</button>";
      }).join("") + "</div>" +
      '<input type="hidden" id="pcur" value="' + esc(curCode) + '">' +
      "</div>" +
      '<div class="f-grid">' +
      '<label>商品折合人民币（原价 ÷ 汇率，可改）<input type="number" step="0.01" id="pcny" value="' + (cny || "") + '"></label>' +
      "</div>" +
      '<div class="calc-out"><span>采购总成本（利润计算基准）</span><span class="val" id="ptotal">' + money(cny || 0) + "</span></div>" +
      "</div>" +
      '<div class="block"><div class="block-h"><span class="dot"></span>物流信息</div>' +
      '<div class="f-grid">' +
      '<label>物流服务商<select id="pls">' + optsArr(CARRIERS, carrier) + "</select></label>" +
      '<label>物流单号<input id="ptrack" value="' + esc(trkNo) + '" placeholder="如：FD1234567890"></label>' +
      '<label>包裹状态<select id="plstatus">' + optsArr(LS_STATUS, lsSt) + "</select></label>" +
      "</div></div>" +
      "<label>备注（尺码 / 瑕疵 / 交易记录）<textarea id=\"premark\" rows=\"3\" placeholder=\"如：L码，袖口轻微磨损\">" + esc(rec.remark || "") + "</textarea></label>" +
      imageFieldHtml("pimg", rec.image, "商品截图") +
      '<div class="frm-actions"><button type="submit" class="btn primary">保存采购卡片</button><button type="button" class="btn" data-close>取消</button></div>' +
      "</form>";
  }

  function saleForm(rec, prefill) {
    rec = rec || {};
    var used = state.sales.map(function (s) { return s.purchaseId; });
    var selId = rec.purchaseId || (prefill ? prefill.id : "") || "";
    var p = state.purchases.find(function (x) { return x.id === selId; }) || null;
    var name = rec.name || (p ? p.name : (prefill ? prefill.name : ""));
    var brand = rec.brand || (p ? p.brand : (prefill ? prefill.brand : ""));
    var cost = p ? totalCost(p) : 0;
    var profit = round2((rec.price || 0) - (rec.shipFee || 0) - (rec.platformFee || 0) - cost);
    var cards = state.purchases.map(function (pp) {
      var isUsed = used.indexOf(pp.id) >= 0 && pp.id !== rec.purchaseId;
      var checked = pp.id === selId;
      return '<label class="pk-card' + (checked ? " on" : "") + (isUsed ? " used" : "") + '">' +
        '<input type="radio" name="spick" value="' + pp.id + '"' + (checked ? " checked" : "") + (isUsed ? " disabled" : "") + ">" +
        '<span class="pk-img">' + (pp.image ? '<img src="' + pp.image + '" alt="">' : ic("box", 26)) + "</span>" +
        '<span class="pk-txt"><b>' + esc((pp.brand ? pp.brand + " · " : "") + pp.name) + "</b><i>" + (isUsed ? "已售出" : money(totalCost(pp))) + "</i></span>" +
        "</label>";
    }).join("");
    return '<form id="frmSale" class="frm">' +
      '<input type="hidden" id="sid" value="' + (rec.id || "") + '">' +
      '<div class="block"><div class="block-h"><span class="dot"></span>关联采购商品（点选，可见照片）</div>' +
      '<div class="pk-grid" id="spicker">' +
      '<label class="pk-card' + (selId ? "" : " on") + '">' +
      '<input type="radio" name="spick" value=""' + (selId ? "" : " checked") + ">" +
      '<span class="pk-img ph">' + ic("coin", 26) + "</span>" +
      '<span class="pk-txt"><b>不关联</b><i>独立记录，利润不含采购成本</i></span></label>' +
      cards +
      "</div></div>" +
      '<div class="f-grid">' +
      '<label>商品名称<input id="sname" required value="' + esc(name) + '"></label>' +
      '<label>品牌<input id="sbrand" value="' + esc(brand) + '"></label>' +
      "</div>" +
      '<div class="block"><div class="block-h"><span class="dot"></span>收支明细</div>' +
      '<div class="f-grid">' +
      '<label>售出价格<input type="number" step="0.01" min="0" id="sprice" required value="' + (rec.price || "") + '" placeholder="0"></label>' +
      '<label>寄出运费<input type="number" step="0.01" min="0" id="sship" value="' + (rec.shipFee || "") + '" placeholder="0"></label>' +
      '<label>平台手续费<input type="number" step="0.01" min="0" id="splat" value="' + (rec.platformFee || "") + '" placeholder="0"></label>' +
      "</div>" +
      '<div class="calc-out"><span>单品纯利润</span><span class="val" id="sprofit" style="' + (profit < 0 ? "color:var(--danger)" : "") + '">' + money(profit) + "</span></div>" +
      "</div>" +
      '<div class="frm-actions"><button type="submit" class="btn primary">保存售卖记录</button><button type="button" class="btn" data-close>取消</button></div>' +
      "</form>";
  }

  function openPurchase(rec, prefill) {
    openModal(prefill ? "转为采购卡片" : (rec && rec.id ? "编辑采购卡片" : "新增采购卡片（采购模板）"), purchaseForm(rec), function () {
      var d = readPurchaseForm();
      if (!d.name) { toast("请填写商品名称"); return; }
      if (d.id) {
        var idx = state.purchases.findIndex(function (p) { return p.id === d.id; });
        if (idx >= 0) {
          var old = state.purchases[idx];
          d.createdAt = old.createdAt;
          d.trackId = old.trackId;
          if (old.seller) d.seller = old.seller;
          state.purchases[idx] = d;
          if (d.trackId) {
            var t = state.tracks.find(function (x) { return x.id === d.trackId; });
            if (t) { t.carrier = d.carrier; t.trackingNo = d.trackingNo; t.status = d.lsStatus; t.country = d.country; t.updatedAt = Date.now(); }
          } else if (d.trackingNo) {
            var nt = { id: uid(), carrier: d.carrier, trackingNo: d.trackingNo, status: d.lsStatus, country: d.country, history: [], purchaseId: d.id, createdAt: Date.now(), updatedAt: Date.now() };
            state.tracks.unshift(nt);
            d.trackId = nt.id;
            state.purchases[idx] = d;
          }
        }
      } else {
        d.id = uid();
        d.createdAt = Date.now();
        if (d.trackingNo) {
          var t2 = { id: uid(), carrier: d.carrier, trackingNo: d.trackingNo, status: d.lsStatus, country: d.country, history: [], purchaseId: d.id, createdAt: Date.now(), updatedAt: Date.now() };
          state.tracks.unshift(t2);
          d.trackId = t2.id;
        }
        state.purchases.unshift(d);
      }
      save();
      closeModal();
      renderAll();
      toast("采购卡片已保存");
    });
    bindPurchaseCalc();
  }

  function readPurchaseForm() {
    return {
      id: $("#pid").value,
      name: $("#pname").value.trim(),
      brand: $("#pbrand").value.trim(),
      date: $("#pdate").value,
      country: $("#pcountry").value,
      cost: {
        price: num($("#pprice").value),
        currency: $("#pcur").value.trim(),
        fx: parseFloat($("#pfx").value),
        priceCNY: num($("#pcny").value)
      },
      carrier: $("#pls").value,
      trackingNo: $("#ptrack").value.trim(),
      lsStatus: $("#plstatus").value,
      stockStatus: $("#pstock").value,
      remark: $("#premark").value.trim(),
      image: $("#pimg-data").value
    };
  }

  function bindPurchaseCalc() {
    var pprice = $("#pprice"), pfx = $("#pfx"), pcny = $("#pcny");
    var slider = $("#curSlider"), pcur = $("#pcur");
    var pcnyEdited = false;
    if (pcny) pcny.addEventListener("input", function () { pcnyEdited = true; });
    function recompute() {
      if (pprice && pfx && pcny && !pcnyEdited) {
        var fx = parseFloat(pfx.value);
        var price = parseFloat(pprice.value);
        if (!isNaN(fx) && fx > 0 && !isNaN(price)) pcny.value = round2(price / fx);
      }
      var t = num($("#pcny").value);
      var el = $("#ptotal");
      if (el) el.textContent = money(t);
    }
    ["pprice", "pfx", "pcny"].forEach(function (id) {
      var el = $("#" + id);
      if (el) el.addEventListener("input", recompute);
    });
    if (slider) {
      slider.addEventListener("click", function (e) {
        var chip = e.target.closest("[data-cur]");
        if (!chip) return;
        $$("#curSlider .cur-chip").forEach(function (b) { b.classList.toggle("on", b === chip); });
        if (pcur) pcur.value = chip.dataset.cur;
        if (pfx) pfx.value = chip.dataset.rate;
        recompute();
      });
    }
    recompute();
  }

  function openSale(rec, prefillPurchase) {
    openModal(prefillPurchase ? "登记售卖（关联 " + (prefillPurchase.brand ? prefillPurchase.brand + " · " : "") + prefillPurchase.name + "）" : (rec && rec.id ? "编辑售卖记录" : "新增售卖记录（售卖模板）"), saleForm(rec, prefillPurchase), function () {
      var d = readSaleForm();
      if (!d.name) { toast("请填写商品名称"); return; }
      var oldPurchaseId = null;
      if (d.id) {
        var idx = state.sales.findIndex(function (s) { return s.id === d.id; });
        if (idx >= 0) {
          oldPurchaseId = state.sales[idx].purchaseId;
          ["date", "buyer", "shipNo", "remark", "image"].forEach(function (k) { if (d[k] == null) d[k] = state.sales[idx][k]; });
          state.sales[idx] = d;
        }
      } else {
        d.id = uid();
        d.createdAt = Date.now();
        state.sales.unshift(d);
      }
      if (oldPurchaseId && oldPurchaseId !== d.purchaseId) {
        var op = state.purchases.find(function (x) { return x.id === oldPurchaseId; });
        if (op && op.saleId === d.id) { op.saleId = null; op.stockStatus = "instock"; }
      }
      if (d.purchaseId) {
        var np = state.purchases.find(function (x) { return x.id === d.purchaseId; });
        if (np) { np.stockStatus = "sold"; np.saleId = d.id; }
      }
      save();
      closeModal();
      renderAll();
      toast("售卖记录已保存，利润已自动计算");
    });
    bindSaleCalc();
  }

  function readSaleForm() {
    var sel = $$("#frmSale input[name='spick']:checked")[0];
    return {
      id: $("#sid").value,
      purchaseId: sel ? (sel.value || null) : null,
      name: $("#sname").value.trim(),
      brand: $("#sbrand").value.trim(),
      price: num($("#sprice").value),
      shipFee: num($("#sship").value),
      platformFee: num($("#splat").value)
    };
  }

  function bindSaleCalc() {
    function update() {
      var price = num($("#sprice").value);
      var ship = num($("#sship").value);
      var plat = num($("#splat").value);
      var sel = $$("#frmSale input[name='spick']:checked")[0];
      var pid = sel ? sel.value : "";
      var p = state.purchases.find(function (x) { return x.id === pid; }) || null;
      var cost = p ? totalCost(p) : 0;
      var profit = round2(price - ship - plat - cost);
      var el = $("#sprofit");
      if (el) { el.textContent = money(profit); el.style.color = profit < 0 ? "var(--danger)" : ""; }
    }
    ["sprice", "sship", "splat"].forEach(function (id) {
      var el = $("#" + id);
      if (el) el.addEventListener("input", update);
    });
    $$("#spicker input[name='spick']").forEach(function (r) {
      r.addEventListener("change", function () {
        $$("#spicker .pk-card").forEach(function (c) { c.classList.toggle("on", c.querySelector("input").checked); });
        var p = state.purchases.find(function (x) { return x.id === r.value; }) || null;
        if (p) { $("#sname").value = p.name; $("#sbrand").value = p.brand; }
        update();
      });
    });
    update();
  }

  function delRecord(type, id) {
    var label = type === "purchase" ? "采购卡片" : "售卖记录";
    if (!confirm("确定删除这条" + label + "吗？")) return;
    if (type === "purchase") {
      var p = state.purchases.find(function (x) { return x.id === id; });
      if (p && p.trackId) {
        var t = state.tracks.find(function (x) { return x.id === p.trackId; });
        if (t) t.purchaseId = null;
      }
      state.purchases = state.purchases.filter(function (x) { return x.id !== id; });
      state.sales.forEach(function (s) { if (s.purchaseId === id) s.purchaseId = null; });
    } else {
      var s = state.sales.find(function (x) { return x.id === id; });
      if (s && s.purchaseId) {
        var np = state.purchases.find(function (x) { return x.id === s.purchaseId; });
        if (np && np.saleId === id) { np.saleId = null; np.stockStatus = "instock"; }
      }
      state.sales = state.sales.filter(function (x) { return x.id !== id; });
    }
    if (ui.selected && ui.selected.id === id) ui.selected = null;
    save();
    renderAll();
    toast(label + "已删除");
  }

  function delTrack(id) {
    if (!confirm("确定删除这条物流单吗？")) return;
    var t = state.tracks.find(function (x) { return x.id === id; });
    if (t && t.purchaseId) {
      var p = state.purchases.find(function (x) { return x.id === t.purchaseId; });
      if (p && p.trackId === id) p.trackId = null;
    }
    state.tracks = state.tracks.filter(function (x) { return x.id !== id; });
    save();
    renderAll();
    toast("物流单已删除");
  }

  function bindTrack(sel, trackId) {
    var pid = sel.value;
    var t = state.tracks.find(function (x) { return x.id === trackId; });
    if (!t) return;
    if (t.purchaseId) {
      var op = state.purchases.find(function (x) { return x.id === t.purchaseId; });
      if (op && op.trackId === trackId) op.trackId = null;
    }
    t.purchaseId = pid || null;
    t.updatedAt = Date.now();
    if (pid) {
      var p = state.purchases.find(function (x) { return x.id === pid; });
      if (p) { p.trackId = trackId; p.carrier = t.carrier; p.trackingNo = t.trackingNo; p.lsStatus = t.status; }
    }
    save();
    renderAll();
    toast(pid ? "物流已绑定到采购卡片" : "已解除绑定");
  }

  function addTrackFromDetail(purchaseId) {
    var p = state.purchases.find(function (x) { return x.id === purchaseId; });
    if (!p) return;
    var note = $("#th-note").value.trim();
    var date = $("#th-date").value || todayStr();
    if (!note) { toast("请填写轨迹描述"); return; }
    var t = trackOf(p);
    if (!t) {
      t = { id: uid(), carrier: p.carrier || "Flash Express", trackingNo: p.trackingNo || "", status: p.lsStatus || "待下单", country: p.country, history: [], purchaseId: p.id, createdAt: Date.now(), updatedAt: Date.now() };
      state.tracks.unshift(t);
      p.trackId = t.id;
    }
    t.history = t.history || [];
    t.history.push({ date: date, note: note });
    t.updatedAt = Date.now();
    save();
    renderAll();
    toast("轨迹已登记");
  }

  function selectCard(type, id) {
    ui.selected = { type: type, id: id };
    ui.rightTab = "detail";
    setRightTab("detail");
    openSheet();
    renderRight();
    renderMain();
  }

  function setRightTab(tab) {
    ui.rightTab = tab;
    $$("#rightTabs .rt").forEach(function (b) {
      b.classList.toggle("on", b.dataset.rt === tab);
    });
    renderRight();
  }

  function exportData() {
    var data = JSON.stringify(state);
    var blob = new Blob([data], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "海淘记录备份_" + todayStr() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast("已导出 JSON 备份");
  }

  function importJson(text) {
    var d;
    try { d = JSON.parse(text); } catch (e) { toast("导入失败：不是有效的 JSON"); return; }
    if (!d || !Array.isArray(d.purchases) || !Array.isArray(d.sales) || !Array.isArray(d.tracks)) {
      toast("导入失败：文件格式不正确"); return;
    }
    if (!confirm("导入将覆盖当前全部数据，确定继续吗？")) return;
    state = {
      v: 1,
      theme: d.theme || state.theme,
      purchases: d.purchases,
      sales: d.sales,
      tracks: d.tracks,
      ledger: Array.isArray(d.ledger) ? d.ledger : [],
      meta: state.meta
    };
    save();
    applyTheme(state.theme);
    renderAll();
    toast("导入成功，共 " + state.purchases.length + " 采购 / " + state.sales.length + " 售卖 / " + state.ledger.length + " 账目");
  }

  function shareData() {
    var data = JSON.stringify(state);
    var box = $("#qrBox");
    if (typeof QRCode === "undefined") {
      box.hidden = false;
      box.innerHTML = '<div class="hint">二维码组件加载中，请稍候几秒再试，或直接使用「导出 JSON 备份」。</div>';
      return;
    }
    if (data.length > 1900) {
      box.hidden = false;
      box.innerHTML = '<div class="hint">当前数据较大（' + data.length + " 字符），无法生成二维码。<br>请使用「导出 JSON 备份」后，在另一设备「导入」。</div>";
      return;
    }
    box.hidden = false;
    box.innerHTML = '<div class="hint">用另一台设备的浏览器扫码即可读取（约 1900 字符以内可扫码）。</div><div id="qrCanvas"></div>';
    var qr = new QRCode(document.getElementById("qrCanvas"), { width: 190, height: 190, correctLevel: QRCode.CorrectLevel.L });
    qr.makeCode(data);
  }

  function copyText(txt) {
    var done = function () { toast("已复制：" + (txt.length > 24 ? txt.slice(0, 24) + "…" : txt)); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt); done(); });
    } else {
      fallbackCopy(txt); done();
    }
  }
  function fallbackCopy(txt) {
    var ta = document.createElement("textarea");
    ta.value = txt;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    renderThemeBtns();
  }
  function renderThemeBtns() {
    var box = $("#themeBtns");
    if (!box) return;
    box.innerHTML = THEMES.map(function (t) {
      return '<button class="theme-btn' + (state.theme === t.id ? " on" : "") + '" data-settheme="' + t.id + '" title="' + t.name + '">' +
        '<span class="theme-swatch" style="background:linear-gradient(135deg,' + t.colors[0] + " 0 55%," + t.colors[1] + " 55% 80%," + t.colors[2] + " 80%)'></span>" +
        "<em>" + t.name + "</em>" +
        "</button>";
    }).join("");
  }

  function openLightbox(src) {
    var lb = $("#lightbox");
    lb.hidden = false;
    lb.innerHTML = '<img src="' + src + '" alt="">';
  }

  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._tm);
    t._tm = setTimeout(function () { t.hidden = true; }, 2200);
  }

  function bindGlobalEvents() {
    $("#bottomNav").addEventListener("click", function (e) {
      var b = e.target.closest("[data-view]");
      if (!b) return;
      ui.view = b.dataset.view;
      ui.q = "";
      ui.country = "";
      ui.ls = "";
      ui.stock = "";
      renderBottomNav();
      renderToolbar();
      renderMain();
      renderSheet();
    });

    $("#rightTabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-rt]");
      if (b) setRightTab(b.dataset.rt);
    });

    $("#cardGrid").addEventListener("click", function (e) {
      var lact = e.target.closest("[data-lact]");
      if (lact) {
        e.stopPropagation();
        var id = lact.dataset.id;
        var it = state.ledger.find(function (x) { return x.id === id; });
        if (!it) return;
        if (lact.dataset.lact === "ledit") openLedger(it);
        else if (lact.dataset.lact === "ldel") delLedger(id);
        return;
      }
      var limg = e.target.closest('.ledger-row [data-act="lightbox"]');
      if (limg) { e.stopPropagation(); openLightbox(limg.dataset.img); return; }
      var lc = e.target.closest(".logi-card");
      if (lc) {
        var la = e.target.closest("[data-act]");
        if (la) {
          e.stopPropagation();
          var laa = la.dataset.act;
          if (laa === "copy") copyText(la.dataset.no);
          else if (laa === "link") { var u = CARRIER_URL[la.dataset.carrier]; if (u) window.open(u, "_blank"); else toast("暂无该快递官网链接"); }
          else if (laa === "edittrack") openEditTrack(la.dataset.track);
          else if (laa === "deltrack") delTrack(la.dataset.track);
        }
        return;
      }
      var card = e.target.closest(".card");
      if (!card) return;
      var act = e.target.closest("[data-act]");
      var type = card.dataset.type, id = card.dataset.id;
      var media = e.target.closest(".card-media");
      if (act) {
        e.stopPropagation();
        var a = act.dataset.act;
        if (a === "edit") openEditByType(type, id);
        else if (a === "del") delRecord(type, id);
        else if (a === "sell") { var p = state.purchases.find(function (x) { return x.id === id; }); if (p) openSale({}, p); }
        return;
      }
      if (media) {
        var img = media.dataset.img;
        if (img) { openLightbox(img); return; }
        openEditByType(type, id);
        return;
      }
      selectCard(type, id);
    });

    var jumpClick = function (e) {
      var it = e.target.closest("[data-jump]");
      if (!it) return;
      var parts = it.dataset.jump.split(":");
      var type = parts[0], id = parts.slice(1).join(":");
      ui.view = type === "purchase" ? "purchases" : "sales";
      renderBottomNav();
      renderToolbar();
      selectCard(type, id);
      renderMain();
    };
    $("#cardGrid").addEventListener("click", jumpClick);

    $("#cardGrid").addEventListener("change", function (e) {
      if (e.target.dataset.setstatus) setTrackStatus(e.target.dataset.setstatus, e.target.value);
      if (e.target.dataset.bindtrack) bindTrack(e.target, e.target.dataset.bindtrack);
    });

    $("#rightContent").addEventListener("click", function (e) {
      var el = e.target.closest("[data-act]");
      if (!el) return;
      var a = el.dataset.act;
      if (a === "addtrack") addTrackFromDetail(el.dataset.id);
      else if (a === "edit") openEditByType(el.dataset.type, el.dataset.id);
      else if (a === "del") delRecord(el.dataset.type, el.dataset.id);
      else if (a === "sell") { var p = state.purchases.find(function (x) { return x.id === el.dataset.id; }); if (p) openSale({}, p); }
      else if (a === "copy") copyText(el.dataset.no);
      else if (a === "link") { var u = CARRIER_URL[el.dataset.carrier]; if (u) window.open(u, "_blank"); else toast("暂无该快递官网链接"); }
      else if (a === "lightbox") openLightbox(el.dataset.img);
      else if (a === "edittrack") openEditTrack(el.dataset.track);
      else if (a === "deltrack") delTrack(el.dataset.track);
    });

    $("#rightContent").addEventListener("change", function (e) {
      if (e.target.classList.contains("q-status")) {
        var trackId = e.target.dataset.track;
        var purchaseId = e.target.dataset.purchase;
        if (trackId) {
          setTrackStatus(trackId, e.target.value);
        } else if (purchaseId) {
          var p = state.purchases.find(function (x) { return x.id === purchaseId; });
          if (p) {
            p.lsStatus = e.target.value;
            save();
            renderAll();
            toast("状态已更新");
          }
        }
      }
      if (e.target.dataset.setstatus) setTrackStatus(e.target.dataset.setstatus, e.target.value);
      if (e.target.dataset.bindtrack) bindTrack(e.target, e.target.dataset.bindtrack);
    });

    $("#themeBtns").addEventListener("click", function (e) {
      var b = e.target.closest("[data-settheme]");
      if (!b) return;
      state.theme = b.dataset.settheme;
      save();
      applyTheme(state.theme);
      toast("已切换皮肤：" + (THEMES.find(function (t) { return t.id === state.theme; }) || {}).name);
    });

    $("#modalClose").addEventListener("click", closeModal);
    $("#modalMask").addEventListener("click", function (e) { if (e.target === this) closeModal(); });

    $("#lightbox").addEventListener("click", function () { this.hidden = true; this.innerHTML = ""; });

    $("#btnFull").addEventListener("click", function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function () {});
      } else {
        document.exitFullscreen().catch(function () {});
      }
    });
  }

  function openEditByType(type, id) {
    if (type === "purchase") {
      var p = state.purchases.find(function (x) { return x.id === id; });
      if (p) openPurchase(p);
    } else if (type === "sale") {
      var s = state.sales.find(function (x) { return x.id === id; });
      if (s) openSale(s);
    }
  }

  function renderAll() {
    renderBottomNav();
    renderStats();
    renderToolbar();
    renderMain();
    renderSheet();
  }

  function init() {
    $("#logoIcon").innerHTML = ic("backpack", 46);
    renderThemeBtns();
    applyTheme(state.theme);
    bindGlobalEvents();
    bindDataEvents();
    $("#sheetClose").addEventListener("click", closeSheet);
    renderAll();
    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(function () {});
      var reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (reloading) return;
        reloading = true;
        location.reload();
      });
    }
  }

  function bindDataEvents() {
    document.addEventListener("click", function (e) {
      var b = e.target.closest("#btnExport");
      if (b) { exportData(); return; }
      var s = e.target.closest("#btnShare");
      if (s) { shareData(); return; }
      var ifr = e.target.closest("#btnImportFile");
      if (ifr) { $("#importFile").click(); return; }
      var icp = e.target.closest("#btnImportClip");
      if (icp) {
        var txt = prompt("请粘贴之前复制的 JSON 备份内容：");
        if (txt) importJson(txt);
        return;
      }
      var clear = e.target.closest("#btnClearAll");
      if (clear) {
        if (confirm("确定清空本设备全部数据吗？此操作无法撤销！")) {
          state = defaultState();
          state.theme = "farm";
          save();
          idbDel(KEY).catch(function () {});
          applyTheme(state.theme);
          renderAll();
          toast("数据已清空");
        }
        return;
      }
      var ts = e.target.closest(".theme-set");
      if (ts) { state.theme = ts.dataset.theme; save(); applyTheme(state.theme); renderAll(); }
    });
    document.addEventListener("change", function (e) {
      if (e.target.id === "importFile") {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var fr = new FileReader();
        fr.onload = function () { importJson(fr.result); };
        fr.readAsText(f);
        e.target.value = "";
      }
    });
  }

  if (typeof QRCode === "undefined") {
    var s = document.createElement("script");
    s.src = "./js/qrcode.min.js";
    s.onload = function () {};
    s.onerror = function () {};
    document.head.appendChild(s);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
