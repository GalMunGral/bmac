import {
  Address,
  AddressCell,
  AddressMode,
  Cell,
  CodeCell,
  DataCell,
  ExecutionContext,
  GridIndex,
  InstructionRef,
  Operation,
} from './types';
import { assert } from './utils';
import { Memory2D } from './Memory2D';

export class VirtualMachine {
  public data = new Memory2D();
  public flag: boolean | undefined = undefined;

  public contexts = new Array<ExecutionContext>({
    target: new GridIndex(0, 0),
    origin: new GridIndex(0, 0),
    prevInstruction: { instr: { kind: Operation.Nop } },
    currInstruction: (this.data.readAt(new GridIndex(0, 0)) as CodeCell).entry,
  });

  public get currentContext() {
    const context = this.contexts[this.contexts.length - 1];
    assert(context !== undefined);
    return context;
  }

  public get programCounter(): InstructionRef {
    return this.currentContext.currInstruction;
  }

  public get currentOrigin(): GridIndex {
    return this.currentContext.origin;
  }

  public get currentTarget(): GridIndex {
    return this.currentContext.target;
  }

  public read(addr: Address): Cell | undefined {
    return this.data.readAt(addr.toGlobal(this.currentOrigin).coords);
  }

  public write(addr: Address, cell: Cell | undefined): void {
    return this.data.writeAt(addr.toGlobal(this.currentOrigin).coords, cell);
  }

  public execute(): boolean {
    const instr = this.currentContext.currInstruction.instr;
    switch (instr.kind) {
      case Operation.Nop: {
        return false;
      }
      case Operation.AddressOf: {
        this.write(instr.dst, new AddressCell(instr.src.toGlobal(this.currentOrigin)));
        this.flag = undefined;
        this.currentContext.prevInstruction = this.currentContext.currInstruction;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.Advance: {
        const addrCell = this.read(instr.src);
        assert(
          addrCell !== undefined &&
            addrCell instanceof AddressCell &&
            addrCell.addr.mode === AddressMode.Global,
        );
        const p1 = addrCell.addr.coords;
        const q1 = instr.src.toGlobal(this.currentOrigin).coords;
        const q2 = instr.dst.toGlobal(this.currentOrigin).coords;
        const p2 = p1.add(q2.sub(q1));
        this.write(instr.src, new AddressCell(new Address(AddressMode.Global, p2)));
        this.flag = undefined;
        this.currentContext.prevInstruction = this.currentContext.currInstruction;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.Read: {
        const addrCell = this.read(instr.src);
        assert(addrCell !== undefined && addrCell instanceof AddressCell);
        const srcCell = this.read(addrCell.addr);
        if (srcCell) {
          this.write(instr.dst, srcCell.clone());
        }
        this.flag = undefined;
        this.currentContext.prevInstruction = this.currentContext.currInstruction;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.Write: {
        const addrCell = this.read(instr.dst);
        assert(addrCell !== undefined && addrCell instanceof AddressCell);
        const srcCell = this.read(instr.src);
        assert(srcCell !== undefined);
        this.write(addrCell.addr, srcCell.clone());
        this.flag = undefined;
        this.currentContext.prevInstruction = this.currentContext.currInstruction;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.Move: {
        const srcCell = this.read(instr.src);
        this.write(instr.dst, srcCell?.clone());
        this.flag = undefined;
        this.currentContext.prevInstruction = this.currentContext.currInstruction;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.Add:
      case Operation.Subtract:
      case Operation.Multiply:
      case Operation.Divide:
      case Operation.Modulo: {
        const srcCell = this.read(instr.src);
        const dstCell = this.read(instr.dst);
        assert(srcCell !== undefined && srcCell instanceof DataCell);
        assert(dstCell !== undefined && dstCell instanceof DataCell);
        dstCell.data =
          instr.kind === Operation.Add
            ? dstCell.data + srcCell.data
            : instr.kind === Operation.Subtract
              ? dstCell.data - srcCell.data
              : instr.kind === Operation.Multiply
                ? dstCell.data * srcCell.data
                : instr.kind === Operation.Divide
                  ? Math.trunc(dstCell.data / srcCell.data)
                  : dstCell.data % Math.floor(srcCell.data);
        this.flag = undefined;
        this.currentContext.prevInstruction = this.currentContext.currInstruction;
        this.currentContext.currInstruction = instr.next;
        return true;
      }
      case Operation.BranchIfEqual: {
        const leftCell = this.read(instr.left);
        const rightCell = this.read(instr.right);
        if (
          leftCell === rightCell ||
          (leftCell !== undefined &&
            rightCell !== undefined &&
            leftCell instanceof DataCell &&
            rightCell instanceof DataCell &&
            leftCell.data === rightCell.data)
        ) {
          this.flag = true;
          this.currentContext.prevInstruction = this.currentContext.currInstruction;
          this.currentContext.currInstruction = instr.ifTrue;
        } else {
          this.flag = false;
          this.currentContext.prevInstruction = this.currentContext.currInstruction;
          this.currentContext.currInstruction = instr.ifFalse;
        }
        return true;
      }
      case Operation.BranchIfLessThan: {
        const leftCell = this.read(instr.left);
        const rightCell = this.read(instr.right);
        if (
          leftCell !== undefined &&
          rightCell !== undefined &&
          leftCell instanceof DataCell &&
          rightCell instanceof DataCell &&
          leftCell.data < rightCell.data
        ) {
          this.flag = true;
          this.currentContext.prevInstruction = this.currentContext.currInstruction;
          this.currentContext.currInstruction = instr.ifTrue;
        } else {
          this.flag = false;
          this.currentContext.prevInstruction = this.currentContext.currInstruction;
          this.currentContext.currInstruction = instr.ifFalse;
        }
        return true;
      }
      case Operation.BranchWithoutLink: {
        let fnCell = this.read(instr.target);
        if (!fnCell || !(fnCell instanceof CodeCell)) {
          fnCell = new CodeCell({
            instr: { kind: Operation.Nop },
          });
          this.write(instr.target, fnCell);
        }
        assert(fnCell instanceof CodeCell);
        this.flag = undefined;
        this.currentContext.target = instr.target.toGlobal(this.currentOrigin).coords;
        this.currentContext.origin = instr.origin.toGlobal(this.currentOrigin).coords;
        this.currentContext.prevInstruction = { instr: { kind: Operation.Nop } };
        this.currentContext.currInstruction = fnCell.entry;
        return true;
      }
      case Operation.BranchWithLink: {
        let fnCell = this.read(instr.target);
        if (!fnCell || !(fnCell instanceof CodeCell)) {
          fnCell = new CodeCell({
            instr: { kind: Operation.Nop },
          });
          this.write(instr.target, fnCell);
        }
        assert(fnCell instanceof CodeCell);
        this.flag = undefined;
        this.currentContext.prevInstruction = this.currentContext.currInstruction;
        this.currentContext.currInstruction = instr.link;
        this.contexts.push({
          target: instr.target.toGlobal(this.currentOrigin).coords,
          origin: instr.origin.toGlobal(this.currentOrigin).coords,
          prevInstruction: { instr: { kind: Operation.Nop } },
          currInstruction: fnCell.entry,
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
