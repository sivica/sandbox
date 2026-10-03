export const screens = [
  "Service selection",
  "Treatment details",
  "Date and slots",
  "Contact details",
  "Confirmation",
];
export const styles = {
  "calm-spa": "Calm spa",
  "clean-clinic": "Clean clinic",
  "modern-boutique": "Modern boutique",
};
export const palettes = {
  "calm-spa": {
    ink: "#243d35",
    muted: "#52645b",
    paper: "#fffdf8",
    line: "#d6dfd5",
    accent: "#244f40",
    soft: "#eaf0e4",
    canvas: "#e6ebe4",
    radius: "22px",
    space: "24px",
    heading: "Georgia, serif",
  },
  "clean-clinic": {
    ink: "#15364c",
    muted: "#486271",
    paper: "#ffffff",
    line: "#cddde6",
    accent: "#165b7a",
    soft: "#eaf5fa",
    canvas: "#e7eff4",
    radius: "10px",
    space: "24px",
    heading: "system-ui, sans-serif",
  },
  "modern-boutique": {
    ink: "#3e2947",
    muted: "#67566e",
    paper: "#fffafc",
    line: "#e6d6e1",
    accent: "#693855",
    soft: "#f4e6ed",
    canvas: "#efe6ee",
    radius: "16px",
    space: "24px",
    heading: "Georgia, serif",
  },
};
export const example =
  "Design a calm, mobile-first treatment booking app. Include service selection, treatment details, date and available slots, contact details, and confirmation. Use accessible text, warm neutral colours and clear navigation. Show loading, unavailable-slot and booking-error states. Use fictional treatments and prices.";
export function sample(style) {
  return {
    style,
    tokens: palettes[style],
    screens: [
      {
        title: "Find your moment",
        subtitle: "A little space to rest and restore",
        action: "Explore treatment",
      },
      {
        title: "Demo Relaxation",
        subtitle: "A quiet hour, just for you",
        action: "Choose a time",
      },
      {
        title: "Make time for yourself",
        subtitle: "Illustrative availability · Europe/Skopje",
        action: "Continue",
      },
      {
        title: "Your details",
        subtitle: "Use fictional details in this preview",
        action: "Confirm booking",
      },
      {
        title: "You’re booked",
        subtitle: "Synthetic confirmation · no real reservation",
        action: "Back to treatments",
      },
    ],
  };
}
const allowed = new Set(Object.keys(palettes["calm-spa"]));
export function validateDesign(data) {
  if (
    !data ||
    !Object.hasOwn(styles, data.style) ||
    !Array.isArray(data.screens) ||
    data.screens.length !== 5
  )
    throw Error("A design needs five booking screens and a supported style.");
  const tokens = {};
  for (const key of allowed) {
    const value = data.tokens?.[key];
    if (
      typeof value !== "string" ||
      (key === "heading"
        ? !["Georgia, serif", "system-ui, sans-serif"].includes(value)
        : ["radius", "space"].includes(key)
          ? !/^([1-3]?\d|40)px$/.test(value)
          : !/^#[0-9a-f]{6}$/i.test(value))
    )
      throw Error("Invalid design token: " + key);
    tokens[key] = value;
  }
  const normalized = data.screens.map((screen) => {
    const result = {};
    for (const key of ["title", "subtitle", "action"]) {
      if (
        typeof screen?.[key] !== "string" ||
        !screen[key].trim() ||
        screen[key].length > 180
      )
        throw Error("Invalid screen copy.");
      result[key] = screen[key];
    }
    return result;
  });
  return { style: data.style, tokens, screens: normalized };
}
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function screenHTML(design, index) {
  const d = validateDesign(design),
    t = d.tokens,
    s = d.screens[index];
  const card = (x) => `<section class="card">${x}</section>`;
  const content = [
    card(
      "<small>REST & RESTORE</small><h2>Demo Relaxation</h2><p>A fictional studio treatment</p><strong>60 min · MKD 1,400</strong>",
    ),
    card(
      "<h2>A softer pace</h2><p>Gentle relaxation in a quiet room, with preparation and cleanup time.</p><p>60 minutes · MKD 1,400</p>",
    ),
    card(
      '<p>Illustrative weekday</p><div class="slots"><span>10:15</span><span>11:00</span><span>14:15</span><span>15:00</span></div>',
    ),
    card(
      '<label>Name<div class="field">Demo Guest</div></label><label>Email<div class="field">guest@example.test</div></label>',
    ),
    card(
      '<div class="tick">✓</div><h2>Demo Relaxation</h2><p>PREVIEW ONLY</p><p>60 min · MKD 1,400</p>',
    ),
  ][index];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><style>*{box-sizing:border-box}body{margin:0;padding:22px;background:${t.paper};color:${t.ink};font:15px system-ui;min-height:100vh}header{font-weight:700;letter-spacing:2px;font-size:12px;padding:5px 0 32px}small{color:${t.muted};font-size:10px;letter-spacing:1px}h1,h2{font-family:${t.heading};font-weight:500}h1{font-size:29px;line-height:1.15}h2{font-size:21px}p{color:${t.muted};line-height:1.55}.card{padding:20px;border:1px solid ${t.line};border-radius:${t.radius};background:${t.soft};margin:24px 0}.action{padding:17px;text-align:center;background:${t.accent};color:white;border-radius:${t.radius};margin:24px 0;font-weight:600}.slots{display:grid;grid-template-columns:1fr 1fr;gap:10px}.slots span,.field{padding:13px;background:${t.paper};border:1px solid ${t.line};border-radius:10px}.field{margin:8px 0 18px}label{font-size:12px}.tick{font-size:42px}footer{font-size:11px;color:${t.muted};padding-top:18px}</style></head><body><header>KINDRED</header><small>STEP ${index + 1} OF 5</small><h1>${escape(s.title)}</h1><p>${escape(s.subtitle)}</p>${content}<div class="action">${escape(s.action)}</div><footer>Fictional design · synthetic details</footer></body></html>`;
}
