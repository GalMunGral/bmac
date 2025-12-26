import { VirtualMachine } from './VirtualMachine';
import { Address, AddressKind, CellKind, Coords2D, Instruction, Operation } from './types';
import { assert } from './utils';

export class Looper {
  public playing = true;
  public clockCycle = 100;
  public operationOptions: Operation[] = Object.values(Operation);

  public srcAddr: Address | null = null;
  public dstAddr: Address | null = null;

  constructor(public vm: VirtualMachine) {}

  public play() {
    this.playing = true;
  }

  public pause() {
    this.playing = false;
  }

  private replace(instr: Instruction) {
    this.vm.currentContext.nextInstruction.instr = instr;
  }

  public selectCellAt(i: number, j: number) {
    const absoluteAddr = new Address(AddressKind.DirectAddress, new Coords2D(i, j));
    const cell = this.vm.data.read(absoluteAddr);
    const relativeAddr: Address = new Address(
      cell?.kind === CellKind.Address ? AddressKind.IndirectAddress : AddressKind.DirectAddress,
      new Coords2D(i, j).sub(this.vm.origin),
    );
    if (!this.srcAddr) {
      this.srcAddr = relativeAddr;
    } else if (!this.dstAddr) {
      this.dstAddr = relativeAddr;
    } else {
      this.srcAddr = this.dstAddr;
      this.dstAddr = relativeAddr;
    }
  }

  public selectOperation(kind: Operation) {
    switch (kind) {
      case Operation.Nop: {
        break;
      }
      case Operation.Pointer:
      case Operation.Move:
      case Operation.Add:
      case Operation.Subtract:
      case Operation.Multiply:
      case Operation.Divide:
      case Operation.Modulo: {
        assert(this.srcAddr !== null);
        assert(this.dstAddr !== null);
        this.replace({
          kind,
          src: this.srcAddr,
          dst: this.dstAddr,
          next: { instr: { kind: Operation.Nop } },
        });
        break;
      }
      case Operation.PointerIncrement: {
        assert(this.srcAddr !== null);
        assert(this.dstAddr !== null);
        const dataCell = this.vm.data.read(this.srcAddr.offset(this.vm.origin));
        assert(dataCell !== undefined && dataCell.kind === CellKind.Data);
        assert(this.dstAddr.kind === AddressKind.IndirectAddress);
        this.replace({
          kind,
          src: this.srcAddr,
          dst: this.dstAddr,
          next: { instr: { kind: Operation.Nop } },
        });
        break;
      }
      case Operation.BranchIfEqual:
      case Operation.BranchIfLessThan: {
        assert(this.srcAddr !== null);
        assert(this.dstAddr !== null);
        this.replace({
          kind,
          left: this.srcAddr,
          right: this.dstAddr,
          ifTrue: { instr: { kind: Operation.Nop } },
          ifFalse: { instr: { kind: Operation.Nop } },
        });
        break;
      }
      case Operation.BranchWithLink: {
        assert(this.srcAddr !== null);
        assert(this.dstAddr !== null);
        this.replace({
          kind,
          target: this.srcAddr.offset(this.vm.origin),
          origin: this.dstAddr,
          link: { instr: { kind: Operation.Nop } },
        });
        break;
      }
      case Operation.Return: {
        assert(this.vm.contexts.length > 1);
        this.replace({
          kind,
        });
        break;
      }
    }
    this.srcAddr = null;
    this.dstAddr = null;
  }
}
