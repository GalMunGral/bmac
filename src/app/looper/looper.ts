import { ChangeDetectorRef, Component, HostListener, inject } from '@angular/core';
import { Looper } from '../../core/Looper';
import { VirtualMachine } from '../../core/VirtualMachine';
import { ButtonModule } from 'primeng/button';
import {
  Address,
  AddressKind,
  AddressMode,
  CellKind,
  Instruction,
  IVec2,
  Operation,
} from '../../core/types';

@Component({
  selector: 'app-looper',
  imports: [ButtonModule],
  templateUrl: './looper.html',
  styleUrl: './looper.css',
})
export class LooperComponent {
  readonly vm = new VirtualMachine();
  readonly looper = new Looper(this.vm);

  @HostListener('window:keydown', ['$event.shiftKey'])
  @HostListener('window:keyup', ['$event.shiftKey'])
  @HostListener('window:drag', ['$event.shiftKey'])
  toggleAddressMode(shiftKeyPressed: boolean) {
    this.looper.mode = shiftKeyPressed ? AddressMode.Global : AddressMode.Local;
  }

  readonly operations: Operation[] = [
    Operation.Move,
    Operation.Add,
    Operation.Subtract,
    Operation.Multiply,
    Operation.Divide,
    Operation.Modulo,
    Operation.PointerIncrement,
    Operation.Pointer,
    Operation.BranchIfLessThan,
    Operation.BranchIfEqual,
    Operation.BranchWithLink,
  ];

  m = 100;
  n = 100;
  indices = Array(this.m)
    .fill(0)
    .map(() => Array(this.n).fill(0));

  private cd = inject(ChangeDetectorRef);

  constructor() {
    const tick = () => {
      if (this.looper.playing) {
        if (this.vm.execute()) {
          this.cd.markForCheck();
        }
      }
      setTimeout(tick, this.looper.clockCycle);
    };
    setTimeout(tick, this.looper.clockCycle);
  }

  get paused() {
    return this.vm.currentContext.currInstruction.instr.kind === Operation.Nop;
  }

