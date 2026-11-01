/**
 * SpriteCache.ts
 * Pre-renders pixel art matrices (16x16, 32x32, 8x8) to dedicated offscreen canvases
 * for high-performance 60 FPS drawImage rendering.
 */

export type SpriteCanvas = HTMLCanvasElement | OffscreenCanvas;

function createCanvas(width: number, height: number): { canvas: SpriteCanvas; ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D } {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }
}

/**
 * Helper to render a pixel matrix using a palette mapping
 * matrix: array of strings or number IDs
 * palette: Record<string, string>
 */
export function buildSpriteFromMatrix(
  matrix: string[],
  palette: Record<string, string>,
  pixelScale = 1
): SpriteCanvas {
  const height = matrix.length;
  const width = matrix[0].length;
  const { canvas, ctx } = createCanvas(width * pixelScale, height * pixelScale);

  for (let y = 0; y < height; y++) {
    const row = matrix[y];
    for (let x = 0; x < width; x++) {
      const char = row[x];
      const color = palette[char];
      if (color && color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelScale, y * pixelScale, pixelScale, pixelScale);
      }
    }
  }

  return canvas;
}

// ==========================================
// PALETTES & MATRICES (Vivid Kingshot Style)
// ==========================================

const KING_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'K': '#1e3a8a', // Dark Royal Blue
  'B': '#3b82f6', // Vivid Royal Blue
  'G': '#fbbf24', // Gold Crown / Belt
  'Y': '#fef08a', // Bright Gold Highlight
  'R': '#dc2626', // Ruby in Crown
  'S': '#fed7aa', // Skin / Face
  'E': '#0f172a', // Eyes / Shoes
  'W': '#ffffff', // Eye White
  'M': '#b45309', // Dark Gold Outline
};

// 16x16 King Sprite
const KING_MATRIX = [
  ".....GG.GG......",
  "....GYRYGYG.....",
  "....GGGGGGG.....",
  "....MMMMMMM.....",
  "....SSSSSSS.....",
  "...SEEWSEEW.....",
  "...SEEEEEEE.....",
  "...SSSSSSSS.....",
  "....SSSSSS......",
  "...KKBBBBBKK....",
  "..KKBBBBBBBKK...",
  "..KKGGGGGGGKK...",
  "...KBBBBBBBK....",
  "...KBB...BBK....",
  "...EE.....EE....",
  "...EE.....EE...."
];

const SOLDIER_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'H': '#94a3b8', // Silver Helmet
  'L': '#cbd5e1', // Bright Helmet Glint
  'S': '#fcd34d', // Skin
  'E': '#0f172a', // Eyes
  'B': '#0284c7', // Blue Armor
  'D': '#0369a1', // Dark Blue Armor
  'W': '#ffffff', // Shield Emblem
  'M': '#64748b', // Steel Sword / Spear
  'Y': '#f59e0b', // Shield rim
};

// 16x16 Soldier Sprite (Holding mini sword & shield)
const SOLDIER_MATRIX = [
  ".....HHHHH......",
  "....HLHLLHH.....",
  "....HHHHHHH.....",
  "....SSSSSSS.....",
  "....SEE.EES.....",
  "....SSSSSSS.....",
  "..MY.BBBBB.M....",
  ".MYW.BBBBB.M....",
  ".MYW.BBDBB.MM...",
  "..MY.BBDBB..M...",
  ".....BBBBB......",
  "....DDDDDDD.....",
  "....DD...DD.....",
  "....EE...EE.....",
  "................",
  "................"
];

const FENCE_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'W': '#78350f', // Dark wood outline
  'B': '#92400e', // Medium wood
  'L': '#b45309', // Light wood plank
  'N': '#475569', // Iron nail
  'H': '#d97706', // Highlight wood
};

// 16x16 Wooden Fence
const FENCE_MATRIX = [
  ".W....W....W....",
  "WBL..WBL..WBL...",
  "WBL..WBL..WBL...",
  "WWWWWWWWWWWWWWW.",
  "WBBBNBBBBNBBBNW.",
  "WLLLHHLLLHHLLHW.",
  "WWWWWWWWWWWWWWW.",
  "WBL..WBL..WBL...",
  "WBL..WBL..WBL...",
  "WWWWWWWWWWWWWWW.",
  "WBBBNBBBBNBBBNW.",
  "WLLLHHLLLHHLLHW.",
  "WWWWWWWWWWWWWWW.",
  "WBL..WBL..WBL...",
  "WBL..WBL..WBL...",
  ".W....W....W...."
];

const COIN_PILE_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'O': '#b45309', // Amber border
  'G': '#f59e0b', // Base Gold
  'Y': '#fbbf24', // Bright Gold
  'W': '#fef08a', // Sparkle white
  'S': '#ffffff', // Pure shine
};

