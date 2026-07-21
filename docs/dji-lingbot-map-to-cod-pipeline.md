# From a DJI Mavic to a COD-Style Game Map: LingBot-Map Pipeline Assessment

**Question:** What would it take to adapt flight software for a DJI Mavic to run the
[LingBot-Map](https://github.com/skoodog/lingbot-map) stream to build maps that can populate a
Call-of-Duty-type game (mirroring the gun mechanics as closely as possible) with a basic milspec loadout?

**Date:** 2026-07-21 · Sources: full code + paper review of the `lingbot-map` fork at commit `c364ca9`,
plus web research current to July 2026 (DJI SDK docs/forums, engine docs, photogrammetry vendors, legal
precedent). File references are `path:line` into the repo.

---

## TL;DR verdict

**Feasible, and LingBot-Map is a genuinely good fit for the "stream" half — but three realities shape the build:**

1. **"Flight software for a DJI Mavic" cannot mean custom firmware.** Mavic firmware is signed and
   locked; the sanctioned surface is DJI's Mobile SDK v5 (Android only) — and it does **not** support
   consumer Mavic 3 or Mavic 4 Pro at all. The MSDK aircraft that matter here are the **Mavic 3
   Enterprise** series and the **Mini 4 Pro** (supported since MSDK v5.13, March 2025). For consumer
   Mavics the stream leaves the drone by zero-code paths: DJI Fly's RTMP push (~1080p, 1–5 s latency)
   or the RC Pro controller's HDMI-out into a $100 capture card (50–200 ms).
2. **LingBot-Map is a streaming 3D reconstructor, not a map-maker for games — yet.** It ingests video
   frames and emits per-frame camera poses + dense depth (unprojected to a colored point cloud) at
   ~20 FPS, with a clever bounded-memory transformer instead of SLAM. But its output is a
   **non-metric, unmeshed point cloud**: no surface, no collision, no scale in meters, no
   georeferencing, no loop closure. The bridge to a game engine — TSDF meshing, metric rescale,
   texturing, collision, navmesh — is all work you add (the repo's own Open3D dependency gets you
   most of the way).
3. **The game is the long pole, not the drone.** Cloning COD *mechanics* (ADS timings, recoil,
   damage falloff, tac-sprint/slide-cancel movement) is legal — game rules aren't copyrightable —
   and UE5's Lyra sample plus community stat databases (TrueGameData) make a faithful-feeling
   single-map shooter a months-scale indie project. COD-grade *multiplayer netcode* (lag
   compensation, 60 Hz servers) and COD-grade *content* are the expensive parts. Never copy COD
   assets/animations/sounds/names — those are protected. Rename the guns; model the loadout from
   public-domain military manuals. **Downscope escape hatch (§5): mirroring CS:GO instead of COD
   cuts the gunplay system to 2–4 weeks (hitscan + spray tables + buy menu) and — because
   Dust2-class bomb-defusal maps are nearly all exterior with fixed spawns — fits an aerial-scan
   map far better than COD's interior-heavy three-lane respawn design.**

**The honest minimal path:** Mini 4 Pro (or Mavic 3E) → automated grid flight (DroneDeploy/Litchi
Pilot/Pilot 2, zero custom code) → LingBot-Map on the live RTMP feed as an **in-flight 3D coverage
preview** → full-quality stills off the SD card into photogrammetry (RealityScan, free tier) for the
**final game asset** → UE5 + Lyra with weapons tuned to community-measured COD stats. Custom code:
~50 lines of glue for the live feed, one meshing script, and a lot of game tuning.

---

## 1. What LingBot-Map actually is (code-verified)

LingBot-Map ("Geometric Context Transformer for Streaming 3D Reconstruction", arXiv 2604.14141,
Robbyant team — Apache-2.0) is a **feed-forward streaming 3D reconstruction foundation model**:
a DINOv2 ViT-L backbone with 24 alternating frame-attention / geometric-context-attention blocks,
a camera head (9-D pose: translation + quaternion + FoV) and a DPT depth head. It processes a video
**one frame per forward pass** against a FlashInfer paged KV cache and emits that frame's pose +
depth + confidence immediately (`lingbot_map/models/gct_stream.py:446`, `gct_profile.py:94-135`).

Its streaming memory has three parts (the paper's "GCT" = exactly the code's two-stream cache,
`lingbot_map/layers/flashinfer_cache.py`):

| Component | What it is | Size |
|---|---|---|
| Anchor context | First 8 "scale frames", full tokens, never evicted — fixes the coordinate frame and scale | 8 frames |
| Pose-reference window | Sliding window of recent frames, full tokens | 64 frames |
| Trajectory memory | Every older frame compressed to **6 tokens** (1 camera + 4 register + 1 scale), append-only, plus video 3D RoPE for ordering | grows 6 tok/frame |

Drift correction is **learned attention over that compressed memory — there is no loop closure and
no bundle adjustment anywhere in the repo**. That's the bet, and on benchmarks it pays: on Oxford
Spires (large outdoor campus, LiDAR ground truth) it scores **ATE 6.42 m vs 18.16 m for the best
competing streaming method (CUT3R)**, and degrades only to 7.11 m at 3,840 frames at 20.29 FPS while
competitors double. Indoor numbers are excellent (7-Scenes ATE 0.08 m, TUM 0.045 m).

**What matters for the drone plan:**

- **~20 FPS at 518×378, bf16 + FlashInfer** (README's claim; `gct_profile.py` exists to verify it on
  your GPU). The pre-allocated KV pool alone is ~10.9 GB, so plan a **16–24 GB CUDA GPU**; a
  community fork exists for RTX 4060 8 GB. Real-time at drone-video framerates is plausible on a
  desktop RTX card if you stream at ~10–20 FPS input.
- **No aerial benchmark exists.** Aerial appears only as a qualitative demo and as training data
  (MatrixCity aerial sequences, MidAir drone dataset). The repo's own post-paper driving benchmarks
  are much weaker (KITTI ATE 24.05 m, VBR 31.20 m) — expect **meaningful drift on large outdoor
  areas**, which is fine for a 100–200 m game map and risky for a whole neighborhood.
- **Input is strictly files today** (`--image_folder` or `--video_path`; video is even re-extracted
  to JPEGs on disk first, `demo.py:65-89`). There is zero RTSP/RTMP/webcam support. **But** the core
  model API is genuinely incremental and stateful — `clean_kv_cache()` → one 8-frame scale batch →
  `forward()` per frame — so wiring a live OpenCV `VideoCapture(rtsp_url)` loop into per-frame
  `(points, colors, pose)` tuples is **~30–50 lines of glue** (preprocess to width-518, call
  forward, `pose_encoding_to_extri_intri`, `unproject_depth_map_to_point_map`, filter
  `depth_conf > 1.5`).
- **No intrinsics needed** — the model *predicts* FoV per frame; DJI camera calibration is not a
  blocker.
- **Outputs:** per-frame NPZ dumps (`--save_predictions`) and **GLB export** (three code paths, e.g.
  `lingbot_map/vis/glb_export.py`) — but the GLB contains a **point cloud**, not a mesh.
- **Streaming caveats for flight:** the RoPE positional budget is ~320 cached keyframes (auto
  keyframe-interval heuristic needs the sequence length up front — broken for open-ended live
  feeds; set `--keyframe_interval` manually); past ~3,000 frames you need windowed mode, whose
  window-to-window Sim(3) stitching runs **after** the flight (not online) and compounds scale
  drift; pose collapse has no in-code detection; sky masking is a post-hoc visualization filter
  that downloads an ONNX model from HuggingFace at first run; dynamic objects (cars, people) are
  explicitly future work — they'll smear into the cloud.

**License:** repo is Apache-2.0. Model weights are separate downloads (HuggingFace/ModelScope) —
**check the model card's license before shipping a commercial game on its output**; also note
VGGT-lineage files carrying Meta copyright headers and the third-party skyseg.onnx.

---

## 2. The flight side: getting a Mavic to fly the pattern and deliver the stream

Custom autopilot firmware is off the table (signed firmware, no open flight stack). Four real paths:

| Path | Aircraft | Code | Stream quality/latency | Automation |
|---|---|---|---|---|
| **A. DJI Fly RTMP push** → MediaMTX/nginx-rtmp on your PC | Any consumer Mavic/Mini | none | ~1080p, 1–5 s | DJI Fly waypoints (cinematic, not survey grids) |
| **B. RC Pro / RC Pro 2 HDMI-out** → USB capture card | Mavic 3 (RC Pro), Mavic 4 (RC Pro 2) | none | clean feed, 50–200 ms (CamLink-class ~$100–130; $20 dongles exist at 80–300 ms) | same as A |
| **C. Custom MSDK v5 Android app** (`ICameraStreamManager` raw H.264/YUV frames; `ILiveStreamManager` RTMP/RTSP/GB28181/Agora out; KMZ/WPML waypoint missions; virtual stick) | **Mini 3/3 Pro/Mini 4 Pro, Mavic 3 Enterprise, Matrice lines** — *not* consumer Mavic 3/4 | Kotlin; 2–6 weeks minimal, 3–6 months solid | transmission feed (~1080p), ~1 s RTSP | full programmatic missions (Mini 3/3P: virtual-stick only) |
| **D. Fly-offload-process** (the mapping default) | any | none | n/a (SD card after landing) | Pilot 2 mapping missions (M3E), DroneDeploy (M3E + Mini 4 Pro), Litchi Pilot, Dronelink |

**Recommended architecture — use two data products per flight:**

- **Live layer (the LingBot-Map part):** RTMP/HDMI feed → ffmpeg/OpenCV → the ~50-line streaming
  consumer → live point cloud in viser. This is your in-flight "am I covering everything, did
  reconstruction break" preview, and a fast draft map minutes after landing. Note the live feed is
  the *compressed transmission* stream; it will never look as good as the recording.
- **Asset layer:** interval stills (2–3 s, 75/75% overlap grid, 20 MP) off the SD card → offline
  reconstruction for the actual game map. Stills carry EXIF GPS (georeference + metric scale for
  free); video frames don't (DJI puts GPS in sidecar `.SRT` logs you'd parse with exiftool).

