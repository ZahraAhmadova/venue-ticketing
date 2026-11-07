const seats = [];
const seatsById = new Map();
let inspectedId = null;
const cart = [];

const venueEl   = document.getElementById("venue");
const legendEl  = document.getElementById("legend");
const detailsEl = document.getElementById("seat-details");
const cartEl    = document.getElementById("cart");
const STORAGE_KEY = "venue-ticketing-cart";

function rowLetter(index) {
  return String.fromCharCode(65 + index);
}

function generateSeats() {
  VENUE.sections.forEach(section => {
    const cat = VENUE.categories[section.category];
    const spanDeg = section.toAngle - section.fromAngle;
    const spanRad = spanDeg * Math.PI / 180;

    for (let r = 0; r < section.rows; r++) {
      const radius = section.startRadius + r * section.rowGap;
      const count = Math.floor((radius * spanRad) / VENUE.seatSpacing);
      const row = rowLetter(r);

      for (let n = 1; n <= count; n++) {
        const angle = section.fromAngle + spanDeg * (n - 0.5) / count;
        const rad = angle * Math.PI / 180;
        const id = `${section.id}-${row}${n}`;

        const seat = {
          id,
          sectionId: section.id,
          sectionName: section.name,
          row,
          number: n,
          category: section.category,
          categoryLabel: cat.label,
          price: cat.price,
          unavailable: VENUE.unavailable.includes(id),
          x: VENUE.focus.x + radius * Math.sin(rad),
          y: VENUE.focus.y + radius * Math.cos(rad),
          angle,
          el: null
        };
        seats.push(seat);
        seatsById.set(id, seat);
      }
    }
  });
}

function renderVenue() {
  venueEl.style.width = VENUE.world.width + "px";
  venueEl.style.height = VENUE.world.height + "px";

  const st = VENUE.stage;
  venueEl.innerHTML =
    `<div class="stage" style="left:${st.x}px;top:${st.y}px;width:${st.width}px;height:${st.height}px">STAGE</div>`;

  VENUE.sections.forEach(section => {
    const midRad = ((section.fromAngle + section.toAngle) / 2) * Math.PI / 180;
    const labelRadius = section.labelRadius ?? (section.startRadius + section.rows * section.rowGap + 6);
    const label = document.createElement("div");
    label.className = "section-label";
    label.textContent = section.name;
    label.style.left = (VENUE.focus.x + labelRadius * Math.sin(midRad)) + "px";
    label.style.top  = (VENUE.focus.y + labelRadius * Math.cos(midRad)) + "px";
    venueEl.appendChild(label);
  });

  const half = 12;
  seats.forEach(seat => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "seat";
    btn.dataset.id = seat.id;
    btn.style.left = (seat.x - half) + "px";
    btn.style.top  = (seat.y - half) + "px";
    btn.style.setProperty("--rot", (-seat.angle) + "deg");
    btn.style.setProperty("--cat", VENUE.categories[seat.category].color);
    btn.setAttribute(
      "aria-label",
      `${seat.sectionName}, row ${seat.row}, seat ${seat.number}, $${seat.price}`
    );
    btn.addEventListener("click", () => inspectSeat(seat.id));
    seat.el = btn;
    venueEl.appendChild(btn);
  });
}

function renderLegend() {
  const items = Object.values(VENUE.categories).map(c =>
    `<li><span class="swatch" style="background:${c.color}"></span>${c.label} – $${c.price}</li>`
  );
  items.push('<li><span class="swatch" style="background:#16a34a"></span>In cart</li>');
  items.push('<li><span class="swatch" style="background:#444a5c"></span>Unavailable</li>');
  legendEl.innerHTML = items.join("");
}

function getSeatState(seat) {
  if (seat.unavailable) return "unavailable";
  if (cart.includes(seat.id)) return "in-cart";
  if (seat.id === inspectedId) return "inspected";
  return "available";
}

function updateSeatElement(seat) {
  const state = getSeatState(seat);
  seat.el.className = "seat " + state;
  seat.el.setAttribute("aria-pressed", state === "inspected");
}

function updateAllSeats() {
  seats.forEach(updateSeatElement);
}

function inspectSeat(id) {
  const previous = seatsById.get(inspectedId);
  inspectedId = id;
  if (previous) updateSeatElement(previous);
  updateSeatElement(seatsById.get(id));
  renderDetails();
}

function renderDetails() {
  const seat = seatsById.get(inspectedId);
  if (!seat) {
    detailsEl.innerHTML = `<h2>Seat details</h2><p class="muted">Select a seat on the map.</p>`;
    return;
  }

  const state = getSeatState(seat);
  const statusText = {
    available: "Available",
    inspected: "Available",
    "in-cart": "Already in your cart",
    unavailable: "Unavailable (sold)"
  }[state];

  const canAdd = state === "inspected";

  detailsEl.innerHTML = `
    <h2>Seat details</h2>
    <div class="detail-row"><span>Section</span><strong>${seat.sectionName}</strong></div>
    <div class="detail-row"><span>Row</span><strong>${seat.row}</strong></div>
    <div class="detail-row"><span>Seat</span><strong>${seat.number}</strong></div>
    <div class="detail-row"><span>Category</span><strong>${seat.categoryLabel}</strong></div>
    <div class="detail-row"><span>Price</span><strong>$${seat.price}</strong></div>
    <div class="detail-row"><span>Status</span><strong>${statusText}</strong></div>
    <button class="btn" id="add-btn" ${canAdd ? "" : "disabled"}>ADD TO CART</button>
  `;
  document.getElementById("add-btn").addEventListener("click", () => addToCart(seat.id));
}

