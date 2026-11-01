# 👑 Agong's Kingshot — Full Technical Specification

> **สถานะ:** Final (ผ่านการ Grill 3 รอบ ไม่มี silent assumption เหลือ)
> **วันที่:** 2026-11-01
> **เอกสารอ้างอิง:** [GLOSSARY.md](../GLOSSARY.md), ADR 0001–0004

---

## 1. ภาพรวมผลิตภัณฑ์ (Product Overview)

เกม 2D Pixel Art บนเว็บ (PWA) สำหรับผู้สูงอายุ ("อากง") ได้แรงบันดาลใจจากโฆษณาเกม Kingshot
- **แก่นเกม:** ลากนิ้วบังคับราชานำกองทัพกวาดล้างสิ่งก่อสร้างและสะสมเหรียญ
- **ไม่มี Game Over:** ราชาอมตะ 100% (ADR 0001)
- **ไม่มีร้านค้าอัปเกรด:** เหรียญเป็นคะแนนสะสมล้วน (ADR 0002)
- **ด่านไม่สิ้นสุด:** Seeded Random สร้างด่านได้ไม่รู้จบ (ADR 0003)

## 2. สถาปัตยกรรมระบบ (System Architecture)

### 2.1 Tech Stack
| Layer | Technology |
|---|---|
| Framework | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (HTML overlay) |
| State | Zustand + localStorage persist |
| Game Render | Canvas 2D API (OffscreenCanvas sprite cache) |
| Audio | Web Audio API (synthesized SFX + BGM) |
| Haptics | Web Vibration API (`navigator.vibrate`) |
| PWA | vite-plugin-pwa (Service Worker, Offline) |
| Effects | canvas-confetti (victory celebration) |
| Icons | Lucide React (UI buttons) |

### 2.2 Render Architecture
```
┌──────────────────────────────────┐
│  React HTML Overlay (z-index:10) │ ← HUD, Modal, Pause, Menu
│  (Tailwind CSS, pointer-events)  │
├──────────────────────────────────┤
│  Canvas 2D (z-index:1)           │ ← Game world, sprites, particles
│  Logical: 360×640                │
│  Physical: 360×640 × DPR         │
└──────────────────────────────────┘
```

### 2.3 Screen State Machine
```
MainMenu ──[เล่นด่านล่าสุด]──► GamePlay ──[บอสแตก]──► StageSummary
   ▲                              │                        │
   │                          [Pause→กลับ]         [ด่านต่อไป]──► GamePlay (S+1)
   │                              │                [เล่นซ้ำ]──► GamePlay (S)
   └──────────[กลับหน้าหลัก]──────┘                [เลือกด่าน]──► StageSelect
                                                       │
MainMenu ◄──[กลับ]── StageSelect ──[กดด่าน]──► GamePlay
```

## 3. World & Camera

| Property | Value |
|---|---|
| World size | 400 × 900 game units |
| Logical resolution | 360 × 640 px |
| DPR scaling | Canvas size = logical × `devicePixelRatio` |
| Camera axis | Y only (vertical scroll), X locked center |
| Camera follow | `lerp(camY, kingY - screenH/2, 0.08)` |
| Camera clamp | `camY ∈ [0, worldH - screenH]` |
| Ground tile | Checkerboard 32×32, 2 green shades |
| Map top edge | Castle wall decoration |
| Map bottom edge | Gate entrance decoration |

## 4. ตัวละครและระบบควบคุม (Player & Controls)

### 4.1 King (ราชา)
| Property | Value |
|---|---|
| Sprite | 16×16 pixel matrix, blue+gold vivid |
| Speed | 120 px/s |
| HP | ∞ (Invincible — ADR 0001) |
| Starting soldiers | 3 (Royal Guards escort from start — ADR 0005) |
| Starting aura radius | 82.5 px |
| Royal Slash Attack | 15 damage, range 48px, cooldown 0.35s |
| Knockback behavior | Pushed back + slowed 0.2s, no HP loss |
| Boundary | Clamped within map edges |

### 4.2 Floating Joystick
| Property | Value |
|---|---|
| Activation zone | Bottom 50% of screen |
| Appear position | Where finger touches down |
| Outer radius | 60 px |
| Inner knob radius | 28 px |
| Deadzone | 10 px |
| Opacity | 50% |
| Output | Normalized vector (dx, dy) |

### 4.3 Soldiers (ทหาร)
| Property | Value |
|---|---|
| Sprite | 16×16 pixel matrix, blue vivid |
| Follow speed | King speed × 1.3 (lerp to orbit position) |
| Formation | Circle around king |
| Attack | Auto-attack within aura radius |
| Damage | 10 per hit |
| Attack interval | 0.5 s per soldier |
| DPS per soldier | 20 |
| Collision | No hitbox (arrows/monsters pass through) |

### 4.4 Aura Radius
$$\text{auraRadius} = 75 + \min(85, \text{soldierCount} \times 2.5)$$
- Min: 75 px (0 soldiers)
- Max: 160 px (34+ soldiers)