**Aircraft choice:**

- **Budget/legal sweet spot: Mini 4 Pro** (~$759 list) — 249 g means FAA Category 1 operations over
  people (the only class where scanning an inhabited street is practically legal without waivers),
  MSDK v5 support, native waypoints, DroneDeploy grid missions. Electronic shutter and small sensor
  are the tradeoff.
- **Serious mapping: Mavic 3 Enterprise** (~$3.6–3.9 k; superseded January 2025 by the Matrice 4
  series, so buy accordingly) — 4/3″ 20 MP with **mechanical shutter** (no rolling-shutter smear),
  0.7 s interval shooting, RTK option for cm-accurate georeferencing, Pilot 2 survey missions,
  MSDK v5 + Cloud API.
- **Your existing consumer Mavic 3/4 still works** via paths A/B/D — you just can't write an app
  for it, and grid flights become manual or DJI-Fly-waypoint approximations.

**Regulatory floor (US):** any non-recreational purpose (building a game asset arguably qualifies)
= FAA Part 107 cert; Remote ID is broadcast by all current DJI aircraft; DJI's hard geofencing was
dismantled in Jan 2025 (US), so compliance is entirely on the operator now. EU: Mini 4 Pro is C0/A1
(fly over uninvolved people, not crowds); Mavic 3 is C1; M3E is C2/A2 (30 m from people).
**Privacy is the sleeper issue:** scanning a real neighborhood captures homes, plates, and possibly
faces — GDPR applies in the EU, several US states have drone-surveillance statutes, and shipping a
recognizable real address as a shooter map is a reputational/legal risk regardless. Scrub textures
or fictionalize the map for release.

