import { VirtualMachine } from './VirtualMachine';
import {
  Address,
  AddressKind,
  AddressMode,
  CellKind,
  Coords2D,
  Instruction,
  Operation,
} from './types';
import { assert } from './utils';

export class Looper {
  public playing = true;
  public clockCycle = 100;

  public mode: AddressMode = AddressMode.Local;
  public srcAddr: Address | null = null;
  public dstAddr: Address | null = null;

  constructor(public vm: VirtualMachine) {}

  private replace(instr: Instruction) {
    this.vm.currentContext.currInstruction.instr = instr;
  }

  public get prevSrc(): Address | null {
    const instr = this.vm.currentContext.prevInstruction.instr;
    switch (instr.kind) {
      case Operation.Pointer:
      case Operation.PointerIncrement:
      case Operation.Move:
      case Operation.Add:
      case Operation.Subtract:
      case Operation.Multiply:
      case Operation.Divide:
      case Operation.Modulo:
        return instr.src;
      case Operation.BranchIfEqual:
      case Operation.BranchIfLessThan:
        return instr.left;
      case Operation.BranchWithLink:
        return instr.target;
      case Operation.Return:
      case Operation.Nop:
        return null;
    }
  }

  public get prevDst(): Address | null {
    const instr = this.vm.currentContext.prevInstruction.instr;
    switch (instr.kind) {
      case Operation.Pointer:
      case Operation.PointerIncrement:
      case Operation.Move:
      case Operation.Add:
      case Operation.Subtract:
      case Operation.Multiply:
      case Operation.Divide:
      case Operation.Modulo:
        return instr.dst;
      case Operation.BranchIfEqual:
      case Operation.BranchIfLessThan:
        return instr.right;
      case Operation.BranchWithLink:
        return instr.origin;
      case Operation.Return:
      case Operation.Nop:
        return null;
    }
  }

  public toAddress(i: number, j: number) {
    const cell = this.vm.data.readAt(new Coords2D(i, j));
    const globalAddr = new Address(
      cell?.kind === CellKind.Address ? AddressKind.IndirectAddress : AddressKind.DirectAddress,
      AddressMode.Global,
      new Coords2D(i, j),
    );
    return this.mode === AddressMode.Global ? globalAddr : globalAddr.toLocal(this.vm.origin);
  }

  public reset() {
    this.srcAddr = null;
    this.dstAddr = null;
  }

  public setSrc(i: number, j: number) {
    this.srcAddr = this.toAddress(i, j);
  }

  public setDst(i: number, j: number) {
    this.dstAddr = this.toAddress(i, j);
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
        const srcCell = this.vm.data.read(this.srcAddr.toGlobal(this.vm.origin));
        const dstCell = this.vm.data.read(this.srcAddr.toGlobal(this.vm.origin));

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
        const dataCell = this.vm.data.read(this.srcAddr.toGlobal(this.vm.origin));
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
          target: this.srcAddr.toGlobal(this.vm.origin),
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
