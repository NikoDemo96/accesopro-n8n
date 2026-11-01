# CLAUDE.md — accesopro-n8n

## Purpose
This project exists to **build and audit high-quality n8n workflows with Claude** for AccesoPro (online prep for adults taking the Grado Superior access exams, Maths, Comunitat Valenciana). Claude works through two tools:
- **n8n-MCP** (https://github.com/czlonkowski/n8n-mcp): node docs, templates, validation, and management of workflows on the local n8n instance.
- **n8n-skills** (https://github.com/czlonkowski/n8n-skills): skills that teach how to use the MCP and n8n correctly. Invoke the matching skill *before* the task it covers.

## The assignment (AI Engineer technical test, AccesoPro · Grupo Mentor)
This project is the candidate's submission for the test brief `Prueba_tecnica_AI_Engineer_AccesoPro.pdf`. **Deadline: Sunday 1 Nov 2026, 16:00 Spanish peninsular time** — late submissions are not evaluated. Always keep time remaining in mind and prioritise accordingly.

**Challenge:** a system that produces, reviews and publishes educational video at scale and learns from what works. Content must be *correct*: a video with a syllabus error is worse than no video, so QA matters as much as volume.

**Inputs (in `data/in/`):** AccesoPro Maths GS Comunitat Valenciana syllabus, topic **T1_S01** (TXT) · T1_S01 podcast script (JSON) · official Generalitat Valenciana syllabus (PDF, the reviewer's reference) · a recorded live class (`clase.mp4`) · brand book (`data/brand/`).

**Level 1 — mandatory** (without it working end to end the test fails):
1. Two inputs: (a) topic text → split into ideas → 30–60 s scripts (hook, explanation, CTA close) → videos with cloned voice (avatar optional); (b) recorded class → automatically detect **5–8 clips** with standalone value (full explanation, exam trick, typical mistake) that make sense without the rest of the class.
2. **Reviewer agent:** a second model checks every script and clip against the *official* syllabus and rejects errors or invented data; rejected pieces are corrected or discarded and the reason is logged.
3. Editing: 9:16 (Shorts) and 16:9, burned-in subtitles, brand imagery.
4. Automatic publication to the candidate's own test YouTube channel as **unlisted**, with generated title, description, tags and thumbnail.
5. Control table: status per piece (generated, reviewed, rejected, published), real cost, link.

**Level 2 — advanced:** optional human approval (link/button, toggleable, no code) · A/B hooks (two hooks per video + explained selection logic) · robustness (job queue, retries, no duplicates on re-run, daily spend cap, respect YouTube API quota).
**Level 3 — optional:** learning loop from YouTube Analytics (retention, views, clicks) · adaptation of one video to another autonomous community.

**Deliverables:** repo/workflows ready to run · README a non-technical person can follow (what was done, what was left out and why) · links to published videos (**≥3 from text, ≥3 clips from class**) · reviewer examples (**≥1 rejected script or clip with reason**) · control table with status and real cost · architecture doc (**max 2 pages**: scale to 1,000 videos/month, cost per video, bottlenecks, what stays under human review) · demo video (≤5 min).

**Evaluation criteria:** end-to-end with a *single trigger* and no manual steps · pedagogical quality (correct, clear, useful for an adult preparing an exam) · reviewer does a *real* check against the syllabus, not a generic review · clip detection uses pedagogical judgement, not time-based cuts · technical judgement (errors, costs, scalability) · prioritisation and communication. **A solid, well-explained Level 1 beats all levels half done.** Justify tool choices (free choice: n8n, Python, ElevenLabs, HeyGen, FFmpeg, Whisper, Claude, GPT…).

**Conditions and confidentiality:**
- Use own voice/image (or a stock avatar) and own API keys and YouTube test channel; no AccesoPro accounts. API spend reimbursed up to €30 with receipts → **track real cost per piece and keep it under budget**.
- Material belongs to Grupo Mentor: do not share or publish it outside the test channel, keep all videos **unlisted**, never commit the material (syllabus, podcast, class recording, brand book) to a public repo, and remind the user to delete material and generated videos within 15 days of submission.
- The code stays the candidate's. A technical interview follows: the user will demo the system and be asked for live changes, so keep the workflow simple enough to explain and modify.

**How Claude should use this:** treat the brief as the acceptance criteria. When building, prioritise Level 1 completeness first; when auditing, report gaps against the Level 1 checklist and the evaluation criteria above, then deliverables still missing, before suggesting Level 2/3 work. Write README/architecture text for the audience the brief names (non-technical reader; evaluators).

## Environment
- Self-hosted n8n in Docker: [docker-compose.yml](docker-compose.yml), [Dockerfile](Dockerfile). Container `n8n-accesopro`, UI/API at `http://localhost:5679` (host 5679 → container 5678). Timezone Europe/Madrid.
- The image adds `ffmpeg`, `ffprobe` and `yt-dlp`. Rebuild after changes: `docker compose up -d --build`.
- `./data` is mounted at `/data` inside the container; n8n file access is restricted to `/data` (`N8N_RESTRICT_FILE_ACCESS_TO`). Always use `/data/...` paths in nodes.
  - `in/` source material (syllabus, podcast JSON, class video) · `audio/` · `video/` (+ `tmp/`) · `thumbs/` · `scripts/` (`render.js`, `download.sh`, `prepare_audio.sh`) · `brand/` (logo, Inter fonts, brand book)
- Host is Windows 11 (PowerShell/Git Bash); the n8n container is Linux/Alpine.

## Workflow source of truth
- Workflows are authored as `workflows/*.sdk.ts` using `@n8n/workflow-sdk` (`workflow`, `node`, `trigger`, `ifElse`, `expr`, `newCredential`).
- Current workflow: [workflows/producir_pieza.sdk.ts](workflows/producir_pieza.sdk.ts) — "AccesoPro · Producir pieza": script/clip → Claude writer → reviewer sub-workflow (`P6n0FqYmoOM6j6E2`, one correction attempt) → YouTube metadata → ElevenLabs voice → FFmpeg render (`/data/scripts/render.js`) → YouTube upload (unlisted) → Data Table `pDESRFfLEkDjWfOE`.
- Keep the `.sdk.ts` file and the deployed workflow in sync. Record deployed workflow IDs here when created.
- Node names, prompts and user-facing text are in Spanish (es-ES). Workflow names follow `AccesoPro · <acción>`.
- Credentials already in use: Anthropic (`olVcoY7AU7oJpytv`), ElevenLabs (header auth), YouTube OAuth2 (test channel). Reference credentials by id/name only; never write secrets into files.

## n8n-MCP tools
- **Discover** (no API needed): `tools_documentation` (start here), `search_nodes`, `get_node`, `search_templates`, `get_template`.
- **Validate**: `validate_node` (minimal, then full), `validate_workflow`.
- **Manage** (needs `N8N_API_URL` + `N8N_API_KEY`): `n8n_create_workflow`, `n8n_get_workflow`, `n8n_update_partial_workflow` (preferred for edits), `n8n_update_full_workflow`, `n8n_validate_workflow`, `n8n_autofix_workflow`, `n8n_test_workflow`, `n8n_executions`, `n8n_workflow_versions` (history/diff/rollback), `n8n_manage_datatable`, `n8n_audit_instance`, `n8n_health_check`.

## n8n-skills — use the matching one first
- Using MCP / node type names / validation profiles: **MCP Tools Expert** (highest priority).
- Choosing an architecture: **Workflow Patterns**. Configuring nodes: **Node Configuration**.
- Expressions `{{ }}`: **Expression Syntax**. Code nodes: **Code JavaScript** (default), **Code Python**, **Code Tool** (AI agents).
- Interpreting errors / fix loop: **Validation Expert**. Retries, error outputs, Error Trigger: **Error Handling**.
- Files/images: **Binary & Data**. Reusable pieces: **Sub-workflows**. LLM agents/chains: **AI Agents**.
- Multiple n8n instances: **Multi-Instance**. Deploying n8n itself: **Self-Hosting**.

## Building a workflow (follow this order)
1. Run `tools_documentation` if tool behavior is unclear. Run these tool calls silently and in parallel when independent.
2. Search templates first; build from a validated template when one fits (credit the author). Otherwise `search_nodes` → `get_node`.
3. Pick the transform in this order: service node → native node → short expression → Code node. Every kept Code node needs a one-line "Why Code:" note.
4. Set **every** parameter explicitly; never rely on defaults. Set dependent properties together (e.g. body + content type).
5. `validate_node` (minimal, then full) per node, then `validate_workflow` for connections, expressions and AI tools.
6. Make edits in one batched `n8n_update_partial_workflow` call. IF nodes have two outputs: set `branch` (`true`/`false`). `addConnection` takes source, target, sourcePort, targetPort.
7. Deploy, then `n8n_test_workflow` and inspect with `n8n_executions`. Passing validation is necessary, not sufficient — verify real output.
- Webhook payloads live under `$json.body`. Code nodes return `[{ json: {...} }]`; use `this.helpers.httpRequest()`, not `$helpers`.
- Add retries/error handling on every external call (Anthropic, ElevenLabs, YouTube, FFmpeg).

## Auditing a workflow
Run `n8n_get_workflow` + `n8n_validate_workflow` (and `n8n_audit_instance` for instance-wide checks), then review and report findings ranked by severity:
- validation errors and false positives · missing error handling/retries/timeouts · hardcoded secrets or ids · Code nodes that should be native nodes
- binary data handling · idempotency of upserts (Data Table keyed on `piece_id`) · cost exposure (LLM/voice/STT) · naming and layout · sub-workflow reuse
Do not change anything during an audit unless asked; propose fixes first.

## Safety rules
- **Never edit an active/production workflow directly.** Work on a copy or new workflow, and snapshot with `n8n_workflow_versions` before modifying an existing one.
- **Ask before**: deleting, overwriting, activating, or publishing anything to YouTube (keep `unlisted` and the test channel), and before bulk runs that spend paid APIs (Anthropic, ElevenLabs).
- Never print, log or commit API keys or tokens. When auditing, prefer a read-only API key (or `DISABLED_TOOLS`) if write access is not needed.
- AI output can be wrong: validate and test before trusting it.

## Setup (user, one time)
- Register n8n-MCP with `N8N_API_URL=http://localhost:5679` and an `N8N_API_KEY` (n8n → Settings → n8n API).
- Install n8n-skills (Claude Code plugin marketplace `czlonkowski/n8n-skills`, or copy its skills folder to `~/.claude/skills`).
- Confirm with `n8n_health_check`.