// 16x16 Sparkly Coin Pile
const COIN_PILE_MATRIX = [
  ".......S........",
  "......SWS.......",
  ".......S........",
  "......OGGO......",
  ".....OYWYGO.....",
  "....OGYYYYGO....",
  "...OGGYYYYGGO...",
  "...OYWYGGYYYYO..",
  "..OGYYYYYYYYGO..",
  ".OGGGYYYYGGYGO..",
  "OGYYYYYYYYYYYYO.",
  "OYWYGGYYYYGYYYYO",
  "OGYYYYYYYYYYYYGO",
  "OGGGYYYYGGYYYYGO",
  "OOOOOOOOOOOOOOOO",
  "................"
];

const CAGE_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'W': '#451a03', // Deep wood frame
  'B': '#78350f', // Wood bars
  'L': '#b45309', // Light highlight
  'I': '#64748b', // Iron bars
  'H': '#94a3b8', // Iron shine
  'S': '#fcd34d', // Trapped buddy face
  'E': '#0f172a', // Trapped buddy eyes
  'K': '#ef4444', // Heart / plea
};

// 16x16 Soldier Cage
const CAGE_MATRIX = [
  "WWWWWWWWWWWWWWWW",
  "WLLLLLLLLLLLLLLW",
  "W.II..II..II..IW",
  "W.IH..IH..IH..IW",
  "W.IH.SSSS.IH..IW",
  "W.IHSEE.EESI..IW",
  "W.IHS.KK.SIH..IW",
  "W.IH.SSSS.IH..IW",
  "W.II..II..II..IW",
  "W.IH..IH..IH..IW",
  "W.IH..II..IH..IW",
  "W.II..II..II..IW",
  "WWWWWWWWWWWWWWWW",
  "WLLLLLLLLLLLLLLW",
  "WBBBBBBBBBBBBBBW",
  "WWWWWWWWWWWWWWWW"
];

const MONSTER_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'D': '#7f1d1d', // Dark Red
  'R': '#dc2626', // Vivid Red
  'L': '#ef4444', // Bright Red
  'H': '#fbbf24', // Yellow Horns
  'E': '#fef08a', // Glowing Eyes
  'P': '#0f172a', // Pupils
  'W': '#ffffff', // Sharp Fangs
  'B': '#450a0a', // Claws
};

// 16x16 Red Monster (Aggro Horned Goblin)
const MONSTER_MATRIX = [
  "...H........H...",
  "..HH........HH..",
  "..HDRRRRRRDH....",
  ".HDLLLLLLLLDH...",
  ".HRLLRRRRLLRH...",
  ".DRLLE..ELLE RD..",
  ".DRLLP..PLLRD...",
  ".RRRRRRRRRRRR...",
  ".RRRRWWWWWRRR...",
  "..RRRWWWWWRR....",
  "..RRRRRRRRRR....",
  ".BD.RRRRRR.DB...",
  ".BD.RRRRRR.DB...",
  "....RR..RR......",
  "...BB....BB.....",
  "................"
];

const ARCHER_TOWER_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'S': '#334155', // Dark Stone
  'M': '#64748b', // Medium Stone
  'L': '#94a3b8', // Light Stone
  'W': '#78350f', // Wood Battlements
  'B': '#92400e', // Light Wood
  'R': '#dc2626', // Target flag
  'Y': '#f59e0b', // Bow string / Arrow
};

// 16x16 Archer Watchtower
const ARCHER_TOWER_MATRIX = [
  "...RR...........",
  "...RR...........",
  "..WBBW..WBBW....",
  "..WBBWWWWBBW....",
  "..WMMYYMMMMW....",
  "...SMMMMMMMS....",
  "...SMLLMMMLS....",
  "...SMMMMMMMS....",
  "...SLLMMLLMS....",
  "...SMMMMMMMS....",
  "..SSMMMMMMMSS...",
  "..SMLLMMMMMLS...",
  "..SMMMMMMMMMS...",
  "..SLLMMMMLLMS...",
  ".SSSSSSSSSSSSS..",
  "................"
];

const BOSS_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'D': '#1e1b4b', // Deep Castle Obsidian
  'P': '#4c1d95', // Purple Stone
  'V': '#7c3aed', // Vivid Violet
  'L': '#a78bfa', // Stone Highlight
  'R': '#dc2626', // Crimson Flag
  'Y': '#fbbf24', // Gold Crest
  'F': '#ef4444', // Red Flame / Eyes
  'B': '#0f172a', // Gate Void
  'G': '#f59e0b', // Gold Trim
};

