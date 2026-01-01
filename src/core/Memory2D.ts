import { Cell, CodeCell, DataCell, GridIndex, Operation } from './types';

export class Memory2D {
  private grid: Array<Array<Cell | undefined>> = [
    [
      new CodeCell({ instr: { kind: Operation.Nop } }),
      new DataCell(0),
      new DataCell(1),
      new DataCell(2),
      new DataCell(3),
      new DataCell(4),
      new DataCell(5),
      new DataCell(6),
      new DataCell(7),
      new DataCell(8),
      new DataCell(9),
    ],
  ];

  public readAt(coords: GridIndex): Cell | undefined {
    if (!this.grid[coords.i]) {
      this.grid[coords.i] = [];
    }
    return this.grid[coords.i]![coords.j];
  }

  public writeAt(coords: GridIndex, cell: Cell | undefined): void {
    if (!this.grid[coords.i]) {
      this.grid[coords.i] = [];
    }
    this.grid[coords.i]![coords.j] = cell;
  }
}
