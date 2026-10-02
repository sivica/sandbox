const $ = (id) => document.getElementById(id);
let csrf = "",
  owner = false;
const node = (tag, text) => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  return e;
};
async function api(path, body) {
  const r = await fetch("/api/admin" + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error || "Request failed");
  return d;
}
async function run(fn) {
  try {
    await fn();
  } catch (e) {
    $("message").textContent = e.message;
  }
}
function form(title, fields, submit) {
  const f = node("form");
  f.append(node("h2", title));
  for (const [name, label, type, value] of fields) {
    const l = node("label", label),
      i = node(type === "select" ? "select" : "input");
    i.name = name;
    if (type === "select") {
      for (const v of value) {
        const o = node("option", v);
        o.value = v;
        i.append(o);
      }
    } else {
      i.type = type;
      i.value = value || "";
      if (type === "number") {
        i.min = 0;
        i.step = "any";
      }
    }
    l.append(i);
    f.append(l);
  }
  f.append(node("button", "Save " + title.toLowerCase()));
  f.onsubmit = (e) => {
    e.preventDefault();
    run(async () => {
      await submit(Object.fromEntries(new FormData(f)));
      $("message").textContent = "Saved in the synthetic demo.";
      await load();
    });
  };
  $("content").append(f);
}
async function load() {
  const session = await api("/session");
  csrf = session.csrf;
  owner = session.role === "owner";
  $("content").replaceChildren();
  if (!owner) {
    const ops = await api("/operations");
    $("content").append(
      node("h2", "Support view: operational logs only"),
      node("pre", JSON.stringify(ops, null, 2)),
    );
    return;
  }
  const data = await api("/demo");
  $("content").append(
    node(
      "p",
      `Profile: ${data.resource.profile}. Weekly retention review ${data.retentionReviewOverdue ? "overdue" : "recorded"}.`,
    ),
  );
  const activate = node("button", "Activate fictional studio rules");
  activate.onclick = () =>
    run(async () => {
      if (
        !confirm("Activate fictional studio rules? Existing bookings remain.")
      )
        return;
      await api("/demo/profile", { confirmation: "USE FICTIONAL DEMO RULES" });
      await load();
    });
  $("content").append(activate);
  form(
    "Owner reservation",
    [
      ["name", "Invented name", "text", "Demo Guest"],
      ["email", "Synthetic contact", "email", "demo-guest@example.com"],
      ["channel", "Channel", "select", ["phone", "messaging", "web"]],
      ["startsAt", "Treatment start (UTC ISO)", "text", ""],
    ],
    async (d) => {
      const s = await fetch("/api/services").then((r) => r.json());
      await api("/demo/bookings", {
        ...d,
        serviceId: s.services[0]?.id,
        requestId: crypto.randomUUID(),
      });
    },
  );
  form(
    "Calendar block",
    [
      ["kind", "Block kind", "select", ["closure", "travel", "other"]],
      ["startsAt", "Occupied start (UTC ISO)", "text", ""],
      ["endsAt", "Occupied end (UTC ISO)", "text", ""],
      ["reason", "Synthetic reason", "text", ""],
      [
        "affected",
        "Affected booking IDs to cancel (comma separated; explicit)",
        "text",
        "",
      ],
    ],
    (d) =>
      api("/demo/blocks", {
        ...d,
        cancelBookingIds: d.affected
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }),
  );
  for (const b of data.blocks) {
    const a = node(
        "article",
        `${b.kind}: ${b.starts_at} – ${b.ends_at}; ${b.reason}`,
      ),
      release = node("button", "Release block");
    release.onclick = () =>
      run(async () => {
        await api("/demo/blocks/" + b.id + "/release", {});
        await load();
      });
    a.append(release);
    $("content").append(a);
  }
  form(
    "Reschedule",
    [
      ["id", "Booking ID", "text", ""],
      ["startsAt", "Replacement treatment start (UTC ISO)", "text", ""],
    ],
    (d) =>
      api("/demo/bookings/" + d.id + "/reschedule", { startsAt: d.startsAt }),
  );
  form(
    "Attendance",
    [
      ["id", "Booking ID", "text", ""],
      ["outcome", "Outcome", "select", ["pending", "attended", "no_show"]],
      ["paid", "Payment received (synthetic)", "select", ["false", "true"]],
    ],
    (d) =>
      api("/demo/bookings/" + d.id + "/outcome", {
        outcome: d.outcome,
        paid: d.paid === "true",
      }),
  );
  form(
    "Manual operations",
    [
      [
        "kind",
        "Record kind",
        "select",
        ["inquiry", "contact", "reconciliation", "alert"],
      ],
      [
        "action",
        "Action",
        "select",
        [
          "receipt",
          "owner_closure",
          "customer_change",
          "reconciled",
          "failure",
          "recovery",
        ],
      ],
      ["channel", "Channel", "select", ["phone", "messaging", "web"]],
      ["bookingId", "Booking ID (optional)", "text", ""],
    ],
    (d) =>
      api("/demo/records", {
        kind: d.kind,
        bookingId: d.bookingId || null,
        data: {
          action: d.action,
          channel: d.channel,
          contactPending: d.kind === "contact",
        },
      }),
  );
  form(
    "Economics",
    [
      ["channel", "Channel", "select", ["web", "phone", "messaging"]],
      [
        "minutes",
        "Total administration minutes including checking",
        "number",
        "",
      ],
      ["manual", "Manual intervention", "select", ["true", "false"]],
      ["entryError", "Entry error", "select", ["false", "true"]],
      [
        "outcome",
        "Outcome",
        "select",
        ["pending", "attended", "attended_unpaid", "cancelled", "no_show"],
      ],
      ["paid", "Payment received (synthetic)", "select", ["false", "true"]],
    ],
    (d) =>
      api("/demo/records", {
        kind: "economics",
        data: {
          ...d,
          minutes: Number(d.minutes),
          manual: d.manual === "true",
          entryError: d.entryError === "true",
          paid: d.paid === "true",
        },
      }),
  );
  const exportLink = node("a", "Download synthetic economics CSV");
  exportLink.href = "/api/admin/demo/economics.csv";
  $("content").append(exportLink);
  const measured = data.records.filter((r) => r.kind === "economics");
  $("content").append(
    node(
      "p",
      `Recorded ${measured.length} recent synthetic inquiry outcomes. Targets are fictional: ≤3 admin minutes, ≤50% manual handling, ≥80% attended-and-paid, zero conflicts. Fee hypothesis MKD 1,500; owner time hypothesis MKD 600/hour. No savings have been established.`,
    ),
    node("h2", "Synthetic records"),
    node("pre", JSON.stringify(data.records, null, 2)),
  );
}
run(load);