// 32x32 Boss Castle Tower
const BOSS_MATRIX = [
  "..............RRRR..............",
  "..............RRRR..............",
  "..............RR................",
  "..............DD................",
  ".....VVPV.....DD.....VVPV.......",
  "....VVLVPV....DD....VVLVPV......",
  "....VPPPPV....DD....VPPPPV......",
  "...VPPPPPPV...DD...VPPPPPPV.....",
  "..VVVVVVVVVVVVVVVVVVVVVVVVVV....",
  "..VLLLLLLLLLLLLLLLLLLLLLLLLV....",
  "..VPVVPVVPVVYYYYYYVVPVVPVVPV....",
  "..VPPPPPPPVVYYYYYYVVPPPPPPPV....",
  "..VPLPPLPPVVYYGGYYVVPLPPLPPV....",
  "..VPPPPPPPVVYYYYYYVVPPPPPPPV....",
  "..VVVVVVVVVVVVVVVVVVVVVVVVVV....",
  "...VPPPPPPPPPPPPPPPPPPPPPPV.....",
  "...VPLPPPLPPPPPLPPPPPLPPPV......",
  "...VPPPPPPPPPPPPPPPPPPPPPV......",
  "...VPPPPPPPFBBBBFPPPPPPPPV......",
  "...VPPPPPPPFBBBBFPPPPPPPPV......",
  "...VPLPPPPPFBBBBFPPPLPPPPV......",
  "...VPPPPPPPFBBBBFPPPPPPPPV......",
  "...VPPPPPPPFBBBBFPPPPPPPPV......",
  "...VPLPPPPPFBBBBFPPPLPPPPV......",
  "..VVPPPPPPPFBBBBFPPPPPPPPVV.....",
  "..VLLLLLLLLFBBBBFLLLLLLLLLV.....",
  "..VPPPPPPPPFBBBBFPPPPPPPPPV.....",
  "..VPLPPPPPPFBBBBFPPPPPLPPPV.....",
  "..VPPPPPPPPFBBBBFPPPPPPPPPV.....",
  ".VVVVVVVVVVFBBBBFVVVVVVVVVVV....",
  ".DDDDDDDDDDDDDDDDDDDDDDDDDDD....",
  "................................"
];

// 8x8 Mini Coin
const MINI_COIN_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'O': '#b45309',
  'G': '#f59e0b',
  'Y': '#fbbf24',
  'W': '#ffffff',
};
const MINI_COIN_MATRIX = [
  "..OOOO..",
  ".OGYYGO.",
  "OGYWYYGO",
  "OGYYYYGO",
  "OGYYYYGO",
  "OGYYYYGO",
  ".OGYYGO.",
  "..OOOO.."
];

// 8x4 Arrow Projectile
const ARROW_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'F': '#ef4444', // Red fletching
  'S': '#78350f', // Wood shaft
  'H': '#cbd5e1', // Steel head
  'T': '#ffffff', // Steel tip
};
const ARROW_MATRIX = [
  "F.SSSS.H",
  "FFSSSSHT",
  "FFSSSSHT",
  "F.SSSS.H"
];

export class SpriteCache {
  private static instance: SpriteCache;

  public king!: SpriteCanvas;
  public soldier!: SpriteCanvas;
  public fence!: SpriteCanvas;
  public coinPile!: SpriteCanvas;
  public cage!: SpriteCanvas;
  public redMonster!: SpriteCanvas;
  public archerTower!: SpriteCanvas;
  public bossTower!: SpriteCanvas;
  public coin!: SpriteCanvas;
  public arrow!: SpriteCanvas;
  public groundTileA!: SpriteCanvas;
  public groundTileB!: SpriteCanvas;

  private constructor() {
    this.initSprites();
  }

  public static getInstance(): SpriteCache {
    if (!SpriteCache.instance) {
      SpriteCache.instance = new SpriteCache();
    }
    return SpriteCache.instance;
  }

  private initSprites(): void {
    // Entities scaled by 2 (16x16 -> 32x32, 32x32 -> 64x64) for sharp pixel clarity
    this.king = buildSpriteFromMatrix(KING_MATRIX, KING_PALETTE, 2);
    this.soldier = buildSpriteFromMatrix(SOLDIER_MATRIX, SOLDIER_PALETTE, 2);
    this.fence = buildSpriteFromMatrix(FENCE_MATRIX, FENCE_PALETTE, 2);
    this.coinPile = buildSpriteFromMatrix(COIN_PILE_MATRIX, COIN_PILE_PALETTE, 2);
    this.cage = buildSpriteFromMatrix(CAGE_MATRIX, CAGE_PALETTE, 2);
    this.redMonster = buildSpriteFromMatrix(MONSTER_MATRIX, MONSTER_PALETTE, 2);
    this.archerTower = buildSpriteFromMatrix(ARCHER_TOWER_MATRIX, ARCHER_TOWER_PALETTE, 2);
    this.bossTower = buildSpriteFromMatrix(BOSS_MATRIX, BOSS_PALETTE, 2);
    this.coin = buildSpriteFromMatrix(MINI_COIN_MATRIX, MINI_COIN_PALETTE, 2);
    this.arrow = buildSpriteFromMatrix(ARROW_MATRIX, ARROW_PALETTE, 2);

    // Build Ground Tiles 32x32
    this.groundTileA = this.buildGroundTile('#15803d', '#16a34a');
    this.groundTileB = this.buildGroundTile('#166534', '#15803d');
  }

  private buildGroundTile(baseColor: string, accentColor: string): SpriteCanvas {
    const { canvas, ctx } = createCanvas(32, 32);
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 32, 32);

    // Subtle grass blade dots
    ctx.fillStyle = accentColor;
    ctx.fillRect(4, 4, 2, 4);
    ctx.fillRect(18, 12, 2, 4);
    ctx.fillRect(10, 22, 2, 4);
    ctx.fillRect(24, 26, 2, 4);

    return canvas;
  }
}

export const spriteCache = SpriteCache.getInstance();