### 4.5 Coin Tower
- Visual stack on king's head, max 60 visual layers
- 1 layer represents 1–5 coins (scaled)
- Gold number label on top
- Sway formula per layer $i$:
$$X_i = X_{\text{king}} + \sin(t \times 0.008 - i \times 0.15) \times \min(18, i \times 0.4) - v_x \times i \times 0.25$$

## 5. Destructible Entities

### 5.1 Base HP & Scaling Table

| Entity | Sprite | HP (S=1) | HP Scale/Stage | Coins | Behavior |
|---|---|---|---|---|---|
| Fence | 16×16 dark brown | 30 | ×1.0 fixed | 3 | Static obstacle |
| Coin Pile | 16×16 gold sparkle | 20 | ×1.0 fixed | 15–25 (seeded) | Static, coins fly out |
| Soldier Cage | 16×16 light brown cage | 80 | ×1.15 | 10 + 3 soldiers | Static, releases soldiers |
| Red Monster | 16×16 red vivid | 60 | ×1.2 | 5 | Aggro AI (see 5.2) |
| Archer Tower | 16×16 gray stone+bow | 120 | ×1.25 | 8 | Shoots arrows (see 5.3) |
| Boss Tower | 32×32 purple+red flag | 300 | ×(1+(S-1)×0.35) | 50 + confetti | Static, stage clear on death |

HP formula for stage S: `baseHP × scale^(S-1)` (except Boss which uses its own formula)

### 5.2 Red Monster AI
```
State: IDLE
  │── King enters 120px range ──► CHASE
  
State: CHASE
  │── Move toward king at 60 px/s
  │── Reach king (collision) ──► ATTACK
  
State: ATTACK
  │── Apply Soft Knockback to king
  │── Play "clang" SFX + spark particles
  │── Haptic 20ms
  │── ──► RETREAT

State: RETREAT
  │── Move away from king at 40 px/s for 1.0s
  │── Timer expires ──► CHASE (if king still in range) or IDLE
```

### 5.3 Archer Tower AI
| Property | Value |
|---|---|
| Detection range | 150 px |
| Fire rate | 1 arrow every 2.0 s |
| Arrow speed | 80 px/s |
| Arrow targeting | Straight line toward king's position at moment of fire (non-homing) |
| Arrow on hit | Soft Knockback (0.2s slow) + "clang" SFX + spark + Haptic 20ms |
| Arrow lifetime | Despawn after 3s or on hit |

## 6. Stage Generation (`mulberry32`)

### 6.1 Seed
```typescript
const rng = mulberry32(stageNumber * 9973);
```

### 6.2 Scaling Formulas & Density (Stage S — ADR 0005)
- **Total Entities per Stage:** 35–45 ชิ้น (ความหนาแน่นสไตล์ Arcade ถล่มทลาย)
- **Starting Soldiers:** 3 นาย
- **First Cage:** อยู่ที่ Y: 730 ห่างจากจุดเกิดเพียง 1–2 วินาที
- **Barricades:** แนวกำแพงรั้วไม้ขวางทาง 3 แนว (Spawn, Mid, Boss perimeter)
- **Cages per Map:** 4–6 กรง (ช่วยรวมกองทัพได้ 15–20+ นาย)

### 6.3 Zone Layout
```
┌──────────────────┐ Y=0
│   BOSS ZONE      │ Boss Tower (center) + Archer Towers (flanks) + Coin Pile
│   Y: 0–250       │
├──────────────────┤
│   MID ZONE       │ Soldier Cages + Red Monsters + Fences (scattered)
│   Y: 250–650     │
├──────────────────┤
│   SPAWN ZONE     │ King spawn (center-bottom) + Fences (easy) + Coin Piles
│   Y: 650–900     │
└──────────────────┘ Y=900
```
- Entities placed with seeded `rng()` within zone X/Y bounds
- Minimum spacing between entities: 40px (prevent overlap)

## 7. Star Rating (ADR 0003)

| Star | Condition | Earned When |
|---|---|---|
| ⭐ 1 | Victory | Boss Tower destroyed (always earned on clear) |
| ⭐ 2 | Total Domination | `destroyedCount === totalDestructibles` (100%) |
| ⭐ 3 | Speed Runner | `clearTime ≤ parTime` |

- Stars are independent (can earn ⭐3 without ⭐2)
- Best result per stage stored in localStorage

## 8. Feedback Systems (ADR 0004)

### 8.1 Sound Effects (Web Audio API Synthesizer)
| Event | Sound Type | Waveform |
|---|---|---|
| Soldier attack hit | Short slash | Square wave 200ms, pitch sweep 800→400Hz |
| Coin collected | Bright ding | Sine wave 100ms, 1200Hz |
| Cage broken | Wood crack | Noise burst 150ms + sine 300Hz |
| Knockback received | Clang | Triangle wave 200ms, 500Hz |
| Boss destroyed | Fanfare | Arpeggio sequence 1.5s |
| Star earned | Ding ascending | Sine 150ms, pitch +200Hz per star |
| BGM loop | Chiptune march | Square+pulse pattern, tempo 140BPM |

