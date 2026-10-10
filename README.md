# 🏝️ Colonization - 3D Multiplayer Catan (4 to 8 Players)

A complete digital recreation of Settlers of Catan designed for **4 to 8 players**, powered by **React Three Fiber (R3F)** for stylized low-poly 3D graphics and **Colyseus** for real-time multiplayer state synchronization.

---

## 🌟 Key Features

### 1. 👥 4 to 8 Player Dynamic Scaling
- **Dynamic Grid Sizing**:
  - **4 Players**: Classic 19-hex board (Radius 2).
  - **6 Players**: Extended 30-hex board with additional resource tiles & harbors.
  - **8 Players**: Grand 44-hex board (Radius 3) engineered with balanced number chit distributions.
- **8 Distinct Player Colors & Banners**: Crimson Red, Royal Blue, Solar Orange, Pure White, Emerald Green, Timber Brown, Mystic Purple, and Arctic Cyan.
- **Official Special Building Phase (for 5-8 players)**:
  - After the active player's main turn, other players can build (settlements, roads, cities, dev cards) in clockwise order.
  - Prevents resource card hoarding, mitigates robber penalties, and keeps all 8 players actively engaged between turns.

### 2. 🌲 Stylized Low-Poly 3D Visuals (R3F)
- **Procedural 3D Biome Hexes**:
  - **Forest (Wood)**: Tiered pine trees with stylized conical foliage.
  - **Hills (Brick)**: Terracotta clay bluffs with quarry rock formations.
  - **Fields (Wheat)**: Golden crop furrows with low-poly hay bales.
  - **Pasture (Wool)**: Lush green meadows with 3D sheep figures.
  - **Mountains (Ore)**: Jagged peaks with snow-capped summits.
  - **Desert**: Sandy dunes with dried bone & cactus details.
  - **Ocean**: Stylized translucent water base surrounding the island.
- **3D Number Tokens**: Raised parchment discs with red high-probability markers (6 & 8) and probability pip dots.
- **Robber Bandit Miniature**: Stylized hooded figurine with glowing red eyes.
- **Interactive 3D Pieces**:
  - **Settlements**: Low-poly cottage cottages with gable roofs and chimneys.
  - **Cities**: Fortified citadel castles with corner towers and battlements.
  - **Roads**: Chamfered timber beams oriented along the hex edges.
  - **Ghost Previews**: Semi-transparent, glowing previews show valid placement locations on hover.
  - **Custom GLTF Pipeline**: Ready to drop in external `.glb` models as replacements for procedural meshes.

### 3. ⚙️ Real-time Authoritative Game Engine (Colyseus)
- **Turn Phases**:
  - Lobby Gathering & Color Selection
  - Snake Draft Placement (Setup Round 1 forward, Round 2 reverse with starting resource distribution)
  - Dice Roll (2d6) & Resource Allocation
  - Robber Mechanics (discards for hands > 7 cards, moving robber, stealing)
  - Trading (4:1 Bank Trade and 3:1 / 2:1 Coastal Harbor discounts)
  - Development Cards (Knight, Year of Plenty, Road Building, Monopoly, Victory Points)
  - Longest Road & Largest Army dynamic tracking (+2 VP each)
  - Special Building Phase for 5-8 players
  - 10 VP Victory celebration with confetti animations

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v22)
- npm v9+

### Installation
From the root directory:
```bash
# Install dependencies for both server and client
npm run install:all
```

### Running Locally

You can launch both server and client in separate terminals:

#### Terminal 1 (Colyseus Server):
```bash
npm run dev:server
```
*Server runs on `ws://localhost:2567` (WebSocket + HTTP).*

#### Terminal 2 (R3F Client):
```bash
npm run dev:client
```
*Vite client runs on `http://localhost:5173`.*

---

## 🎮 How to Test Multiplayer (4-8 Players)

1. Open `http://localhost:5173` in your browser.
2. Enter a settler name, choose your color, and select **4, 6, or 8 players**.
3. Open 1 or more **Incognito tabs** or separate browser windows to `http://localhost:5173`.
4. Enter unique names and pick colors for each settler.
5. In the host window, click **Start Game** once ready!
6. Enjoy placing settlements, rolling dice, building roads, and conquering the island in full 3D!
