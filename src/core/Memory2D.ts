import { Cell, CellKind, IVec2 } from './types';

export class Memory2D {
  private grid: Array<Array<Cell>> = [
    [
      { kind: CellKind.Data, data: 0 },
      { kind: CellKind.Data, data: 1 },
      { kind: CellKind.Data, data: 10 },
    ],
  ];

  public readAt(coords: IVec2): Cell | undefined {
    if (!this.grid[coords.i]) {
      this.grid[coords.i] = [];
    }
    return this.grid[coords.i]![coords.j];
  }

  public writeAt(coords: IVec2, cell: Cell): void {
    if (!this.grid[coords.i]) {
      this.grid[coords.i] = [];
    }
    this.grid[coords.i]![coords.j] = cell;
  }
}
