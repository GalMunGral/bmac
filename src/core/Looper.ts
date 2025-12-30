import { VirtualMachine } from './VirtualMachine';
import {
  Address,
  AddressKind,
  AddressMode,
  CellKind,
  Instruction,
  IVec2,
  Operation,
} from './types';
import { assert } from './utils';

export class Looper {
  public playing = true;
  public clockCycle = 25;

  public mode: AddressMode = AddressMode.Local;
  public srcAddr: Address | null = null;
  public dstAddr: Address | null = null;

  constructor(public vm: VirtualMachine) {}

  private replace(instr: Instruction) {
    this.vm.currentContext.currInstruction.instr = instr;
  }

  public toAddress(i: number, j: number) {
    const cell = this.vm.data.readAt(new IVec2(i, j));
    const globalAddr = new Address(
      cell?.kind === CellKind.Address ? AddressKind.IndirectAddress : AddressKind.DirectAddress,
      AddressMode.Global,
      new IVec2(i, j),
    );
    return this.mode === AddressMode.Global
      ? globalAddr
      : globalAddr.toLocal(this.vm.currentOrigin);
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

  public record(kind: Operation) {
    switch (kind) {
      case Operation.Nop: {
        break;
      }
      case Operation.Pointer: {
        assert(this.srcAddr !== null);
        assert(this.dstAddr !== null);
        const srcCell = this.vm.read(this.srcAddr);
        const dstCell = this.vm.read(this.dstAddr);
        assert(srcCell !== undefined && srcCell.kind === CellKind.Data);
        this.replace({
          kind,
          src: this.srcAddr,
          dst: this.dstAddr,
          next: { instr: { kind: Operation.Nop } },
        });
        break;
      }
      case Operation.Move: {
        assert(this.srcAddr !== null);
        assert(this.dstAddr !== null);
        const srcCell = this.vm.read(this.srcAddr);
        const dstCell = this.vm.read(this.dstAddr);
        assert(srcCell !== undefined);
        this.replace({
          kind,
          src: this.srcAddr,
          dst: this.dstAddr,
          next: { instr: { kind: Operation.Nop } },
        });
        break;
      }
      case Operation.Add:
      case Operation.Subtract:
      case Operation.Multiply:
      case Operation.Divide:
      case Operation.Modulo: {
        assert(this.srcAddr !== null);
        assert(this.dstAddr !== null);
        const srcCell = this.vm.read(this.srcAddr);
        const dstCell = this.vm.read(this.dstAddr);
        assert(srcCell !== undefined && srcCell.kind === CellKind.Data);
        assert(dstCell !== undefined && dstCell.kind === CellKind.Data);
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
        const dataCell = this.vm.read(this.srcAddr);
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
        const leftCell = this.vm.read(this.srcAddr);
        const rightCell = this.vm.read(this.dstAddr);
        assert(leftCell !== undefined && leftCell.kind === CellKind.Data);
        assert(rightCell !== undefined && rightCell.kind === CellKind.Data);
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
        const srcCell = this.vm.read(this.srcAddr);
        assert(srcCell === undefined || srcCell.kind === CellKind.Code);
        this.replace({
          kind,
          target: this.srcAddr.toGlobal(this.vm.currentOrigin),
          origin: this.dstAddr,
          link: {
            instr: {
              kind: this.srcAddr.mode === AddressMode.Global ? Operation.Return : Operation.Nop,
            },
          },
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
