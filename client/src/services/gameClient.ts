import { Client, Room } from 'colyseus.js';
import { PlayerColor, ResourceType, DevCardType } from '../shared/types.js';
import { GameStateSchema } from '../schema/GameState.js';

// Colyseus WebSocket endpoint
const WS_ENDPOINT = window.location.hostname === 'localhost' 
  ? 'ws://localhost:2567' 
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/colyseus`;

export class GameClientService {
  private client: Client;
  public room: Room<GameStateSchema> | null = null;
  public onStateChangeCallback: ((state: GameStateSchema) => void) | null = null;
  public onInitBoardCallback: ((boardConfig: any) => void) | null = null;
  public onGameStateCallback: ((state: any) => void) | null = null;
  public onErrorCallback: ((error: string) => void) | null = null;
  public onVictimSelectCallback: ((victimIds: string[]) => void) | null = null;

  constructor() {
    this.client = new Client(WS_ENDPOINT);
  }

  async joinOrCreateRoom(options: { 
    name: string; 
    color: PlayerColor; 
    maxPlayers?: number;
    roomId?: string;
  }): Promise<Room<GameStateSchema>> {
    try {
      if (options.roomId) {
        this.room = await this.client.joinById<GameStateSchema>(options.roomId, options, GameStateSchema);
      } else {
        this.room = await this.client.joinOrCreate<GameStateSchema>('catan', options, GameStateSchema);
      }

      this.room.onMessage('init_board', (config) => {
        if (this.onInitBoardCallback) {
          this.onInitBoardCallback(config);
        }
      });

      this.room.onMessage('game_state', (state) => {
        if (this.onGameStateCallback) {
          this.onGameStateCallback(state);
        }
      });

      this.room.onStateChange((state) => {
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback(state);
        }
      });

      this.room.onMessage('error', (message: string) => {
        if (this.onErrorCallback) {
          this.onErrorCallback(message);
        }
      });

      this.room.onMessage('select_victim', (data: { victimIds: string[] }) => {
        if (this.onVictimSelectCallback) {
          this.onVictimSelectCallback(data.victimIds);
        }
      });

      return this.room;
    } catch (err: any) {
      console.error('Failed to join or create room:', err);
      throw err;
    }
  }

  toggleReady() {
    this.room?.send('toggle_ready');
  }

  changeColor(color: PlayerColor) {
    this.room?.send('change_color', color);
  }

  startGame() {
    this.room?.send('start_game');
  }

  rollDice() {
    this.room?.send('roll_dice');
  }

  buildSettlement(vertexId: string) {
    this.room?.send('build_settlement', vertexId);
  }

  buildCity(vertexId: string) {
    this.room?.send('build_city', vertexId);
  }

  buildRoad(edgeId: string) {
    this.room?.send('build_road', edgeId);
  }

  buyDevCard() {
    this.room?.send('buy_dev_card');
  }

  playDevCard(card: DevCardType, params?: any) {
    this.room?.send('play_dev_card', { card, params });
  }

  bankTrade(give: ResourceType, receive: ResourceType) {
    this.room?.send('bank_trade', { give, receive });
  }

  moveRobber(hexId: string) {
    this.room?.send('move_robber', hexId);
  }

  stealCard(victimId: string) {
    this.room?.send('steal_card', victimId);
  }

  discardCards(discard: Partial<Record<ResourceType, number>>) {
    this.room?.send('discard_cards', discard);
  }

  endTurn() {
    this.room?.send('end_turn');
  }

  passSpecialBuild() {
    this.room?.send('pass_special_build');
  }

  leave() {
    this.room?.leave();
    this.room = null;
  }
}

export const gameClient = new GameClientService();
