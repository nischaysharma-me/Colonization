import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

export class ResourcesSchema extends Schema {
  @type('number') wood: number = 0;
  @type('number') brick: number = 0;
  @type('number') wheat: number = 0;
  @type('number') sheep: number = 0;
  @type('number') ore: number = 0;

  total(): number {
    return this.wood + this.brick + this.wheat + this.sheep + this.ore;
  }
}

export class DevCardsSchema extends Schema {
  @type('number') knight: number = 0;
  @type('number') victoryPoint: number = 0;
  @type('number') roadBuilding: number = 0;
  @type('number') yearOfPlenty: number = 0;
  @type('number') monopoly: number = 0;
}

export class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('string') color: string = 'red';
  @type('boolean') isReady: boolean = false;
  @type('boolean') isConnected: boolean = true;
  @type('number') victoryPoints: number = 0;
  @type(ResourcesSchema) resources: ResourcesSchema = new ResourcesSchema();
  @type(DevCardsSchema) devCards: DevCardsSchema = new DevCardsSchema();
  @type('number') playedKnights: number = 0;
  @type('number') roadCount: number = 0;
  @type('number') settlementCount: number = 0;
  @type('number') cityCount: number = 0;
  @type('boolean') hasLongestRoad: boolean = false;
  @type('boolean') hasLargestArmy: boolean = false;
}

export class HexTileSchema extends Schema {
  @type('string') id: string = '';
  @type('number') q: number = 0;
  @type('number') r: number = 0;
  @type('string') type: string = 'desert';
  @type('number') number: number = 0;
  @type('boolean') hasRobber: boolean = false;
  @type('number') x: number = 0;
  @type('number') z: number = 0;
  @type('string') harborType: string = '';
  @type('number') harborRotation: number = 0;
}

export class VertexSchema extends Schema {
  @type('string') id: string = '';
  @type('number') x: number = 0;
  @type('number') z: number = 0;
  @type('string') ownerId: string = '';
  @type('string') buildingType: string = ''; // 'settlement' | 'city'
}

export class EdgeSchema extends Schema {
  @type('string') id: string = '';
  @type('string') vertexA: string = '';
  @type('string') vertexB: string = '';
  @type('number') x: number = 0;
  @type('number') z: number = 0;
  @type('number') rotation: number = 0;
  @type('string') ownerId: string = '';
}

export class LogMessageSchema extends Schema {
  @type('string') id: string = '';
  @type('string') text: string = '';
  @type('number') timestamp: number = 0;
  @type('string') color: string = '';
}

export class GameStateSchema extends Schema {
  @type('string') phase: string = 'LOBBY';
  @type('number') turnIndex: number = 0;
  @type('string') activePlayerId: string = '';
  @type('number') specialBuildIndex: number = -1; // -1 if not in special build phase
  @type('number') dice1: number = 1;
  @type('number') dice2: number = 1;
  @type('string') robberHexId: string = '';
  @type('number') maxPlayers: number = 4;
  @type('string') winnerId: string = '';

  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type(['string']) turnOrder = new ArraySchema<string>();
  @type({ map: HexTileSchema }) hexes = new MapSchema<HexTileSchema>();
  @type({ map: VertexSchema }) vertices = new MapSchema<VertexSchema>();
  @type({ map: EdgeSchema }) edges = new MapSchema<EdgeSchema>();
  @type([LogMessageSchema]) logs = new ArraySchema<LogMessageSchema>();
}
