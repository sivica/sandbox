import React, { useState, useRef, useEffect } from "react";
import { requestApi as defaultApi } from "./booking-api.js";
const h = React.createElement;
const names = [
  "Services",
  "Service details",
  "Choose a time",
  "Your details",
  "Confirmation",
];
const SAVED = "kindred-staging-booking",
  PENDING = "kindred-staging-pending";
function readStore(store, key) {
  try {
    return JSON.parse(store.getItem(key));
  } catch {
    return null;
  }
}
function writeStore(store, key, value) {
  try {
    value ? store.setItem(key, JSON.stringify(value)) : store.removeItem(key);
  } catch {
    /* In-memory retry remains available when storage is blocked. */
  }
}
// Private receipt tokens stay in the fragment, never in HTTP requests or server logs.
const receipt = new URLSearchParams(location.hash.slice(1));
if (
  /^[0-9a-f-]{36}$/i.test(receipt.get("booking") || "") &&
  /^[0-9a-f]{64}$/.test(receipt.get("token") || "")
) {
  writeStore(localStorage, SAVED, {
    id: receipt.get("booking"),
    accessToken: receipt.get("token"),
  });
  history.replaceState(null, "", location.pathname);
}
const addDay = (date, count) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
};
const dateLabel = (date) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
const bookingTime = (booking) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: booking.timezone,
  }).format(new Date(booking.startsAt));
