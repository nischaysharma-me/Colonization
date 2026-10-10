import { Room, Client } from 'colyseus';
import { 
  GameStateSchema, 
  PlayerSchema, 
  HexTileSchema, 
  VertexSchema, 
  EdgeSchema, 
  LogMessageSchema 
} from '../schema/GameState.js';
import { generateBoard } from '../game/boardGenerator.js';
import { 
  BoardConfig, 
  BUILDING_COSTS, 
  COLOR_ORDER, 
  DevCardType, 
  PlayerColor, 
  ResourceType 
} from '../shared/types.js';

export class CatanRoom extends Room<GameStateSchema> {
  maxClients = 8;
  boardConfig!: BoardConfig;
  discardQueue: Set<string> = new Set();
  devCardDeck: DevCardType[] = [];
  lastPlacedVertexForPlayer: Map<string, string> = new Map(); // For setup phase road adjacency check

  onCreate(options: { maxPlayers?: number; roomId?: string }) {
    const maxPlayers = Math.min(8, Math.max(4, options.maxPlayers || 4));
    this.maxClients = maxPlayers;

    const state = new GameStateSchema();
    state.maxPlayers = maxPlayers;
    this.setState(state);

    // Generate board based on player capacity
    this.initBoard(maxPlayers);
    this.initDevCardDeck();
    this.setupMessageHandlers();
  }

  initDevCardDeck() {
    const baseCards: DevCardType[] = [
      ...Array(14).fill('knight'),
      ...Array(5).fill('victoryPoint'),
      ...Array(2).fill('roadBuilding'),
      ...Array(2).fill('yearOfPlenty'),
      ...Array(2).fill('monopoly')
    ];
    if (this.state.maxPlayers > 4) {
      // 5-8 players add extra cards
      baseCards.push(
        ...Array(6).fill('knight'),
        ...Array(2).fill('victoryPoint'),
        ...Array(1).fill('roadBuilding'),
        ...Array(1).fill('yearOfPlenty'),
        ...Array(1).fill('monopoly')
      );
    }
    // Shuffle
    this.devCardDeck = baseCards.sort(() => Math.random() - 0.5);
  }

  initBoard(maxPlayers: number) {
    this.boardConfig = generateBoard(maxPlayers);

    // Populate Hexes
    this.boardConfig.hexes.forEach(h => {
      const hex = new HexTileSchema();
      hex.id = h.id;
      hex.q = h.q;
      hex.r = h.r;
      hex.type = h.type;
      hex.number = h.number || 0;
      hex.hasRobber = h.hasRobber;
      hex.x = h.x;
      hex.z = h.z;
      if (h.harbor) {
        hex.harborType = h.harbor.type;
        hex.harborRotation = h.harbor.rotation;
      }
      this.state.hexes.set(h.id, hex);
      if (h.hasRobber) {
        this.state.robberHexId = h.id;
      }
    });

    // Populate Vertices
    Object.values(this.boardConfig.vertices).forEach(v => {
      const vertex = new VertexSchema();
      vertex.id = v.id;
      vertex.x = v.x;
      vertex.z = v.z;
      vertex.ownerId = '';
      vertex.buildingType = '';
      this.state.vertices.set(v.id, vertex);
    });

    // Populate Edges
    Object.values(this.boardConfig.edges).forEach(e => {
      const edge = new EdgeSchema();
      edge.id = e.id;
      edge.vertexA = e.vertexA;
      edge.vertexB = e.vertexB;
      edge.x = e.x;
      edge.z = e.z;
      edge.rotation = e.rotation;
      edge.ownerId = '';
      this.state.edges.set(e.id, edge);
    });
  }

