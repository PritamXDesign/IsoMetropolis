/**
 * IsoMetropolis Traffic & Vehicle Simulation
 * Spawns and moves vehicles along road networks with smooth isometric coordinates.
 */

class TrafficSystem {
  constructor(cityMap) {
    this.map = cityMap;
    this.vehicles = [];
    this.maxVehicles = 40;
    this.carColors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#f8fafc', '#8b5cf6'];
  }

  update() {
    // 1. Spawn new vehicles if below cap and roads exist
    if (this.vehicles.length < this.maxVehicles && this.map.roadsList.length > 2) {
      if (Math.random() < 0.2) {
        this.spawnVehicle();
      }
    }

    // 2. Move existing vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      const dx = v.targetX - v.x;
      const dy = v.targetY - v.y;
      const dist = Math.hypot(dx, dy);

      if (dist < v.speed) {
        v.x = v.targetX;
        v.y = v.targetY;
        v.lifetime--;

        if (v.lifetime <= 0) {
          this.vehicles.splice(i, 1);
          continue;
        }

        // Pick next road neighbor
        const next = this.chooseNextTile(v);
        if (next) {
          v.prevX = v.x;
          v.prevY = v.y;
          v.targetX = next.x;
          v.targetY = next.y;
          v.dir = this.calcDirection(v.prevX, v.prevY, next.x, next.y);
        } else {
          // Dead end, despawn
          this.vehicles.splice(i, 1);
        }
      } else {
        v.x += (dx / dist) * v.speed;
        v.y += (dy / dist) * v.speed;
      }
    }
  }

  spawnVehicle() {
    const startTile = this.map.roadsList[Math.floor(Math.random() * this.map.roadsList.length)];
    if (!startTile) return;

    const neighbors = this.getRoadNeighbors(startTile.x, startTile.y);
    if (neighbors.length === 0) return;

    const nextTile = neighbors[Math.floor(Math.random() * neighbors.length)];
    const isFireTruck = this.map.grid[startTile.y][startTile.x].building === 'fire_dept' || Math.random() < 0.05;

    this.vehicles.push({
      x: startTile.x,
      y: startTile.y,
      prevX: startTile.x,
      prevY: startTile.y,
      targetX: nextTile.x,
      targetY: nextTile.y,
      dir: this.calcDirection(startTile.x, startTile.y, nextTile.x, nextTile.y),
      speed: 0.035 + Math.random() * 0.015,
      color: isFireTruck ? '#dc2626' : this.carColors[Math.floor(Math.random() * this.carColors.length)],
      isEmergency: isFireTruck,
      lifetime: 80 + Math.floor(Math.random() * 60)
    });
  }

  chooseNextTile(v) {
    const neighbors = this.getRoadNeighbors(v.x, v.y);
    if (neighbors.length === 0) return null;

    // Filter out the tile we just came from to prevent immediate 180 flip
    const forwardNeighbors = neighbors.filter(n => !(n.x === v.prevX && n.y === v.prevY));
    if (forwardNeighbors.length > 0) {
      return forwardNeighbors[Math.floor(Math.random() * forwardNeighbors.length)];
    }
    return neighbors[0]; // Dead end fallback
  }

  getRoadNeighbors(x, y) {
    const list = [];
    const dirs = [
      { x: x, y: y - 1 },
      { x: x + 1, y: y },
      { x: x, y: y + 1 },
      { x: x - 1, y: y }
    ];
    for (const d of dirs) {
      const tile = this.map.getTile(d.x, d.y);
      if (tile && tile.road) {
        list.push({ x: d.x, y: d.y });
      }
    }
    return list;
  }

  calcDirection(fromX, fromY, toX, toY) {
    if (toX > fromX) return 'SE';
    if (toX < fromX) return 'NW';
    if (toY > fromY) return 'SW';
    return 'NE';
  }
}
