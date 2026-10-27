/**
 * IsoMetropolis Simulation Engine
 * Handles zoning growth, RCI demand, municipal finances, environmental systems, and citizen happiness.
 */

class SimulationEngine {
  constructor(cityMap) {
    this.map = cityMap;

    // Simulation state
    this.funds = CONFIG.STARTING_FUNDS;
    this.day = 1;
    this.month = 1;
    this.year = 2026;
    this.speed = 1; // 0: paused, 1: normal, 2: fast, 4: ultra
    this.timeOfDay = 0.25; // 0.25 = noon, 0.75 = dusk, 0.9 = midnight
    this.autoDayNight = true;

    // RCI Demand (0 to 100 scale)
    this.demand = {
      res: 60,
      com: 50,
      ind: 50
    };

    // Tax rates (%)
    this.taxes = {
      res: 9,
      com: 9,
      ind: 9
    };

    // Service funding (0 - 100%)
    this.funding = {
      transport: 100,
      utilities: 100,
      police: 100,
      fire: 100,
      health: 100,
      education: 100
    };

    // City Aggregates
    this.population = 0;
    this.totalJobs = 0;
    this.employed = 0;
    this.unemploymentRate = 0;
    this.happiness = 75;
    this.lastMonthIncome = 0;
    this.lastMonthExpense = 0;
    this.lastMonthProfit = 0;

    // Historical ledger for stats modal
    this.history = {
      pop: [0],
      funds: [this.funds],
      happiness: [75]
    };

    // Active incidents
    this.activeFires = [];
    this.newsQueue = [...CONFIG.NEWS_TICKER];
  }

  // Set game simulation speed
  setSpeed(s) {
    this.speed = Math.max(0, Math.min(4, s));
  }

  // Main simulation tick (called every tick interval when not paused)
  tick() {
    if (this.speed === 0) return;

    // Advance day
    this.day++;
    if (this.autoDayNight) {
      this.timeOfDay = (this.timeOfDay + 0.03 * this.speed) % 1.0;
    }

    // Run systems
    this.simulateZones();
    this.simulateEnvironment();
    this.simulateFires();
    this.calculateAggregates();

    // End of month check
    if (this.day > CONFIG.DAYS_PER_MONTH) {
      this.day = 1;
      this.month++;
      if (this.month > 12) {
        this.month = 1;
        this.year++;
      }
      this.processMonthlyBudget();
    }
  }

  // Simulate residential, commercial, industrial growth & decay
  simulateZones() {
    let resDemand = this.demand.res;
    let comDemand = this.demand.com;
    let indDemand = this.demand.ind;

    for (let y = 0; y < this.map.size; y++) {
      for (let x = 0; x < this.map.size; x++) {
        const tile = this.map.grid[y][x];
        if (!tile.zone) continue;

        const isServiced = tile.hasRoad && tile.hasPower && tile.hasWater;

        if (isServiced) {
          // Check growth
          if (tile.zone === 'zone_res' && resDemand > 20 && tile.stage < 4) {
            if (Math.random() < 0.15 * this.speed) {
              tile.stage = Math.max(1, tile.stage + 1);
              resDemand -= 1;
            }
          } else if (tile.zone === 'zone_com' && comDemand > 20 && tile.stage < 4) {
            if (Math.random() < 0.12 * this.speed) {
              tile.stage = Math.max(1, tile.stage + 1);
              comDemand -= 1;
            }
          } else if (tile.zone === 'zone_ind' && indDemand > 20 && tile.stage < 4) {
            if (Math.random() < 0.14 * this.speed) {
              tile.stage = Math.max(1, tile.stage + 1);
              indDemand -= 1;
            }
          }
        } else {
          // If abandoned/unserviced for too long, slowly decay
          if (tile.stage > 0 && Math.random() < 0.05 * this.speed) {
            tile.stage = Math.max(0, tile.stage - 1);
          }
        }

        // Update population & jobs based on zone and stage
        this.updateTileStats(tile);
      }
    }
  }

