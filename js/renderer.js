/**
 * IsoMetropolis Isometric Canvas Rendering Engine
 * Viewport culling, Y-sorted depth rendering, day/night cycles, overlays, and mini-map.
 */

class IsometricRenderer {
  constructor(canvas, miniCanvas, cityMap, simEngine, trafficSys) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.miniCanvas = miniCanvas;
    this.miniCtx = miniCanvas ? miniCanvas.getContext('2d') : null;

    this.map = cityMap;
    this.sim = simEngine;
    this.traffic = trafficSys;

    // Viewport camera
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 2.2;

    // Display options
    this.showGrid = true;
    this.activeOverlay = 'normal'; // 'normal', 'power', 'water', 'pollution', 'landValue'
    this.hoverTile = null;
    this.activeTool = CONFIG.TOOLS.SELECT;
    this.activeStyle = 'european';
    this.animFrame = 0;

    // Center camera on map initial load
    this.centerCamera();
  }

  centerCamera() {
    this.panX = this.canvas.width / 2;
    this.panY = this.canvas.height / 5;
  }

  // Convert Grid (x, y) to Screen (sx, sy)
  gridToScreen(gx, gy) {
    const hw = (CONFIG.TILE_WIDTH / 2) * this.zoom;
    const hh = (CONFIG.TILE_HEIGHT / 2) * this.zoom;
    const sx = (gx - gy) * hw + this.panX;
    const sy = (gx + gy) * hh + this.panY;
    return { x: sx, y: sy };
  }

  // Convert Screen (sx, sy) to Grid (x, y)
  screenToGrid(sx, sy) {
    const hw = (CONFIG.TILE_WIDTH / 2) * this.zoom;
    const hh = (CONFIG.TILE_HEIGHT / 2) * this.zoom;
    const adjX = (sx - this.panX) / hw;
    const adjY = (sy - this.panY) / hh;
    const gx = Math.floor((adjX + adjY) / 2);
    const gy = Math.floor((adjY - adjX) / 2);
    return { x: gx, y: gy };
  }

  // Main Render Loop
  render() {
    this.animFrame++;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Clear background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a'; // Deep cozy dark slate backdrop
    ctx.fillRect(0, 0, w, h);

    ctx.save();

    // 2. Determine Day / Night lighting
    const tod = this.sim.timeOfDay;
    // 0.25 is noon, 0.75 is dusk, 0.9 is midnight
    let nightAlpha = 0;
    if (tod > 0.65 && tod < 0.85) {
      // Sunset to night
      nightAlpha = (tod - 0.65) / 0.2 * 0.75;
    } else if (tod >= 0.85 || tod <= 0.15) {
      // Deep night
      nightAlpha = 0.75;
    } else if (tod > 0.15 && tod < 0.35) {
      // Dawn to noon
      nightAlpha = (0.35 - tod) / 0.2 * 0.75;
    }
    const isNight = nightAlpha > 0.4;

    // 3. Y-Sort Iteration (depth rendering)
    // Diagonals d = x + y ranges from 0 to 2*(size-1)
    const maxDiag = (this.map.size - 1) * 2;
    for (let d = 0; d <= maxDiag; d++) {
      // Find all (x, y) with x + y = d
      const minX = Math.max(0, d - (this.map.size - 1));
      const maxX = Math.min(this.map.size - 1, d);

      for (let x = minX; x <= maxX; x++) {
        const y = d - x;
        this.renderTile(x, y, isNight);
      }

      // Render vehicles that fall on this diagonal slice
      this.renderVehiclesOnSlice(d);
    }

    // 4. Grid lines overlay
    if (this.showGrid) {
      this.renderGridLines();
    }

    // 5. Hover preview & cursor
    if (this.hoverTile) {
      this.renderHoverPreview();
    }

    // 6. Night lighting ambient tint
    if (nightAlpha > 0) {
      ctx.fillStyle = `rgba(15, 23, 42, ${nightAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();

    // 7. Render Mini-map
    if (this.miniCtx) {
      this.renderMiniMap();
    }
  }

  // Render individual tile, ground, building, overlays
  renderTile(x, y, isNight) {
    const tile = this.map.getTile(x, y);
    if (!tile) return;

    const ctx = this.ctx;
    const scr = this.gridToScreen(x, y);
    const tw = CONFIG.TILE_WIDTH * this.zoom;
    const th = CONFIG.TILE_HEIGHT * this.zoom;

    // Viewport Culling check
    if (scr.x + tw < -50 || scr.x - tw > this.canvas.width + 50 ||
        scr.y + th * 4 < -50 || scr.y - th > this.canvas.height + 50) {
      return;
    }

    // A. Draw Ground Sprite
    if (tile.road) {
      const mask = this.map.getRoadMask(x, y);
      const roadSprite = sprites.getRoadSprite(mask, tile.isBridge);
      ctx.drawImage(roadSprite, scr.x - tw / 2, scr.y - (th / 2) - 4 * this.zoom, tw, roadSprite.height * this.zoom);
    } else {
      const groundSprite = sprites.getGroundSprite(tile.terrain, Math.floor(this.animFrame / 15));
      ctx.drawImage(groundSprite, scr.x - tw / 2, scr.y - (th / 2) - 6 * this.zoom, tw, groundSprite.height * this.zoom);
    }

    // B. Draw Zone Boundary outline if empty stage
    if (tile.zone && tile.stage === 0) {
      const zoneColors = {
        zone_res: 'rgba(34, 197, 94, 0.45)',
        zone_com: 'rgba(59, 130, 246, 0.45)',
        zone_ind: 'rgba(234, 179, 8, 0.45)'
      };
      this.drawDiamondPath(scr.x, scr.y, tw / 2, th / 2);
      ctx.fillStyle = zoneColors[tile.zone] || 'rgba(255,255,255,0.3)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // C. Draw Building Sprite
    if (tile.zone && tile.stage > 0) {
      const bldgSprite = sprites.getBuildingSprite(tile.zone, tile.stage, tile.style, isNight);
      const sh = bldgSprite.height * this.zoom;
      // Draw building anchored at ground center
      ctx.drawImage(bldgSprite, scr.x - tw / 2, scr.y + (th / 2) - sh, tw, sh);
    } else if (tile.building) {
      const bldgSprite = sprites.getSpecialBuildingSprite(tile.building, Math.floor(this.animFrame / 8), isNight);
      const sh = bldgSprite.height * this.zoom;
      ctx.drawImage(bldgSprite, scr.x - tw / 2, scr.y + (th / 2) - sh, tw, sh);
    }

    // D. Active Fire Effect
    if (tile.onFire) {
      const flicker = (Math.sin(this.animFrame * 0.4) + 1) * 3;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(scr.x, scr.y - 15 * this.zoom, (8 + flicker) * this.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(scr.x, scr.y - 18 * this.zoom, (5 + flicker * 0.5) * this.zoom, 0, Math.PI * 2);
      ctx.fill();
      // Smoke puff
      ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
      ctx.beginPath();
      ctx.arc(scr.x, scr.y - 32 * this.zoom, 9 * this.zoom, 0, Math.PI * 2);
      ctx.fill();
    }

    // E. Overlays
    if (this.activeOverlay !== 'normal') {
      this.renderTileOverlay(tile, scr.x, scr.y, tw, th);
    }
  }

  // Render thematic heatmap / service overlays
  renderTileOverlay(tile, sx, sy, tw, th) {
    const ctx = this.ctx;
    if (this.activeOverlay === 'power') {
      if ((tile.zone && tile.stage > 0) || tile.building) {
        this.drawDiamondPath(sx, sy, tw / 2, th / 2);
        ctx.fillStyle = tile.hasPower ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.6)';
        ctx.fill();
      }
    } else if (this.activeOverlay === 'water') {
      if ((tile.zone && tile.stage > 0) || tile.building) {
        this.drawDiamondPath(sx, sy, tw / 2, th / 2);
        ctx.fillStyle = tile.hasWater ? 'rgba(59, 130, 246, 0.4)' : 'rgba(245, 158, 11, 0.6)';
        ctx.fill();
      }
    } else if (this.activeOverlay === 'pollution') {
      if (tile.pollution > 0) {
        this.drawDiamondPath(sx, sy, tw / 2, th / 2);
        const alpha = Math.min(0.8, tile.pollution / 60);
        ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
        ctx.fill();
      }
    } else if (this.activeOverlay === 'landValue') {
      this.drawDiamondPath(sx, sy, tw / 2, th / 2);
      const val = tile.landValue / 100;
      ctx.fillStyle = `rgba(34, 197, 94, ${val * 0.5})`;
      ctx.fill();
    }
  }

  renderVehiclesOnSlice(sliceD) {
    const ctx = this.ctx;
    for (const v of this.traffic.vehicles) {
      const d = Math.round(v.x + v.y);
      if (d === sliceD) {
        const scr = this.gridToScreen(v.x, v.y);
        const carSprite = sprites.getVehicleSprite(v.dir, v.color);
        const cw = carSprite.width * this.zoom;
        const ch = carSprite.height * this.zoom;
        ctx.drawImage(carSprite, scr.x - cw / 2, scr.y - ch / 2 - 2 * this.zoom, cw, ch);

        // Flashing emergency siren
        if (v.isEmergency && Math.floor(this.animFrame / 6) % 2 === 0) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(scr.x, scr.y - 8 * this.zoom, 3 * this.zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Draw isometric diamond path
  drawDiamondPath(cx, cy, hw, hh) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
  }

  // Draw faint isometric grid lines
  renderGridLines() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let y = 0; y < this.map.size; y++) {
      for (let x = 0; x < this.map.size; x++) {
        const scr = this.gridToScreen(x, y);
        const hw = (CONFIG.TILE_WIDTH / 2) * this.zoom;
        const hh = (CONFIG.TILE_HEIGHT / 2) * this.zoom;
        this.drawDiamondPath(scr.x, scr.y, hw, hh);
        ctx.stroke();
      }
    }
  }

  // Render hover cursor and preview ghost
  renderHoverPreview() {
    const h = this.hoverTile;
    const tile = this.map.getTile(h.x, h.y);
    if (!tile) return;

    const ctx = this.ctx;
    const scr = this.gridToScreen(h.x, h.y);
    const hw = (CONFIG.TILE_WIDTH / 2) * this.zoom;
    const hh = (CONFIG.TILE_HEIGHT / 2) * this.zoom;

    // Check validity
    let isValid = true;
    let cost = 0;

    if (this.activeTool === CONFIG.TOOLS.ROAD) {
      cost = CONFIG.ITEMS.road.cost;
      if (tile.road || tile.building) isValid = false;
    } else if (this.activeTool === CONFIG.TOOLS.BULLDOZE) {
      cost = 10;
      isValid = tile.road || tile.building || tile.zone || tile.terrain === CONFIG.TILES.TREES;
    } else if (this.activeTool.startsWith('zone_')) {
      const item = CONFIG.ITEMS[this.activeTool];
      cost = item ? item.cost : 25;
      if (tile.terrain === CONFIG.TILES.WATER || tile.road || tile.building) isValid = false;
    } else if (CONFIG.ITEMS[this.activeTool]) {
      const item = CONFIG.ITEMS[this.activeTool];
      cost = item.cost;
      if (tile.terrain === CONFIG.TILES.WATER || tile.road || tile.building) isValid = false;
      if (this.activeTool === 'water_pump') {
        const neighbors = [
          this.map.getTile(h.x, h.y - 1),
          this.map.getTile(h.x + 1, h.y),
          this.map.getTile(h.x, h.y + 1),
          this.map.getTile(h.x - 1, h.y)
        ];
        if (!neighbors.some(n => n && n.terrain === CONFIG.TILES.WATER)) isValid = false;
      }
    }

    if (this.sim.funds < cost) isValid = false;

    // Highlight diamond
    this.drawDiamondPath(scr.x, scr.y, hw, hh);
    ctx.fillStyle = isValid ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.45)';
    ctx.fill();
    ctx.strokeStyle = isValid ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cost tooltip floating above cursor
    if (this.activeTool !== CONFIG.TOOLS.SELECT && this.activeTool !== CONFIG.TOOLS.INSPECT) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      const text = isValid ? `$${cost}` : 'Cannot Build';
      ctx.fillText(text, scr.x, scr.y - hh - 8);
    }
  }

  // Render real-time mini-map
  renderMiniMap() {
    const ctx = this.miniCtx;
    const w = this.miniCanvas.width;
    const h = this.miniCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const tileSize = w / this.map.size;

    for (let y = 0; y < this.map.size; y++) {
      for (let x = 0; x < this.map.size; x++) {
        const t = this.map.grid[y][x];
        let color = '#15803d'; // grass

        if (t.terrain === CONFIG.TILES.WATER) color = '#0284c7';
        else if (t.terrain === CONFIG.TILES.SAND) color = '#facc15';
        else if (t.road) color = '#94a3b8';
        else if (t.zone === 'zone_res') color = '#22c55e';
        else if (t.zone === 'zone_com') color = '#3b82f6';
        else if (t.zone === 'zone_ind') color = '#eab308';
        else if (t.building) color = '#f97316';

        ctx.fillStyle = color;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    // Camera view bounding box on mini-map
    const centerGrid = this.screenToGrid(this.canvas.width / 2, this.canvas.height / 2);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.5;
    const camBoxSize = (10 / this.zoom);
    ctx.strokeRect(
      (centerGrid.x - camBoxSize / 2) * tileSize,
      (centerGrid.y - camBoxSize / 2) * tileSize,
      camBoxSize * tileSize,
      camBoxSize * tileSize
    );
  }
}
