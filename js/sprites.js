/**
 * IsoMetropolis Isometric Sprite Generator & Texture Cache
 * Procedural vector-isometric rendering with crisp offscreen canvas caching.
 */

class SpriteManager {
  constructor() {
    this.cache = new Map();
    this.W = CONFIG.TILE_WIDTH;  // 64
    this.H = CONFIG.TILE_HEIGHT; // 32
    this.hw = this.W / 2;        // 32
    this.hh = this.H / 2;        // 16
  }

  // Helper to create an offscreen canvas
  createCanvas(width, height) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false; // Retro crisp pixels
    return { canvas: c, ctx: ctx };
  }

  // Draw basic isometric ground diamond
  drawDiamond(ctx, cx, cy, color, strokeColor = null) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - this.hh);
    ctx.lineTo(cx + this.hw, cy);
    ctx.lineTo(cx, cy + this.hh);
    ctx.lineTo(cx - this.hw, cy);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Draw 3D Isometric Box (Walls + Roof)
  drawIsoBox(ctx, cx, cy, width, length, height, roofColor, leftWallColor, rightWallColor) {
    // cx, cy is the ground center of the box
    // Left face
    ctx.beginPath();
    ctx.moveTo(cx - width, cy);
    ctx.lineTo(cx, cy + length);
    ctx.lineTo(cx, cy + length - height);
    ctx.lineTo(cx - width, cy - height);
    ctx.closePath();
    ctx.fillStyle = leftWallColor;
    ctx.fill();

    // Right face
    ctx.beginPath();
    ctx.moveTo(cx, cy + length);
    ctx.lineTo(cx + width, cy);
    ctx.lineTo(cx + width, cy - height);
    ctx.lineTo(cx, cy + length - height);
    ctx.closePath();
    ctx.fillStyle = rightWallColor;
    ctx.fill();

    // Top face (roof)
    ctx.beginPath();
    ctx.moveTo(cx, cy - length - height);
    ctx.lineTo(cx + width, cy - height);
    ctx.lineTo(cx, cy + length - height);
    ctx.lineTo(cx - width, cy - height);
    ctx.closePath();
    ctx.fillStyle = roofColor;
    ctx.fill();
  }

  // Generate or retrieve cached road sprite (16 possible neighbor configurations)
  getRoadSprite(mask, isBridge = false) {
    const key = `road_${mask}_${isBridge}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const { canvas, ctx } = this.createCanvas(this.W, this.H + 8);
    const cx = this.hw;
    const cy = this.hh + 4;

    if (isBridge) {
      // Wooden/concrete bridge supports over water
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 24, cy + 6, 8, 6);
      ctx.fillRect(cx + 16, cy + 6, 8, 6);
      this.drawDiamond(ctx, cx, cy, '#64748b', '#334155');
    } else {
      // Normal asphalt ground
      this.drawDiamond(ctx, cx, cy, '#374151', '#1f2937');
    }

    // Road markings & connections based on bitmask:
    // 1: North (-y), 2: East (+x), 4: South (+y), 8: West (-x)
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Center point
    const hasN = (mask & 1);
    const hasE = (mask & 2);
    const hasS = (mask & 4);
    const hasW = (mask & 8);

    ctx.beginPath();
    if (hasN) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + this.hw * 0.5, cy - this.hh * 0.5);
    }
    if (hasE) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + this.hw * 0.5, cy + this.hh * 0.5);
    }
    if (hasS) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - this.hw * 0.5, cy + this.hh * 0.5);
    }
    if (hasW) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - this.hw * 0.5, cy - this.hh * 0.5);
    }
    // If isolated, draw center dot
    if (mask === 0) {
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Dashed center yellow line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    if (hasN) { ctx.moveTo(cx, cy); ctx.lineTo(cx + this.hw * 0.5, cy - this.hh * 0.5); }
    if (hasE) { ctx.moveTo(cx, cy); ctx.lineTo(cx + this.hw * 0.5, cy + this.hh * 0.5); }
    if (hasS) { ctx.moveTo(cx, cy); ctx.lineTo(cx - this.hw * 0.5, cy + this.hh * 0.5); }
    if (hasW) { ctx.moveTo(cx, cy); ctx.lineTo(cx - this.hw * 0.5, cy - this.hh * 0.5); }
    ctx.stroke();
    ctx.setLineDash([]);

    this.cache.set(key, canvas);
    return canvas;
  }

  // Generate ground tile (grass, water, sand, trees)
  getGroundSprite(tileType, frame = 0) {
    const key = `ground_${tileType}_${frame % 4}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const { canvas, ctx } = this.createCanvas(this.W, this.H + 12);
    const cx = this.hw;
    const cy = this.hh + 6;

    if (tileType === CONFIG.TILES.WATER) {
      // Water tile with gentle animated wave shimmer
      const waveOffset = (frame % 4) * 2;
      this.drawDiamond(ctx, cx, cy, '#0284c7', '#0369a1');
      // Subtle wave highlights
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 10 + waveOffset, cy);
      ctx.lineTo(cx + 8 + waveOffset, cy);
      ctx.stroke();
    } else if (tileType === CONFIG.TILES.SAND) {
      this.drawDiamond(ctx, cx, cy, '#fde047', '#eab308');
      // Sandy specks
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(cx - 6, cy - 2, 2, 2);
      ctx.fillRect(cx + 8, cy + 3, 2, 2);
    } else if (tileType === CONFIG.TILES.TREES) {
      // Forest tile with 2-3 cute isometric trees
      this.drawDiamond(ctx, cx, cy, '#15803d', '#166534');
      // Trees
      this.drawTree(ctx, cx - 8, cy + 2, 12, '#16a34a');
      this.drawTree(ctx, cx + 8, cy - 2, 14, '#15803d');
      this.drawTree(ctx, cx, cy + 6, 10, '#22c55e');
    } else {
      // Normal lush grass
      this.drawDiamond(ctx, cx, cy, '#22c55e', '#16a34a');
      // Blade of grass texture
      ctx.fillStyle = '#15803d';
      ctx.fillRect(cx - 8, cy - 1, 2, 2);
      ctx.fillRect(cx + 6, cy + 2, 2, 2);
      ctx.fillRect(cx - 2, cy - 4, 2, 2);
    }

    this.cache.set(key, canvas);
    return canvas;
  }

  drawTree(ctx, x, y, size, color) {
    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 1, y, 3, size * 0.6);
    // Foliage (canopy)
    ctx.beginPath();
    ctx.arc(x, y - size * 0.4, size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Get zoned building sprite based on type, stage (1-4), style, and night mode
  getBuildingSprite(zoneType, stage, style = 'european', isNight = false) {
    const key = `bldg_${zoneType}_s${stage}_${style}_${isNight ? 'night' : 'day'}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const fullHeight = 110;
    const { canvas, ctx } = this.createCanvas(this.W, fullHeight);
    const cx = this.hw;
    const cy = fullHeight - this.hh - 4; // base center

    // Draw lot foundation
    this.drawDiamond(ctx, cx, cy, '#94a3b8', '#64748b');

    // Render building according to style & zone & stage
    this.renderBuildingGeometry(ctx, cx, cy, zoneType, stage, style, isNight);

    this.cache.set(key, canvas);
    return canvas;
  }

  renderBuildingGeometry(ctx, cx, cy, zoneType, stage, style, isNight) {
    const nightWindow = isNight ? '#fef08a' : '#93c5fd';
    const winGlow = isNight ? 'rgba(253, 224, 71, 0.8)' : 'rgba(147, 197, 253, 0.5)';

    // STYLES PALETTES
    const styles = {
      european: {
        wallLeft: '#d6cbba',
        wallRight: '#e8dfcf',
        roof: '#475569', // Slate
        trim: '#b45309',
        accent: '#991b1b'
      },
      modern: {
        wallLeft: '#94a3b8',
        wallRight: '#cbd5e1',
        roof: '#0284c7', // Cyan glass
        trim: '#38bdf8',
        accent: '#0369a1'
      },
      japanese: {
        wallLeft: '#292524',
        wallRight: '#44403c',
        roof: '#1e293b', // Eaves
        trim: '#dc2626', // Crimson
        accent: '#fca5a5'
      },
      cyberpunk: {
        wallLeft: '#0f172a',
        wallRight: '#1e1b4b',
        roof: '#06b6d4', // Neon Cyan
        trim: '#d946ef', // Neon Magenta
        accent: '#f43f5e'
      },
      medieval: {
        wallLeft: '#78350f',
        wallRight: '#a16207',
        roof: '#b45309', // Thatch / terracotta
        trim: '#451a03',
        accent: '#854d0e'
      }
    };

    const p = styles[style] || styles.european;

    if (zoneType === 'zone_res') {
      // RESIDENTIAL
      if (stage === 1) {
        // Small single-family cottage
        this.drawIsoBox(ctx, cx, cy, 14, 8, 16, p.roof, p.wallLeft, p.wallRight);
        // Chimney
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(cx + 4, cy - 26, 4, 8);
        // Windows
        ctx.fillStyle = nightWindow;
        ctx.fillRect(cx - 9, cy - 6, 4, 4);
        ctx.fillRect(cx + 4, cy - 6, 4, 4);
      } else if (stage === 2) {
        // Townhouse / Duplex
        this.drawIsoBox(ctx, cx, cy, 18, 9, 28, p.roof, p.wallLeft, p.wallRight);
        // Windows row
        ctx.fillStyle = nightWindow;
        ctx.fillRect(cx - 12, cy - 10, 4, 5);
        ctx.fillRect(cx - 5, cy - 7, 4, 5);
        ctx.fillRect(cx + 6, cy - 8, 4, 5);
        ctx.fillRect(cx - 12, cy - 20, 4, 5);
        ctx.fillRect(cx + 6, cy - 18, 4, 5);
      } else if (stage === 3) {
        // Apartment block
        this.drawIsoBox(ctx, cx, cy, 22, 11, 46, p.roof, p.wallLeft, p.wallRight);
        // Multiple window grids
        ctx.fillStyle = nightWindow;
        for (let floor = 0; floor < 4; floor++) {
          const fy = cy - 8 - floor * 9;
          ctx.fillRect(cx - 16, fy, 4, 5);
          ctx.fillRect(cx - 8, fy + 4, 4, 5);
          ctx.fillRect(cx + 4, fy + 4, 4, 5);
          ctx.fillRect(cx + 12, fy, 4, 5);
        }
      } else {
        // High-rise Luxury Condo / Penthouse Spire
        this.drawIsoBox(ctx, cx, cy, 24, 12, 70, p.roof, p.wallLeft, p.wallRight);
        // Upper stepped tier
        this.drawIsoBox(ctx, cx, cy - 70, 16, 8, 18, p.trim, p.wallLeft, p.wallRight);
        // Rooftop antenna with beacon
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 88);
        ctx.lineTo(cx, cy - 102);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy - 102, 2, 0, Math.PI * 2);
        ctx.fill();

        // Matrix of glowing windows
        ctx.fillStyle = nightWindow;
        for (let floor = 0; floor < 7; floor++) {
          const fy = cy - 8 - floor * 9;
          ctx.fillRect(cx - 16, fy, 4, 4);
          ctx.fillRect(cx - 8, fy + 4, 4, 4);
          ctx.fillRect(cx + 4, fy + 4, 4, 4);
          ctx.fillRect(cx + 12, fy, 4, 4);
        }
      }
    } else if (zoneType === 'zone_com') {
      // COMMERCIAL
      if (stage === 1) {
        // Corner store / Bodega with awning
        this.drawIsoBox(ctx, cx, cy, 16, 8, 18, p.roof, p.wallLeft, p.wallRight);
        // Awning
        ctx.fillStyle = p.accent;
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy + 2);
        ctx.lineTo(cx, cy + 8);
        ctx.lineTo(cx + 12, cy + 2);
        ctx.lineTo(cx, cy - 2);
        ctx.closePath();
        ctx.fill();
        // Shop glass window
        ctx.fillStyle = nightWindow;
        ctx.fillRect(cx - 10, cy - 6, 8, 5);
        ctx.fillRect(cx + 2, cy - 3, 8, 5);
      } else if (stage === 2) {
        // Boutique shopping center / 2-story retail
        this.drawIsoBox(ctx, cx, cy, 20, 10, 32, p.roof, p.wallLeft, p.wallRight);
        // Storefront display
        ctx.fillStyle = nightWindow;
        ctx.fillRect(cx - 14, cy - 6, 12, 7);
        ctx.fillRect(cx + 2, cy - 2, 12, 7);
        // Signage
        ctx.fillStyle = p.trim;
        ctx.fillRect(cx - 10, cy - 16, 20, 5);
      } else if (stage === 3) {
        // Corporate Office Tower
        this.drawIsoBox(ctx, cx, cy, 22, 11, 52, '#38bdf8', '#0369a1', '#0284c7');
        // Glass curtain wall bands
        ctx.fillStyle = nightWindow;
        for (let f = 0; f < 5; f++) {
          ctx.fillRect(cx - 18, cy - 6 - f * 9, 14, 4);
          ctx.fillRect(cx + 4, cy - f * 9, 14, 4);
        }
      } else {
        // Grand Commercial Skyscraper (Metropolis / Cyberpunk landmark)
        this.drawIsoBox(ctx, cx, cy, 24, 12, 75, '#06b6d4', '#0f172a', '#1e293b');
        // Glass pinnacle pyramid
        ctx.beginPath();
        ctx.moveTo(cx, cy - 75 - 20);
        ctx.lineTo(cx + 16, cy - 75);
        ctx.lineTo(cx, cy - 75 + 8);
        ctx.lineTo(cx - 16, cy - 75);
        ctx.closePath();
        ctx.fillStyle = p.trim;
        ctx.fill();

        // Neon / Office lights
        ctx.fillStyle = isNight ? p.roof : '#38bdf8';
        for (let f = 0; f < 8; f++) {
          ctx.fillRect(cx - 18, cy - 6 - f * 8, 14, 3);
          ctx.fillRect(cx + 4, cy - f * 8, 14, 3);
        }
      }
    } else {
      // INDUSTRIAL
      if (stage === 1) {
        // Workshop / Garage with corrugated roof
        this.drawIsoBox(ctx, cx, cy, 16, 9, 16, '#64748b', '#475569', '#334155');
        // Garage door
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(cx - 10, cy - 4, 8, 8);
      } else if (stage === 2) {
        // Factory with sawtooth roof
        this.drawIsoBox(ctx, cx, cy, 22, 11, 26, '#eab308', '#78350f', '#854d0e');
        // Smokestack
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(cx + 8, cy - 38, 5, 20);
        // Smokestack stripe
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx + 8, cy - 34, 5, 4);
      } else if (stage === 3) {
        // Heavy Industrial Complex
        this.drawIsoBox(ctx, cx, cy, 24, 12, 36, '#475569', '#334155', '#1e293b');
        // Chemical tank
        ctx.beginPath();
        ctx.arc(cx - 10, cy - 10, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        // Dual smoke chimneys
        ctx.fillStyle = '#64748b';
        ctx.fillRect(cx + 4, cy - 48, 5, 22);
        ctx.fillRect(cx + 12, cy - 44, 5, 18);
      } else {
        // High-Tech Industrial Campus / Bio-Tech Lab
        this.drawIsoBox(ctx, cx, cy, 24, 12, 50, '#10b981', '#064e3b', '#047857');
        // Hexagonal dome on roof
        ctx.beginPath();
        ctx.arc(cx, cy - 54, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#34d399';
        ctx.fill();
        // Solar panels
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(cx - 18, cy - 46, 8, 4);
        ctx.fillRect(cx + 10, cy - 46, 8, 4);
      }
    }
  }

  // Get civic / utility / park building sprite
  getSpecialBuildingSprite(buildingId, frame = 0, isNight = false) {
    const key = `spec_${buildingId}_f${frame % 8}_${isNight ? 'n' : 'd'}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const fullHeight = 120;
    const { canvas, ctx } = this.createCanvas(this.W, fullHeight);
    const cx = this.hw;
    const cy = fullHeight - this.hh - 4;

    // Foundation
    this.drawDiamond(ctx, cx, cy, '#cbd5e1', '#94a3b8');

    switch (buildingId) {
      case 'wind_turbine': {
        // Tower pole
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx - 2, cy - 50, 4, 50);
        // Generator nacelle
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(cx, cy - 50, 4, 0, Math.PI * 2);
        ctx.fill();
        // Animated 3-blade rotor
        const angle = (frame * 0.4) % (Math.PI * 2);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2.5;
        for (let b = 0; b < 3; b++) {
          const a = angle + (b * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 50);
          ctx.lineTo(cx + Math.cos(a) * 22, cy - 50 + Math.sin(a) * 22);
          ctx.stroke();
        }
        break;
      }
      case 'solar_farm': {
        // Tilted solar panels
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 2; col++) {
            const px = cx - 12 + col * 14;
            const py = cy - 10 + row * 8;
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.moveTo(px - 5, py);
            ctx.lineTo(px + 5, py - 4);
            ctx.lineTo(px + 7, py + 2);
            ctx.lineTo(px - 3, py + 6);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        break;
      }
      case 'coal_power': {
        // Power building
        this.drawIsoBox(ctx, cx - 8, cy, 14, 8, 28, '#475569', '#334155', '#1e293b');
        // Massive cooling tower
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(cx + 4, cy + 4);
        ctx.lineTo(cx + 8, cy - 35);
        ctx.lineTo(cx + 20, cy - 35);
        ctx.lineTo(cx + 24, cy + 4);
        ctx.closePath();
        ctx.fill();
        // Steam cloud puff
        ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
        ctx.beginPath();
        ctx.arc(cx + 14, cy - 42 - (frame % 4), 6, 0, Math.PI * 2);
        ctx.arc(cx + 18, cy - 46 - (frame % 4), 8, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'water_tower': {
        // Elevated water sphere on steel legs
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy); ctx.lineTo(cx - 4, cy - 32);
        ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 4, cy - 32);
        ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy - 32);
        ctx.stroke();
        // Water vat
        ctx.beginPath();
        ctx.arc(cx, cy - 38, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#0284c7';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      }
      case 'water_pump': {
        // Water pump station
        this.drawIsoBox(ctx, cx, cy, 16, 9, 20, '#0284c7', '#0369a1', '#075985');
        // Large pipe into ground
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + 10);
        ctx.stroke();
        break;
      }
      case 'police': {
        this.drawIsoBox(ctx, cx, cy, 20, 10, 32, '#1e3a8a', '#1e40af', '#2563eb');
        // Police beacon (animated flashing)
        const isBeaconBlue = (frame % 2 === 0);
        ctx.fillStyle = isBeaconBlue ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy - 36, 4, 0, Math.PI * 2);
        ctx.fill();
        // "POLICE" sign stripe
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx - 10, cy - 16, 20, 4);
        break;
      }
      case 'fire_dept': {
        this.drawIsoBox(ctx, cx, cy, 20, 10, 30, '#991b1b', '#b91c1c', '#dc2626');
        // Yellow garage roll-up door
        ctx.fillStyle = '#fde047';
        ctx.fillRect(cx - 12, cy - 6, 10, 10);
        // Watchtower
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(cx + 6, cy - 42, 6, 16);
        break;
      }
      case 'clinic':
      case 'hospital': {
        const isHosp = (buildingId === 'hospital');
        const h = isHosp ? 55 : 32;
        this.drawIsoBox(ctx, cx, cy, 22, 11, h, '#f8fafc', '#e2e8f0', '#cbd5e1');
        // Red Cross symbol
        ctx.fillStyle = '#ef4444';
        const sy = cy - h + 14;
        ctx.fillRect(cx - 2, sy - 6, 4, 12);
        ctx.fillRect(cx - 6, sy - 2, 12, 4);
        // Helipad on general hospital
        if (isHosp) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy - h - 4, 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('H', cx, cy - h - 4);
        }
        break;
      }
      case 'school':
      case 'university': {
        const isUni = (buildingId === 'university');
        const h = isUni ? 50 : 34;
        this.drawIsoBox(ctx, cx, cy, 22, 11, h, '#9a3412', '#c2410c', '#ea580c');
        // Clock / Bell tower
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(cx - 4, cy - h - 16, 8, 16);
        // Clock face
        ctx.beginPath();
        ctx.arc(cx, cy - h - 8, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        break;
      }
      case 'park_small': {
        // Lush green grass
        this.drawDiamond(ctx, cx, cy, '#16a34a', '#15803d');
        // 2 shade trees
        this.drawTree(ctx, cx - 8, cy - 2, 14, '#22c55e');
        this.drawTree(ctx, cx + 8, cy + 4, 12, '#15803d');
        // Park bench
        ctx.fillStyle = '#92400e';
        ctx.fillRect(cx - 2, cy + 2, 6, 2);
        break;
      }
      case 'park_fountain': {
        this.drawDiamond(ctx, cx, cy, '#cbd5e1', '#94a3b8');
        // Fountain basin
        ctx.beginPath();
        ctx.ellipse(cx, cy, 14, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0284c7';
        ctx.fill();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Water jet
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(cx, cy - 8 - (frame % 2), 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'zen_garden': {
        this.drawDiamond(ctx, cx, cy, '#e2e8f0', '#cbd5e1'); // Raked gravel
        // Torii gate
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(cx - 8, cy - 14, 2, 14);
        ctx.fillRect(cx + 6, cy - 14, 2, 14);
        ctx.fillRect(cx - 10, cy - 14, 20, 3);
        // Cherry blossom tree
        this.drawTree(ctx, cx, cy + 4, 12, '#f472b6');
        break;
      }
      case 'cyber_plaza': {
        this.drawDiamond(ctx, cx, cy, '#0f172a', '#06b6d4');
        // Holographic pyramid
        ctx.strokeStyle = '#d946ef';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 24);
        ctx.lineTo(cx - 10, cy);
        ctx.lineTo(cx + 10, cy);
        ctx.closePath();
        ctx.stroke();
        // Glowing cyan core
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(cx, cy - 12, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'stadium': {
        // Oval sports stadium
        this.drawIsoBox(ctx, cx, cy, 26, 13, 24, '#1e293b', '#334155', '#475569');
        // Inner pitch
        ctx.beginPath();
        ctx.ellipse(cx, cy - 24, 16, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#16a34a';
        ctx.fill();
        break;
      }
      case 'city_hall': {
        // Neoclassical Columns & Golden Dome
        this.drawIsoBox(ctx, cx, cy, 24, 12, 38, '#e2e8f0', '#94a3b8', '#cbd5e1');
        // Columns
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 14, cy - 20, 3, 22);
        ctx.fillRect(cx - 6, cy - 16, 3, 22);
        ctx.fillRect(cx + 3, cy - 16, 3, 22);
        ctx.fillRect(cx + 11, cy - 20, 3, 22);
        // Golden dome
        ctx.beginPath();
        ctx.arc(cx, cy - 44, 8, Math.PI, 0);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        // Flag pole
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 44);
        ctx.lineTo(cx, cy - 60);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(cx, cy - 60, 6, 4);
        break;
      }
      case 'clock_tower': {
        this.drawIsoBox(ctx, cx, cy, 14, 7, 65, '#991b1b', '#7f1d1d', '#b91c1c');
        // Spire roof
        ctx.beginPath();
        ctx.moveTo(cx, cy - 65 - 18);
        ctx.lineTo(cx + 10, cy - 65);
        ctx.lineTo(cx, cy - 65 + 5);
        ctx.lineTo(cx - 10, cy - 65);
        ctx.closePath();
        ctx.fillStyle = '#334155';
        ctx.fill();
        // Clock face
        ctx.beginPath();
        ctx.arc(cx, cy - 54, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        break;
      }
      case 'monolith': {
        // Apex Sky Spire
        ctx.beginPath();
        ctx.moveTo(cx, cy - 105);
        ctx.lineTo(cx + 14, cy);
        ctx.lineTo(cx, cy + 7);
        ctx.lineTo(cx - 14, cy);
        ctx.closePath();
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Glowing cyan core strip
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 100);
        ctx.lineTo(cx, cy + 4);
        ctx.stroke();
        break;
      }
      default:
        this.drawIsoBox(ctx, cx, cy, 14, 7, 20, '#64748b', '#475569', '#334155');
    }

    this.cache.set(key, canvas);
    return canvas;
  }

  // Animated Car Sprites (4 directions)
  getVehicleSprite(direction, color = '#ef4444') {
    const key = `car_${direction}_${color}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const { canvas, ctx } = this.createCanvas(24, 16);
    const cx = 12;
    const cy = 8;

    ctx.fillStyle = color;
    // Tiny isometric car chassis
    if (direction === 'NE' || direction === 'SW') {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Windshield
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(cx - 2, cy - 2, 4, 3);

    this.cache.set(key, canvas);
    return canvas;
  }
}

const sprites = new SpriteManager();
