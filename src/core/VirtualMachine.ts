import {
  Address,
  AddressKind,
  AddressMode,
  Cell,
  CellKind,
  ExecutionContext,
  IVec2,
  Operation,
} from './types';
import { assert } from './utils';
import { Memory2D } from './Memory2D';

export class VirtualMachine {
  public data = new Memory2D();
  public flag: boolean | undefined = undefined;

  public contexts = new Array<ExecutionContext>({
    origin: new IVec2(),
    prevInstruction: { instr: { kind: Operation.Nop } },
    currInstruction: { instr: { kind: Operation.Nop } },
  });

  public get currentContext() {
    const context = this.contexts[this.contexts.length - 1];
    assert(context !== undefined);
    return context;
  }

  public get origin(): IVec2 {
    return this.currentContext.origin;
  }

  public read(addr: Address): Cell | undefined {
    switch (addr.kind) {
      case AddressKind.DirectAddress: {
        return this.data.readAt(addr.toGlobal(this.origin).coords);
      }
      case AddressKind.IndirectAddress: {
        const c = this.data.readAt(addr.toGlobal(this.origin).coords);
        assert(c !== undefined && c.kind === CellKind.Address);
        return this.data.readAt(c.addr.toGlobal(this.origin).coords);
      }
    }
  }

  public write(addr: Address, cell: Cell): void {
    switch (addr.kind) {
      case AddressKind.DirectAddress: {
        return this.data.writeAt(addr.toGlobal(this.origin).coords, cell);
      }
      case AddressKind.IndirectAddress: {
        const c = this.data.readAt(addr.toGlobal(this.origin).coords);
        assert(c !== undefined && c.kind === CellKind.Address);
        return this.data.writeAt(c.addr.toGlobal(this.origin).coords, cell);
      }
    }
  }

  public execute(): boolean {
    const instr = this.currentContext.currInstruction.instr;
    this.currentContext.prevInstruction = this.currentContext.currInstruction;
    switch (instr.kind) {
      case Operation.Nop: {
        return false;
      }
      case Operation.Pointer: {
        this.data.writeAt(this.origin.add(instr.dst.coords), {
          kind: CellKind.Address,
          addr: instr.src,
        });
        this.flag = undefined;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.PointerIncrement: {
        const dstGlobalCoords = instr.dst.toGlobal(this.origin).coords;
        const addrCell = this.data.readAt(dstGlobalCoords);
        assert(addrCell !== undefined && addrCell.kind === CellKind.Address);
        const dataCell = this.read(instr.src);
        assert(dataCell !== undefined && dataCell.kind === CellKind.Data);
        this.data.writeAt(dstGlobalCoords, {
          kind: CellKind.Address,
          addr: addrCell.addr.add(new IVec2(0, Math.floor(dataCell.data))),
        });
        this.flag = undefined;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.Move: {
        const srcCell = this.read(instr.src);
        assert(srcCell !== undefined);
        this.write(instr.dst, { ...srcCell });
        this.flag = undefined;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.Add:
      case Operation.Subtract:
      case Operation.Multiply:
      case Operation.Divide:
      case Operation.Modulo: {
        const leftCell = this.read(instr.dst);
        assert(leftCell !== undefined && leftCell.kind === CellKind.Data);
        const rightCell = this.read(instr.src);
        assert(rightCell !== undefined && rightCell.kind === CellKind.Data);
        this.write(instr.dst, {
          kind: CellKind.Data,
          data:
            instr.kind === Operation.Add
              ? leftCell.data + rightCell.data
              : instr.kind === Operation.Subtract
                ? leftCell.data - rightCell.data
                : instr.kind === Operation.Multiply
                  ? leftCell.data * rightCell.data
                  : instr.kind === Operation.Divide
                    ? leftCell.data / rightCell.data
                    : leftCell.data % Math.floor(rightCell.data),
        });
        this.flag = undefined;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.BranchIfEqual: {
        const leftCell = this.read(instr.left);
        assert(leftCell !== undefined && leftCell.kind === CellKind.Data);
        const rightCell = this.read(instr.right);
        assert(rightCell !== undefined && rightCell.kind === CellKind.Data);
        if (leftCell.data === rightCell.data) {
          this.flag = true;
          this.currentContext.currInstruction = instr.ifTrue;
        } else {
          this.flag = false;
          this.currentContext.currInstruction = instr.ifFalse;
        }
        return true;
      }
      case Operation.BranchIfLessThan: {
        const leftCell = this.read(instr.left);
        assert(leftCell !== undefined && leftCell.kind === CellKind.Data);
        const rightCell = this.read(instr.right);
        assert(rightCell !== undefined && rightCell.kind === CellKind.Data);
        if (leftCell.data < rightCell.data) {
          this.flag = true;
          this.currentContext.currInstruction = instr.ifTrue;
        } else {
          this.flag = false;
          this.currentContext.currInstruction = instr.ifFalse;
        }
        return true;
      }
      case Operation.BranchWithLink: {
        const fnAddress = new Address(
          AddressKind.DirectAddress,
          AddressMode.Global,
          instr.target.coords,
        );
        let fnCell = this.read(fnAddress);
        if (!fnCell || fnCell.kind !== CellKind.Code) {
          fnCell = {
            kind: CellKind.Code,
            entry: {
              instr: { kind: Operation.Nop },
            },
          };
          this.write(fnAddress, fnCell);
        }
        assert(fnCell.kind === CellKind.Code);
        this.flag = undefined;
        this.currentContext.currInstruction = instr.link;
        this.contexts.push({
          prevInstruction: { instr: { kind: Operation.Nop } },
          currInstruction: fnCell.entry,
          origin: instr.origin.coords.add(this.origin),
        });
        return true;
      }
      case Operation.Return: {
        this.flag = undefined;
        this.contexts.pop();
        return true;
      }
      default:
        return false;
    }
  }
}