  onJoin(client: Client, options: { name?: string; color?: PlayerColor }) {
    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.name = options.name || `Player ${this.state.players.size + 1}`;

    // Pick first free color
    const takenColors = Array.from(this.state.players.values()).map(p => p.color);
    const availableColor = COLOR_ORDER.find(c => !takenColors.includes(c)) || 'red';
    player.color = options.color && !takenColors.includes(options.color) ? options.color : availableColor;

    this.state.players.set(client.sessionId, player);
    this.addLog(`${player.name} joined the game.`, player.color);

    // If lobby full and everyone ready, or auto ready
    if (this.state.players.size === 1) {
      player.isReady = true; // Host ready by default
    }

    client.send('init_board', this.boardConfig);
    client.send('game_state', this.getGameStatePayload());
    this.broadcastGameState();
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    player.isConnected = false;
    this.addLog(`${player.name} disconnected.`, player.color);

    if (this.state.phase === 'LOBBY') {
      this.state.players.delete(client.sessionId);
    } else {
      try {
        await this.allowReconnection(client, 60);
        player.isConnected = true;
        this.addLog(`${player.name} reconnected!`, player.color);
      } catch (e) {
        this.addLog(`${player.name} left permanently.`, player.color);
      }
    }
  }

  addLog(text: string, color: string = '#cbd5e1') {
    const log = new LogMessageSchema();
    log.id = `log_${Date.now()}_${Math.random()}`;
    log.text = text;
    log.timestamp = Date.now();
    log.color = color;
    this.state.logs.push(log);
    if (this.state.logs.length > 50) {
      this.state.logs.shift();
    }
    this.broadcastGameState();
  }

