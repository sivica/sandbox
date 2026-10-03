const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const created = new Map();
const simulated = process.env.TEST_PROFILE === "simulated";
const treatmentName = simulated ? "Demo Relaxation" : "Fresh start";
const treatmentId = simulated ? "demo-relaxation" : "glow";
test.beforeEach(async ({ page }) => {
  page.on("response", async (response) => {
    if (
      response.url().endsWith("/api/bookings") &&
      response.request().method() === "POST" &&
      response.ok()
    ) {
      try {
        const data = await response.json();
        created.set(data.booking.id, data.accessToken);
      } catch {}
    }
  });
});
test.afterEach(async ({ request, page }) => {
  const local = await page
    .evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem("kindred-staging-booking"));
      } catch {
        return null;
      }
    })
    .catch(() => null);
  if (local) created.set(local.id, local.accessToken);
  for (const [id, token] of created)
    await request.post(`/api/bookings/${id}/cancel`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    });
  created.clear();
});
async function settle(page) {
  await page.waitForTimeout(350);
}
async function audit(page) {
  await settle(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}
async function toDetails(page, request) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Feel like yourself, again." }),
  ).toBeVisible();
  await page.getByRole("button", { name: new RegExp(treatmentName) }).click();
  await expect(
    page.getByRole("heading", { name: treatmentName, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Choose a time →" }).click();
  const info = await (await request.get("/api/services")).json();
  const dates = [];
  let date, chosen;
  for (let i = 2; i < 15; i++) {
    const d = new Date(`${info.business.today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    date = d.toISOString().slice(0, 10);
    const data = await (
      await request.get(`/api/slots?serviceId=${treatmentId}&date=${date}`)
    ).json();
    if (data.slots.length) {
      chosen = data.slots[0];
      break;
    }
  }
  expect(chosen).toBeTruthy();
  await page.getByLabel("Choose a date").fill(date);
  await expect(page.getByText("Checking available times…")).not.toBeVisible();
  await page.getByRole("button", { name: chosen.label, exact: true }).click();
  await page.getByRole("button", { name: "Continue →" }).click();
  await expect(
    page.getByRole("heading", { name: "Your details", exact: true }),
  ).toBeVisible();
  return { date, chosen };
}
async function fill(page) {
  await page.getByLabel("Full name", { exact: true }).fill("Staging Tester");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("browser@example.com");
  await page
    .getByLabel("Anything we should know?")
    .fill("Invented browser test");
}

test("five screens, correction, pending locks, saved confirmation, reload and cancellation", async ({
  page,
  request,
}, testInfo) => {
  await toDetails(page, request);
  await page.getByRole("button", { name: "Confirm test booking →" }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeFocused();
  await audit(page);
  await page.getByLabel("Full name", { exact: true }).fill("Staging Tester");
  await page.getByLabel("Email address", { exact: true }).fill("bad");
  await page.getByRole("button", { name: "Confirm test booking →" }).click();
  await expect(page.locator("#email-error")).toHaveText(
    "Enter a valid email address.",
  );
  await page
    .getByLabel("Email address", { exact: true })
    .fill("browser@example.com");
  await expect(page.locator("#email-error")).toHaveCount(0);
  await expect(
    page.getByLabel("Email address", { exact: true }),
  ).toHaveAttribute("aria-invalid", "false");
  await page.route("**/api/bookings", async (route) => {
    await new Promise((r) => setTimeout(r, 500));
    await route.continue();
  });
  await page.getByRole("button", { name: "Confirm test booking →" }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Go back" })).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "A moment just for you." }),
  ).toBeVisible();
  const reference = await page.getByText(/^Reference STG-/).innerText();
  await expect(
    page.getByText("Status: confirmed", { exact: true }),
  ).toBeVisible();
  await audit(page);
  await page.reload();
  await expect(page.getByText(reference, { exact: true })).toBeVisible();
  await settle(page);
  await page.screenshot({
    path: testInfo.outputPath("saved-confirmation.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Cancel test booking", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Test booking cancelled." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Status: cancelled", { exact: true }),
  ).toBeVisible();
});

test("lost response after commit safely retries same booking across reload", async ({
  page,
  request,
}) => {
  await toDetails(page, request);
  await fill(page);
  let first = true,
    committed;
  await page.route("**/api/bookings", async (route) => {
    if (first) {
      first = false;
      const response = await route.fetch();
      committed = await response.json();
      created.set(committed.booking.id, committed.accessToken);
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Confirm test booking →" }).click();
  await expect(
    page.getByText(/The outcome is not confirmed yet/),
  ).toBeVisible();
  await expect(page.getByLabel("Full name", { exact: true })).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Check your booking request" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Retry same request", exact: true })
    .click();
  await expect(
    page.getByText(`Reference ${committed.booking.reference}`, { exact: true }),
  ).toBeVisible();
});

test("slot taken between selection and submit retains details and permits reselection", async ({
  page,
  request,
}) => {
  const { chosen } = await toDetails(page, request);
  await fill(page);
  const response = await request.post("/api/bookings", {
    headers: { "Idempotency-Key": require("node:crypto").randomUUID() },
    data: {
      serviceId: treatmentId,
      startsAt: chosen.startsAt,
      name: "Conflict Tester",
      email: "conflict@example.com",
      note: "",
    },
  });
  expect(response.status()).toBe(201);
  const booking = await response.json();
  created.set(booking.booking.id, booking.accessToken);
  await page.getByRole("button", { name: "Confirm test booking →" }).click();
  await expect(
    page.getByText(/That time is no longer available/),
  ).toBeVisible();
  await audit(page);
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "Staging Tester",
  );
  await page
    .getByRole("button", { name: "Choose another time", exact: true })
    .click();
  await expect(page.getByText("Checking available times…")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: chosen.label, exact: true }),
  ).toHaveCount(0);
  await page.locator(".times button").first().click();
  await page.getByRole("button", { name: "Continue →" }).click();
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "browser@example.com",
  );
  await page.getByRole("button", { name: "Confirm test booking →" }).click();
  await expect(
    page.getByRole("heading", { name: "A moment just for you." }),
  ).toBeVisible();
});

test("empty service count, unavailable date, API failure recovery and 200% text", async ({
  page,
  request,
}) => {
  await page.route("**/api/services", async (route) => {
    const response = await route.fetch(),
      data = await response.json();
    data.services = [];
    await route.fulfill({ response, json: data });
  });
  await page.goto("/");
  await expect(page.getByText("Our menu is being refreshed.")).toBeVisible();
  await expect(page.getByText("3 options", { exact: true })).toHaveCount(0);
  await audit(page);
  await page.unroute("**/api/services");
  await toDetails(page, request);
  await page.getByRole("button", { name: "Go back" }).click();
  const info = await (await request.get("/api/services")).json();
  let d = new Date(`${info.business.today}T12:00:00Z`);
  do {
    d.setUTCDate(d.getUTCDate() + 1);
  } while (d.getUTCDay() !== 0);
  await page.getByLabel("Choose a date").fill(d.toISOString().slice(0, 10));
  await expect(
    page.getByText("No appointments available", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue →" })).toBeDisabled();
  await audit(page);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  await page.route("**/api/slots?*", (route) =>
    route.fulfill({ status: 503, json: { error: "Availability interrupted" } }),
  );
  await page.getByLabel("Choose a date").fill(info.business.today);
  await expect(page.getByText("Availability interrupted")).toBeVisible();
  await page.unroute("**/api/slots?*");
  await page.getByRole("button", { name: "Retry availability" }).click();
  await expect(page.getByText("Availability interrupted")).not.toBeVisible();
});
