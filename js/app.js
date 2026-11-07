const seats = [];              
const seatsById = new Map();   
let inspectedId = null;
const cart = [];              

const venueEl   = document.getElementById("venue");
const legendEl  = document.getElementById("legend");
const detailsEl = document.getElementById("seat-details");

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
function init() {
  generateSeats();
  renderVenue();
  renderLegend();
  updateAllSeats();
}

init();