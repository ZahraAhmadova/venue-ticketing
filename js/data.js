const VENUE = {
  name: "Auditorium",

  world: { width: 1200, height: 720 },   
  focus: { x: 600, y: 30 },             
  seatSpacing: 30,                      

  stage: { x: 450, y: 0, width: 300, height: 80 },

  categories: {
    premium:  { label: "Premium",  price: 40, color: "#d4a017" },
    standard: { label: "Standard", price: 20, color: "#c02a4a" },
    economy:  { label: "Economy",  price: 10, color: "#5c7cfa" }
  },
  sections: [
    { id: "fc", name: "Front Center",       category: "premium",  rows: 7, startRadius: 194, rowGap: 32, fromAngle: -24, toAngle: 24, labelRadius: 150 },
    { id: "wl", name: "Left Wing",          category: "standard", rows: 8, startRadius: 200, rowGap: 32, fromAngle: -66, toAngle: -30, labelRadius: 150 },
    { id: "wr", name: "Right Wing",         category: "standard", rows: 8, startRadius: 200, rowGap: 32, fromAngle: 30,  toAngle: 66,  labelRadius: 150 },
    { id: "ul", name: "Upper Tier Left",    category: "economy",  rows: 5, startRadius: 470, rowGap: 32, fromAngle: -66, toAngle: -30 },
    { id: "uc", name: "Upper Tier Center",  category: "economy",  rows: 5, startRadius: 430, rowGap: 32, fromAngle: -24, toAngle: 24 },
    { id: "ur", name: "Upper Tier Right",   category: "economy",  rows: 5, startRadius: 470, rowGap: 32, fromAngle: 30,  toAngle: 66 }
  ],
  unavailable: [
    "fc-C3", "fc-C4", "fc-D5", "wl-B2",
    "wr-D4", "ul-A7", "uc-C6", "uc-C7",
    "ur-C10", "ur-C11"
  ]
};