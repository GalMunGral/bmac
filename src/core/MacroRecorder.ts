import { VirtualMachine } from './VirtualMachine';
import { assert } from './utils';
import {
  Address,
  AddressCell,
  AddressMode,
  CodeCell,
  DataCell,
  GridIndex,
  Instruction,
  Operation,
} from './types';

export class MacroRecorder {
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
    const globalAddr = new Address(AddressMode.Global, new GridIndex(i, j));
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
      case Operation.AddressOf: {
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
      case Operation.Move: {
        assert(this.srcAddr !== null);
        assert(this.dstAddr !== null);
        const srcCell = this.vm.read(this.srcAddr);
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
        assert(srcCell !== undefined && srcCell instanceof DataCell);
        assert(dstCell !== undefined && !(dstCell instanceof CodeCell));
        this.replace({
          kind,
          src: this.srcAddr,
          dst: this.dstAddr,
          next: { instr: { kind: Operation.Nop } },
        });
        break;
      }
      case Operation.Read: {
        assert(this.srcAddr !== null);
        assert(this.dstAddr !== null);
        const addrCell = this.vm.read(this.srcAddr);
        assert(addrCell !== undefined && addrCell instanceof AddressCell);
        this.replace({
          kind,
          src: this.srcAddr,
          dst: this.dstAddr,
          next: { instr: { kind: Operation.Nop } },
        });
        break;
      }
      case Operation.Write: {
        assert(this.srcAddr !== null);
        assert(this.dstAddr !== null);
        const addrCell = this.vm.read(this.dstAddr);
        assert(addrCell !== undefined && addrCell instanceof AddressCell);
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
        const srcCell = this.vm.read(this.srcAddr);
        assert(srcCell === undefined || srcCell instanceof CodeCell);
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
