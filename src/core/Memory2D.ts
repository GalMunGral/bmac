import { Address, AddressKind, Cell, CellKind } from './types';
import { assert } from './utils';

export class Memory2D {
  private grid: Array<Array<Cell>> = [
    [
      { kind: CellKind.Data, data: 0 },
      { kind: CellKind.Data, data: 1 },
      { kind: CellKind.Data, data: 10 },
    ],
  ];

  public readAt(i: number, j: number): Cell | undefined {
    if (!this.grid[i]) {
      this.grid[i] = [];
    }
    return this.grid[i][j];
  }

  public writeAt(i: number, j: number, cell: Cell): void {
    if (!this.grid[i]) {
      this.grid[i] = [];
    }
    this.grid[i][j] = cell;
  }

  public read(addr: Address): Cell | undefined {
    switch (addr.kind) {
      case AddressKind.DirectAddress: {
        return this.readAt(addr.coords.i, addr.coords.j);
      }
      case AddressKind.IndirectAddress: {
        const c = this.readAt(addr.coords.i, addr.coords.j);
        assert(c !== undefined && c.kind === CellKind.Address);
        return this.readAt(c.coords.i, c.coords.j);
      }
    }
  }

  public write(addr: Address, cell: Cell): void {
    switch (addr.kind) {
      case AddressKind.DirectAddress: {
        return this.writeAt(addr.coords.i, addr.coords.j, cell);
      }
      case AddressKind.IndirectAddress: {
        const c = this.readAt(addr.coords.i, addr.coords.j);
        assert(c !== undefined && c.kind === CellKind.Address);
        return this.writeAt(c.coords.i, c.coords.j, cell);
      }
    }
  }
}
