import { Address, AddressKind, AddressMode, Cell, CellKind, Coords2D } from './types';
import { assert } from './utils';

export class Memory2D {
  private grid: Array<Array<Cell>> = [
    [
      { kind: CellKind.Data, data: 0 },
      { kind: CellKind.Data, data: 1 },
      { kind: CellKind.Data, data: 10 },
    ],
  ];

  public readAt(coords: Coords2D): Cell | undefined {
    if (!this.grid[coords.i]) {
      this.grid[coords.i] = [];
    }
    return this.grid[coords.i]![coords.j];
  }

  public writeAt(coords: Coords2D, cell: Cell): void {
    if (!this.grid[coords.i]) {
      this.grid[coords.i] = [];
    }
    this.grid[coords.i]![coords.j] = cell;
  }

  public read(addr: Address): Cell | undefined {
    assert(addr.mode === AddressMode.Global);
    switch (addr.kind) {
      case AddressKind.DirectAddress: {
        return this.readAt(addr.coords);
      }
      case AddressKind.IndirectAddress: {
        const c = this.readAt(addr.coords);
        assert(c !== undefined && c.kind === CellKind.Address);
        return this.readAt(c.coords);
      }
    }
  }

  public write(addr: Address, cell: Cell): void {
    assert(addr.mode === AddressMode.Global);
    switch (addr.kind) {
      case AddressKind.DirectAddress: {
        return this.writeAt(addr.coords, cell);
      }
      case AddressKind.IndirectAddress: {
        const c = this.readAt(addr.coords);
        assert(c !== undefined && c.kind === CellKind.Address);
        return this.writeAt(c.coords, cell);
      }
    }
  }
}
