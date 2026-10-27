# IsoMetropolis - Web & Native macOS City Builder

A feature-rich, high-performance isometric city-building simulation inspired by **[CityRT](https://cityrt.com/en/)** and classic isometric management games like *SimCity 2000*.

Available as both a **standalone native macOS Application** and a **zero-install browser web app**.

---

## 🍎 Native macOS App & Downloads

The native macOS app is packaged with an authentic custom AppIcon, native menus, full-screen mode, and hardware-accelerated WebKit rendering.

### Downloadable Binaries:
- **[IsoMetropolis-macOS-Installer.dmg](dist/IsoMetropolis-macOS-Installer.dmg)** (778 KB) — Drag-and-drop installer for macOS.
- **[IsoMetropolis-macOS.zip](dist/IsoMetropolis-macOS.zip)** (374 KB) — Direct standalone application archive.

### How to Install on Mac:
1. Double-click `IsoMetropolis-macOS-Installer.dmg`.
2. Drag **IsoMetropolis** into your **Applications** folder.
3. Launch **IsoMetropolis** from Launchpad, Spotlight, or Applications!

---

## 🌟 Key Features

### 1. 📐 Isometric Engine & Procedural Sprites
- **Authentic 2:1 Diamond Projection**: Crisp vector-isometric graphics with smooth Y-sorting depth rendering.
- **Viewport Culling**: Ultra-smooth 60 FPS performance regardless of map size.
- **Dynamic Lighting & Day/Night Cycle**: Real-time transition between sunlight, sunset dusk, and midnight with glowing building windows and streetlamps.
- **Interactive Mini-Map Radar**: Real-time 36x36 city radar with clickable camera jumping.

### 2. 🏛️ Multiple Architectural Styles
Freely build or mix architectural aesthetics across districts:
- **Metropolis Modern**: Glass skyscrapers, sleek high-rises, and corporate towers.
- **European (Haussmann)**: Elegant Parisian stone facades, slate mansard roofs, cafes, and fountains.
- **Neo-Tokyo / Edo**: Traditional tiled eaves, crimson torii gates, lanterns, and modern Tokyo spires.
- **Cyberpunk 2099**: Dark carbon alloy towers, holographic billboards, and glowing neon strips.
- **Old World Medieval**: Half-timbered beams, thatched roofs, stone chimneys, and cobblestones.

### 3. 🚦 Dynamic Road Networks & Animated Traffic
- **16-State Autotiling**: Roads automatically connect into straightaways, corners, 3-way T-junctions, and 4-way crossroads.
- **Suspension Bridges**: Building roads across water automatically constructs bridges.
- **Autonomous Vehicles**: Animated cars, yellow taxis, commuter sedans, delivery vans, and emergency fire trucks navigating roads.

### 4. ⚡ Comprehensive Utility & Civic Systems
- **Power Grid**: Wind Turbines, Solar Arrays, and Thermal Coal Plants with electrical conductivity simulation.
- **Water Network**: Water Towers and River Intake Pumps providing pressurized water.
- **Public Safety & Healthcare**: Police Stations, Fire Departments, and Hospitals.
- **Education & Culture**: Elementary Schools, State Universities, Parks, Fountains, Zen Gardens, and Sports Stadiums.
- **Landmarks**: Grand City Hall, Historic Clock Tower, and Apex Sky Spire.

### 5. 📊 Economic Simulation & RCI Demand
- **RCI Demand Engine**: Real-time tracking of Residential, Commercial, and Industrial demand.
- **Municipal Taxation**: Sliders to set independent tax rates on residents and businesses.
- **City Ledger**: Monthly income, utility/road upkeep expenses, and net cashflow calculations.
- **Disasters & Incidents**: Fire outbreaks that require fire department protection.
- **Dynamic News Ticker**: Humorous, real-time headlines reporting on mayor approval and city happenings.

### 6. 💾 Save, Export & Pre-built Cities
- **LocalStorage Auto-Save & Manual Slots**: Never lose your progress.
- **JSON City Import & Export**: Download your city file and share it with friends!
- **4 Included Pre-built Cities**:
  1. *Sunny Bay Metropolis* (Coastal city with 5,000+ residents)
  2. *Neo Tokyo 2099* (Cyberpunk megacity)
  3. *Old Haussmann River* (Historic European canals & boulevards)
  4. *Blank Canvas* (Pristine nature ready to build)

---

## 🎮 Controls & Shortcuts

| Action | Control |
| :--- | :--- |
| **Pan Camera** | Right-Click Drag, Middle-Click Drag, or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / Arrow keys |
| **Zoom In / Out** | Mouse Wheel / Pinch-to-zoom |
| **Pause / Play** | <kbd>Space</kbd> |
| **Simulation Speed** | <kbd>1</kbd> (1x), <kbd>2</kbd> (2x), <kbd>3</kbd> (4x) |
| **Quick Build Road** | <kbd>R</kbd> |
| **Bulldozer / Clear** | <kbd>B</kbd> |
| **Inspect Tile** | <kbd>I</kbd> |
| **Toggle Grid** | <kbd>G</kbd> |
| **Toggle Full Screen** | <kbd>Cmd</kbd> + <kbd>Ctrl</kbd> + <kbd>F</kbd> |

---

## 🔨 Building the Mac App from Source

To compile the native app and regenerate the DMG installer:
```bash
./macos/build_app.sh
```
Artifacts are generated in the `dist/` folder.
