import {
  Address,
  AddressKind,
  AddressMode,
  CellKind,
  Coords2D,
  ExecutionContext,
  Operation,
} from './types';
import { assert } from './utils';
import { Memory2D } from './Memory2D';

export class VirtualMachine {
  public data = new Memory2D();
  public flag: boolean | undefined = undefined;

  public contexts = new Array<ExecutionContext>({
    origin: new Coords2D(),
    prevInstruction: { instr: { kind: Operation.Nop } },
    currInstruction: { instr: { kind: Operation.Nop } },
  });

  public get currentContext() {
    const context = this.contexts[this.contexts.length - 1];
    assert(context !== undefined);
    return context;
  }

  public get origin(): Coords2D {
    return this.currentContext.origin;
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
          coords: instr.src.coords, // relative
        });
        this.flag = undefined;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.PointerIncrement: {
        const addrCell = this.data.readAt(this.origin.add(instr.dst.coords));
        assert(addrCell !== undefined && addrCell.kind === CellKind.Address);
        const dataCell = this.data.read(instr.src.toGlobal(this.origin));
        assert(dataCell !== undefined && dataCell.kind === CellKind.Data);
        this.data.writeAt(this.origin.add(instr.dst.coords), {
          kind: CellKind.Address,
          coords: new Coords2D(addrCell.coords.i, addrCell.coords.j + Math.floor(dataCell.data)),
        });
        this.flag = undefined;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.Move: {
        const srcCell = this.data.read(instr.src.toGlobal(this.origin));
        assert(srcCell !== undefined);
        this.data.write(instr.dst.toGlobal(this.origin), { ...srcCell });
        this.flag = undefined;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.Add:
      case Operation.Subtract:
      case Operation.Multiply:
      case Operation.Divide:
      case Operation.Modulo: {
        const leftCell = this.data.read(instr.dst.toGlobal(this.origin));
        assert(leftCell !== undefined && leftCell.kind === CellKind.Data);
        const rightCell = this.data.read(instr.src.toGlobal(this.origin));
        assert(rightCell !== undefined && rightCell.kind === CellKind.Data);
        this.data.write(instr.dst.toGlobal(this.origin), {
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
        const leftCell = this.data.read(instr.left.toGlobal(this.origin));
        assert(leftCell !== undefined && leftCell.kind === CellKind.Data);
        const rightCell = this.data.read(instr.right.toGlobal(this.origin));
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
        const leftCell = this.data.read(instr.left.toGlobal(this.origin));
        assert(leftCell !== undefined && leftCell.kind === CellKind.Data);
        const rightCell = this.data.read(instr.right.toGlobal(this.origin));
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
        let fnCell = this.data.read(fnAddress);
        if (!fnCell || fnCell.kind !== CellKind.Code) {
          fnCell = {
            kind: CellKind.Code,
            entry: {
              instr: { kind: Operation.Nop },
            },
          };
          this.data.write(fnAddress, fnCell);
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
