# Kindred Design Studio

Local Electron/React prototype for the three reviewed screens. Browser preview is a visual sandbox, not a ChatGPT connection.

## Run

Node 22+ and macOS: `npm ci`, `npm run build`, `npm start`. For the browser visual prototype: `npm run preview`, then http://127.0.0.1:4190.

## Delivered

- Getting started with Continue with ChatGPT and truthful unavailable-connection state.
- Prompt, three styles, optional reference-image generation/removal and editable inspiration cards.
- Authored sample designs above the refinement input, selected version, screen scope and project name.
- Accessible More menu, sandboxed larger screen preview and ZIP export.
- Persisted drafts, names and up to 20 versions (Electron userData; browser localStorage).
- Exports retain the original booking controller/API, package lock, synthetic fixtures, code, tokens, static screen proposals and version manifest.

The static proposals are data rendered by trusted code, not arbitrary executable model output. Exported tokens update the selected runnable booking style; screen-copy proposals are separate files for integration review. Screen proposal actions are visual; the runnable exported booking controller contains the complete synthetic booking flow.

## Personal subscription mode

For your own local use, run `npm run personal` after `npm ci` and `npm run build`. Unlock the Mac, click **Continue with ChatGPT**, and finish the official browser sign-in and plan-access consent. An eligible subscription and account authorization are required. No API key or separate usage billing fallback is provided.

This mode uses an original connector implemented from OpenAI's public protocol documentation, not DevKit code or existing Codex credentials. It discovers your account's available models, streams completed design responses, rotates renewable credentials and supports disconnect/revocation. Credentials are encrypted using the operating system and stored separately under macOS Application Support/kindred-personal-design-studio. Project drafts and exports are local; prompts are sent to OpenAI when you generate.

Real sign-in, completed generation/refinement, encrypted connection resumption, access-token renewal, remote revocation and returning sign-in have been verified on this Mac. GPT-6-Astra also completed reference-image generation from a fictional screenshot. Usage-limit failure and recovery are tested with synthetic responses; the real allowance was not exhausted. See STATUS.md and COMPLETION.md for evidence and limits.

Personal mode is separate from hosted or paid distribution; this implementation does not establish eligibility for those uses.

## Original prototype connection limitation

OpenAI's official DevKit is under a Noncommercial License which excludes development with an intended commercial application, even when local. This project's possible commercial use cannot be assumed permitted. No DevKit code, trademark assets or existing Codex credentials are copied or reused. No sign-in or model request is made by default.

Sources:
- https://github.com/openai/sign-in-with-chatgpt-devkit/blob/main/LICENSE
- https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference

The personal mode above now supplies an original independent implementation. Resolve commercial licensing/eligibility before any commercial distribution. Hosted distribution separately requires provider access approval. The personal app has verified authorization and generation; this is not evidence of commercial eligibility.

## Authorized provider boundary

The trusted main process can load an independently supplied provider with `KINDRED_AUTH_PROVIDER=/absolute/path/provider.mjs`. This is an owner-controlled development setting, not renderer input. It must export `createProvider({storageDir,openBrowser,encryption})` and provide `getSession`, `signIn`, `cancelSignIn`, `disconnect`, `listModels`, `streamResponse`.

- Return only safe session identity/status/sharing to the renderer; protect all tokens with OS encryption. No browser storage, API keys or billing fallback.
- Validate official OAuth identity, state, nonce and PKCE; grant plan usage separately; persist host/client registrations.
- Stream Responses with `store:false`, `stream:true`, account-specific model discovery. Return `{text,completed:true}` only after `response.completed`. Reject interrupted/incomplete/failed requests.
- Respect AbortSignal, account switching, renewable-token rotation and disconnect/revocation failure reporting.
- Reference submission uses Responses input_image data URLs with an image-capable account model. Renderer and main process enforce size/type/dimension checks and re-encode images. References are ephemeral and sent only when attached to a generation request.

The main process rejects concurrent generation, stale completions and unsupported models/styles; renderer validates the JSON specification and renders five static previews. There is no arbitrary generated code or command execution. New specs do not alter booking logic or rules.

## Security and limitations

Context isolation, sandbox, Node-disabled renderer, main-frame sender checks, denied permissions/navigation/window opening and network-free design iframes. CSP blocks renderer network calls. No privileged preload inside previews. Export paths are fixed under userData; renderer never supplies output paths. The main app and provider are trusted code; no claim of complete security review is made.

Design compilation is a constrained schema-to-interface step; freeform code generation is not implemented. Image inputs influence the constrained design specification. Synthetic regression checks now cover the reviewed protocol/UI/recovery/export paths. Run `npx playwright install chromium`, `npm run build`, then `npm test`. These checks do not establish real account access, actual OS credential encryption or native screen-reader acceptance. Builds are tracked separately from acceptance. No production changes, monitor restart, real customer data, posting or human acceptance.

## Canvas and interactive design
The five screens can be arranged on a React Flow canvas, with pan/zoom and a screen-list fallback on mobile. Select a heading, subtitle or button to scope direct editing and AI refinement. Direct edits save a labelled version without an AI request. Undo/redo selects saved versions. Shared accent changes require All screens scope; screen-scoped AI changes preserve other components and shared tokens.

AI results are proposals: review, Accept design or Discard proposal. The previous accepted version remains usable. A sandboxed interactive preview uses fixed trusted code and fictional treatment/contact/slot data; it creates no reservation and makes no network requests. Export includes `public/interactive-design.html`, generated from the same validated design, alongside the separate trusted booking-controller baseline. Its standalone design preview needs no account connection. It is a synthetic walkthrough, not a new production booking integration.

Build and all 49 automated checks passed (21 protocol, 24 browser/export, one recovery, three recorder). A continuous real app recording now shows actual subscription generation, refinement, interactive preview and export. Authored-sample and earlier still-capture videos remain historical artifacts.

## Record a demo
Click **Record demo** in the personal Electron workspace. It hides the account identity and captures only this app window at two frames per second, for up to five minutes. Click **Stop demo recording** to write an owner-only recording manifest and numbered JPEG frames under the personal app recordings folder. No microphone, desktop or other apps are captured. Final video encoding is a separate local step. Do not open account-management dialogs or put sensitive content in the project while recording.