  updateTileStats(tile) {
    if (!tile.zone || tile.stage === 0) {
      tile.population = 0;
      tile.jobs = 0;
      return;
    }

    if (tile.zone === 'zone_res') {
      const popTable = [0, 8, 24, 64, 150];
      tile.population = popTable[tile.stage] || 0;
      tile.jobs = 0;
    } else if (tile.zone === 'zone_com') {
      const jobTable = [0, 6, 20, 55, 130];
      tile.population = 0;
      tile.jobs = jobTable[tile.stage] || 0;
    } else if (tile.zone === 'zone_ind') {
      const jobTable = [0, 8, 26, 70, 120];
      tile.population = 0;
      tile.jobs = jobTable[tile.stage] || 0;
    }
  }

  // Calculate environmental factors: pollution, land value, services
  simulateEnvironment() {
    for (let y = 0; y < this.map.size; y++) {
      for (let x = 0; x < this.map.size; x++) {
        const tile = this.map.grid[y][x];

        // Base land value
        let val = 45;

        // Waterfront bonus
        const neighbors = [
          this.map.getTile(x, y - 1),
          this.map.getTile(x + 1, y),
          this.map.getTile(x, y + 1),
          this.map.getTile(x - 1, y)
        ];
        if (neighbors.some(n => n && n.terrain === CONFIG.TILES.WATER)) {
          val += 25;
        }

        // Trees bonus
        if (neighbors.some(n => n && n.terrain === CONFIG.TILES.TREES)) {
          val += 15;
        }

        // Base pollution
        let pol = 0;
        if (tile.zone === 'zone_ind') {
          pol += tile.stage * 15;
        }
        if (tile.building === 'coal_power') {
          pol += 50;
        }

        tile.pollution = pol;
        tile.landValue = Math.min(100, Math.max(10, val - pol * 0.4));
      }
    }
  }

  // Simulate fire outbreaks and fire dept suppression
  simulateFires() {
    // Rare fire breakout (0.3% chance per tick on unserviced/industrial buildings)
    if (Math.random() < 0.003 * this.speed && this.activeFires.length === 0) {
      const candidates = [];
      for (let y = 0; y < this.map.size; y++) {
        for (let x = 0; x < this.map.size; x++) {
          const t = this.map.grid[y][x];
          if ((t.zone && t.stage > 0) || t.building) {
            candidates.push(t);
          }
        }
      }
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        target.onFire = true;
        target.fireTimer = 12; // ticks until extinguished or destroyed
        this.activeFires.push(target);
        sound.playSiren();
        this.newsQueue.unshift(`BREAKING NEWS: 🚨 Structure fire reported at (${target.x}, ${target.y})! Fire fighters dispatched!`);
      }
    }

