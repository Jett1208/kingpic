# 👑 Agong's Kingshot (2D Pixel Edition) — Architecture & Master Prompt Pack

เอกสารชุดนี้ออกแบบมาเพื่อใช้เป็น **Context File (`blueprint.md`)** สำหรับโยนใส่ **Antigravity** เพื่อให้ AI Agent สร้างโปรเจกต์ตามโครงสร้าง OOP เต็มรูปแบบ 

## ส่วนที่ 1: พิมพ์เขียวโปรเจกต์สำหรับ Antigravity (Production Setup)

เมื่อต้องการนำโปรเจกต์ขึ้น GitHub และ Deploy บน Vercel ให้ทำเป็น PWA เต็มรูปแบบสำหรับมือถือของอากง ให้เปิดโฟลเดอร์ใน **Antigravity** แล้วใช้คำสั่งและโครงสร้างด้านล่างนี้ครับ

### 1. คำสั่งเริ่มต้นสร้างโปรเจกต์ (Terminal Commands)

```bash
# 1. สร้างโปรเจกต์ Vite + React + TypeScript
npm create vite@latest agong-kingshot -- --template react-ts
cd agong-kingshot

# 2. ติดตั้ง Tailwind CSS, Lucide Icons (สำหรับปุ่มใหญ่ๆ), Zustand และ PWA Plugin
npm install tailwindcss @tailwindcss/vite lucide-react zustand canvas-confetti
npm install -D @types/canvas-confetti vite-plugin-pwa
```

### 2. โครงสร้างโฟลเดอร์และหน้าที่ของแต่ละไฟล์ (Directory Structure)

```text
agong-kingshot/
├── public/
│   ├── icon-192.png              # ไอคอนรูปมงกุฎพิกเซลสำหรับหน้าจอมือถืออากง
│   └── icon-512.png
├── src/
│   ├── core/
│   │   ├── GameEngine.ts         # ควบคุม Game Loop (requestAnimationFrame), กล้อง และเช็กชนะ 100%
│   │   ├── InputManager.ts       # จัดการ Floating Joystick คำนวณ Vector (dx, dy) จากนิ้วที่ลาก
│   │   ├── SoundEngine.ts        # สังเคราะห์เสียง 8-bit ด้วย Web Audio API (Attack, Coin, Cage, Win)
│   │   └── SpriteCache.ts        # วาด Pixel Matrix 16x16 ลง OffscreenCanvas เพื่อเรนเดอร์ 60 FPS ลื่นๆ
│   ├── entities/
│   │   ├── Squad.ts              # ราชา + เสาเหรียญแกว่งตามสมการ Sine + ทหารอมตะเดินตามในวงกลม
│   │   ├── Destructible.ts       # รั้วไม้, ป้อมธนู, มอนสเตอร์สีแดง, กรงขังเพื่อน, กองเหรียญ, ป้อมบอส
│   │   └── ParticleSystem.ts     # เหรียญบินเข้าหัวราชา (Bezier Curve) + ตัวเลขดาเมจเด้ง + เศษไม้แตก
│   ├── systems/
│   │   ├── StageGenerator.ts     # อัลกอริทึม Seeded Random (Mulberry32) สร้างด่านตามเลข stageNumber
│   │   └── useGameStore.ts       # Zustand Store เชื่อมค่าจาก Canvas มาแสดงที่ React UI + เซฟ localStorage
│   ├── components/
│   │   ├── MainMenu.tsx          # หน้าหลัก: ปุ่มเริ่มเกมขนาดใหญ่ + หน้าเลือกด่านย้อนหลัง
│   │   ├── HUD.tsx               # แถบสถานะด้านบน (เลขด่าน, เปอร์เซ็นต์ 0-100%, เวลา, เหรียญ)
│   │   └── StageSummaryModal.tsx # หน้าสรุปผลจบด่านพร้อมปุ่มควบคุม 4 ปุ่มขนาดใหญ่พิเศษ
│   ├── App.tsx                   # สลับหน้าจอระหว่าง MainMenu กับ GameCanvas + HUD + Summary
│   └── main.tsx
├── vite.config.ts                # ตั้งค่า PWA Manifest ล็อกจอแนวตั้ง (portrait) และทำงานแบบ Offline
└── blueprint.md                  # (ไฟล์นี้) เก็บไว้ใน Root เพื่อให้ Antigravity Agent อ่านเป็นบริบทหลัก
```

---

## ส่วนที่ 2: สเปกทางเทคนิคของแต่ละโมดูล (Module Specifications สำหรับสั่ง Agent)

