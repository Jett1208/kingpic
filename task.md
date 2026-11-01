# 👑 Agong's Kingshot — Implementation Tickets

> **Reference:** [SPEC.md](docs/SPEC.md) | [GLOSSARY.md](GLOSSARY.md) | ADR 0001–0004
> **Status Legend:** ⬜ Not Started | 🔨 In Progress | ✅ Done

---

## Phase 0: Project Bootstrap
### ✅ T-00: Scaffold Vite + React + TypeScript + PWA
- [x] `npm create vite` + install all dependencies
- [x] Configure `vite.config.ts` with Tailwind, PWA manifest (portrait, standalone)
- [x] Generate placeholder PWA icons (192, 512)
- [x] Verify `npm run build` passes clean
- **Files:** `vite.config.ts`, `src/index.css`, `public/icon-*.png`

---

## Phase 1: Core Engine (Canvas & Systems)

### ✅ T-01: SpriteCache — Pixel Art Sprite System
- [x] Created `src/core/SpriteCache.ts`
- [x] 16x16 / 32x32 / 8x8 Pixel matrix for King, Soldier, Fence, CoinPile, SoldierCage, RedMonster, ArcherTower, BossTower, Arrow, Coin, GroundTileA, GroundTileB
- [x] Pre-rendered to offscreen canvases for 60 FPS performance

### ✅ T-02: GameEngine — Game Loop, Camera, World
- [x] Created `src/core/GameEngine.ts`
- [x] requestAnimationFrame loop, delta time capped at 50ms
- [x] Camera Y-lerp smooth follow + clamped in 400x900 world
- [x] Logical viewport 360x640 scaled to device pixel ratio
- [x] Checkerboard ground rendering, castle wall and gate decorations

### ✅ T-03: InputManager — Floating Joystick
- [x] Created `src/core/InputManager.ts`
- [x] Touch Floating Joystick in bottom screen area (60px radius, 28px knob, 10px deadzone)
- [x] Keyboard WASD / Arrow keys support for desktop testing
- [x] Normalized output vector (dx, dy)

### ✅ T-04: SoundEngine — Web Audio API Synthesizer
- [x] Created `src/core/SoundEngine.ts`
- [x] Pure Web Audio synthesis: attack hit, coin chime, cage break, knockback clang, victory fanfare, star dings
- [x] 8-bit chiptune BGM looping synthesizer (140 BPM march)
- [x] Web Vibration API (Haptics) with fallbacks

---

## Phase 2: Entities & Gameplay

### ✅ T-05: Squad — King + Soldiers + Coin Tower
- [x] Created `src/entities/Squad.ts`
- [x] King movement (120 px/s, boundary clamp, soft knockback reaction)
- [x] Rescued soldiers orbit in circular formation with auto-attack (20 DPS/soldier)
- [x] Dynamic Aura Radius: `75 + min(85, soldiers * 2.5)`
- [x] Swaying Coin Tower on King's head via Sine wave equation

### ✅ T-06: Destructible — All Entity Types + AI
- [x] Created `src/entities/Destructible.ts`
- [x] `Fence` (HP 30), `CoinPile` (HP 20), `SoldierCage` (HP 80 * 1.15^(S-1))
- [x] `RedMonster` with IDLE -> CHASE -> ATTACK -> RETREAT state machine
- [x] `ArcherTower` with 150px detection, straight non-homing arrow projectiles
- [x] `BossTower` (HP 300 * (1 + (S-1)*0.35)) triggering victory sequence

### ✅ T-07: ParticleSystem — Visual Effects
- [x] Created `src/entities/ParticleSystem.ts`
- [x] Bezier curve flying coins into King's head
- [x] Floating damage numbers with dark outline
- [x] Bouncing wood debris with gravity
- [x] Hit sparks

### ✅ T-08: StageGenerator — Seeded Random Level Builder
- [x] Created `src/systems/StageGenerator.ts`
- [x] Mulberry32 deterministic PRNG (`seed = stageNumber * 9973`)
- [x] 3 zones layout (Boss Zone, Mid Zone, Spawn Zone)
- [x] Infinite level generation with Par Time formula

---

## Phase 3: State Management & React UI

### ✅ T-09: useGameStore — Zustand + localStorage
- [x] Created `src/systems/useGameStore.ts`
- [x] Persisted state: `highestUnlocked`, `stages` (stars, bestTime, bestCoins, bestPercent), sound/haptic toggles, tutorial seen
- [x] Transient state: screen router, active stage, live coins, elapsed time, destruction percent

### ✅ T-10: MainMenu.tsx
- [x] Created `src/components/MainMenu.tsx`
- [x] High-contrast title & crown icon
- [x] Extra-large buttons: [▶️ เล่นด่านล่าสุด], [📋 เลือกด่าน], Sound/Haptic toggles

### ✅ T-11: StageSelect.tsx
- [x] Created `src/components/StageSelect.tsx`
- [x] 4-column scrollable grid with 0–3 stars indicators and next locked stage

### ✅ T-12: HUD.tsx
- [x] Created `src/components/HUD.tsx`
- [x] Fixed top bar: Stage number, Destruction %, Elapsed time, Mute & Pause buttons
- [x] Bottom-left coins & soldiers badges with high contrast

### ✅ T-13: PauseOverlay.tsx
- [x] Created `src/components/PauseOverlay.tsx`
- [x] Auto-pause on app minimize / screen lock
- [x] [▶️ เล่นต่อ] and [🏠 กลับหน้าหลัก] buttons

### ✅ T-14: StageSummaryModal.tsx
- [x] Created `src/components/StageSummaryModal.tsx`
- [x] Confetti burst, animated star reveal (with ding SFX)
- [x] 4 extra-large Thai buttons: [▶️ ด่านต่อไป], [🔄 เล่นซ้ำอีกรอบ], [📋 เลือกด่าน], [🏠 กลับหน้าหลัก]

### ✅ T-15: TutorialOverlay.tsx
- [x] Created `src/components/TutorialOverlay.tsx`
- [x] Bouncing hand icon with instruction text, dismissed upon first drag

---

## Phase 4: Integration & Polish

### ✅ T-16: App.tsx — Screen Router & Canvas Mount
- [x] Integrated `GameEngine` lifecycle with React state machine in `src/App.tsx`
- [x] Auto-pause listener on document visibility change

### ✅ T-17: Pixel Art PWA Icons
- [x] Generated high-res 16x16 pixel art crown PNGs scaled to 192x192 and 512x512 in `public/`

### ✅ T-18: Final Build Verification & Performance
- [x] `tsc -b && vite build` passed cleanly with 0 errors
- [x] `oxlint` passed with 0 warnings and 0 errors
- [x] Standalone PWA service worker and Web App Manifest generated

---

## Phase 5: Squad Combat Evolution (ADR 0005 & 0006)

### ✅ T-19: Dynamic Charge Combat, 50 HP Soldiers, Team Heal & Enemy Swarms
- [x] Upgraded Soldier HP to 50 HP with mini health bar rendering
- [x] Natural Loose Escort Mob following behavior (breaking free from rigid circle)
- [x] Detection Aura perimeter triggering active charge combat into enemies
- [x] Combat leash system (soldiers disengage and sprint back if King walks away)
- [x] Enemy Swarm generation (20–24 Red Monsters placed across map corridors and camps)
- [x] Cage Break Team Full Heal (rescued cage fully heals all surviving soldiers to 100% HP)

