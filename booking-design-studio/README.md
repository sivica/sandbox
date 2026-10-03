# Kindred Design Studio

Local Electron/React prototype for the three reviewed screens. Browser preview is a visual sandbox, not a ChatGPT connection.

## Run

Node 22+ and macOS: `npm ci`, `npm run build`, `npm start`. For the browser visual prototype: `npm run preview`, then http://127.0.0.1:4190.

## Delivered

- Getting started with Continue with ChatGPT and truthful unavailable-connection state.
- Prompt, three styles, optional local reference preview/removal and editable inspiration cards.
- Authored sample designs above the refinement input, selected version, screen scope and project name.
- Accessible More menu, sandboxed larger screen preview and ZIP export.
- Persisted drafts, names and up to 20 versions (Electron userData; browser localStorage).
- Exports retain the original booking controller/API, package lock, synthetic fixtures, code, tokens, static screen proposals and version manifest.

The static proposals are data rendered by trusted code, not arbitrary executable model output. Exported tokens update the selected runnable booking style; screen-copy proposals are separate files for integration review. Screen proposal actions are visual; the runnable exported booking controller contains the complete synthetic booking flow.

## Personal subscription mode

For your own local use, run `npm run personal` after `npm ci` and `npm run build`. Unlock the Mac, click **Continue with ChatGPT**, and finish the official browser sign-in and plan-access consent. An eligible subscription and account authorization are required. No API key or separate usage billing fallback is provided.

This mode uses an original connector implemented from OpenAI's public protocol documentation, not DevKit code or existing Codex credentials. It discovers your account's available models, streams completed design responses, rotates renewable credentials and supports disconnect/revocation. Credentials are encrypted using the operating system and stored separately under macOS Application Support/kindred-personal-design-studio. Project drafts and exports are local; prompts are sent to OpenAI when you generate.

Build passed. Sign-in, completed inference, renewal and revocation have **not** been verified with a real account. The app launched, but the Mac was locked. Use fictional treatment-booking briefs while completing validation. Reference images are preview-only and cannot be submitted for generation yet.

Personal mode is separate from hosted or paid distribution; this implementation does not establish eligibility for those uses.

## Original prototype connection limitation

OpenAI's official DevKit is under a Noncommercial License which excludes development with an intended commercial application, even when local. This project's possible commercial use cannot be assumed permitted. No DevKit code, trademark assets or existing Codex credentials are copied or reused. No sign-in or model request is made by default.

Sources:
- https://github.com/openai/sign-in-with-chatgpt-devkit/blob/main/LICENSE
- https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference

The personal mode above now supplies an original independent implementation. Resolve commercial licensing/eligibility before any commercial distribution. Hosted distribution separately requires provider access approval. The UI and connection wiring are implemented; real authorization and generation remain unverified.

## Authorized provider boundary

The trusted main process can load an independently supplied provider with `KINDRED_AUTH_PROVIDER=/absolute/path/provider.mjs`. This is an owner-controlled development setting, not renderer input. It must export `createProvider({storageDir,openBrowser,encryption})` and provide `getSession`, `signIn`, `cancelSignIn`, `disconnect`, `listModels`, `streamResponse`.

- Return only safe session identity/status/sharing to the renderer; protect all tokens with OS encryption. No browser storage, API keys or billing fallback.
- Validate official OAuth identity, state, nonce and PKCE; grant plan usage separately; persist host/client registrations.
- Stream Responses with `store:false`, `stream:true`, account-specific model discovery. Return `{text,completed:true}` only after `response.completed`. Reject interrupted/incomplete/failed requests.
- Respect AbortSignal, account switching, renewable-token rotation and disconnect/revocation failure reporting.
- Reference submission is disabled pending an authorized image-input-capable provider; the current contract is text only.

The main process rejects concurrent generation, stale completions and unsupported models/styles; renderer validates the JSON specification and renders five static previews. There is no arbitrary generated code or command execution. New specs do not alter booking logic or rules.

## Security and limitations

Context isolation, sandbox, Node-disabled renderer, main-frame sender checks, denied permissions/navigation/window opening and network-free design iframes. CSP blocks renderer network calls. No privileged preload inside previews. Export paths are fixed under userData; renderer never supplies output paths. The main app and provider are trusted code; no claim of complete security review is made.

Design compilation is a constrained schema-to-interface step; freeform code generation and image-input generation are not implemented. Automated or manual tests have not been run for this phase. Builds are tracked separately from acceptance. No production changes, monitor restart, real customer data, posting or human acceptance.