    // Process existing fires
    for (let i = this.activeFires.length - 1; i >= 0; i--) {
      const t = this.activeFires[i];
      t.fireTimer--;

      // Check if nearby fire station covers it
      let fireSuppression = 1;
      for (let y = Math.max(0, t.y - 10); y <= Math.min(this.map.size - 1, t.y + 10); y++) {
        for (let x = Math.max(0, t.x - 10); x <= Math.min(this.map.size - 1, t.x + 10); x++) {
          if (this.map.grid[y][x].building === 'fire_dept') {
            fireSuppression = 2.5;
            break;
          }
        }
      }

      if (t.fireTimer <= 0) {
        t.onFire = false;
        if (fireSuppression >= 2) {
          // Saved by fire fighters!
          this.newsQueue.unshift(`FIRE HEROES: Fire fighters saved building at (${t.x}, ${t.y})!`);
        } else {
          // Burnt down to stage 0
          t.stage = 0;
          t.population = 0;
          t.jobs = 0;
          this.newsQueue.unshift(`DISASTER: Building burnt down at (${t.x}, ${t.y}) due to lack of fire station coverage!`);
        }
        this.activeFires.splice(i, 1);
      }
    }
  }

  // Calculate city totals & demand curves
  calculateAggregates() {
    let totalPop = 0;
    let totalJobs = 0;
    let totalHappiness = 75;

    for (let y = 0; y < this.map.size; y++) {
      for (let x = 0; x < this.map.size; x++) {
        const t = this.map.grid[y][x];
        totalPop += t.population || 0;
        totalJobs += t.jobs || 0;

        // Landmark bonus
        if (t.building === 'city_hall') totalHappiness += 4;
        if (t.building === 'stadium') totalHappiness += 6;
        if (t.building === 'monolith') totalHappiness += 8;
      }
    }

    this.population = totalPop;
    this.totalJobs = totalJobs;

    // Employment
    const workforce = Math.floor(this.population * 0.65);
    this.employed = Math.min(workforce, this.totalJobs);
    this.unemploymentRate = workforce > 0 ? Math.round(((workforce - this.employed) / workforce) * 100) : 0;

    // RCI Demand algorithm
    // 1. Res demand rises when jobs exceed population & taxes are low
    const jobRatio = totalPop > 0 ? (this.totalJobs / (totalPop * 0.65)) : 1.5;
    this.demand.res = Math.min(100, Math.max(0, Math.round(50 * jobRatio - (this.taxes.res - 9) * 4)));

    // 2. Com demand rises with population
    const popRatio = this.totalJobs > 0 ? ((totalPop * 0.5) / this.totalJobs) : 1.2;
    this.demand.com = Math.min(100, Math.max(0, Math.round(50 * popRatio - (this.taxes.com - 9) * 4)));

    // 3. Ind demand rises with workforce
    this.demand.ind = Math.min(100, Math.max(0, Math.round(60 - this.unemploymentRate * 0.5 - (this.taxes.ind - 9) * 4)));

    // Happiness score
    let h = 80;
    h -= this.unemploymentRate * 0.4;
    h -= (this.taxes.res - 9) * 2;
    h -= (this.taxes.com - 9) * 1.5;
    if (this.funds < 0) h -= 15;
    this.happiness = Math.min(100, Math.max(10, Math.round(h)));
  }

  // Process monthly budget, taxes, and expenses
  processMonthlyBudget() {
    // TAX REVENUE
    const resIncome = Math.round(this.population * 2.8 * (this.taxes.res / 9));
    const comIncome = Math.round(this.totalJobs * 0.4 * 3.8 * (this.taxes.com / 9));
    const indIncome = Math.round(this.totalJobs * 0.6 * 3.2 * (this.taxes.ind / 9));
    const totalIncome = resIncome + comIncome + indIncome;

    // EXPENSES
    let transportExpense = 0;
    let utilityExpense = 0;
    let serviceExpense = 0;

    for (let y = 0; y < this.map.size; y++) {
      for (let x = 0; x < this.map.size; x++) {
        const t = this.map.grid[y][x];
        if (t.road) {
          transportExpense += CONFIG.ITEMS.road.upkeep * (this.funding.transport / 100);
        }
        if (t.building) {
          const item = CONFIG.ITEMS[t.building];
          if (item && item.upkeep) {
            if (item.category === 'utilities') {
              utilityExpense += item.upkeep * (this.funding.utilities / 100);
            } else {
              serviceExpense += item.upkeep;
            }
          }
        }
      }
    }

    const totalExpense = Math.round(transportExpense + utilityExpense + serviceExpense);
    const netProfit = totalIncome - totalExpense;

    this.funds += netProfit;
    this.lastMonthIncome = totalIncome;
    this.lastMonthExpense = totalExpense;
    this.lastMonthProfit = netProfit;

    // Track history for graphs
    this.history.pop.push(this.population);
    this.history.funds.push(this.funds);
    this.history.happiness.push(this.happiness);
    if (this.history.pop.length > 24) {
      this.history.pop.shift();
      this.history.funds.shift();
      this.history.happiness.shift();
    }

    if (netProfit > 0) {
      sound.playMoney();
    }
  }

  // Get current news headline
  getNextNews() {
    if (this.newsQueue.length > 0) {
      return this.newsQueue.shift();
    }
    return CONFIG.NEWS_TICKER[Math.floor(Math.random() * CONFIG.NEWS_TICKER.length)];
  }
}
