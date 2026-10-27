/**
 * IsoMetropolis UI & Interaction Manager
 * Handles user input, dragging, zooming, tool selection, modals, and HUD updates.
 */

class UIManager {
  constructor(renderer, cityMap, simEngine, trafficSys) {
    this.renderer = renderer;
    this.map = cityMap;
    this.sim = simEngine;
    this.traffic = trafficSys;

    this.cityName = 'Metropolis';
    this.mayorName = 'Mayor Alex';

    // Drag / Pan state
    this.isDragging = false;
    this.dragButton = 0; // 0: left, 1: middle, 2: right
    this.startX = 0;
    this.startY = 0;
    this.hasMoved = false;

    // Tool drag state (for dragging roads and zoning)
    this.isBuildingDrag = false;
    this.dragStartTile = null;

    // Touch support
    this.lastTouchDist = 0;

    this.setupEventListeners();
    this.setupModals();
    this.updateHUD();
  }

  setupEventListeners() {
    const canvas = this.renderer.canvas;

    // Prevent context menu so right click can be used for fast panning
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Mouse Down
    canvas.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.dragButton = e.button;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.hasMoved = false;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const gridPos = this.renderer.screenToGrid(mouseX, mouseY);

      // Left click with a build tool starts building drag
      if (e.button === 0 && this.renderer.activeTool !== CONFIG.TOOLS.SELECT && this.renderer.activeTool !== CONFIG.TOOLS.INSPECT) {
        this.isBuildingDrag = true;
        this.dragStartTile = gridPos;
      }
    });

    // Mouse Move
    window.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Update hover tile
      if (mouseX >= 0 && mouseX <= canvas.width && mouseY >= 0 && mouseY <= canvas.height) {
        const gridPos = this.renderer.screenToGrid(mouseX, mouseY);
        if (gridPos.x >= 0 && gridPos.x < this.map.size && gridPos.y >= 0 && gridPos.y < this.map.size) {
          this.renderer.hoverTile = gridPos;
        } else {
          this.renderer.hoverTile = null;
        }
      } else {
        this.renderer.hoverTile = null;
      }

      // Handle Pan
      if (this.isDragging) {
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;

        if (Math.hypot(dx, dy) > 4) {
          this.hasMoved = true;
        }

        // Pan with right-click or middle-click, or left-click when tool is SELECT
        if (this.dragButton === 2 || this.dragButton === 1 || (this.dragButton === 0 && this.renderer.activeTool === CONFIG.TOOLS.SELECT)) {
          this.renderer.panX += dx;
          this.renderer.panY += dy;
          this.startX = e.clientX;
          this.startY = e.clientY;
        } else if (this.isBuildingDrag && this.hasMoved && this.renderer.hoverTile) {
          // Continuous drag building (e.g. painting roads, bulldozer, or zoning)
          if (this.renderer.activeTool === CONFIG.TOOLS.ROAD || this.renderer.activeTool === CONFIG.TOOLS.BULLDOZE || this.renderer.activeTool.startsWith('zone_')) {
            this.executeToolAt(this.renderer.hoverTile.x, this.renderer.hoverTile.y);
          }
        }
      }
    });

    // Mouse Up
    window.addEventListener('mouseup', e => {
      if (this.isDragging && !this.hasMoved && e.button === 0) {
        // Simple click without drag
        if (this.renderer.hoverTile) {
          this.executeToolAt(this.renderer.hoverTile.x, this.renderer.hoverTile.y);
        }
      }

      this.isDragging = false;
      this.isBuildingDrag = false;
      this.dragStartTile = null;
    });

    // Zoom via Scroll Wheel
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      const newZoom = Math.max(this.renderer.minZoom, Math.min(this.renderer.maxZoom, this.renderer.zoom * zoomFactor));

      // Zoom towards mouse pointer
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const beforeZoomX = (mouseX - this.renderer.panX) / this.renderer.zoom;
      const beforeZoomY = (mouseY - this.renderer.panY) / this.renderer.zoom;

      this.renderer.zoom = newZoom;
      this.renderer.panX = mouseX - beforeZoomX * newZoom;
      this.renderer.panY = mouseY - beforeZoomY * newZoom;
    }, { passive: false });

    // Mini-map click to jump camera
    if (this.renderer.miniCanvas) {
      this.renderer.miniCanvas.addEventListener('click', e => {
        const rect = this.renderer.miniCanvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const targetX = Math.floor((mx / this.renderer.miniCanvas.width) * this.map.size);
        const targetY = Math.floor((my / this.renderer.miniCanvas.height) * this.map.size);

        // Center on clicked coordinate
        const hw = (CONFIG.TILE_WIDTH / 2) * this.renderer.zoom;
        const hh = (CONFIG.TILE_HEIGHT / 2) * this.renderer.zoom;
        this.renderer.panX = canvas.width / 2 - (targetX - targetY) * hw;
        this.renderer.panY = canvas.height / 2 - (targetX + targetY) * hh;
      });
    }

    // Touch event listeners for mobile / touchpads
    canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.hasMoved = false;
      } else if (e.touches.length === 2) {
        this.lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    canvas.addEventListener('touchmove', e => {
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.startX;
        const dy = e.touches[0].clientY - this.startY;
        this.renderer.panX += dx;
        this.renderer.panY += dy;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.hasMoved = true;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (this.lastTouchDist > 0) {
          const factor = dist / this.lastTouchDist;
          this.renderer.zoom = Math.max(this.renderer.minZoom, Math.min(this.renderer.maxZoom, this.renderer.zoom * factor));
        }
        this.lastTouchDist = dist;
      }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', e => {
      // Ignore key events when typing inside inputs or dialogs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ': // Space: Pause / Play
          this.sim.setSpeed(this.sim.speed === 0 ? 1 : 0);
          this.updateSpeedButtons();
          break;
        case '1':
          this.sim.setSpeed(1);
          this.updateSpeedButtons();
          break;
        case '2':
          this.sim.setSpeed(2);
          this.updateSpeedButtons();
          break;
        case '3':
        case '4':
          this.sim.setSpeed(4);
          this.updateSpeedButtons();
          break;
        case 'r':
          this.setTool(CONFIG.TOOLS.ROAD);
          break;
        case 'b':
          this.setTool(CONFIG.TOOLS.BULLDOZE);
          break;
        case 'i':
          this.setTool(CONFIG.TOOLS.INSPECT);
          break;
        case 'g':
          this.toggleGrid();
          break;
        case 'w':
        case 'arrowup':
          this.renderer.panY += 30;
          break;
        case 's':
        case 'arrowdown':
          this.renderer.panY -= 30;
          break;
        case 'a':
        case 'arrowleft':
          this.renderer.panX += 30;
          break;
        case 'd':
        case 'arrowright':
          this.renderer.panX -= 30;
          break;
      }
    });
  }

  // Execute currently active tool at grid coordinates (x, y)
  executeToolAt(x, y) {
    const tile = this.map.getTile(x, y);
    if (!tile) return;

    const tool = this.renderer.activeTool;

    if (tool === CONFIG.TOOLS.SELECT) {
      return;
    }

    if (tool === CONFIG.TOOLS.INSPECT) {
      this.showInspectModal(tile);
      sound.playClick();
      return;
    }

    if (tool === CONFIG.TOOLS.BULLDOZE) {
      if (this.sim.funds >= 10 && this.map.bulldoze(x, y)) {
        this.sim.funds -= 10;
        sound.playDemolish();
        this.updateHUD();
      } else {
        sound.playError();
      }
      return;
    }

    if (tool === CONFIG.TOOLS.ROAD) {
      const cost = CONFIG.ITEMS.road.cost;
      if (this.sim.funds >= cost && this.map.buildRoad(x, y)) {
        this.sim.funds -= cost;
        sound.playRoad();
        this.updateHUD();
      } else {
        sound.playError();
      }
      return;
    }

    if (tool.startsWith('zone_')) {
      const item = CONFIG.ITEMS[tool];
      const cost = item ? item.cost : 25;
      if (this.sim.funds >= cost && this.map.buildZone(x, y, tool, this.renderer.activeStyle)) {
        this.sim.funds -= cost;
        sound.playBuild();
        this.updateHUD();
      } else {
        sound.playError();
      }
      return;
    }

    if (tool === 'dezone') {
      if (tile.zone) {
        tile.zone = null;
        tile.stage = 0;
        tile.population = 0;
        tile.jobs = 0;
        this.map.updateConnectivity();
        sound.playDemolish();
      }
      return;
    }

    // Civic & Utility buildings
    const item = CONFIG.ITEMS[tool];
    if (item) {
      if (this.sim.funds >= item.cost && this.map.buildBuilding(x, y, tool, this.renderer.activeStyle)) {
        this.sim.funds -= item.cost;
        sound.playBuild();
        this.updateHUD();
      } else {
        sound.playError();
      }
    }
  }

  setTool(toolId) {
    this.renderer.activeTool = toolId;
    sound.playClick();

    // Update active class on toolbar buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === toolId);
    });
  }

  setStyle(styleId) {
    this.renderer.activeStyle = styleId;
    sound.playClick();
  }

  toggleGrid() {
    this.renderer.showGrid = !this.renderer.showGrid;
    const btn = document.getElementById('btn-grid');
    if (btn) btn.classList.toggle('active', this.renderer.showGrid);
  }

  toggleDayNight() {
    this.sim.autoDayNight = !this.sim.autoDayNight;
    if (!this.sim.autoDayNight) {
      // Toggle between locked day and locked night
      this.sim.timeOfDay = this.sim.timeOfDay > 0.5 ? 0.25 : 0.9;
    }
    const btn = document.getElementById('btn-daynight');
    if (btn) {
      btn.textContent = this.sim.timeOfDay > 0.5 ? '🌙 Night' : '☀️ Day';
    }
  }

  updateSpeedButtons() {
    document.querySelectorAll('.speed-btn').forEach(btn => {
      const spd = parseInt(btn.dataset.speed, 10);
      btn.classList.toggle('active', spd === this.sim.speed);
    });
  }

  // Update Top HUD Bar, RCI bars, and news marquee
  updateHUD() {
    const elFunds = document.getElementById('hud-funds');
    const elPop = document.getElementById('hud-pop');
    const elDate = document.getElementById('hud-date');
    const elHappy = document.getElementById('hud-happy');

    if (elFunds) {
      elFunds.textContent = `$${this.sim.funds.toLocaleString()}`;
      elFunds.className = this.sim.funds < 0 ? 'text-danger' : 'text-success';
    }
    if (elPop) elPop.textContent = this.sim.population.toLocaleString();
    if (elHappy) elHappy.textContent = `${this.sim.happiness}%`;

    if (elDate) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      elDate.textContent = `${monthNames[this.sim.month - 1]} ${this.sim.year} (Day ${this.sim.day})`;
    }

    // RCI Demand Meters
    const barR = document.getElementById('demand-res');
    const barC = document.getElementById('demand-com');
    const barI = document.getElementById('demand-ind');
    if (barR) barR.style.height = `${this.sim.demand.res}%`;
    if (barC) barC.style.height = `${this.sim.demand.com}%`;
    if (barI) barI.style.height = `${this.sim.demand.ind}%`;
  }

  setupModals() {
    // Budget Modal
    const budgetDialog = document.getElementById('dialog-budget');
    const btnBudget = document.getElementById('btn-modal-budget');
    if (btnBudget && budgetDialog) {
      btnBudget.addEventListener('click', () => {
        this.renderBudgetModalContent();
        budgetDialog.showModal();
        sound.playClick();
      });
    }

    // Stats Modal
    const statsDialog = document.getElementById('dialog-stats');
    const btnStats = document.getElementById('btn-modal-stats');
    if (btnStats && statsDialog) {
      btnStats.addEventListener('click', () => {
        this.renderStatsModalContent();
        statsDialog.showModal();
        sound.playClick();
      });
    }

    // Presets / Cities Modal
    const presetsDialog = document.getElementById('dialog-presets');
    const btnPresets = document.getElementById('btn-modal-presets');
    if (btnPresets && presetsDialog) {
      btnPresets.addEventListener('click', () => {
        presetsDialog.showModal();
        sound.playClick();
      });
    }

    // Handbook Modal
    const handbookDialog = document.getElementById('dialog-handbook');
    const btnHandbook = document.getElementById('btn-modal-handbook');
    if (btnHandbook && handbookDialog) {
      btnHandbook.addEventListener('click', () => {
        handbookDialog.showModal();
        sound.playClick();
      });
    }

    // Close buttons for native dialogs
    document.querySelectorAll('.dialog-close-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const dialog = e.target.closest('dialog');
        if (dialog) dialog.close();
      });
    });

    // Close when clicking native dialog backdrop
    document.querySelectorAll('dialog').forEach(d => {
      d.addEventListener('click', e => {
        const rect = d.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          d.close();
        }
      });
    });
  }

  renderBudgetModalContent() {
    const el = document.getElementById('budget-details');
    if (!el) return;

    const resInc = Math.round(this.sim.population * 2.8 * (this.sim.taxes.res / 9));
    const comInc = Math.round(this.sim.totalJobs * 0.4 * 3.8 * (this.sim.taxes.com / 9));
    const indInc = Math.round(this.sim.totalJobs * 0.6 * 3.2 * (this.sim.taxes.ind / 9));
    const totalInc = resInc + comInc + indInc;

    el.innerHTML = `
      <div class="budget-columns">
        <div class="budget-col">
          <h3>💰 Monthly Tax Revenues</h3>
          <div class="budget-row">
            <label>Residential Tax (${this.sim.taxes.res}%):</label>
            <input type="range" id="slider-tax-res" min="1" max="20" value="${this.sim.taxes.res}">
            <span class="text-success">+$${resInc.toLocaleString()}</span>
          </div>
          <div class="budget-row">
            <label>Commercial Tax (${this.sim.taxes.com}%):</label>
            <input type="range" id="slider-tax-com" min="1" max="20" value="${this.sim.taxes.com}">
            <span class="text-success">+$${comInc.toLocaleString()}</span>
          </div>
          <div class="budget-row">
            <label>Industrial Tax (${this.sim.taxes.ind}%):</label>
            <input type="range" id="slider-tax-ind" min="1" max="20" value="${this.sim.taxes.ind}">
            <span class="text-success">+$${indInc.toLocaleString()}</span>
          </div>
          <div class="budget-total border-top">
            <strong>Total Revenue:</strong>
            <strong class="text-success">+$${totalInc.toLocaleString()}</strong>
          </div>
        </div>

        <div class="budget-col">
          <h3>📉 Monthly Expenses</h3>
          <div class="budget-row">
            <span>Road Maintenance:</span>
            <span class="text-danger">-$${Math.round(this.sim.lastMonthExpense * 0.35).toLocaleString()}</span>
          </div>
          <div class="budget-row">
            <span>Utility Power & Water:</span>
            <span class="text-danger">-$${Math.round(this.sim.lastMonthExpense * 0.35).toLocaleString()}</span>
          </div>
          <div class="budget-row">
            <span>Public Safety & Health:</span>
            <span class="text-danger">-$${Math.round(this.sim.lastMonthExpense * 0.3).toLocaleString()}</span>
          </div>
          <div class="budget-total border-top">
            <strong>Total Expenses:</strong>
            <strong class="text-danger">-$${this.sim.lastMonthExpense.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      <div class="net-cashflow-banner ${this.sim.lastMonthProfit >= 0 ? 'bg-positive' : 'bg-negative'}">
        <strong>Estimated Net Monthly Cashflow:</strong>
        <span>${this.sim.lastMonthProfit >= 0 ? '+' : ''}$${this.sim.lastMonthProfit.toLocaleString()}</span>
      </div>
    `;

    // Tax slider inputs
    const sRes = document.getElementById('slider-tax-res');
    const sCom = document.getElementById('slider-tax-com');
    const sInd = document.getElementById('slider-tax-ind');
    if (sRes) sRes.oninput = e => { this.sim.taxes.res = parseInt(e.target.value, 10); this.renderBudgetModalContent(); };
    if (sCom) sCom.oninput = e => { this.sim.taxes.com = parseInt(e.target.value, 10); this.renderBudgetModalContent(); };
    if (sInd) sInd.oninput = e => { this.sim.taxes.ind = parseInt(e.target.value, 10); this.renderBudgetModalContent(); };
  }

  renderStatsModalContent() {
    const el = document.getElementById('stats-details');
    if (!el) return;

    el.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-num">${this.sim.population.toLocaleString()}</div>
          <div class="stat-lbl">Citizens</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${this.sim.totalJobs.toLocaleString()}</div>
          <div class="stat-lbl">Available Jobs</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${this.sim.unemploymentRate}%</div>
          <div class="stat-lbl">Unemployment</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${this.sim.happiness}%</div>
          <div class="stat-lbl">Citizen Happiness</div>
        </div>
      </div>

      <div class="chart-container">
        <h4>📈 Historical Population Trend</h4>
        <canvas id="chart-population" width="480" height="140"></canvas>
      </div>
    `;

    // Draw simple canvas trend chart
    const canvas = document.getElementById('chart-population');
    if (canvas && this.sim.history.pop.length > 1) {
      const ctx = canvas.getContext('2d');
      const data = this.sim.history.pop;
      const maxVal = Math.max(10, ...data);
      const stepX = canvas.width / (data.length - 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = i * stepX;
        const y = canvas.height - (val / maxVal) * (canvas.height - 20) - 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Chart area fill
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.fill();
    }
  }

  showInspectModal(tile) {
    const dialog = document.getElementById('dialog-inspect');
    const content = document.getElementById('inspect-details');
    if (!dialog || !content) return;

    let typeStr = 'Natural Grassland';
    if (tile.terrain === CONFIG.TILES.WATER) typeStr = 'Deep River Water';
    else if (tile.terrain === CONFIG.TILES.SAND) typeStr = 'River Shore / Beach';
    else if (tile.terrain === CONFIG.TILES.TREES) typeStr = 'Woodland Trees';
    else if (tile.road) typeStr = tile.isBridge ? 'River Suspension Bridge' : 'Paved City Road';
    else if (tile.zone) {
      const names = { zone_res: 'Residential District', zone_com: 'Commercial District', zone_ind: 'Industrial District' };
      typeStr = `${names[tile.zone]} (Tier ${tile.stage})`;
    } else if (tile.building) {
      const item = CONFIG.ITEMS[tile.building];
      typeStr = item ? item.name : tile.building;
    }

    content.innerHTML = `
      <div class="inspect-box">
        <div class="inspect-header">
          <h3>📍 Tile Coordinates (${tile.x}, ${tile.y})</h3>
          <span class="badge ${tile.hasPower && tile.hasWater ? 'badge-good' : 'badge-warn'}">
            ${tile.hasPower && tile.hasWater ? 'Fully Serviced' : 'Needs Utilities'}
          </span>
        </div>
        <p class="inspect-type"><strong>Type:</strong> ${typeStr}</p>
        <div class="inspect-meta-grid">
          <div><strong>Architecture:</strong> <span class="capitalize">${tile.style}</span></div>
          <div><strong>Residents:</strong> ${tile.population} citizens</div>
          <div><strong>Workplace Jobs:</strong> ${tile.jobs} workers</div>
          <div><strong>Power Supply:</strong> ${tile.hasPower ? '⚡ Connected' : '❌ Blackout'}</div>
          <div><strong>Water Supply:</strong> ${tile.hasWater ? '💧 Pressurized' : '❌ Dry'}</div>
          <div><strong>Land Value:</strong> $${tile.landValue}/sq.m</div>
          <div><strong>Pollution:</strong> ${tile.pollution > 0 ? `${tile.pollution} ppm` : '0 (Clean)'}</div>
          <div><strong>Fire Hazard:</strong> ${tile.onFire ? '🔥 ON FIRE!' : 'Safe'}</div>
        </div>
      </div>
    `;

    dialog.showModal();
  }
}