  getGameStatePayload() {
    const buildings: Record<string, { ownerId: string; buildingType: string }> = {};
    this.state.vertices.forEach(v => {
      if (v.ownerId) {
        buildings[v.id] = { ownerId: v.ownerId, buildingType: v.buildingType };
      }
    });

    const roads: Record<string, string> = {};
    this.state.edges.forEach(e => {
      if (e.ownerId) {
        roads[e.id] = e.ownerId;
      }
    });

    return {
      phase: this.state.phase,
      turnIndex: this.state.turnIndex,
      activePlayerId: this.state.activePlayerId,
      specialBuildIndex: this.state.specialBuildIndex,
      dice1: this.state.dice1,
      dice2: this.state.dice2,
      robberHexId: this.state.robberHexId,
      maxPlayers: this.state.maxPlayers,
      winnerId: this.state.winnerId,
      turnOrder: Array.from(this.state.turnOrder),
      players: Array.from(this.state.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isReady: p.isReady,
        isConnected: p.isConnected,
        victoryPoints: p.victoryPoints,
        roadCount: p.roadCount,
        settlementCount: p.settlementCount,
        cityCount: p.cityCount,
        hasLongestRoad: p.hasLongestRoad,
        hasLargestArmy: p.hasLargestArmy,
        resources: {
          wood: p.resources.wood,
          brick: p.resources.brick,
          wheat: p.resources.wheat,
          sheep: p.resources.sheep,
          ore: p.resources.ore,
        },
        devCards: {
          knight: p.devCards.knight,
          victoryPoint: p.devCards.victoryPoint,
          roadBuilding: p.devCards.roadBuilding,
          yearOfPlenty: p.devCards.yearOfPlenty,
          monopoly: p.devCards.monopoly,
        }
      })),
      buildings,
      roads,
      logs: Array.from(this.state.logs).filter(Boolean).map(l => ({
        id: l!.id,
        text: l!.text,
        color: l!.color,
        timestamp: l!.timestamp,
      }))
    };
  }

  broadcastGameState() {
    this.broadcast('game_state', this.getGameStatePayload());
  }

  setupMessageHandlers() {
    this.onMessage('request_sync', (client) => {
      client.send('init_board', this.boardConfig);
      client.send('game_state', this.getGameStatePayload());
    });

    this.onMessage('toggle_ready', (client) => {
      const p = this.state.players.get(client.sessionId);
      if (p && this.state.phase === 'LOBBY') {
        p.isReady = !p.isReady;
        this.broadcastGameState();
      }
    });

    this.onMessage('change_color', (client, color: PlayerColor) => {
      const p = this.state.players.get(client.sessionId);
      if (p && this.state.phase === 'LOBBY') {
        const taken = Array.from(this.state.players.values()).some(other => other.id !== client.sessionId && other.color === color);
        if (!taken && COLOR_ORDER.includes(color)) {
          p.color = color;
          this.broadcastGameState();
        }
      }
    });

    this.onMessage('start_game', (client) => {
      if (this.state.phase !== 'LOBBY') return;
      if (this.state.players.size < 1) {
        client.send('error', 'Need at least 1 player to start');
        return;
      }

      // Initialize turn order
      const playerIds = Array.from(this.state.players.keys()).sort(() => Math.random() - 0.5);
      this.state.turnOrder.clear();
      playerIds.forEach(id => this.state.turnOrder.push(id));

      this.state.turnIndex = 0;
      this.state.activePlayerId = this.state.turnOrder[0] || '';
      this.state.phase = 'SETUP_1';

      const activePlayer = this.state.players.get(this.state.activePlayerId);
      this.addLog(`Game started! ${activePlayer?.name}'s turn to place first settlement and road.`);
    });

    this.onMessage('roll_dice', (client) => {
      if (this.state.phase !== 'ROLL' || client.sessionId !== this.state.activePlayerId) return;

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      this.state.dice1 = d1;
      this.state.dice2 = d2;
      const total = d1 + d2;

      const activePlayer = this.state.players.get(client.sessionId);
      this.addLog(`${activePlayer?.name} rolled ${total} (${d1} + ${d2}).`, activePlayer?.color);

      if (total === 7) {
        // Robber triggered! Check discards for players with > 7 cards
        this.discardQueue.clear();
        this.state.players.forEach(p => {
          if (p.resources.total() > 7) {
            this.discardQueue.add(p.id);
          }
        });

        if (this.discardQueue.size > 0) {
          this.state.phase = 'ROBBER_DISCARD';
          this.addLog(`Robber active! Players with over 7 cards must discard half.`);
        } else {
          this.state.phase = 'ROBBER_MOVE';
          this.addLog(`${activePlayer?.name} must move the robber.`);
        }
      } else {
        // Distribute resources
        this.distributeResources(total);
        this.state.phase = 'MAIN';
      }
    });

    this.onMessage('discard_cards', (client, discard: Partial<Record<ResourceType, number>>) => {
      if (this.state.phase !== 'ROBBER_DISCARD') return;
      if (!this.discardQueue.has(client.sessionId)) return;

      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const totalCards = player.resources.total();
      const required = Math.floor(totalCards / 2);

      let count = 0;
      for (const [res, qty] of Object.entries(discard) as [ResourceType, number][]) {
        if (qty > 0 && player.resources[res] >= qty) {
          count += qty;
        }
      }

      if (count !== required) {
        client.send('error', `You must discard exactly ${required} cards.`);
        return;
      }

      // Deduct resources
      for (const [res, qty] of Object.entries(discard) as [ResourceType, number][]) {
        if (qty > 0) player.resources[res] -= qty;
      }

      this.discardQueue.delete(client.sessionId);
      this.addLog(`${player.name} discarded ${required} resources.`);

      if (this.discardQueue.size === 0) {
        this.state.phase = 'ROBBER_MOVE';
        const active = this.state.players.get(this.state.activePlayerId);
        this.addLog(`${active?.name} must move the robber.`);
      }
    });

    this.onMessage('move_robber', (client, hexId: string) => {
      if (this.state.phase !== 'ROBBER_MOVE' || client.sessionId !== this.state.activePlayerId) return;
      if (hexId === this.state.robberHexId) {
        client.send('error', 'Must move robber to a different tile.');
        return;
      }

      const currentHex = this.state.hexes.get(this.state.robberHexId);
      if (currentHex) currentHex.hasRobber = false;

      const newHex = this.state.hexes.get(hexId);
      if (!newHex) return;
      newHex.hasRobber = true;
      this.state.robberHexId = hexId;

      // Find adjacent players who can be robbed
      const victimIds = this.getRobbablePlayers(hexId, client.sessionId);
      if (victimIds.length > 0) {
        this.state.phase = 'ROBBER_STEAL';
        client.send('select_victim', { victimIds });
      } else {
        this.state.phase = 'MAIN';
      }
      this.addLog(`${this.state.players.get(client.sessionId)?.name} moved the Robber.`);
    });

    this.onMessage('steal_card', (client, victimId: string) => {
      if (this.state.phase !== 'ROBBER_STEAL' || client.sessionId !== this.state.activePlayerId) return;

      const thief = this.state.players.get(client.sessionId);
      const victim = this.state.players.get(victimId);
      if (!thief || !victim || victim.resources.total() === 0) {
        this.state.phase = 'MAIN';
        return;
      }

      // Collect all cards into an array to pick random
      const pool: ResourceType[] = [];
      (['wood', 'brick', 'wheat', 'sheep', 'ore'] as ResourceType[]).forEach(r => {
        for (let i = 0; i < victim.resources[r]; i++) pool.push(r);
      });

      if (pool.length > 0) {
        const stolen = pool[Math.floor(Math.random() * pool.length)];
        victim.resources[stolen]--;
        thief.resources[stolen]++;
        this.addLog(`${thief.name} stole a card from ${victim.name}.`);
      }

      this.state.phase = 'MAIN';
    });

    this.onMessage('build_settlement', (client, vertexId: string) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const isSetup = this.state.phase === 'SETUP_1' || this.state.phase === 'SETUP_2';
      const isSpecialBuild = this.state.phase === 'SPECIAL_BUILD';
      const isMain = this.state.phase === 'MAIN';

      if (isSetup && client.sessionId !== this.state.activePlayerId) return;
      if (isMain && client.sessionId !== this.state.activePlayerId) return;
      if (isSpecialBuild && client.sessionId !== this.getCurrentSpecialBuilderId()) return;

      const vertex = this.state.vertices.get(vertexId);
      if (!vertex || vertex.ownerId) {
        client.send('error', 'Vertex occupied or invalid.');
        return;
      }

      // Check distance rule: adjacent vertices must not have buildings
      const vData = this.boardConfig.vertices[vertexId];
      if (!vData) return;
      for (const adjVId of vData.adjacentVertexIds) {
        const adjV = this.state.vertices.get(adjVId);
        if (adjV && adjV.ownerId) {
          client.send('error', 'Distance rule violation: settlements must be at least 2 edges apart.');
          return;
        }
      }

      // In main game / special build, settlement must connect to player's road
      if (!isSetup) {
        const hasConnectedRoad = vData.adjacentEdgeIds.some(eId => {
          const edge = this.state.edges.get(eId);
          return edge && edge.ownerId === client.sessionId;
        });
        if (!hasConnectedRoad) {
          client.send('error', 'Settlement must connect to your existing road.');
          return;
        }

        // Check costs
        if (!this.canAfford(player, BUILDING_COSTS.settlement)) {
          client.send('error', 'Not enough resources for settlement.');
          return;
        }
        this.deductCost(player, BUILDING_COSTS.settlement);
      }

      // Place settlement
      vertex.ownerId = client.sessionId;
      vertex.buildingType = 'settlement';
      player.settlementCount++;
      player.victoryPoints++;
      this.lastPlacedVertexForPlayer.set(client.sessionId, vertexId);

      // In SETUP_2, give starting resources from adjacent tiles!
      if (this.state.phase === 'SETUP_2') {
        vData.hexIds.forEach(hId => {
          const hex = this.state.hexes.get(hId);
          if (hex && hex.type !== 'desert' && hex.type !== 'water') {
            player.resources[hex.type as ResourceType]++;
          }
        });
      }

      this.addLog(`${player.name} built a settlement.`, player.color);
      this.checkVictory(player);
    });

    this.onMessage('build_city', (client, vertexId: string) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const isSpecialBuild = this.state.phase === 'SPECIAL_BUILD';
      const isMain = this.state.phase === 'MAIN';
      if (isMain && client.sessionId !== this.state.activePlayerId) return;
      if (isSpecialBuild && client.sessionId !== this.getCurrentSpecialBuilderId()) return;

      const vertex = this.state.vertices.get(vertexId);
      if (!vertex || vertex.ownerId !== client.sessionId || vertex.buildingType !== 'settlement') {
        client.send('error', 'Must upgrade your own settlement to a city.');
        return;
      }

      if (!this.canAfford(player, BUILDING_COSTS.city)) {
        client.send('error', 'Not enough resources for city (2 Wheat, 3 Ore).');
        return;
      }

      this.deductCost(player, BUILDING_COSTS.city);
      vertex.buildingType = 'city';
      player.settlementCount--;
      player.cityCount++;
      player.victoryPoints++;

      this.addLog(`${player.name} upgraded a settlement to a City!`, player.color);
      this.checkVictory(player);
    });

    this.onMessage('build_road', (client, edgeId: string) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const isSetup = this.state.phase === 'SETUP_1' || this.state.phase === 'SETUP_2';
      const isSpecialBuild = this.state.phase === 'SPECIAL_BUILD';
      const isMain = this.state.phase === 'MAIN';

      if (isSetup && client.sessionId !== this.state.activePlayerId) return;
      if (isMain && client.sessionId !== this.state.activePlayerId) return;
      if (isSpecialBuild && client.sessionId !== this.getCurrentSpecialBuilderId()) return;

      const edge = this.state.edges.get(edgeId);
      if (!edge || edge.ownerId) {
        client.send('error', 'Edge is already occupied.');
        return;
      }

      const eData = this.boardConfig.edges[edgeId];
      if (!eData) return;

      if (isSetup) {
        // Must connect to the settlement just placed
        const lastVertexId = this.lastPlacedVertexForPlayer.get(client.sessionId);
        if (eData.vertexA !== lastVertexId && eData.vertexB !== lastVertexId) {
          client.send('error', 'Road must connect to your recently placed settlement.');
          return;
        }
      } else {
        // Connect to existing road or settlement/city
        const connects = 
          this.state.vertices.get(eData.vertexA)?.ownerId === client.sessionId ||
          this.state.vertices.get(eData.vertexB)?.ownerId === client.sessionId ||
          this.boardConfig.vertices[eData.vertexA]?.adjacentEdgeIds.some(id => this.state.edges.get(id)?.ownerId === client.sessionId) ||
          this.boardConfig.vertices[eData.vertexB]?.adjacentEdgeIds.some(id => this.state.edges.get(id)?.ownerId === client.sessionId);

        if (!connects) {
          client.send('error', 'Road must connect to your existing road or settlement.');
          return;
        }

        if (!this.canAfford(player, BUILDING_COSTS.road)) {
          client.send('error', 'Not enough resources for road (1 Wood, 1 Brick).');
          return;
        }
        this.deductCost(player, BUILDING_COSTS.road);
      }

      edge.ownerId = client.sessionId;
      player.roadCount++;
      this.addLog(`${player.name} built a road.`, player.color);

      // Check Longest Road
      this.recalculateLongestRoad();

      // If in setup phase, advance turn immediately after road placement!
      if (isSetup) {
        this.advanceSetupTurn();
      }
    });

    this.onMessage('buy_dev_card', (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (client.sessionId !== this.state.activePlayerId && this.state.phase !== 'SPECIAL_BUILD') return;

      if (this.devCardDeck.length === 0) {
        client.send('error', 'No development cards remaining.');
        return;
      }

      if (!this.canAfford(player, BUILDING_COSTS.devCard)) {
        client.send('error', 'Not enough resources (1 Ore, 1 Wheat, 1 Sheep).');
        return;
      }

      this.deductCost(player, BUILDING_COSTS.devCard);
      const card = this.devCardDeck.pop()!;
      player.devCards[card]++;

      if (card === 'victoryPoint') {
        player.victoryPoints++;
        this.checkVictory(player);
      }

      this.addLog(`${player.name} bought a Development Card.`, player.color);
    });

    this.onMessage('play_dev_card', (client, data: { card: DevCardType; params?: any }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || client.sessionId !== this.state.activePlayerId || this.state.phase !== 'MAIN') return;

      if (player.devCards[data.card] <= 0) return;

      if (data.card === 'knight') {
        player.devCards.knight--;
        player.playedKnights++;
        this.state.phase = 'ROBBER_MOVE';
        this.addLog(`${player.name} played a Knight!`, player.color);
        this.recalculateLargestArmy();
      } else if (data.card === 'yearOfPlenty') {
        const { res1, res2 } = data.params || {};
        if (res1 && res2) {
          player.devCards.yearOfPlenty--;
          player.resources[res1 as ResourceType]++;
          player.resources[res2 as ResourceType]++;
          this.addLog(`${player.name} played Year of Plenty (+${res1}, +${res2}).`, player.color);
        }
      } else if (data.card === 'monopoly') {
        const targetRes = data.params?.resource as ResourceType;
        if (targetRes) {
          player.devCards.monopoly--;
          let totalTaken = 0;
          this.state.players.forEach(p => {
            if (p.id !== client.sessionId && p.resources[targetRes] > 0) {
              totalTaken += p.resources[targetRes];
              p.resources[targetRes] = 0;
            }
          });
          player.resources[targetRes] += totalTaken;
          this.addLog(`${player.name} declared Monopoly on ${targetRes} and took ${totalTaken}!`, player.color);
        }
      }
    });

    this.onMessage('bank_trade', (client, data: { give: ResourceType; receive: ResourceType }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (client.sessionId !== this.state.activePlayerId && this.state.phase !== 'SPECIAL_BUILD') return;

      const rate = this.getPlayerTradeRate(client.sessionId, data.give);
      if (player.resources[data.give] < rate) {
        client.send('error', `You need ${rate} ${data.give} to trade with bank.`);
        return;
      }

      player.resources[data.give] -= rate;
      player.resources[data.receive]++;
      this.addLog(`${player.name} traded ${rate} ${data.give} for 1 ${data.receive} with Bank.`);
    });

    this.onMessage('end_turn', (client) => {
      if (client.sessionId !== this.state.activePlayerId || this.state.phase !== 'MAIN') return;

      // In 5-8 players, initiate Special Building Phase before passing turn to next player
      if (this.state.maxPlayers >= 5) {
        this.state.phase = 'SPECIAL_BUILD';
        this.state.specialBuildIndex = 0; // Starts from player clockwise after active
        this.addLog(`Special Building Phase begins.`);
      } else {
        this.nextTurn();
      }
    });

    this.onMessage('pass_special_build', (client) => {
      if (this.state.phase !== 'SPECIAL_BUILD') return;
      if (client.sessionId !== this.getCurrentSpecialBuilderId()) return;

      this.advanceSpecialBuild();
    });
  }

  getCurrentSpecialBuilderId(): string {
    const activeIdx = this.state.turnOrder.indexOf(this.state.activePlayerId);
    const targetIdx = (activeIdx + 1 + this.state.specialBuildIndex) % this.state.turnOrder.length;
    return this.state.turnOrder[targetIdx] || '';
  }

  advanceSpecialBuild() {
    this.state.specialBuildIndex++;
    // If every other player has had their special build turn:
    if (this.state.specialBuildIndex >= this.state.turnOrder.length - 1) {
      this.state.specialBuildIndex = -1;
      this.nextTurn();
    }
  }

  nextTurn() {
    this.state.turnIndex = (this.state.turnIndex + 1) % this.state.turnOrder.length;
    this.state.activePlayerId = this.state.turnOrder[this.state.turnIndex] || '';
    this.state.phase = 'ROLL';

    const nextPlayer = this.state.players.get(this.state.activePlayerId);
    this.addLog(`Turn begins for ${nextPlayer?.name}. Roll dice!`, nextPlayer?.color);
  }

  advanceSetupTurn() {
    if (this.state.phase === 'SETUP_1') {
      if (this.state.turnIndex < this.state.turnOrder.length - 1) {
        this.state.turnIndex++;
        this.state.activePlayerId = this.state.turnOrder[this.state.turnIndex] || '';
        const next = this.state.players.get(this.state.activePlayerId);
        this.addLog(`${next?.name}'s turn for first settlement & road.`, next?.color);
      } else {
        // Transition to SETUP_2 (Snake draft in reverse order)
        this.state.phase = 'SETUP_2';
        // Active player remains the last player for their 2nd placement
        const next = this.state.players.get(this.state.activePlayerId);
        this.addLog(`Round 2 Setup! ${next?.name} places second settlement & road (receives starting resources!).`, next?.color);
      }
    } else if (this.state.phase === 'SETUP_2') {
      if (this.state.turnIndex > 0) {
        this.state.turnIndex--;
        this.state.activePlayerId = this.state.turnOrder[this.state.turnIndex] || '';
        const next = this.state.players.get(this.state.activePlayerId);
        this.addLog(`${next?.name}'s turn for second settlement & road.`, next?.color);
      } else {
        // Setup complete! Start main game loop at player 0
        this.state.phase = 'ROLL';
        this.state.turnIndex = 0;
        this.state.activePlayerId = this.state.turnOrder[0] || '';
        const p0 = this.state.players.get(this.state.activePlayerId);
        this.addLog(`Setup finished! Main game begins. ${p0?.name}, roll the dice!`, p0?.color);
      }
    }
  }

  distributeResources(diceTotal: number) {
    this.state.hexes.forEach(hex => {
      if (hex.number === diceTotal && !hex.hasRobber && hex.type !== 'desert' && hex.type !== 'water') {
        const hexData = this.boardConfig.hexes.find(h => h.id === hex.id);
        if (!hexData) return;

        // Find vertices on this hex
        Object.values(this.boardConfig.vertices).forEach(v => {
          if (v.hexIds.includes(hex.id)) {
            const vState = this.state.vertices.get(v.id);
            if (vState && vState.ownerId) {
              const player = this.state.players.get(vState.ownerId);
              if (player) {
                const yieldAmount = vState.buildingType === 'city' ? 2 : 1;
                player.resources[hex.type as ResourceType] += yieldAmount;
                this.addLog(`${player.name} received +${yieldAmount} ${hex.type}.`, player.color);
              }
            }
          }
        });
      }
    });
  }

  getRobbablePlayers(hexId: string, activePlayerId: string): string[] {
    const victims = new Set<string>();
    Object.values(this.boardConfig.vertices).forEach(v => {
      if (v.hexIds.includes(hexId)) {
        const vState = this.state.vertices.get(v.id);
        if (vState && vState.ownerId && vState.ownerId !== activePlayerId) {
          const victim = this.state.players.get(vState.ownerId);
          if (victim && victim.resources.total() > 0) {
            victims.add(vState.ownerId);
          }
        }
      }
    });
    return Array.from(victims);
  }

  getPlayerTradeRate(playerId: string, resource: ResourceType): number {
    let rate = 4; // Default bank trade rate
    // Check if player has a harbor
    this.boardConfig.hexes.forEach(h => {
      if (h.harbor) {
        const vA = this.state.vertices.get(h.harbor.vertexA);
        const vB = this.state.vertices.get(h.harbor.vertexB);
        const owns = (vA && vA.ownerId === playerId) || (vB && vB.ownerId === playerId);
        if (owns) {
          if (h.harbor.type === resource) rate = Math.min(rate, 2);
          if (h.harbor.type === 'threeToOne') rate = Math.min(rate, 3);
        }
      }
    });
    return rate;
  }

  recalculateLongestRoad() {
    let max = 4; // Threshold is 5
    let leaderId = '';
    this.state.players.forEach(p => {
      if (p.roadCount > max) {
        max = p.roadCount;
        leaderId = p.id;
      }
    });

    this.state.players.forEach(p => {
      if (p.id === leaderId && !p.hasLongestRoad) {
        p.hasLongestRoad = true;
        p.victoryPoints += 2;
        this.addLog(`${p.name} claimed Longest Road! (+2 VP)`, p.color);
      } else if (p.id !== leaderId && p.hasLongestRoad) {
        p.hasLongestRoad = false;
        p.victoryPoints -= 2;
      }
    });
  }

  recalculateLargestArmy() {
    let max = 2; // Threshold is 3
    let leaderId = '';
    this.state.players.forEach(p => {
      if (p.playedKnights > max) {
        max = p.playedKnights;
        leaderId = p.id;
      }
    });

    this.state.players.forEach(p => {
      if (p.id === leaderId && !p.hasLargestArmy) {
        p.hasLargestArmy = true;
        p.victoryPoints += 2;
        this.addLog(`${p.name} claimed Largest Army! (+2 VP)`, p.color);
      } else if (p.id !== leaderId && p.hasLargestArmy) {
        p.hasLargestArmy = false;
        p.victoryPoints -= 2;
      }
    });
  }

  canAfford(player: PlayerSchema, cost: Partial<Record<ResourceType, number>>): boolean {
    for (const [res, count] of Object.entries(cost) as [ResourceType, number][]) {
      if (player.resources[res] < (count || 0)) return false;
    }
    return true;
  }

  deductCost(player: PlayerSchema, cost: Partial<Record<ResourceType, number>>) {
    for (const [res, count] of Object.entries(cost) as [ResourceType, number][]) {
      player.resources[res] -= count || 0;
    }
  }

  checkVictory(player: PlayerSchema) {
    if (player.victoryPoints >= 10 && !this.state.winnerId) {
      this.state.winnerId = player.id;
      this.state.phase = 'GAME_OVER';
      this.addLog(`VICTORY! ${player.name} reached 10 Victory Points and colonized the island!`, player.color);
    }
  }
}
