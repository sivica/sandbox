import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  screens,
  styles,
  sample,
  example,
  validateDesign,
  screenHTML,
} from "./design.js";
import { DesignCanvas } from "./canvas.jsx";
import { bookingHTML } from "./interactive.js";
import { exportZip } from "./export.js";
const desktop = !!window.kindred;
const key = "kindred-studio-project-v1";
async function call(action, payload) {
  if (desktop) {
    const r = await window.kindred.call(action, payload);
    if (r.error) {
      const error = Error(r.error);
      error.code = r.code;
      error.connection = r.connection;
      throw error;
    }
    return r;
  }
  if (action === "state") {
    let project = null;
    try {
      project = JSON.parse(localStorage.getItem(key));
    } catch {}
    return {
      configured: false,
      session: { status: "disconnected", sharing: false },
      project,
      notice:
        "Browser visual prototype. ChatGPT authorization requires the local desktop connection.",
    };
  }
  if (action === "save") {
    localStorage.setItem(key, JSON.stringify(payload));
    return {};
  }
  if (action === "usage") {
    window.open("https://chatgpt.com/settings/usage", "_blank", "noopener");
    return {};
  }
  if (action === "export") {
    const url = URL.createObjectURL(
      new Blob([payload], { type: "application/zip" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "kindred-design.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return {};
  }
  throw Error("ChatGPT connection is unavailable in this visual prototype.");
}
function App() {
  const [page, setPage] = useState("welcome"),
    [project, setProject] = useState({
      name: "Treatment Booking",
      draft: "",
      style: "calm-spa",
      versions: [],
      selected: null,
    }),
    [ready, setReady] = useState(false),
    [connection, setConnection] = useState({ configured: false, session: {} }),
    [models, setModels] = useState([]),
    [profiles, setProfiles] = useState([]),
    [model, setModel] = useState(""),
    [appearance, setAppearance] = useState("dark"),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [menu, setMenu] = useState(false),
    [modal, setModal] = useState(null),
    [scope, setScope] = useState("All screens"),
    [reference, setReference] = useState(null),
    [screen, setScreen] = useState(0),
    [previewSize, setPreviewSize] = useState("mobile"),
    [view, setView] = useState("canvas"),
    [element, setElement] = useState("action"),
    [proposal, setProposal] = useState(null);
  const menuButton = useRef(),
    menuRoot = useRef(),
    dialog = useRef(),
    returnFocus = useRef(),
    sequence = useRef(0),
    draftRevision = useRef(0),
    saveQueue = useRef(Promise.resolve());
  const selected = project.versions.find(
    (v) => v.manifest.id === project.selected,
  );
  const usable =
    connection.session?.sharing && models.some((m) => m.slug === model);
  useEffect(() => {
    call("state")
      .then((r) => {
        setConnection(r);
        if (desktop && r.configured)
          call("profiles")
            .then((p) => setProfiles(p.profiles))
            .catch(() => {});
        if (r.session?.sharing) {
          call("models")
            .then((catalog) => {
              setModels(catalog.models);
              setModel(catalog.models[0]?.slug || "");
            })
            .catch(async (e) => {
              try {
                const snapshot = e.connection || (await call("state"));
                setConnection(snapshot);
                if (!snapshot.session?.sharing) {
                  setModels([]);
                  setModel("");
                }
              } catch {}
              setError(e.message);
            });
        }
        if (r.project?.versions) {
          try {
            r.project.versions.forEach((v) => validateDesign(v.design));
            setProject(r.project);
          } catch {
            setError("Saved project was invalid; starting a new draft.");
          }
        }
        setReady(true);
      })
      .catch((e) => {
        setError(e.message);
        setReady(true);
      });
  }, []);
  useEffect(() => {
    if (ready) {
      saveQueue.current = saveQueue.current
        .then(() => call("save", project))
        .catch((e) => setError("Could not save project: " + e.message));
    }
  }, [project, ready]);
  useEffect(() => {
    document.documentElement.dataset.appearance = appearance;
  }, [appearance]);
  const invalidateGeneration = () => {
    sequence.current++;
    setProposal(null);
    call("cancel").catch(() => {});
  };
  const update = (patch) => {
    if (Object.hasOwn(patch, "draft")) draftRevision.current++;
    if (Object.hasOwn(patch, "selected")) invalidateGeneration();
    setProject((p) => ({ ...p, ...patch }));
  };
  async function refreshAccounts() {
    const r = await call("state");
    setConnection(r);
    setModels([]);
    setModel("");
    if (desktop && r.configured) setProfiles((await call("profiles")).profiles);
    if (r.session?.sharing) {
      const catalog = await call("models");
      setModels(catalog.models);
      setModel(catalog.models[0]?.slug || "");
    }
    return r;
  }
  const closeMenu = () => {
    setMenu(false);
    menuButton.current?.focus();
  };
  useEffect(() => {
    if (menu) menuRoot.current?.querySelector('[role="menuitem"]')?.focus();
  }, [menu]);
  useEffect(() => {
    if (modal) {
      dialog.current?.showModal();
      dialog.current?.querySelector("button,input")?.focus();
    } else if (dialog.current?.open) {
      dialog.current.close();
      returnFocus.current?.focus();
    }
  }, [modal]);
  useEffect(() => {
    const handler = (e) => {
      if (
        menu &&
        !menuRoot.current?.contains(e.target) &&
        !menuButton.current?.contains(e.target)
      )
        closeMenu();
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [menu]);
  async function run(label, fn) {
    setError("");
    setMessage("");
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      try {
        const snapshot = e.connection || (await call("state"));
        setConnection(snapshot);
        if (!snapshot.session?.sharing) {
          setModels([]);
          setModel("");
        }
      } catch {}
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function connect(newProfile = false) {
    sequence.current++;
    await run("Opening ChatGPT…", async () => {
      const r = await call("connect", {
        newProfile,
        profileId: newProfile ? undefined : connection.session?.profileId,
        reconsent:
          connection.session?.status === "connected" &&
          !connection.session?.sharing,
      });
      if (desktop) setProfiles((await call("profiles")).profiles);
      setConnection(r);
      if (r.session.sharing) {
        const catalog = await call("models");
        setModels(catalog.models);
        setModel(catalog.models[0]?.slug || "");
        setPage("workspace");
        setMessage("Connected. First generation will verify inference access.");
      } else
        setMessage(
          "Signed in without permission to use your plan. Reconnect to grant access.",
        );
    });
  }
  function openModal(type, event, index = screen) {
    returnFocus.current = event?.currentTarget || menuButton.current;
    setScreen(index);
    closeMenu();
    setModal(type);
  }
  function accept(design, source, parent = null, submittedRevision = null) {
    if (source === "sample") invalidateGeneration();
    setError("");
    const id = crypto.randomUUID();
    const version = {
      design,
      manifest: {
        id,
        parent,
        scope,
        source,
        validation: "validated schema and trusted preview templates",
        component: element,
        sourceBaseline: "6038e4faceb4427af8f1256a691934431af908d0",
        createdAt: new Date().toISOString(),
        validatedFiles: [
          "design-specification.json",
          "public/interactive-design.html",
          "public/designs/screen-1.html",
          "public/designs/screen-2.html",
          "public/designs/screen-3.html",
          "public/designs/screen-4.html",
          "public/designs/screen-5.html",
        ],
      },
    };
    setProject((p) => ({
      ...p,
      versions: [...p.versions, version].slice(-20),
      selected: id,
      draft:
        source === "sample" || submittedRevision === draftRevision.current
          ? ""
          : p.draft,
    }));
    setMessage(
      source === "sample"
        ? "Loaded an authored sample. No AI request was made."
        : source === "manual"
          ? "Saved direct edit as a new version. No AI request was made."
          : "Generation completed and specification validated.",
    );
  }
  async function generate() {
    const operation = ++sequence.current;
    const submittedRevision = draftRevision.current;
    await run("Generating designs…", async () => {
      const r = await call("generate", {
        prompt: project.draft,
        style: project.style,
        scope,
        previous: selected?.design,
        component: scope === "All screens" ? null : element,
        model,
      });
      if (operation !== sequence.current) return;
      let text = r.text.trim();
      text = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      let d = validateDesign(JSON.parse(text));
      if (selected && scope !== "All screens") {
        const i = screens.indexOf(scope);
        d = {
          ...selected.design,
          screens: selected.design.screens.map((s, n) =>
            n === i
              ? {
                  ...s,
                  [element]: d.screens[n][element],
                  ...(element === "action"
                    ? { actionPadding: d.screens[n].actionPadding }
                    : {}),
                }
              : s,
          ),
        };
      } // No executable model output is accepted.
      for (let i = 0; i < 5; i++) screenHTML(d, i);
      setProposal({
        design: d,
        parent: selected?.manifest.id || null,
        submittedRevision,
        operation,
      });
      setMessage(
        "Generation completed and specification validated. Review and accept the proposed design.",
      );
    });
  }
  async function exportCurrent() {
    await run("Exporting…", async () => {
      const bytes = exportZip(selected);
      const r = await call("export", bytes);
      setMessage(
        r.path
          ? "Export saved: " + r.path
          : "ZIP downloaded. The accepted interactive design and separate booking baseline are included.",
      );
    });
  }
  function menuKeys(e) {
    const list = [...menuRoot.current.querySelectorAll('[role="menuitem"]')];
    let index = list.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      index =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? list.length - 1
            : (index + (e.key === "ArrowDown" ? 1 : -1) + list.length) %
              list.length;
      list[index]?.focus();
    } else if (e.key === "Tab") setMenu(false);
  }
  const composer = (
    <section className="composer">
      <label htmlFor="brief">
        {selected
          ? "What changes would you like to make?"
          : "What would you like to design?"}
      </label>
      <textarea
        id="brief"
        maxLength={12000}
        value={project.draft}
        onChange={(e) => update({ draft: e.target.value })}
        placeholder={
          selected
            ? "Make the booking button more prominent…"
            : "Describe your app, its users, screens and visual style…"
        }
        rows={4}
      />
      <div className="composer-tools">
        <label className="attachment">
          ＋ Reference
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (file.size > 4 * 1024 * 1024) {
                setError("Reference limit: 4 MB.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () =>
                setReference({ name: file.name, url: reader.result });
              reader.readAsDataURL(file);
            }}
          />
        </label>
        <label className="compact">
          Design style
          <select
            value={project.style}
            onChange={(e) => update({ style: e.target.value })}
          >
            {Object.entries(styles).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {selected && (
          <label className="compact">
            Change scope
            <select
              value={scope}
              onChange={(e) => {
                invalidateGeneration();
                setScope(e.target.value);
              }}
            >
              {["All screens", ...screens].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        <button
          className="primary generate"
          disabled={
            !usable ||
            !project.draft.trim() ||
            !!busy ||
            !!reference ||
            !!proposal
          }
          onClick={generate}
        >
          {selected ? "Apply changes" : "Generate designs"} ↗
        </button>
      </div>
      {reference && (
        <div className="reference">
          <img alt="Attached design reference" src={reference.url} />
          <span>
            {reference.name}
            <br />
            Reference submission is pending provider/model support.
          </span>
          <button onClick={() => setReference(null)}>Remove reference</button>
        </div>
      )}
      <small>
        Uses your ChatGPT allowance. No separate AI credits. Disable account
        credit usage for allowance-only requests.
      </small>
    </section>
  );
  return (
    <div className="app">
      <header>
        <button className="wordmark" onClick={() => setPage("welcome")}>
          ◌ KINDRED <span>Design Studio</span>
        </button>
        {page === "workspace" && (
          <div className="header-actions">
            <label className="compact">
              Appearance
              <select
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </label>
            <button
              ref={menuButton}
              aria-label="More project actions"
              aria-haspopup="menu"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              ⋮
            </button>
            {menu && (
              <div
                className="menu"
                ref={menuRoot}
                role="menu"
                onKeyDown={menuKeys}
              >
                <button role="menuitem" onClick={(e) => openModal("rename", e)}>
                  Rename project
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    document.querySelector("#brief")?.focus();
                    setMessage(
                      "Choose Design style below, then explicitly apply changes.",
                    );
                  }}
                >
                  Design style
                </button>
                <button
                  role="menuitem"
                  disabled={!selected}
                  onClick={(e) => openModal("preview", e)}
                >
                  Open preview
                </button>
                <button
                  role="menuitem"
                  disabled={!selected || !!busy}
                  onClick={() => {
                    closeMenu();
                    exportCurrent();
                  }}
                >
                  Export code
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    call("usage").catch((e) => setError(e.message));
                  }}
                >
                  Manage ChatGPT usage
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    openModal("accounts");
                    refreshAccounts().catch((e) => setError(e.message));
                  }}
                >
                  Switch account
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    sequence.current++;
                    call("cancel");
                    run("Disconnecting…", async () => {
                      try {
                        await call("disconnect");
                      } finally {
                        setConnection(await call("state"));
                        setModels([]);
                        setModel("");
                      }
                    });
                  }}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      <main>
        {page === "welcome" ? (
          <section className="welcome">
            <button className="back" onClick={() => setPage("workspace")}>
              ← Open local workspace
            </button>
            <div className="brand-mark">◌</div>
            <p className="eyebrow">FROM A BRIEF TO A BOOKING DESIGN</p>
            <h1>
              Design your treatment
              <br />
              booking app
            </h1>
            <p className="lead">
              Use your existing eligible ChatGPT subscription to create designs
              you can export and build.
            </p>
            <button
              className="continue"
              disabled={!!busy}
              onClick={() => connect()}
            >
              Continue with ChatGPT →
            </button>
            {busy === "Opening ChatGPT…" && (
              <button onClick={() => call("cancelConnect")}>
                Cancel sign-in
              </button>
            )}
            <p className="fine">
              Requires an eligible plan and permission to use it.
              <br />
              Generation counts toward your plan limits.
            </p>
            <div className="local-notice">
              {connection.personal
                ? "Personal, local-only tool. Continue with ChatGPT to sign in and grant plan access."
                : "Connection pending: a licensed provider must be configured."}
              <br />
              {connection.personal
                ? "Credentials stay encrypted on this Mac. Use fictional design briefs."
                : "Explore the authored samples in the local workspace."}
            </div>
          </section>
        ) : (
          <>
            <div className="project-header">
              <div>
                <p className="eyebrow">YOUR DESIGN WORKSPACE</p>
                <h1>{selected ? project.name : "Start designing your app"}</h1>
              </div>
              <div className="connection-pill">
                {connection.session?.identity?.email && (
                  <span>
                    {connection.session.identity.name || "ChatGPT account"} ·{" "}
                    {connection.session.identity.email} ·{" "}
                    {connection.session.profileId?.slice(0, 8)}
                  </span>
                )}
                {connection.session?.sharing
                  ? "Using ChatGPT plan"
                  : "Local prototype · not connected"}
                <button
                  onClick={() =>
                    connection.session?.sharing ? call("usage") : connect()
                  }
                >
                  {connection.session?.sharing ? "Manage usage" : "Connect"}
                </button>
              </div>
            </div>
            {connection.session?.sharing && (
              <label className="compact model">
                Account model
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {models.map((m) => (
                    <option value={m.slug} key={m.slug}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {selected && (
              <>
                <div className="result-heading">
                  <p>
                    {selected.manifest.source === "sample"
                      ? "Authored sample · no AI generation"
                      : selected.manifest.source === "manual"
                        ? "Direct edit · no AI generation"
                        : "ChatGPT design specification"}{" "}
                    · five screens
                  </p>
                  <label className="compact">
                    Version
                    <select
                      value={project.selected}
                      onChange={(e) => update({ selected: e.target.value })}
                    >
                      {project.versions.map((v, i) => (
                        <option key={v.manifest.id} value={v.manifest.id}>
                          Version {i + 1} · {v.manifest.source}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="canvas-toolbar">
                  <button
                    onClick={() =>
                      setView(view === "canvas" ? "list" : "canvas")
                    }
                  >
                    {view === "canvas" ? "Show screen list" : "Show canvas"}
                  </button>
                  <button
                    disabled={
                      project.versions.findIndex(
                        (v) => v.manifest.id === project.selected,
                      ) <= 0
                    }
                    onClick={() =>
                      update({
                        selected:
                          project.versions[
                            project.versions.findIndex(
                              (v) => v.manifest.id === project.selected,
                            ) - 1
                          ].manifest.id,
                      })
                    }
                  >
                    Undo
                  </button>
                  <button
                    disabled={
                      project.versions.findIndex(
                        (v) => v.manifest.id === project.selected,
                      ) >=
                      project.versions.length - 1
                    }
                    onClick={() =>
                      update({
                        selected:
                          project.versions[
                            project.versions.findIndex(
                              (v) => v.manifest.id === project.selected,
                            ) + 1
                          ].manifest.id,
                      })
                    }
                  >
                    Redo
                  </button>
                  <button onClick={(e) => openModal("preview", e, 0)}>
                    Interactive preview
                  </button>
                </div>
                {view === "canvas" && (
                  <DesignCanvas
                    version={selected}
                    layout={project.layout || {}}
                    selectedScreen={screen}
                    element={element}
                    onLayout={(layout) => update({ layout })}
                    onSelect={(i, key) => {
                      invalidateGeneration();
                      setScreen(i);
                      setElement(key);
                      setScope(screens[i]);
                    }}
                  />
                )}
                <section
                  className="element-editor"
                  aria-label="Selected element editor"
                >
                  <h2>
                    Edit {screens[screen]} · {element}
                  </h2>
                  <form
                    key={selected.manifest.id + screen + element}
                    onSubmit={(e) => {
                      e.preventDefault();
                      invalidateGeneration();
                      const f = new FormData(e.currentTarget),
                        d = structuredClone(selected.design);
                      d.screens[screen][element] = String(f.get("copy"));
                      d.screens[screen].actionPadding = Number(
                        f.get("padding"),
                      );
                      if (scope === "All screens")
                        d.tokens.accent = String(f.get("accent"));
                      accept(validateDesign(d), "manual", selected.manifest.id);
                    }}
                  >
                    <label>
                      Selected element text
                      <input
                        name="copy"
                        defaultValue={selected.design.screens[screen][element]}
                        maxLength={180}
                        required
                      />
                    </label>
                    <label>
                      Button padding
                      <input
                        name="padding"
                        type="number"
                        min="12"
                        max="28"
                        defaultValue={
                          selected.design.screens[screen].actionPadding || 17
                        }
                      />
                    </label>
                    <label>
                      Shared accent (All screens scope)
                      <input
                        name="accent"
                        type="color"
                        disabled={scope !== "All screens"}
                        defaultValue={selected.design.tokens.accent}
                      />
                    </label>
                    <button disabled={!!busy}>Save direct edit</button>
                  </form>
                </section>
                <div
                  className={
                    view === "canvas" ? "gallery mobile-screen-list" : "gallery"
                  }
                >
                  {screens.map((label, i) => (
                    <div className="screen-list-item" key={label}>
                      <button
                        className="design-card"
                        aria-label={"Preview " + label}
                        onClick={(e) => openModal("preview", e, i)}
                      >
                        <span>{label}</span>
                        <iframe
                          sandbox=""
                          tabIndex={-1}
                          title={label + " design"}
                          srcDoc={screenHTML(selected.design, i)}
                        />
                        <span className="card-action">Open preview ↗</span>
                      </button>
                      <button
                        onClick={() => {
                          invalidateGeneration();
                          setScreen(i);
                          setElement("action");
                          setScope(screens[i]);
                        }}
                      >
                        Select {label} button
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {proposal && (
              <section className="proposal" aria-label="Proposed design">
                <h2>Review proposed design</h2>
                <p>
                  Scope: {scope} · accept creates a new version. Your current
                  design stays available.
                </p>
                <iframe
                  sandbox=""
                  title="Proposed design preview"
                  srcDoc={screenHTML(proposal.design, screen)}
                />
                <button
                  onClick={() => {
                    if (proposal.operation !== sequence.current) {
                      setProposal(null);
                      return;
                    }
                    accept(
                      proposal.design,
                      "chatgpt",
                      proposal.parent,
                      proposal.submittedRevision,
                    );
                    setProposal(null);
                  }}
                >
                  Accept design
                </button>
                <button onClick={() => setProposal(null)}>
                  Discard proposal
                </button>
              </section>
            )}
            {composer}
            <section className="inspiration">
              <div className="section-label">
                ✦{" "}
                {selected ? "Try another authored sample" : "Need inspiration?"}
              </div>
              <div className="inspiration-grid">
                {Object.entries(styles).map(([k, v]) => (
                  <div className={"inspiration-card " + k} key={k}>
                    <h2>{v} booking</h2>
                    <p>A treatment-booking starting point with five screens.</p>
                    <button
                      onClick={() => {
                        update({
                          draft: example.replace("calm", v.toLowerCase()),
                          style: k,
                        });
                        setMessage("Prompt filled. Edit it before generating.");
                      }}
                    >
                      Use this prompt
                    </button>
                    <button
                      onClick={() => {
                        accept(sample(k), "sample");
                        update({ style: k });
                      }}
                    >
                      Load sample
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        <div role="status" aria-live="polite" className="status">
          {busy || message}
        </div>
        {busy === "Generating designs…" && (
          <button
            onClick={() => {
              sequence.current++;
              call("cancel");
              setMessage("Cancelled. Previous version retained.");
            }}
          >
            Cancel generation
          </button>
        )}
        <div role="alert" className="error">
          {error}
        </div>
      </main>
      <footer>
        {connection.personal
          ? "Personal local design tool · synthetic bookings · uses your authorized ChatGPT allowance"
          : "Local design prototype · synthetic bookings · connection pending licensing/eligibility"}
      </footer>
      <dialog
        ref={dialog}
        aria-labelledby="studio-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          setModal(null);
        }}
      >
        <div className="dialog-head">
          <h2 id="studio-dialog-title">
            {modal === "rename"
              ? "Rename project"
              : modal === "accounts"
                ? "ChatGPT accounts"
                : "Design preview"}
          </h2>
          <button aria-label="Close dialog" onClick={() => setModal(null)}>
            ✕
          </button>
        </div>
        {modal === "accounts" ? (
          <div>
            {profiles.map((p) => (
              <button
                key={p.id}
                disabled={!!busy}
                onClick={() => {
                  invalidateGeneration();
                  run("Selecting account…", async () => {
                    await call("selectProfile", { id: p.id });
                    await refreshAccounts();
                    setModal(null);
                  });
                }}
              >
                {p.identity.email || p.identity.name || p.label} ·{" "}
                {p.id.slice(0, 8)} · {p.status}
                {p.id === connection.session?.profileId ? " · active" : ""}
              </button>
            ))}
            <button
              disabled={!!busy}
              onClick={() => {
                setModal(null);
                connect(true);
              }}
            >
              Add account
            </button>
          </div>
        ) : modal === "rename" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = new FormData(e.currentTarget).get("name").trim();
              if (name) update({ name });
              setModal(null);
            }}
          >
            <label>
              Project name
              <input
                name="name"
                defaultValue={project.name}
                required
                maxLength={100}
              />
            </label>
            <button className="primary">Save name</button>
          </form>
        ) : (
          selected && (
            <>
              <div className="preview-controls">
                <label>
                  Screen
                  <select
                    value={screen}
                    onChange={(e) => setScreen(Number(e.target.value))}
                  >
                    {screens.map((s, i) => (
                      <option value={i} key={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Size
                  <select
                    value={previewSize}
                    onChange={(e) => setPreviewSize(e.target.value)}
                  >
                    <option value="mobile">Mobile</option>
                    <option value="desktop">Desktop</option>
                  </select>
                </label>
              </div>
              <p className="fine">
                Interactive synthetic walkthrough · no real reservation or
                calendar access.
              </p>
              <iframe
                className={"large-preview " + previewSize}
                sandbox="allow-scripts"
                title={screens[screen] + " enlarged design"}
                srcDoc={bookingHTML(selected.design, screen)}
              />
            </>
          )
        )}
      </dialog>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
