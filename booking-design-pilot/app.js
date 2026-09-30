import React, {
  useState,
  useRef,
  useEffect,
} from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";
const h = React.createElement;
const services = [
  {
    id: "reset",
    name: "The reset",
    category: "SIGNATURE FACIAL",
    minutes: 60,
    price: 65,
    icon: "◌",
    description:
      "A gentle cleanse, facial massage and hydration treatment. A quiet hour to reset your day.",
  },
  {
    id: "restore",
    name: "Restore & unwind",
    category: "RELAXATION MASSAGE",
    minutes: 45,
    price: 55,
    icon: "≈",
    description:
      "A relaxing shoulder and back massage, tailored to your preferred pressure.",
  },
  {
    id: "glow",
    name: "Fresh start",
    category: "EXPRESS FACIAL",
    minutes: 30,
    price: 35,
    icon: "✧",
    description:
      "A short cleanse and hydration treatment for a refreshed feeling.",
  },
];
const names = [
  "Services",
  "Service details",
  "Choose a time",
  "Your details",
  "Confirmation",
];
function App() {
  const [step, setStep] = useState(0),
    [service, setService] = useState(services[0]),
    [day, setDay] = useState("Tomorrow"),
    [slot, setSlot] = useState(""),
    [mode, setMode] = useState("normal"),
    [form, setForm] = useState({ name: "", email: "", note: "" }),
    [errors, setErrors] = useState({}),
    [validationAttempt, setValidationAttempt] = useState(0),
    [sending, setSending] = useState(false),
    [submitError, setSubmitError] = useState(false),
    [revision, setRevision] = useState("reviewed");
  const screenRef = useRef(null),
    nameRef = useRef(null),
    emailRef = useRef(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  useEffect(() => {
    screenRef.current?.querySelector("h1")?.focus();
  }, [step]);
  useEffect(() => {
    if (validationAttempt && Object.keys(errors).length) {
      // Focus after the error description and aria-describedby are committed.
      (errors.name ? nameRef : emailRef).current?.focus();
    }
  }, [validationAttempt]);
  const button = (label, onClick, props = {}) =>
    h("button", { type: "button", onClick, ...props }, label);
  function submit(e) {
    e.preventDefault();
    if (sending) return;
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!emailRef.current?.validity.valid)
      next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) {
      setValidationAttempt((attempt) => attempt + 1);
      return;
    }
    const validatedBooking = {
      ...form,
      name: form.name.trim(),
      service,
      day,
      slot,
    };
    const shouldFail = mode === "error";
    setSending(true);
    setSubmitError(false);
    setTimeout(() => {
      setSending(false);
      if (shouldFail) setSubmitError(true);
      else {
        setConfirmedBooking(validatedBooking);
        setStep(4);
      }
    }, 700);
  }

  const field = (key, label, type = "text") =>
    h(
      "label",
      { className: "field" },
      label,
      h("input", {
        type,
        ref: key === "name" ? nameRef : emailRef,
        disabled: sending,
        value: form[key],
        autoComplete: key === "name" ? "name" : "email",
        required: true,
        "aria-invalid": !!errors[key],
        "aria-describedby": errors[key] ? key + "-error" : undefined,
        onChange: (e) => setForm({ ...form, [key]: e.target.value }),
      }),
      errors[key] &&
        h(
          "span",
          { id: key + "-error", className: "error", role: "alert" },
          errors[key],
        ),
    );
  const summary = (item = service) =>
    h(
      "div",
      { className: "summary" },
      h(
        "div",
        null,
        h("strong", null, item.name),
        h("small", null, `${item.minutes} min · Kindred studio`),
      ),
      h("strong", null, `€${item.price}`),
    );
  let content;
  if (step === 0)
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
        h("span", null, "3 options"),
      ),
      mode === "loading"
        ? h("p", { role: "status", className: "state" }, "Loading treatments…")
        : mode === "empty"
          ? h(
              "div",
              { className: "state" },
              h("h2", null, "Our menu is being refreshed"),
              h("p", null, "Please check back soon."),
              button("Show sample menu", () => setMode("normal"), {
                className: "secondary",
              }),
            )
          : services.map((s) =>
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
                    h("span", null, `${s.minutes} min · €${s.price}`),
                  ),
                  h("span", { "aria-hidden": true }, "→"),
                ),
                () => {
                  setService(s);
                  setStep(1);
                },
                { className: "service-card", key: s.id },
              ),
            ),
      h(
        "p",
        { className: "footnote" },
        "Prices shown in EUR. No payment required in this demo.",
      ),
    );
  if (step === 1)
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
        h("li", null, "A treatment tailored to your preferences"),
        h("li", null, "Time to relax in a private treatment room"),
      ),
      h(
        "div",
        { className: "info" },
        "Kindred studio · 12 Willow Lane",
        h("small", null, "Fictional studio · sample address"),
      ),
      button(
        "Choose a time →",
        () => {
          setSlot("");
          setStep(2);
        },
        { className: "primary" },
      ),
    );
  if (step === 2)
    content = h(
      React.Fragment,
      null,
      h("span", { className: "eyebrow" }, "MAKE SPACE IN YOUR DAY"),
      h("h1", { tabIndex: -1 }, "When suits you?"),
      summary(),
      h("h2", null, "Choose a day"),
      h(
        "div",
        { className: "days" },
        ["Tomorrow", "In 2 days", "In 3 days"].map((d) =>
          button(
            d,
            () => {
              setDay(d);
              setSlot("");
            },
            {
              key: d,
              className: day === d ? "choice selected" : "choice",
              "aria-pressed": day === d,
            },
          ),
        ),
      ),
      h("h2", null, "Available times"),
      mode === "unavailable"
        ? h(
            "div",
            { className: "state", role: "status" },
            h("strong", null, "No appointments available"),
            h(
              "p",
              null,
              "All sample days are unavailable in this demo state. Use Show sample availability to restore times.",
            ),
            button("Show sample availability", () => setMode("normal"), {
              className: "secondary",
            }),
          )
        : h(
            "div",
            { className: "times" },
            ["09:30", "11:00", "13:30", "15:00", "16:30", "17:30"].map((t) =>
              button(t, () => setSlot(t), {
                key: t,
                className: slot === t ? "choice selected" : "choice",
                "aria-pressed": slot === t,
              }),
            ),
          ),
      h(
        "p",
        { className: "footnote" },
        "Sample dates and availability; nothing is reserved.",
      ),
      button("Continue →", () => setStep(3), {
        className: "primary",
        disabled: !slot || mode === "unavailable",
      }),
    );
  if (step === 3)
    content = h(
      React.Fragment,
      null,
      h("span", { className: "eyebrow" }, "ONE LAST THING"),
      h("h1", { tabIndex: -1 }, "Your details"),
      summary(),
      h("p", { className: "booking-time" }, `${day} at ${slot}`),
      h(
        "form",
        { onSubmit: submit, noValidate: true },
        field("name", "Full name"),
        field("email", "Email address", "email"),
        h(
          "label",
          { className: "field" },
          "Anything we should know? (optional)",
          h("textarea", {
            disabled: sending,
            value: form.note,
            onChange: (e) => setForm({ ...form, note: e.target.value }),
            placeholder: "Preferences or accessibility needs",
          }),
        ),
        h(
          "p",
          { className: "footnote" },
          "Demo only: details stay in this browser’s memory and are not sent or saved. Use invented details.",
        ),
        submitError &&
          h(
            "div",
            { role: "alert", className: "error-box" },
            "We couldn’t complete the demo booking. Your details are still here. Switch “Demo state” to Normal and try again.",
          ),
        h(
          "button",
          { type: "submit", className: "primary", disabled: sending },
          sending ? "Confirming…" : "Confirm demo booking →",
        ),
      ),
    );
  if (step === 4)
    content = h(
      React.Fragment,
      null,
      h("div", { className: "check", "aria-hidden": true }, "✓"),
      h("span", { className: "eyebrow" }, "YOU’RE ALL SET"),
      h("h1", { tabIndex: -1 }, "A moment just for you."),
      h(
        "p",
        null,
        `Thanks, ${confirmedBooking?.name.split(" ")[0] || ""}. Here is your sample booking.`,
      ),
      h(
        "div",
        { className: "confirmation" },
        summary(confirmedBooking.service),
        h("p", null, `${confirmedBooking.day} · ${confirmedBooking.slot}`),
        h("p", null, "Kindred studio · 12 Willow Lane"),
        h("small", null, "Reference DEMO-1042 · no real appointment"),
      ),
      h(
        "div",
        { className: "info" },
        "No email has been sent. This is a concept demonstration.",
      ),
      button(
        "Explore treatments",
        () => {
          setStep(0);
          setConfirmedBooking(null);
          setSlot("");
          setForm({ name: "", email: "", note: "" });
          setErrors({});
          setMode("normal");
        },
        { className: "primary" },
      ),
    );
  return h(
    "div",
    { className: revision === "draft" ? "workspace draft" : "workspace" },
    h(
      "aside",
      { className: "review-panel" },
      h("span", { className: "eyebrow" }, "DESIGN PILOT · CONCEPT ONLY"),
      h("h2", null, "From idea to handoff"),
      h(
        "p",
        null,
        "Five connected screens for a fictional appointment-booking studio.",
      ),
      h(
        "label",
        { className: "field" },
        "Design version",
        h(
          "select",
          {
            disabled: sending,
            value: revision,
            onChange: (e) => setRevision(e.target.value),
          },
          h("option", { value: "reviewed" }, "Reviewed concept"),
          h("option", { value: "draft" }, "Illustrative initial draft"),
        ),
      ),
      h(
        "p",
        null,
        "The draft is a constructed comparison, not an archived AI output.",
      ),
      h(
        "ul",
        null,
        h("li", null, "Clear next actions and selected states"),
        h("li", null, "Shared spacing, typography and components"),
        h("li", null, "Visible validation and recovery states"),
      ),
      h(
        "label",
        { className: "field" },
        "Demo state",
        h(
          "select",
          {
            disabled: sending,
            value: mode,
            onChange: (e) => {
              setMode(e.target.value);
              setSubmitError(false);
            },
          },
          ["normal", "loading", "empty", "unavailable", "error"].map((x) =>
            h("option", { value: x, key: x }, x),
          ),
        ),
      ),
      h(
        "small",
        null,
        "Loading/empty: screen 1. Unavailable: screen 3. Error: submit screen 4.",
      ),
      h("a", { href: "HANDOFF.md" }, "Read developer handoff →"),
    ),
    h(
      "main",
      { className: "phone", "aria-label": "Booking prototype" },
      h(
        "header",
        null,
        button("←", () => setStep(Math.max(0, step - 1)), {
          className: "back",
          "aria-label": "Go back",
          disabled: step === 0 || sending,
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
        h("ol", { className: "progress-list" }, names.map((n, i) =>
          h("li", {
            key: n,
            className: i <= step ? "progress active" : "progress",
            "aria-current": i === step ? "step" : undefined,
          }, h("span", { className: "sr-only" }, n)),
        )),
      ),
      h("div", { className: "screen", key: step, ref: screenRef }, content),
      h("footer", null, "FICTIONAL STUDIO · INTERACTIVE DESIGN SAMPLE"),
    ),
  );
}
createRoot(document.getElementById("root")).render(h(App));
