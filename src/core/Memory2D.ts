import { Cell, CellKind, IVec2, Operation } from './types';

export class Memory2D {
  private grid: Array<Array<Cell>> = [
    [
      { kind: CellKind.Code, entry: { instr: { kind: Operation.Nop } } },
      { kind: CellKind.Data, data: 0 },
      { kind: CellKind.Data, data: 1 },
      { kind: CellKind.Data, data: 2 },
      { kind: CellKind.Data, data: 3 },
      { kind: CellKind.Data, data: 4 },
      { kind: CellKind.Data, data: 5 },
      { kind: CellKind.Data, data: 6 },
      { kind: CellKind.Data, data: 7 },
      { kind: CellKind.Data, data: 8 },
      { kind: CellKind.Data, data: 9 },
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