function addToCart(id) {
  const seat = seatsById.get(id);
  if (!seat || seat.unavailable || cart.includes(id)) return;
  cart.push(id);
  saveCart();
  updateSeatElement(seat);
  renderDetails();
  renderCart();
}

function removeFromCart(id) {
  const index = cart.indexOf(id);
  if (index === -1) return;
  cart.splice(index, 1);
  saveCart();
  updateSeatElement(seatsById.get(id));
  renderDetails();
  renderCart();
}

function getTotal() {
  return cart.reduce((sum, id) => sum + seatsById.get(id).price, 0);
}

function renderCart() {
  if (cart.length === 0) {
    cartEl.innerHTML = `
      <h2>Your cart</h2>
      <p class="muted">Your cart is empty</p>
      <p class="total">Total: $0</p>
    `;
    return;
  }

  const rows = cart.map(id => {
    const seat = seatsById.get(id);
    return `
      <li class="cart-item">
        <span>${seat.sectionName}, Row ${seat.row}, Seat ${seat.number}</span>
        <span class="cart-price">$${seat.price}</span>
        <button type="button" class="remove-btn" data-id="${id}" aria-label="Remove ${seat.sectionName} row ${seat.row} seat ${seat.number} from cart">Remove</button>
      </li>
    `;
  }).join("");

  cartEl.innerHTML = `
    <h2>Your cart (${cart.length})</h2>
    <ul class="cart-list">${rows}</ul>
    <p class="total">Total: $${getTotal()}</p>
  `;

  cartEl.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.id));
  });
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {}
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return;
    saved.forEach(id => {
      const seat = seatsById.get(id);
      if (seat && !seat.unavailable && !cart.includes(id)) cart.push(id);
    });
    saveCart();
  } catch (e) {}
}
const view = { scale: 1, x: 0, y: 0 };
const ZOOM_STEP = 1.25;
const PAN_STEP = 80;
const MIN_SCALE = 0.3;
const MAX_SCALE = 3;
const KEEP_VISIBLE = 0.25;

function clampView() {
  const vw = viewportEl.clientWidth;
  const vh = viewportEl.clientHeight;
  const ww = VENUE.world.width * view.scale;
  const wh = VENUE.world.height * view.scale;
  view.x = Math.min(vw - ww * KEEP_VISIBLE, Math.max(-ww * (1 - KEEP_VISIBLE), view.x));
  view.y = Math.min(vh - wh * KEEP_VISIBLE, Math.max(-wh * (1 - KEEP_VISIBLE), view.y));
}
function applyView() {
  clampView();
  venueEl.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
}
function zoomBy(factor) {
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor));
  const ratio = newScale / view.scale;
  const cx = viewportEl.clientWidth / 2;
  const cy = viewportEl.clientHeight / 2;
  view.x = cx - (cx - view.x) * ratio;
  view.y = cy - (cy - view.y) * ratio;
  view.scale = newScale;
  applyView();
}
function panBy(dx, dy) {
  view.x += dx;
  view.y += dy;
  applyView();
}
function resetView() {
  const vw = viewportEl.clientWidth;
  const vh = viewportEl.clientHeight;
  const fit = Math.min(vw / VENUE.world.width, vh / VENUE.world.height);
  view.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, fit));
  view.x = (vw - VENUE.world.width * view.scale) / 2;
  view.y = (vh - VENUE.world.height * view.scale) / 2;
  applyView();
}
function setupControls() {
  document.getElementById("zoom-in").addEventListener("click", () => zoomBy(ZOOM_STEP));
  document.getElementById("zoom-out").addEventListener("click", () => zoomBy(1 / ZOOM_STEP));
  document.getElementById("move-up").addEventListener("click", () => panBy(0, PAN_STEP));
  document.getElementById("move-down").addEventListener("click", () => panBy(0, -PAN_STEP));
  document.getElementById("move-left").addEventListener("click", () => panBy(PAN_STEP, 0));
  document.getElementById("move-right").addEventListener("click", () => panBy(-PAN_STEP, 0));
  document.getElementById("reset-view").addEventListener("click", resetView);
  window.addEventListener("resize", applyView);
  viewportEl.addEventListener("scroll", () => {
    viewportEl.scrollTop = 0;
    viewportEl.scrollLeft = 0;
  });
}
function init() {
  generateSeats();
  loadCart();
  renderVenue();
  renderLegend();
  updateAllSeats();
  renderCart();
  setupControls();
  resetView();
}

init();