เวลาสั่งงาน AI Agent ใน Antigravity คุณสามารถอ้างอิงหัวข้อด้านล่างนี้เพื่อให้เขียนโค้ดแยกไฟล์ได้เป๊ะ 100%:

### 1. ระบบสุ่มด่านแบบคงที่ (`src/systems/StageGenerator.ts`)
* ใช้ฟังก์ชัน `mulberry32(seed: number)` โดยส่ง `seed = stageNumber * 9973` เข้าไป
* **สูตรสเกลความยากตามด่าน ($S = \text{stageNumber}$):**
  * เวลาเป้าหมายของด่าน ($\text{Par Time}$): $45 + \min(60, S \times 5)$ วินาที
  * จำนวนกรงขังเพื่อนในด่าน: $2 + \lfloor S / 2 \rfloor$ กรง (ยิ่งด่านสูง ยิ่งช่วยเพื่อนมาตั้งกองทัพใหญ่ๆ ได้สะใจขึ้น)
  * เลือดของป้อมบอส ($\text{Boss HP}$): $300 \times (1 + (S - 1) \times 0.35)$
* **การจัดวาง (Zone Layout):**
  * **โซนล่าง (จุดเกิดราชา):** มีกองเหรียญฟรีและรั้วไม้บางๆ ให้อากงลากนิ้วชนแตกง่ายๆ ตั้งแต่วินาทีแรก
  * **โซนกลางซ้าย-ขวา:** มีกรงขังเพื่อนทหารที่มีรั้วไม้หรือมอนสเตอร์สีแดงเฝ้าอยู่
  * **โซนบนสุด:** ป้อมบอสใหญ่ประจำด่าน ขนาบข้างด้วยป้อมธนู 2 ข้าง และกองเหรียญรางวัลก้อนโต

### 2. ระบบเสาเหรียญและฝูงทหาร (`src/entities/Squad.ts`)
* **รัศมีวงกลมโจมตี (`auraRadius`):**
  $$\text{auraRadius} = 75 + \min(85, \text{soldierCount} \times 2.5)$$
* **การวาดเสาเหรียญบนหัวราชา (`drawCoinTower`):**
  * เก็บค่า `stackedCoins: number`
  * เพื่อไม่ให้เหรียญทะลุขอบจอบนสุดเมื่อเก็บได้หลายร้อยเหรียญ ให้วาดเหรียญซ้อนกันสูงสุดไม่เกิน $60$ ชั้นบนหน้าจอ (1 ชั้นแทน 1–5 เหรียญตามสเกล) และแสดงป้ายตัวเลขสีทองกำกับบนยอดเสา
  * ตำแหน่งแกน $X$ ของเหรียญชั้นที่ $i$ คำนวณการโอนเอนเวลาเดินด้วย:
    $$X_i = X_{\text{king}} + \sin(\text{time} \times 0.008 - i \times 0.15) \times \min(18, i \times 0.4) - \text{velocityX} \times i \times 0.25$$

### 3. ตั้งค่า PWA สำหรับมือถืออากง (`vite.config.ts`)
ใส่โค้ดนี้ใน `vite.config.ts` เพื่อให้เวลาเปิดเว็บในมือถืออากงแล้วกด **"Add to Home Screen (เพิ่มไปยังหน้าจอหลัก)"** ตัวเกมจะกลายเป็นแอปเต็มจอ ไม่มีแถบ URL กวนใจ และเล่นได้แม้ไม่มีอินเทอร์เน็ต:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'เกมตีป้อมของอากง (Kingshot)',
        short_name: 'เกมอากง',
        description: 'เกมลากนิ้วตีป้อมเก็บเหรียญสำหรับอากง',
        theme_color: '#16a34a',
        background_color: '#14532d',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

---

## ส่วนที่ 3: คำสั่ง Prompt สำหรับรันใน Antigravity Agent

หลังจากที่คุณสร้างโฟลเดอร์และวางไฟล์ `blueprint.md` นี้ลงในโปรเจกต์แล้ว ให้พิมพ์สั่ง Agent ใน Antigravity ด้วยข้อความนี้ได้เลยครับ:

> *"อ่านไฟล์ `@blueprint.md` ทั้งหมด แล้วช่วยสร้างโค้ดทุกไฟล์ตามโครงสร้างในส่วนที่ 2 และส่วนที่ 3 ให้ครบสมบูรณ์ โดยเน้นให้ Pixel Art Sprites สดใสชัดเจนเหมือนโฆษณาเกม Kingshot, เสียงสังเคราะห์ Web Audio API ทำงานได้จริง และปุ่มภาษาไทยทั้ง 4 ปุ่มในหน้าสรุปผลจบด่านมีขนาดใหญ่พิเศษสำหรับผู้สูงอายุ"*
