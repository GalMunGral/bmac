import { Address, AddressKind, CellKind, Coords2D, ExecutionContext, Operation } from './types';
import { assert } from './utils';
import { DataMemory } from './DataMemory';

export class VirtualMachine {
  public data = new DataMemory();
  public flag: boolean | undefined = undefined;

  public contexts = new Array<ExecutionContext>({
    origin: new Coords2D(),
    nextInstruction: { instr: { kind: Operation.Nop } },
  });

  public get currentContext() {
    const context = this.contexts[this.contexts.length - 1];
    assert(context !== undefined);
    return context;
  }

  public get origin(): Coords2D {
    return this.currentContext.origin;
  }

  public execute() {
    const instr = this.currentContext.nextInstruction.instr;
    switch (instr.kind) {
      case Operation.Nop: {
        break;
      }
      case Operation.Pointer: {
        this.data.write(instr.dst.offset(this.origin), {
          kind: CellKind.Address,
          coords: instr.src.coords, // relative
        });
        this.flag = undefined;
        this.currentContext.nextInstruction = instr.next;
        break;
      }
      case Operation.PointerIncrement: {
        const addrCell = this.data.read(instr.dst.offset(this.origin));
        assert(addrCell !== undefined && addrCell.kind === CellKind.Address);
        const dataCell = this.data.read(instr.src.offset(this.origin));
        assert(dataCell !== undefined && dataCell.kind === CellKind.Data);
        this.data.write(instr.dst.offset(this.origin), {
          kind: CellKind.Address,
          coords: new Coords2D(addrCell.coords.i, addrCell.coords.j + Math.floor(dataCell.data)),
        });
        this.flag = undefined;
        this.currentContext.nextInstruction = instr.next;
        break;
      }
      case Operation.Move: {
        const srcCell = this.data.read(instr.src.offset(this.origin));
        assert(srcCell !== undefined);
        this.data.write(instr.dst.offset(this.origin), { ...srcCell });
        this.flag = undefined;
        this.currentContext.nextInstruction = instr.next;
        break;
      }
      case Operation.Add:
      case Operation.Subtract:
      case Operation.Multiply:
      case Operation.Divide:
      case Operation.Modulo: {
        const leftCell = this.data.read(instr.dst.offset(this.origin));
        assert(leftCell !== undefined && leftCell.kind === CellKind.Data);
        const rightCell = this.data.read(instr.src.offset(this.origin));
        assert(rightCell !== undefined && rightCell.kind === CellKind.Data);
        this.data.write(instr.dst.offset(this.origin), {
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
        this.currentContext.nextInstruction = instr.next;
        break;
      }
      case Operation.BranchIfEqual: {
        const leftCell = this.data.read(instr.left.offset(this.origin));
        assert(leftCell !== undefined && leftCell.kind === CellKind.Data);
        const rightCell = this.data.read(instr.right.offset(this.origin));
        assert(rightCell !== undefined && rightCell.kind === CellKind.Data);
        if (leftCell.data === rightCell.data) {
          this.flag = true;
          this.currentContext.nextInstruction = instr.ifTrue;
        } else {
          this.flag = false;
          this.currentContext.nextInstruction = instr.ifFalse;
        }
        break;
      }
      case Operation.BranchIfLessThan: {
        const leftCell = this.data.read(instr.left.offset(this.origin));
        assert(leftCell !== undefined && leftCell.kind === CellKind.Data);
        const rightCell = this.data.read(instr.right.offset(this.origin));
        assert(rightCell !== undefined && rightCell.kind === CellKind.Data);
        if (leftCell.data < rightCell.data) {
          this.flag = true;
          this.currentContext.nextInstruction = instr.ifTrue;
        } else {
          this.flag = false;
          this.currentContext.nextInstruction = instr.ifFalse;
        }
        break;
      }
      case Operation.BranchWithLink: {
        const fnAddress = new Address(AddressKind.DirectAddress, instr.target.coords);
        let fnCell = this.data.read(fnAddress);
        if (!fnCell) {
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
        this.currentContext.nextInstruction = instr.link;
        this.contexts.push({
          nextInstruction: fnCell.entry,
          origin: instr.origin.coords.add(this.origin),
        });
        break;
      }
      case Operation.Return: {
        this.flag = undefined;
        this.contexts.pop();
        break;
      }
    }
  }
}