export function BookingApp({ requestApi = defaultApi } = {}) {
  const api = requestApi;
  const [step, setStep] = useState(0),
    [services, setServices] = useState([]),
    [business, setBusiness] = useState(null),
    [service, setService] = useState(null),
    [day, setDay] = useState(""),
    [slot, setSlot] = useState(null),
    [slots, setSlots] = useState([]),
    [slotsLoading, setSlotsLoading] = useState(false),
    [slotsError, setSlotsError] = useState(""),
    [bootLoading, setBootLoading] = useState(true),
    [bootError, setBootError] = useState(""),
    [refresh, setRefresh] = useState(0),
    [form, setForm] = useState({
      name: "",
      email: "",
      note: "",
      contactRoute: "email",
    }),
    [errors, setErrors] = useState({}),
    [validationAttempt, setValidationAttempt] = useState(0),
    [sending, setSending] = useState(false),
    [submitError, setSubmitError] = useState(""),
    [slotConflict, setSlotConflict] = useState(false),
    [confirmed, setConfirmed] = useState(null),
    [cancelError, setCancelError] = useState(""),
    [pending, setPending] = useState(() => readStore(sessionStorage, PENDING)),
    [saved, setSaved] = useState(() => readStore(localStorage, SAVED));
  const screenRef = useRef(null),
    nameRef = useRef(null),
    emailRef = useRef(null),
    inFlight = useRef(false),
    pendingRef = useRef(pending);
  useEffect(() => {
    screenRef.current?.querySelector("h1")?.focus();
  }, [step, bootLoading]);
  useEffect(() => {
    if (validationAttempt && Object.keys(errors).length)
      (errors.name ? nameRef : emailRef).current?.focus();
  }, [validationAttempt]);
  const button = (label, onClick, props = {}) =>
    h("button", { type: "button", onClick, ...props }, label);
  async function restoreBooking(record) {
    const result = await api(`/api/bookings/${encodeURIComponent(record.id)}`, {
      headers: { Authorization: `Bearer ${record.accessToken}` },
    });
    setConfirmed(result.booking);
    setStep(4);
    return result.booking;
  }
  useEffect(() => {
    let active = true;
    (async () => {
      setBootLoading(true);
      setBootError("");
      try {
        const data = await api("/api/services");
        if (!active) return;
        setServices(data.services);
        setBusiness(data.business);
        setDay((current) => current || addDay(data.business.today, 1));
        if (pendingRef.current) {
          setSubmitError(
            "A previous request needs its outcome checked. Retry it before starting another booking.",
          );
        } else if (saved) {
          try {
            await restoreBooking(saved);
          } catch (error) {
            if (error.status === 404) {
              writeStore(localStorage, SAVED, null);
              setSaved(null);
            } else
              setBootError(
                "Your saved booking could not be loaded. Retry to check its status.",
              );
          }
        }
      } catch (error) {
        if (active) setBootError(error.message);
      } finally {
        if (active) setBootLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (step !== 2 || !service || !day) return;
    const controller = new AbortController();
    setSlotsLoading(true);
    setSlotsError("");
    setSlots([]);
    api(
      `/api/slots?serviceId=${encodeURIComponent(service.id)}&date=${encodeURIComponent(day)}`,
      { signal: controller.signal },
    )
      .then((data) => {
        setSlots(data.slots);
        setSlot(
          (current) =>
            data.slots.find((s) => s.startsAt === current?.startsAt) || null,
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted) setSlotsError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSlotsLoading(false);
      });
    return () => controller.abort();
  }, [step, service, day, refresh]);
  async function sendBooking(request) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setSubmitError("");
    setSlotConflict(false);
    pendingRef.current = request;
    setPending(request);
    writeStore(sessionStorage, PENDING, request);
    try {
      const result = await api("/api/bookings", {
        method: "POST",
        headers: { "Idempotency-Key": request.key },
        body: JSON.stringify(request.payload),
      });
      const record = { id: result.booking.id, accessToken: result.accessToken };
      writeStore(localStorage, SAVED, record);
      setSaved(record);
      setConfirmed(result.booking);
      setStep(4);
      writeStore(sessionStorage, PENDING, null);
      pendingRef.current = null;
      setPending(null);
    } catch (error) {
      if (
        error.status &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 429
      ) {
        writeStore(sessionStorage, PENDING, null);
        pendingRef.current = null;
        setPending(null);
        setSlotConflict(error.code === "slot_unavailable");
        setSubmitError(error.message);
      } else {
        setSubmitError(
          "Checking reservation. The outcome is not confirmed yet. Retry the same request to check it safely; no second booking will be created.",
        );
      }
    } finally {
      setSending(false);
      inFlight.current = false;
    }
  }
  function submit(event) {
    event.preventDefault();
    if (sending || pendingRef.current) return;
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!emailRef.current?.validity.valid)
      next.email = "Enter a valid email address.";
    else if (
      !/^[^\s@]+@(example\.com|example\.org|example\.net|[a-z0-9.-]+\.test)$/i.test(
        form.email.trim(),
      )
    )
      next.email = "Use an example.com/org/net or .test address in staging.";
    setErrors(next);
    if (Object.keys(next).length) {
      setValidationAttempt((a) => a + 1);
      return;
    }
    if (!slot || !service) {
      setSlotConflict(true);
      setSubmitError("Choose an available time.");
      return;
    }
    sendBooking({
      key: crypto.randomUUID(),
      payload: { ...form, serviceId: service.id, startsAt: slot.startsAt },
    });
  }
  async function cancelBooking() {
    if (inFlight.current || !saved || !confirmed) return;
    inFlight.current = true;
    setSending(true);
    setCancelError("");
    try {
      const result = await api(`/api/bookings/${saved.id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${saved.accessToken}` },
        body: "{}",
      });
      setConfirmed(result.booking);
      if (result.ownerRequest) setCancelError(result.message);
    } catch {
      setCancelError(
        "Cancellation could not be confirmed. Retry to check it safely.",
      );
    } finally {
      setSending(false);
      inFlight.current = false;
    }
  }
  function reset() {
    setStep(0);
    setService(null);
    setSlot(null);
    setConfirmed(null);
    setErrors({});
    setSubmitError("");
    setSlotConflict(false);
    setCancelError("");
    setForm({ name: "", email: "", note: "", contactRoute: "email" });
  }
  const field = (key, label, type = "text") =>
    h(
      "label",
      { className: "field" },
      label,
      h("input", {
        type,
        "aria-label": label,
        ref: key === "name" ? nameRef : emailRef,
        disabled: sending || !!pending,
        value: form[key],
        required: true,
        maxLength: key === "name" ? 120 : 254,
        autoComplete: key === "name" ? "name" : "email",
        "aria-invalid": !!errors[key],
        "aria-describedby": errors[key] ? `${key}-error` : undefined,
        onChange: (event) => {
          const { value, validity } = event.target;
          setForm((current) => ({ ...current, [key]: value }));
          const valid =
            key === "name"
              ? !!value.trim()
              : validity.valid &&
                /^[^\s@]+@(example\.com|example\.org|example\.net|[a-z0-9.-]+\.test)$/i.test(
                  value.trim(),
                );
          if (valid)
            setErrors((current) => {
              const next = { ...current };
              delete next[key];
              return next;
            });
        },
      }),
      errors[key] &&
        h(
          "span",
          { id: `${key}-error`, className: "error", role: "alert" },
          errors[key],
        ),
    );
  const summary = (item = service) =>
    item &&
    h(
      "div",
      { className: "summary" },
      h(
        "div",
        null,
        h("strong", null, item.name),
        h("small", null, `${item.minutes} min · Kindred studio`),
      ),
      h("strong", null, `${item.currency} ${item.price}`),
    );
  let content;
  if (bootLoading)
    content = h(
      React.Fragment,
      null,
      h("h1", { tabIndex: -1 }, "Loading the studio…"),
      h("p", { role: "status" }, "Checking services and saved booking."),
    );
  else if (bootError)
    content = h(
      React.Fragment,
      null,
      h("h1", { tabIndex: -1 }, "Please try again"),
      h("p", { role: "alert" }, bootError),
      button("Retry loading", () => setRefresh((n) => n + 1), {
        className: "primary",
      }),
    );
  else if (pending && step !== 3)
    content = h(
      React.Fragment,
      null,
      h("h1", { tabIndex: -1 }, "Check your booking request"),
      h(
        "p",
        { role: "alert" },
        submitError || "A request is waiting to be confirmed.",
      ),
      button(
        sending ? "Checking…" : "Retry same request",
        () => sendBooking(pending),
        { className: "primary", disabled: sending },
      ),
    );
  else if (step === 0)
    content = h(
      React.Fragment,
      null,
      h(
        "div",
        { className: "hero" },
        h("span", { className: "eyebrow" }, "A LITTLE TIME FOR YOU"),
        h("h1", { tabIndex: -1 }, "Feel like yourself, again."),
        h(
          "p",
          null,
          "Thoughtful treatments. A calm space. Find your moment at Kindred.",
        ),
        h("span", { className: "hero-art", "aria-hidden": true }, "◌"),
      ),
      h(
        "div",
        { className: "section-heading" },
        h("h2", null, "Choose your treatment"),
        services.length > 0 && h("span", null, `${services.length} options`),
      ),
      services.length
        ? services.map((s) =>
            button(
              h(
                React.Fragment,
                null,
                h(
                  "span",
                  { className: "service-icon", "aria-hidden": true },
                  s.icon,
                ),
                h(
                  "span",
                  { className: "service-copy" },
                  h("small", null, s.category),
                  h("strong", null, s.name),
                  h(
                    "span",
                    null,
                    `${s.minutes} min · ${s.currency} ${s.price}`,
                  ),
                ),
                h("span", { "aria-hidden": true }, "→"),
              ),
              () => {
                setService(s);
                setStep(1);
              },
              { className: "service-card", key: s.id },
            ),
          )
        : h("p", { role: "status" }, "Our menu is being refreshed."),
      h(
        "p",
        { className: "footnote" },
        "Fictional sample prices. No payment is collected.",
      ),
      saved &&
        button(
          "View last saved booking",
          () => {
            setBootLoading(true);
            restoreBooking(saved)
              .catch((e) => setBootError(e.message))
              .finally(() => setBootLoading(false));
          },
          { className: "secondary" },
        ),
    );
  else if (step === 1)
    content = h(
      React.Fragment,
      null,
      h("div", { className: "detail-art", "aria-hidden": true }, service.icon),
      h("span", { className: "eyebrow" }, service.category),
      h("h1", { tabIndex: -1 }, service.name),
      h("p", null, service.description),
      summary(),
      h("h2", null, "Your visit"),
      h(
        "ul",
        { className: "visit" },
        h("li", null, "A brief consultation before we begin"),
        h("li", null, "One sample treatment room"),
        h("li", null, business.profile === "simulated"
          ? "Weekdays, 10:00–18:00 · lunch 13:00–14:00"
          : "Sample availability varies; choose a date to check"),
      ),
      h(
        "div",
        { className: "info" },
        "Kindred staging studio",
        h("small", null, "Fictional business · test appointments only"),
      ),
      button(
        "Choose a time →",
        () => {
          setSlot(null);
          setStep(2);
        },
        { className: "primary" },
      ),
    );
  else if (step === 2)
    content = h(
      React.Fragment,
      null,
      h("span", { className: "eyebrow" }, "MAKE SPACE IN YOUR DAY"),
      h("h1", { tabIndex: -1 }, "When suits you?"),
      summary(),
      h(
        "label",
        { className: "field" },
        "Choose a date",
        h("input", {
          type: "date",
          className: "date-input",
          min: business.today,
          max: business.lastDate,
          value: day,
          onChange: (e) => {
            setDay(e.target.value);
            setSlot(null);
          },
        }),
      ),
      h("p", null, day ? dateLabel(day) : "Choose a date"),
      h("h2", null, "Available times"),
      slotsLoading
        ? h("p", { role: "status" }, "Checking available times…")
        : slotsError
          ? h(
              "div",
              { role: "alert", className: "error-box" },
              slotsError,
              button("Retry availability", () => setRefresh((n) => n + 1), {
                className: "secondary",
              }),
            )
          : slots.length
            ? h(
                "div",
                { className: "times" },
                slots.map((s) =>
                  button(s.label, () => setSlot(s), {
                    key: s.startsAt,
                    className:
                      slot?.startsAt === s.startsAt
                        ? "choice selected"
                        : "choice",
                    "aria-pressed": slot?.startsAt === s.startsAt,
                  }),
                ),
              )
            : h(
                "div",
                { role: "status", className: "state" },
                h("strong", null, "No appointments available"),
                h(
                  "p",
                  null,
                  "Choose another date. Availability follows the current fictional studio calendar.",
                ),
              ),
      h(
        "p",
        { className: "footnote" },
        `Times shown in ${business.timezone}. A time is reserved only after confirmation.`,
      ),
      button(
        "Continue →",
        () => {
          setSubmitError("");
          setSlotConflict(false);
          setStep(3);
        },
        {
          className: "primary",
          disabled: !slot || slotsLoading || !!slotsError,
        },
      ),
    );
  else if (step === 3)
    content = h(
      React.Fragment,
      null,
      h("span", { className: "eyebrow" }, "ONE LAST THING"),
      h("h1", { tabIndex: -1 }, "Your details"),
      summary(),
      h(
        "p",
        { className: "booking-time" },
        `${dateLabel(day)} at ${slot?.label || ""} · ${business.timezone}`,
      ),
      h(
        "form",
        { onSubmit: submit, noValidate: true },
        field("name", "Full name"),
        field("email", "Email address", "email"),
        h(
          "label",
          null,
          "Preferred contact route",
          h(
            "select",
            {
              value: form.contactRoute || "email",
              disabled: sending || !!pending,
              onChange: (e) =>
                setForm({ ...form, contactRoute: e.target.value }),
            },
            ...["email", "messaging", "phone"].map((v) =>
              h("option", { key: v, value: v }, v),
            ),
          ),
        ),
        h(
          "p",
          null,
          "For messaging or phone, use a fictional identifier formatted as an example.com email. No message is sent.",
        ),
        h(
          "label",
          { className: "field" },
          "Anything we should know? (optional)",
          h("textarea", {
            disabled: sending || !!pending,
            value: form.note,
            maxLength: 1000,
            onChange: (e) =>
              setForm((current) => ({ ...current, note: e.target.value })),
            placeholder: "Use an invented note only",
          }),
        ),
        h(
          "p",
          { className: "footnote" },
          "Staging saves test details in a database. Use invented details and an example.com/org/net or .test email. No real appointment, email or payment is created.",
        ),
        submitError &&
          h("div", { role: "alert", className: "error-box" }, submitError),
        pending
          ? button(
              sending ? "Confirming…" : "Retry same request",
              () => sendBooking(pending),
              { className: "primary", disabled: sending },
            )
          : h(
              "button",
              {
                type: "submit",
                className: "primary",
                disabled: sending || slotConflict,
              },
              sending ? "Confirming…" : "Confirm test booking →",
            ),
        slotConflict &&
          button(
            "Choose another time",
            () => {
              setSlot(null);
              setStep(2);
            },
            { className: "secondary", disabled: sending },
          ),
      ),
    );
  else if (step === 4 && confirmed)
    content = h(
      React.Fragment,
      null,
      h(
        "div",
        { className: "check", "aria-hidden": true },
        confirmed.status === "cancelled" ? "—" : "✓",
      ),
      h("span", { className: "eyebrow" }, "STAGING BOOKING"),
      h(
        "h1",
        { tabIndex: -1 },
        confirmed.status === "cancelled"
          ? "Test booking cancelled."
          : "A moment just for you.",
      ),
      h(
        "p",
        null,
        `Thanks, ${confirmed.name.split(" ")[0]}. Your test booking is saved.`,
      ),
      h(
        "div",
        { className: "confirmation" },
        summary(confirmed.service),
        h("p", null, bookingTime(confirmed)),
        h("p", null, confirmed.timezone),
        h("small", null, `Reference ${confirmed.reference}`),
        h(
          "p",
          { className: "booking-status", role: "status" },
          `Status: ${confirmed.status}`,
        ),
      ),
      h(
        "div",
        { className: "info" },
        "Saved in the staging database. Reload this browser to retrieve it. No real appointment or email has been created.",
      ),
      saved &&
        h(
          "a",
          { href: `/#booking=${saved.id}&token=${saved.accessToken}` },
          "Private test receipt — anyone with this link can access this test booking",
        ),
      cancelError && h("p", { role: "alert" }, cancelError),
      confirmed.status !== "cancelled" &&
        button(sending ? "Cancelling…" : "Cancel test booking", cancelBooking, {
          className: "secondary",
          disabled: sending,
        }),
      button("Explore treatments", reset, {
        className: "primary",
        disabled: sending,
      }),
    );
  return h(
    "div",
    { className: "workspace" },
    h(
      "aside",
      { className: "review-panel" },
      h("span", { className: "eyebrow" }, "STAGING · TEST BOOKINGS ONLY"),
      h("h2", null, "Kindred booking staging"),
      h(
        "p",
        null,
        "Five connected screens with saved bookings and live sample availability.",
      ),
      h(
        "ul",
        null,
        h("li", null, "One fictional treatment room"),
        h("li", null, "Sample rules, not a real business calendar"),
        h("li", null, "No payment or email delivery"),
      ),
      h("a", { href: "/HANDOFF.md" }, "Read staging handoff →"),
    ),
    h(
      "main",
      { className: "phone", "aria-label": "Booking staging" },
      h(
        "header",
        null,
        button("←", () => setStep(Math.max(0, step - 1)), {
          className: "back",
          "aria-label": "Go back",
          disabled:
            step === 0 || step === 4 || sending || !!pending || bootLoading,
        }),
        h("span", { className: "brand" }, "kindred"),
        h("span", { className: "step" }, `${step + 1} / 5`),
      ),
      h(
        "span",
        {
          className: "sr-only",
          role: "status",
          "aria-live": "polite",
          "aria-atomic": true,
        },
        `Step ${step + 1} of 5: ${names[step]}`,
      ),
      h(
        "nav",
        { "aria-label": "Journey progress" },
        h(
          "ol",
          { className: "progress-list" },
          names.map((name, i) =>
            h(
              "li",
              {
                key: name,
                className: i <= step ? "progress active" : "progress",
                "aria-current": i === step ? "step" : undefined,
              },
              h("span", { className: "sr-only" }, name),
            ),
          ),
        ),
      ),
      h("div", { className: "screen", key: step, ref: screenRef }, content),
      h("footer", null, "FICTIONAL STUDIO · SAVED TEST BOOKINGS"),
    ),
  );
}