---

## 3. From point cloud to playable map (the gap LingBot-Map doesn't cover)

Everything a game engine needs and the repo doesn't produce — with the good news that the repo's
own stack gets you surprisingly far:

| Need | Status in repo | What to do |
|---|---|---|
| **Surface mesh** | Absent — rendering is 100% point-based (Open3D unlit points + EDL); zero TSDF/Poisson/marching-cubes code | `open3d==0.19` is already a pinned dep, and `demo_render`'s `SceneBuilder` already holds per-frame depth/pose/K/RGB/confidence — insert Open3D `ScalableTSDFVolume` integration or Poisson after `builder.preprocess()` with **zero new dependencies** (~1–2 weeks incl. tuning) |
| **Metric scale** | Non-metric (up-to-scale; the repo's own benchmark Umeyama-aligns *with* estimated scale) | Solve one scalar: match reconstructed camera height to barometric/GPS altitude from the `.SRT` log, or scale a known distance; RTK stills sidestep it entirely |
| **Georeference / gravity** | None (EXIF used only for orientation) | Align to the SRT/EXIF GPS track (Umeyama on camera centers); floor-align from the ground plane |
| **Texturing/UVs** | Per-point color only | Bake from posed keyframe images onto the TSDF mesh (Open3D texture mapping / Blender), or skip: use photogrammetry for the asset layer |
| **Hole filling** | Sky masked out → open tops; unseen backfaces absent | Blender/MeshLab cleanup pass; design map bounds to hide them |
| **Collision** | None (engines can't collide with point clouds) | Simplified collision mesh from the decimated TSDF mesh; the repo's Morton **voxel grid** (`voxel.py:112`, occupied-voxel centers + size) is a ready-made occupancy seed for blocky collision |
| **LOD** | Runtime octree point LOD only (not exportable) | UE5 Nanite eats the dense mesh directly; author simple collision separately |
| **Navmesh** | n/a | Free once collision geometry exists (UE5 NavMesh volume) |

**Alternative asset paths for the final map (both proven):**
- **Photogrammetry mesh:** RealityScan 2.x (free under $1 M revenue) or WebODM (free) → textured
  mesh → Nanite. This is the Battlefront/COD:MW-2019 lineage — Infinity Ward literally
  drone-scanned terrain for MW2019.
- **3D Gaussian splats** for lush visuals: nerfstudio/gsplat or Postshot (note: commercial PLY
  export now needs Postshot's paid Indie tier, ~€17/mo) → UE5 via third-party plugins (Luma AI
  plugin — free but a maintenance risk since Luma pivoted away; "NanoGS" (Mar 2026) adds
  Nanite-style splat LOD; Unity via aras-p's UnityGaussianSplatting). Splats have **no surface** —
  you still build the collision mesh, so treat splats as the pretty layer over the same TSDF/photo
  mesh colliders.

**The map-design reality check:** a real neighborhood scan is a *shell*. Aerial capture gets roofs
and facades — **no interiors**, and COD three-lane flow (maps are roughly 100–200 m across; lanes,
cover density, bounded sightlines, spawn logic) demands enterable buildings and editorial control.
Plan a blockout pass where the scan is the visual/geometry reference, interiors are hand-modeled or
ground-scanned (phone photogrammetry works), and the space is deliberately re-balanced. "Faithful
scan" and "plays like COD" are in tension; every shipped scan-based map editorializes.

---

## 4. The game: mirroring COD gun mechanics with a basic milspec loadout

**Engine baseline:** UE5 (free until $1 M lifetime revenue, then 5%) + **Lyra Starter Game** — Epic's
official shooter sample built on the Gameplay Ability System: weapon abilities, spread/recoil
scaffolding (`RangedWeaponInstance`), TDM/Control modes, replication and dedicated-server support
out of the box. Fab kits exist that already advertise COD-style gunsmith/tac-sprint/slide-cancel if
you want to buy speed. (Unity path: Competitive Action Multiplayer template + UFPS; viable, less
COD-shaped.)

**What "mirroring the gun mechanics" concretely means — all of it tunable data, all of it measured
by the community** (TrueGameData, WZRanked, XclusiveAce, JGOD):

- **Ballistics:** modern COD uses projectiles with velocity + drop (hitscan died with BO4/MW2019).
  Rule of thumb: a gun is effectively hitscan out to velocity ÷ tick-rate (540 m/s at 20 Hz ≈ 27 m).
- **Handling:** per-gun ADS time and sprint-to-fire in milliseconds (e.g. MW2 M4: 158 ms base
  sprint-out, 75 ms tuned), modified by attachments — this is where "COD feel" actually lives.
- **Recoil:** deterministic per-gun patterns (MW2019/WZ1 era) vs randomized (WZ2 era) — pick the
  era you're mirroring; deterministic is both more learnable and easier to implement.
- **Damage:** per-body-part values with stepped range-falloff tiers → TTK breakpoints.
- **Movement tech:** tac-sprint, slide-cancel (decide MW2019 rules — resets tac-sprint — or MW3
  rules — doesn't), sprint-mantle, tac-stance. This is character-controller work in UE5, well-trodden.
- **Netcode (the hard 20%):** UE5 ships replication + client prediction but **not lag
  compensation** — COD-style hit registration needs a custom server-rewind system (community
  implementations and SnapNet middleware exist). COD itself runs ~60 Hz MP / ~20 Hz Warzone. For a
  v1, ship bots/co-op (Lyra has bot scaffolding; navmesh on your cleaned mesh) and listen-server
  PvP; treat ranked-quality netcode as its own project.

**"Basic milspec loadout" — define it, source it legally:** an M4A1-pattern 5.56 carbine
(700–950 RPM class), M17/M9-class 9 mm sidearg, frag + flash, plate carrier (armor model), IFAK
(heal). Ballistic/equipment specs from US military field/technical manuals are **public domain
(17 U.S.C. §105)**. Weapon 3D models/animations/sounds: buy licensed packs on Fab/Unity Asset
Store or commission — never rip from COD.

**The legal lines (US-centric, not legal advice):**
- Game **mechanics are not copyrightable** (17 U.S.C. §102(b); *Tetris v. Xio* marks the limit:
  don't clone the *audiovisual expression*). Cloning timings, recoil math, movement rules: fine.
- COD's **assets, animations, sounds, operator likenesses, map layouts, and names** are protected.
  "Call of Duty"/"Warzone" are trademarks. Build your own or license.
- **Real gun names are trademarks**: industry practice since EA's 2013 pullback is renaming or
  unlicensed-depiction-with-risk; *AM General v. Activision* (2020) protected Humvees as expression,
  but *Jack Daniel's v. VIP* (2023) narrowed that defense — **rename the guns** (COD itself does).
- Depicting real military *hardware categories* generically (an "M4-style carbine") is standard.

---

## 5. Downscope option: CS:GO-style instead of COD-style (recommended)

Mirroring CS:GO rather than modern COD removes most of the game-side cost — and it happens to fit
an aerial-scan pipeline better than COD does:

| Dimension | COD-style (above) | CS:GO-style downscope |
|---|---|---|
| Ballistics | Projectiles w/ velocity + drop | **Hitscan** line-traces + material penetration — the textbook case; Valve's published lag-compensation paper is the reference implementation |
| Gun feel | Per-gun ADS/sprint-out ms, attachment matrices | **Deterministic spray patterns as data tables** (the AK curve), first-shot + movement inaccuracy, tagging slowdown, armor/headshot multipliers |
| Loadout | Gunsmith, attachments, perks, progression | **Buy menu = your "basic milspec loadout" verbatim**: rifle, sidearm, HE/flash/smoke, kevlar + helmet, defuse kit; ~8–12 weapons covers the whole game |
| Movement | Tac-sprint, slide-cancel, mantle, ADS | No ADS (sniper zoom only), Source-style movement with counter-strafe feel — open-source UE5 reimplementations exist (Project Borealis movement plugin) |
| Mode/spawns | Respawn modes → spawn-flow logic (hard) | Round-based bomb defusal → **fixed spawns**; the hardest map-design problem disappears |
| Map demands | Three-lane flow, enterable interiors | **Dust2-class maps are ~all exterior** — streets, courtyards, low cover, minimal interiors — i.e. exactly what a drone scan produces; scan → two bombsites + mid ≈ playable |
| Netcode bar | 12+ players, respawn churn | 5v5, round-based; lag comp still needed for ranked feel, but bots-first v1 plays fine without it |

Effort swing: the gunplay/loadout system drops from months to **2–4 weeks** (hitscan traces, spray
tables, buy menu, round-state machine), and map editorialization roughly halves. The "upgraded
experience" is then presentation, where your pipeline already shines: Nanite/Lumen on the scanned
mesh (or a splat visual layer), modern HRTF audio, high-tickrate responsiveness — CS2's formula, on
maps you flew yourself. Legal posture unchanged: mechanics are free to mirror; don't copy Valve's
assets, names, or the expressed layout of Dust2 et al.; still rename real guns.

---

## 6. Effort and cost summary

| Workstream | Effort | Cost |
|---|---|---|
| Drone + controller (Mini 4 Pro w/ RC-N2) | off the shelf | ~$760–1,100 (M3E: ~$3.6–5 k) |
| Ground PC (RTX 4080-class 16 GB, 64 GB RAM) — serves LingBot-Map, photogrammetry, and UE5 | off the shelf | ~$1,800–2,800 |
| Capture card (HDMI path) / MediaMTX RTMP server | off the shelf | $0–130 |
| Automated mapping flights (DroneDeploy/Litchi Pilot/Pilot 2) | zero code | $0–low subscription |
| **LingBot-Map live-stream consumer** (RTSP→forward→points glue + manual keyframe interval) | **~50 lines; days** | free (verify weights license) |
| **TSDF meshing + metric-scale + export stage** on top of repo's Open3D/NPZ/GLB scaffolding | **1–2 weeks** | free |
| Custom MSDK v5 Android app (only if you outgrow zero-code missions/streaming) | 2–6 weeks minimal; 3–6 months robust | free (DJI dev account) |
| UE5 + Lyra prototype: your mesh + collision + navmesh + one tuned COD-stat weapon set, bots | 1–2 months (solo, experienced) | free tier |
| — CS:GO-style downscope instead (§5): hitscan + spray tables + buy menu + bomb-defusal round loop | 2–4 weeks | free tier |
| Map editorialization (blockout, interiors, cover, spawns) | 1–2 months per map | asset packs $ |
| Milspec weapon/character art, animation, audio | buy packs (days) → or months custom | $100s–$1,000s in packs |
| COD-grade MP netcode (server rewind, dedicated servers, anti-cheat) | 6–12+ dev-months | server hosting ongoing |
| Part 107 cert (US, non-recreational flying) | study + $175 exam | ~$175 |

**First weekend, concretely:** fly your Mavic manually over an empty field/structure recording 4K;
run `demo_render/batch_demo.py` on the MP4 (windowed mode, `--save_predictions --mask_sky`); export
GLB; drop it into UE5 as a visual reference; verify `gct_profile.py` hits ~real-time on your GPU.
Second weekend: the 50-line RTMP live loop + an Open3D TSDF script over the saved NPZs → your first
collidable mesh under a Lyra character with an M4-stat rifle. That's the whole pipeline, end to end,
before any custom drone software exists.

---

## Appendix: verification notes

- Findings cross-checked by an adversarial critic pass; corrections applied: MSDK v5 does **not**
  support Mavic 4 Pro / Air 3 / consumer Mavic 3 (official `dji-sdk/Mobile-SDK-Android-V5` README,
  v5.18.0); Postshot's free tier no longer covers commercial PLY export (v1.0 restructure); Luma's
  UE plugin works but is a maintenance risk; Mavic 3E was superseded by the Matrice 4 series
  (Jan 2025) — still purchasable and still the budget mechanical-shutter option.
- LingBot-Map claims verified against code at `path:line` granularity (paged cache:
  `lingbot_map/layers/flashinfer_cache.py`; streaming protocol: `gct_profile.py:94-135`; no-mesh
  finding: exhaustive grep; non-metric scale: `benchmark/benchmark/geometry/registration.py:65-92`).
- Numbers marked as community measurements (COD stats, map sizes, tick rates) are not official
  Activision data; recoil determinism varies by title era.
