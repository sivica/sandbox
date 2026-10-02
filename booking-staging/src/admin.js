const $ = (id) => document.getElementById(id);
let csrf = "",
  offset = 0;
const message = (text) => ($("message").textContent = text);
async function api(path, body) {
  const r = await fetch("/api/admin" + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  if (!r.ok) {
    if (r.status === 401) {
      $("panel").hidden = true;
      $("login").hidden = false;
    }
    throw Error(data.error || "Request failed");
  }
  return data;
}
function element(tag, text) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  return e;
}
function input(form, label, name, value, type = "number") {
  const l = element("label", label),
    i = element("input");
  i.name = name;
  i.type = type;
  if (type === "checkbox") i.checked = value;
  else i.value = value;
  l.append(i);
  form.append(l);
  return i;
}
async function bookings() {
  const data = await api(
    `/bookings?offset=${offset}&status=${$("status").value}`,
  );
  $("bookings").replaceChildren();
  for (const b of data.bookings) {
    const a = element("article");
    a.append(
      element("h3", b.service_name),
      element("p", `${b.name} — ${b.status}`),
      element(
        "p",
        new Date(b.starts_at).toLocaleString(undefined, {
          timeZone: "Europe/Skopje",
        }) + " Europe/Skopje",
      ),
      element("p", b.email),
      element("p", b.note),
      element("p", b.reference),
    );
    if (b.status === "confirmed") {
      const button = element("button", "Cancel booking");
      button.onclick = () =>
        run(async () => {
          if (!confirm("Cancel this synthetic booking?")) return;
          await api(`/bookings/${b.id}/cancel`, {});
          await load();
          message("Booking cancelled.");
        });
      a.append(button);
    }
    $("bookings").append(a);
  }
  $("previous").disabled = offset === 0;
  $("next").disabled = !data.hasMore;
}
async function load() {
  await bookings();
  const s = await api("/settings");
  $("services").replaceChildren();
  for (const service of s.services) {
    const f = element("form");
    f.append(element("h3", service.name));
    const minutes = input(f, "Duration in minutes", "minutes", service.minutes);
    minutes.min = 15;
    minutes.max = 240;
    const price = input(f, "Price in cents", "price", service.price_cents);
    price.min = 0;
    const active = input(f, "Available", "active", service.active, "checkbox");
    f.append(element("button", "Save service"));
    f.onsubmit = (e) => {
      e.preventDefault();
      run(async () => {
        await api("/services/" + service.id, {
          minutes: Number(minutes.value),
          price_cents: Number(price.value),
          active: active.checked,
        });
        message("Service saved.");
      });
    };
    $("services").append(f);
  }
  $("days").replaceChildren();
  [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].forEach((day, index) => {
    const h = s.hours.find((h) => h.weekday === index + 1),
      f = element("article");
    f.dataset.weekday = index + 1;
    input(f, day, "enabled", !!h, "checkbox");
    input(f, "Opens", "opens", (h?.opens || "09:00").slice(0, 5), "time");
    input(f, "Closes", "closes", (h?.closes || "18:00").slice(0, 5), "time");
    $("days").append(f);
  });
  const retention = await api("/retention");
  $("retention").textContent =
    `${retention.eligible} synthetic bookings ended more than ${retention.days} days ago. Automatic deletion is off.`;
  const ops = await api("/operations");
  $("operations").replaceChildren(element("pre", JSON.stringify(ops, null, 2)));
}
async function run(fn) {
  try {
    await fn();
  } catch (e) {
    message(e.message);
  }
}
async function signed(data) {
  csrf = data.csrf;
  $("login").hidden = true;
  $("panel").hidden = false;
  if (data.role === "viewer") {
    location.href = "/demo.html";
    return;
  }
  await load();
}
$("signin").onsubmit = (e) => {
  e.preventDefault();
  run(async () => {
    const data = new FormData(e.target);
    await signed(
      await api("/login", {
        username: data.get("username"),
        password: data.get("password"),
      }),
    );
    e.target.password.value = "";
    message("Signed in.");
  });
};
$("logout").onclick = () =>
  run(async () => {
    await api("/logout", {});
    csrf = "";
    $("panel").hidden = true;
    $("login").hidden = false;
    message("Signed out.");
  });
$("status").onchange = () =>
  run(async () => {
    offset = 0;
    await bookings();
  });
$("previous").onclick = () =>
  run(async () => {
    offset = Math.max(0, offset - 50);
    await bookings();
  });
$("next").onclick = () =>
  run(async () => {
    offset += 50;
    await bookings();
  });
$("hours").onsubmit = (e) => {
  e.preventDefault();
  run(async () => {
    const hours = [...$("days").children]
      .filter((a) => a.querySelector("[name=enabled]").checked)
      .map((a) => ({
        weekday: Number(a.dataset.weekday),
        opens: a.querySelector("[name=opens]").value,
        closes: a.querySelector("[name=closes]").value,
      }));
    await api("/hours", { hours });
    message("Opening hours saved.");
  });
};
$("purge").onclick = () =>
  run(async () => {
    const r = await api("/retention");
    if (!r.eligible) {
      message("No bookings are eligible.");
      return;
    }
    if (
      prompt(
        `Delete ${r.eligible} old synthetic bookings? Type DELETE OLD SYNTHETIC BOOKINGS`,
      ) !== "DELETE OLD SYNTHETIC BOOKINGS"
    )
      return;
    const result = await api("/retention", {
      confirmation: "DELETE OLD SYNTHETIC BOOKINGS",
    });
    await load();
    message(`${result.deleted} old bookings deleted.`);
  });
run(async () => {
  try {
    await signed(await api("/session"));
  } catch (e) {
    message(e.message);
  }
});