  public getInstrSrc(instr: Instruction): Address | null {
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

  public getInstrDst(instr: Instruction): Address | null {
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

  isSrc(i: number, j: number) {
    const o = this.vm.currentOrigin;
    const p = new IVec2(i, j);
    return Boolean(this.looper.srcAddr?.toGlobal(o).coords.equals(p));
  }

  isLastSrc(i: number, j: number) {
    const o = this.vm.currentOrigin;
    const p = new IVec2(i, j);
    return Boolean(
      this.getInstrSrc(this.vm.currentContext.prevInstruction.instr)?.toGlobal(o).coords.equals(p),
    );
  }

  isDst(i: number, j: number) {
    const o = this.vm.currentOrigin;
    const p = new IVec2(i, j);
    return Boolean(this.looper.dstAddr?.toGlobal(o).coords.equals(p));
  }

  isLastDst(i: number, j: number) {
    const o = this.vm.currentOrigin;
    const p = new IVec2(i, j);
    return Boolean(
      this.getInstrDst(this.vm.currentContext.prevInstruction.instr)?.toGlobal(o).coords.equals(p),
    );
  }

  isCurrentContext(i: number, j: number) {
    const p = new IVec2(i, j);
    return this.vm.currentOrigin.equals(p) || this.vm.currentTarget.equals(p);
  }

  get statusIndicators() {
    const flag = this.vm.flag;
    const flagBitColor = flag === true ? '#77ff77' : flag === false ? '#ff7777' : 'transparent';
    const flagBitIndicator = `radial-gradient(circle at 100%, ${flagBitColor} 0%, transparent 50%)`;

    const addressModeColor = this.usingGlobalAddressMode ? '#ff77ff' : 'transparent';
    const addressModeIndicator = `radial-gradient(circle at 0% 0%, ${addressModeColor} 0%, transparent 33%)`;

    const recordingStateColor = this.paused ? '#777777' : 'transparent';
    const recordingStateIndicator = `radial-gradient(circle at 50% 100%, ${recordingStateColor} 0%, transparent 33%)`;

    return [recordingStateIndicator, flagBitIndicator, addressModeIndicator, '#222222'].join(',');
  }

  get usingGlobalAddressMode() {
    return (
      this.looper.mode === AddressMode.Global ||
      this.getInstrSrc(this.vm.currentContext.currInstruction.instr)?.mode == AddressMode.Global ||
      this.getInstrDst(this.vm.currentContext.currInstruction.instr)?.mode == AddressMode.Global
    );
  }

  transformForButtonAt(i: number) {
    const N = this.operations.length;
    const radius = 100;
    const extraRotate = this.operations[i] === Operation.Divide ? 'rotate(45deg)' : '';
    return `rotate(${-i / N}turn) translate(${-radius}px) rotate(${i / N}turn) ${extraRotate} translate(-50%, -50%)`;
  }

  iconForOperation(operation: Operation) {
    switch (operation) {
      case Operation.Nop:
        return 'pi pi-ban';
      case Operation.Pointer:
        return 'pi pi-link';
      case Operation.PointerIncrement:
        return 'pi pi-fast-forward';
      case Operation.Move:
        return 'pi pi-clone';
      case Operation.Add:
        return 'pi pi-plus';
      case Operation.Subtract:
        return 'pi pi-minus';
      case Operation.Multiply:
        return 'pi pi-times';
      case Operation.Divide:
        return 'pi pi-percentage';
      case Operation.Modulo:
        return 'pi pi-percentage';
      case Operation.BranchIfEqual:
        return 'pi pi-equals';
      case Operation.BranchIfLessThan:
        return 'pi pi-chevron-left';
      case Operation.BranchWithLink:
        return 'pi pi-play-circle';
      case Operation.Return:
        return 'pi pi-eject';
      default:
        return 'pi pi-times';
    }
  }

  rotateForOperation(operation: Operation) {
    if (operation === Operation.Divide) return '45deg';
    return 'none';
  }

  cellColorAt(i: number, j: number) {
    if (this.isCurrentContext(i, j)) {
      return '#ffffffaa';
    }
    if (this.isSrc(i, j) || this.isLastSrc(i, j)) {
      return '#333355aa';
    }
    if (this.isDst(i, j) || this.isLastDst(i, j)) {
      return '#553333aa';
    }
    return '#000000aa';
  }

  textColorAt(i: number, j: number) {
    return this.isCurrentContext(i, j) ? '#000000aa' : '#ffffffaa';
  }

  CellContentAt(i: number, j: number): string {
    const cell = this.vm.data.readAt(new IVec2(i, j));
    if (!cell) return '';
    switch (cell.kind) {
      case CellKind.Address: {
        if (cell.addr.kind === AddressKind.DirectAddress) {
          const c = this.vm.read(cell.addr);
          return `(${c && c.kind === CellKind.Data ? c.data : '_'})`;
        } else {
          return '(*)';
        }
      }
      case CellKind.Data: {
        return String(cell.data);
      }
      case CellKind.Code: {
        if (this.vm.contexts.some((ctx) => ctx.target.equals(new IVec2(i, j)))) {
          if (this.vm.programCounter.instr.kind === Operation.Nop) {
            // paused
            return '<div class="pi pi-pause pointer-events-none"></div>';
          }
          // running
          return '<div class="pi pi-spinner-dotted pi-spin pointer-events-none"></div>';
        }
        return '<div class="pi pi-play pointer-events-none"></div>';
      }
    }
  }

  onDragStart(i: number, j: number) {
    this.looper.setSrc(i, j);
  }

  onDrop(i: number, j: number) {
    this.looper.setDst(i, j);
    if (!this.looper.srcAddr || !this.looper.dstAddr) {
      return;
    }
    // shortcuts
    if (this.vm.read(this.looper.srcAddr)?.kind === CellKind.Code) {
      // this.recordAndPlayImmediately(Operation.BranchWithLink);
    } else if (
      this.looper.srcAddr.toGlobal(this.vm.currentOrigin).coords.equals(this.vm.currentOrigin) &&
      this.looper.dstAddr.toGlobal(this.vm.currentOrigin).coords.equals(this.vm.currentTarget)
    ) {
      this.recordAndPlayImmediately(Operation.Return);
    }
  }

  recordAndPlayImmediately(operation: Operation) {
    this.looper.record(operation);
    if (this.vm.execute()) {
      this.cd.markForCheck();
    }
  }

  protected readonly open = open;
}