### 8.2 Haptic Vibration
| Event | Duration |
|---|---|
| Coin/fence hit | 20 ms |
| Cage broken | 60 ms |
| Boss destroyed | 100 ms |
| Knockback received | 30 ms |

### 8.3 Particle Effects
| Effect | Description |
|---|---|
| Coin fly-in | Bezier curve from source to king's coin tower |
| Damage number | Float up + fade out over 0.8s, white bold text |
| Wood debris | 3–5 small brown squares scatter outward, gravity 0.5s |
| Spark | 4–6 yellow/white dots radiate from hit point, 0.3s |
| Confetti | canvas-confetti library burst on boss kill |

## 9. UI Specification

### 9.1 MainMenu
```
┌─────────────────────────────────┐
│                                 │
│     (Pixel Art King Logo)       │
│                                 │
│   👑 เกมตีป้อมของอากง           │  ← Title, 28px bold
│                                 │
│  ┌─────────────────────────┐    │
│  │   ▶️  เล่นด่านล่าสุด    │    │  ← Green, 56px tall, full-width
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │   📋  เลือกด่าน         │    │  ← Blue, 48px tall
│  └─────────────────────────┘    │
│                                 │
│     🔊  📳                      │  ← Toggle buttons, 40×40
└─────────────────────────────────┘
```

### 9.2 HUD (During Gameplay)
```
┌─────────────────────────────────┐
│ 🏰 ด่าน 5   ⚔️ 42%   ⏱ 01:23  │  ← Top bar, 18px bold white, drop-shadow
│                          🔇  ⏸️ │  ← 40×40 buttons
│                                 │
│           (Canvas)              │
│                                 │
│  💰 127                         │  ← Bottom-left, 20px gold
└─────────────────────────────────┘
```

### 9.3 Pause Overlay
- Trigger: ⏸️ button OR `document.visibilitychange` → hidden
- Full-screen dark overlay (opacity 70%)
- Center: "⏸️ หยุดพัก" title
- [▶️ เล่นต่อ] button (green, large)
- [🏠 กลับหน้าหลัก] button (gray)

### 9.4 Stage Select
- Grid: 4 columns
- Each cell: square button, stage number, 0–3 star icons
- Unlocked: green background, tap to play
- Next locked: gray + 🔒 icon (visible but disabled)
- Beyond: hidden
- Scrollable vertically
- Back button → MainMenu

### 9.5 StageSummaryModal
- **Sequence:** Boss explodes → Confetti 1.5s + Haptic 100ms → Dark overlay fade 0.5s → Modal slide-up → Stats → Stars animate 1-by-1 (0.4s gap, "ding" each) → 4 buttons appear

```
┌─────────────────────────────────┐
│         ✨ ด่าน 5 ✨             │
│                                 │
│   💰 127 เหรียญ                 │
│   ⏱ 00:48                      │
│   ⚔️ 100%                      │
│                                 │
│        ⭐ ⭐ ⭐                  │  ← Animate in sequence
│                                 │
│  ┌─────────────────────────┐    │
│  │   ▶️  ด่านต่อไป         │    │  ← GREEN, largest, 56px tall
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │   🔄  เล่นซ้ำอีกรอบ     │    │  ← Blue, 48px
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │   📋  เลือกด่าน         │    │  ← Gray, 44px
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │   🏠  กลับหน้าหลัก      │    │  ← Gray, 44px
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### 9.6 Tutorial Overlay (Stage 1, First Play Only)
- Animated hand icon pointing to bottom half of screen
- Text: "แตะแล้วลากนิ้ว เพื่อบังคับราชาเดิน 👆"
- Disappears on first touch-drag
- Persisted: `tutorialSeen: true` in localStorage

## 10. Data Persistence (localStorage via Zustand)

```typescript
interface GameSave {
  version: 1;
  highestUnlocked: number;       // Latest unlocked stage
  stages: Record<number, {
    stars: number;               // 0–3
    bestTime: number;            // seconds
    bestCoins: number;
    bestPercent: number;         // 0–100
  }>;
  soundOn: boolean;
  hapticOn: boolean;
  tutorialSeen: boolean;
}
```
- **Migration:** If `version` mismatch → keep `stages`, reset new fields to defaults
- **Default:** `{ version: 1, highestUnlocked: 1, stages: {}, soundOn: true, hapticOn: true, tutorialSeen: false }`

## 11. PWA Configuration

| Property | Value |
|---|---|
| Display | standalone |
| Orientation | portrait (locked) |
| Theme color | #16a34a (green-600) |
| Background | #14532d (green-900) |
| Service Worker | generateSW (auto-update) |
| Offline | Full offline support (all assets precached) |
| Icons | 192×192, 512×512 PNG (pixel art crown) |
