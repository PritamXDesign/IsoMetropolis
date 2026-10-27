/**
 * IsoMetropolis Grid Map Data Model & Systems
 */

class CityMap {
  constructor(size = CONFIG.GRID_SIZE) {
    this.size = size;
    this.grid = [];
    this.roadsList = []; // Array of {x, y} for fast traffic routing
    this.initEmpty();
  }

  initEmpty() {
    this.grid = [];
    for (let y = 0; y < this.size; y++) {
      const row = [];
      for (let x = 0; x < this.size; x++) {
        row.push({
          x,
          y,
          terrain: CONFIG.TILES.GRASS,
          road: false,
          isBridge: false,
          zone: null,
          building: null,
          stage: 0,
          style: 'european',
          hasRoad: false,
          hasPower: false,
          hasWater: false,
          population: 0,
          jobs: 0,
          pollution: 0,
          landValue: 50,
          crime: 0,
          health: 50,
          education: 50,
          onFire: false,
          fireTimer: 0
        });
      }
      this.grid.push(row);
    }
    this.roadsList = [];
  }

  getTile(x, y) {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
      return this.grid[y][x];
    }
    return null;
  }

  // Generate scenic natural terrain with coast/river and scattered woods
  generateTerrain() {
    this.initEmpty();

    // Generate a gentle winding river crossing from north-west to south-east
    const riverCenter = this.size * 0.35;
    for (let y = 0; y < this.size; y++) {
      const rx = Math.floor(riverCenter + Math.sin(y * 0.25) * 4);
      for (let dx = -2; dx <= 2; dx++) {
        const tx = rx + dx;
        const tile = this.getTile(tx, y);
        if (tile) {
          tile.terrain = CONFIG.TILES.WATER;
        }
      }
      // Sandy banks
      const leftBank = this.getTile(rx - 3, y);
      const rightBank = this.getTile(rx + 3, y);
      if (leftBank && leftBank.terrain === CONFIG.TILES.GRASS) leftBank.terrain = CONFIG.TILES.SAND;
      if (rightBank && rightBank.terrain === CONFIG.TILES.GRASS) rightBank.terrain = CONFIG.TILES.SAND;
    }

    // Coastal corner (bottom-right bay)
    for (let y = this.size - 6; y < this.size; y++) {
      for (let x = this.size - 6; x < this.size; x++) {
        const dist = Math.hypot(x - this.size, y - this.size);
        if (dist < 7) {
          const t = this.getTile(x, y);
          if (t) t.terrain = CONFIG.TILES.WATER;
        } else if (dist < 9) {
          const t = this.getTile(x, y);
          if (t && t.terrain === CONFIG.TILES.GRASS) t.terrain = CONFIG.TILES.SAND;
        }
      }
    }

    // Natural clusters of trees
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const t = this.getTile(x, y);
        if (t && t.terrain === CONFIG.TILES.GRASS) {
          // Cluster math
          const noise = Math.sin(x * 0.4) * Math.cos(y * 0.4) + Math.sin(x * 0.15 + y * 0.2);
          if (noise > 0.65) {
            t.terrain = CONFIG.TILES.TREES;
          }
        }
      }
    }
  }

  // Calculate 4-neighbor autotiling bitmask for road at (x, y)
  getRoadMask(x, y) {
    let mask = 0;
    // N: y - 1
    const n = this.getTile(x, y - 1);
    if (n && n.road) mask |= 1;
    // E: x + 1
    const e = this.getTile(x + 1, y);
    if (e && e.road) mask |= 2;
    // S: y + 1
    const s = this.getTile(x, y + 1);
    if (s && s.road) mask |= 4;
    // W: x - 1
    const w = this.getTile(x - 1, y);
    if (w && w.road) mask |= 8;

    return mask;
  }

  // Place or remove road
  buildRoad(x, y) {
    const tile = this.getTile(x, y);
    if (!tile || tile.road || tile.building) return false;

    // Check if building over water -> bridge!
    if (tile.terrain === CONFIG.TILES.WATER) {
      tile.isBridge = true;
    } else if (tile.terrain === CONFIG.TILES.TREES) {
      tile.terrain = CONFIG.TILES.GRASS; // Bulldoze trees for road
    }

    tile.road = true;
    tile.zone = null;
    tile.stage = 0;
    this.refreshRoadsList();
    this.updateConnectivity();
    return true;
  }

  // Place zone
  buildZone(x, y, zoneType, style = 'european') {
    const tile = this.getTile(x, y);
    if (!tile || tile.terrain === CONFIG.TILES.WATER || tile.road || tile.building) return false;

    if (tile.terrain === CONFIG.TILES.TREES) {
      tile.terrain = CONFIG.TILES.GRASS;
    }

    tile.zone = zoneType;
    tile.style = style;
    tile.stage = 0;
    tile.population = 0;
    tile.jobs = 0;
    this.updateConnectivity();
    return true;
  }

  // Place civic or utility building
  buildBuilding(x, y, buildingId, style = 'european') {
    const tile = this.getTile(x, y);
    if (!tile || tile.terrain === CONFIG.TILES.WATER || tile.road || tile.building) return false;

    // Water pump check: needs at least one adjacent water tile!
    if (buildingId === 'water_pump') {
      const neighbors = [
        this.getTile(x, y - 1),
        this.getTile(x + 1, y),
        this.getTile(x, y + 1),
        this.getTile(x - 1, y)
      ];
      const hasWaterNear = neighbors.some(n => n && n.terrain === CONFIG.TILES.WATER);
      if (!hasWaterNear) return false;
    }

    if (tile.terrain === CONFIG.TILES.TREES) {
      tile.terrain = CONFIG.TILES.GRASS;
    }

    tile.zone = null;
    tile.building = buildingId;
    tile.style = style;
    tile.stage = 1;
    this.updateConnectivity();
    return true;
  }

  // Demolish / Clear tile
  bulldoze(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return false;

    const hadSomething = tile.road || tile.building || tile.zone || tile.terrain === CONFIG.TILES.TREES;
    if (!hadSomething) return false;

    tile.road = false;
    tile.isBridge = false;
    tile.zone = null;
    tile.building = null;
    tile.stage = 0;
    tile.population = 0;
    tile.jobs = 0;
    tile.onFire = false;
    if (tile.terrain === CONFIG.TILES.TREES) {
      tile.terrain = CONFIG.TILES.GRASS;
    }

    this.refreshRoadsList();
    this.updateConnectivity();
    return true;
  }

  refreshRoadsList() {
    this.roadsList = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y][x].road) {
          this.roadsList.push({ x, y });
        }
      }
    }
  }

  // Update infrastructure connectivity: Road access, Power grid, Water grid
  updateConnectivity() {
    // 1. Reset connectivity
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const t = this.grid[y][x];
        t.hasRoad = false;
        t.hasPower = false;
        t.hasWater = false;
      }
    }

    // 2. Check road adjacency
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const t = this.grid[y][x];
        if (t.road) {
          t.hasRoad = true;
          continue;
        }
        // Orthogonal neighbors
        const neighbors = [
          this.getTile(x, y - 1),
          this.getTile(x + 1, y),
          this.getTile(x, y + 1),
          this.getTile(x - 1, y)
        ];
        if (neighbors.some(n => n && n.road)) {
          t.hasRoad = true;
        }
      }
    }

    // 3. Power Grid Propagation (BFS)
    const powerSources = [];
    let totalPowerCapacity = 0;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const t = this.grid[y][x];
        if (t.building) {
          const item = CONFIG.ITEMS[t.building];
          if (item && item.power) {
            powerSources.push({ x, y });
            totalPowerCapacity += item.power;
          }
        }
      }
    }

    if (powerSources.length > 0) {
      const queue = [...powerSources];
      const visited = new Set();
      queue.forEach(p => visited.add(`${p.x},${p.y}`));

      let powerDelivered = 0;
      while (queue.length > 0 && powerDelivered < totalPowerCapacity) {
        const curr = queue.shift();
        const tile = this.getTile(curr.x, curr.y);
        if (!tile) continue;

        tile.hasPower = true;
        if (tile.zone && tile.stage > 0) {
          powerDelivered += tile.stage * 2;
        }

        const neighbors = [
          { x: curr.x, y: curr.y - 1 },
          { x: curr.x + 1, y: curr.y },
          { x: curr.x, y: curr.y + 1 },
          { x: curr.x - 1, y: curr.y }
        ];

        for (const n of neighbors) {
          const key = `${n.x},${n.y}`;
          if (!visited.has(key)) {
            const nt = this.getTile(n.x, n.y);
            // Power conducts through roads, buildings, and zones
            if (nt && (nt.road || nt.building || nt.zone)) {
              visited.add(key);
              queue.push(n);
            }
          }
        }
      }
    }

    // 4. Water Grid Propagation (BFS)
    const waterSources = [];
    let totalWaterCapacity = 0;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const t = this.grid[y][x];
        if (t.building) {
          const item = CONFIG.ITEMS[t.building];
          if (item && item.water) {
            waterSources.push({ x, y });
            totalWaterCapacity += item.water;
          }
        }
      }
    }

    if (waterSources.length > 0) {
      const queue = [...waterSources];
      const visited = new Set();
      queue.forEach(w => visited.add(`${w.x},${w.y}`));

      let waterDelivered = 0;
      while (queue.length > 0 && waterDelivered < totalWaterCapacity) {
        const curr = queue.shift();
        const tile = this.getTile(curr.x, curr.y);
        if (!tile) continue;

        tile.hasWater = true;
        if (tile.zone && tile.stage > 0) {
          waterDelivered += tile.stage * 2;
        }

        const neighbors = [
          { x: curr.x, y: curr.y - 1 },
          { x: curr.x + 1, y: curr.y },
          { x: curr.x, y: curr.y + 1 },
          { x: curr.x - 1, y: curr.y }
        ];

        for (const n of neighbors) {
          const key = `${n.x},${n.y}`;
          if (!visited.has(key)) {
            const nt = this.getTile(n.x, n.y);
            // Pipes run along roads and adjacent buildings
            if (nt && (nt.road || nt.building || nt.zone)) {
              visited.add(key);
              queue.push(n);
            }
          }
        }
      }
    }
  }

  // Export city map to JSON string
  exportJSON(meta = {}) {
    return JSON.stringify({
      version: 1,
      size: this.size,
      meta,
      grid: this.grid.map(row => row.map(tile => ({
        x: tile.x,
        y: tile.y,
        terrain: tile.terrain,
        road: tile.road,
        isBridge: tile.isBridge,
        zone: tile.zone,
        building: tile.building,
        stage: tile.stage,
        style: tile.style,
        population: tile.population,
        jobs: tile.jobs
      })))
    });
  }

  // Import city from JSON string
  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.grid || !Array.isArray(data.grid)) return false;

      this.size = data.size || CONFIG.GRID_SIZE;
      this.initEmpty();

      for (let y = 0; y < Math.min(this.size, data.grid.length); y++) {
        for (let x = 0; x < Math.min(this.size, data.grid[y].length); x++) {
          const src = data.grid[y][x];
          const dest = this.grid[y][x];
          if (src && dest) {
            dest.terrain = src.terrain ?? CONFIG.TILES.GRASS;
            dest.road = !!src.road;
            dest.isBridge = !!src.isBridge;
            dest.zone = src.zone || null;
            dest.building = src.building || null;
            dest.stage = src.stage || 0;
            dest.style = src.style || 'european';
            dest.population = src.population || 0;
            dest.jobs = src.jobs || 0;
          }
        }
      }

      this.refreshRoadsList();
      this.updateConnectivity();
      return data.meta || {};
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  }
}
