import { Cell, CellKind, IVec2, Operation } from './types';

export class Memory2D {
  private grid: Array<Array<Cell>> = [
    [
      { kind: CellKind.Code, entry: { instr: { kind: Operation.Nop } } },
      { kind: CellKind.Data, data: 0 },
      { kind: CellKind.Data, data: 1 },
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
