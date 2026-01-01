import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  viewChild,
} from '@angular/core';
import { MacroRecorder } from '../../core/MacroRecorder';
import { VirtualMachine } from '../../core/VirtualMachine';
import { ButtonModule } from 'primeng/button';
import {
  Address,
  AddressCell,
  AddressMode,
  CodeCell,
  DataCell,
  GridIndex,
  Instruction,
  Operation,
} from '../../core/types';

@Component({
  selector: 'app-bmac',
  imports: [ButtonModule],
  templateUrl: './bmac.html',
  styleUrl: './bmac.css',
})
export class BMAC {
  readonly vm = new VirtualMachine();
  readonly recorder = new MacroRecorder(this.vm);

  @HostListener('window:keydown', ['$event.shiftKey'])
  @HostListener('window:keyup', ['$event.shiftKey'])
  @HostListener('window:drag', ['$event.shiftKey'])
  toggleAddressMode(shiftKeyPressed: boolean) {
    this.recorder.mode = shiftKeyPressed ? AddressMode.Global : AddressMode.Local;
  }

  dragImage = viewChild<ElementRef>('dragImage');

  readonly operations: Operation[] = [
    Operation.BranchWithLink,
    Operation.Add,
    Operation.Subtract,
    Operation.Multiply,
    Operation.Divide,
    Operation.Modulo,
    Operation.BranchIfEqual,
    Operation.BranchIfLessThan,
    Operation.Write,
    Operation.Read,
    Operation.Shift,
    Operation.AddressOf,
    Operation.Move,
  ];

  cellSize = 40;
  gapSize = 1;
  m = 100;
  n = 100;
  indices = Array(this.m)
    .fill(0)
    .map(() => Array(this.n).fill(0));

  private cd = inject(ChangeDetectorRef);

  constructor() {
    const tick = () => {
      if (this.recorder.playing) {
        if (this.vm.execute()) {
          this.cd.markForCheck();
        }
      }
      setTimeout(tick, this.recorder.clockCycle);
    };
    setTimeout(tick, this.recorder.clockCycle);
  }

  get paused() {
    return this.vm.currentContext.currInstruction.instr.kind === Operation.Nop;
  }

  public getInstrSrc(instr: Instruction): Address | null {
    switch (instr.kind) {
      case Operation.AddressOf:
      case Operation.Shift:
      case Operation.Read:
      case Operation.Write:
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
      case Operation.AddressOf:
      case Operation.Shift:
      case Operation.Read:
      case Operation.Write:
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
    const p = new GridIndex(i, j);
    return Boolean(this.recorder.srcAddr?.toGlobal(o).coords.equals(p));
  }

  isLastSrc(i: number, j: number) {
    const o = this.vm.currentOrigin;
    const p = new GridIndex(i, j);
    return Boolean(
      this.getInstrSrc(this.vm.currentContext.prevInstruction.instr)?.toGlobal(o).coords.equals(p),
    );
  }

  isDst(i: number, j: number) {
    const o = this.vm.currentOrigin;
    const p = new GridIndex(i, j);
    return Boolean(this.recorder.dstAddr?.toGlobal(o).coords.equals(p));
  }

  isLastDst(i: number, j: number) {
    const o = this.vm.currentOrigin;
    const p = new GridIndex(i, j);
    return Boolean(
      this.getInstrDst(this.vm.currentContext.prevInstruction.instr)?.toGlobal(o).coords.equals(p),
    );
  }

  isCurrentContext(i: number, j: number) {
    const p = new GridIndex(i, j);
    return this.vm.currentOrigin.equals(p) || this.vm.currentTarget.equals(p);
  }

  getPointerCoordinates(
    i: number,
    j: number,
  ): { x1: number; x2: number; y1: number; y2: number } | null {
    const cell = this.vm.read(new Address(AddressMode.Global, new GridIndex(i, j)));
    if (!(cell instanceof AddressCell)) {
      return null;
    }
    const target = cell.addr.toGlobal(this.vm.currentOrigin).coords;
    const coords = {
      x1: j * (this.cellSize + 1) + this.cellSize / 2,
      y1: i * (this.cellSize + 1) + this.cellSize / 2,
      x2: target.j * (this.cellSize + 1) + this.cellSize / 2,
      y2: target.i * (this.cellSize + 1) + this.cellSize / 2,
    };
    const dx = coords.x2 - coords.x1;
    const dy = coords.y2 - coords.y1;
    const l = Math.sqrt(dx * dx + dy * dy);
    const paddingStart = this.cellSize / 3;
    const paddingEnd = this.cellSize / 2;
    coords.x1 += (dx / l) * paddingStart;
    coords.y1 += (dy / l) * paddingStart;
    coords.x2 -= (dx / l) * paddingEnd;
    coords.y2 -= (dy / l) * paddingEnd;
    return coords;
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
      this.recorder.mode === AddressMode.Global ||
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
      case Operation.AddressOf:
        return 'pi pi-external-link';
      case Operation.Shift:
        return 'pi pi-arrows-alt';
      case Operation.Read:
        return 'pi pi-file-export';
      case Operation.Write:
        return 'pi pi-file-import';
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

  cellContentAt(i: number, j: number): string {
    const cell = this.vm.data.readAt(new GridIndex(i, j));
    if (!cell) return '';
    if (cell instanceof AddressCell) {
      const { i, j } = cell.addr.toGlobal(this.vm.currentOrigin).coords;
      return '<i class="pi pi-external-link"></i>';
    } else if (cell instanceof DataCell) {
      return String(cell.data);
    } else if (cell instanceof CodeCell) {
      if (this.vm.contexts.some((ctx) => ctx.target.equals(new GridIndex(i, j)))) {
        if (this.vm.programCounter.instr.kind === Operation.Nop) {
          // paused
          return '<i class="pi pi-pause pointer-events-none"></i>';
        }
        // running
        return '<i class="pi pi-spinner-dotted pi-spin pointer-events-none"></i>';
      }
      return '<div class="pi pi-play pointer-events-none"></div>';
    }
    return '';
  }

  onDragStart(e: DragEvent, i: number, j: number) {
    e.dataTransfer?.setDragImage(
      this.dragImage()?.nativeElement,
      this.cellSize / 2,
      this.cellSize / 2,
    );
    this.recorder.setSrc(i, j);
  }

  onDrop(i: number, j: number) {
    this.recorder.setDst(i, j);
    if (!this.recorder.srcAddr || !this.recorder.dstAddr) {
      return;
    }
    // shortcuts
    if (this.vm.read(this.recorder.srcAddr) instanceof CodeCell) {
      // this.recordAndPlayImmediately(Operation.BranchWithLink);
    } else if (
      this.recorder.srcAddr.toGlobal(this.vm.currentOrigin).coords.equals(this.vm.currentOrigin) &&
      this.recorder.dstAddr.toGlobal(this.vm.currentOrigin).coords.equals(this.vm.currentTarget)
    ) {
      this.recordAndPlayImmediately(Operation.Return);
    }
  }

  recordAndPlayImmediately(operation: Operation) {
    this.recorder.record(operation);
    if (this.vm.execute()) {
      this.cd.markForCheck();
    }
  }

  protected readonly open = open;
}
