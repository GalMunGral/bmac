import { ChangeDetectorRef, Component, HostListener, inject } from '@angular/core';
import { Looper } from '../../core/Looper';
import { VirtualMachine } from '../../core/VirtualMachine';
import { ButtonModule } from 'primeng/button';
import { AddressMode, CellKind, IVec2, Operation } from '../../core/types';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-looper',
  imports: [ButtonModule, Card],
  templateUrl: './looper.html',
  styleUrl: './looper.css',
})
export class LooperComponent {
  readonly looper = new Looper(new VirtualMachine());

  @HostListener('window:keydown', ['$event.shiftKey'])
  @HostListener('window:keyup', ['$event.shiftKey'])
  @HostListener('window:drag', ['$event.shiftKey'])
  toggleAddressMode(shiftKeyPressed: boolean) {
    this.looper.mode = shiftKeyPressed ? AddressMode.Global : AddressMode.Local;
  }

  readonly operations: Operation[][] = [
    [
      Operation.BranchWithLink,
      Operation.Return,
      Operation.BranchIfEqual,
      Operation.BranchIfLessThan,
    ],
    [Operation.Add, Operation.Subtract, Operation.Multiply, Operation.Divide, Operation.Modulo],
    [Operation.Move, Operation.Pointer, Operation.PointerIncrement],
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
        if (this.looper.vm.execute()) {
          this.cd.markForCheck();
        }
      }
      setTimeout(tick, this.looper.clockCycle);
    };
    setTimeout(tick, this.looper.clockCycle);
  }

  get paused() {
    return this.looper.vm.currentContext.currInstruction.instr.kind === Operation.Nop;
  }

  isSrc(i: number, j: number) {
    const o = this.looper.vm.origin;
    const p = new IVec2(i, j);
    return Boolean(this.looper.srcAddr?.toGlobal(o).coords.equals(p));
  }

  isLastSrc(i: number, j: number) {
    const o = this.looper.vm.origin;
    const p = new IVec2(i, j);
    return Boolean(this.looper.prevSrc?.toGlobal(o).coords.equals(p));
  }

  isDst(i: number, j: number) {
    const o = this.looper.vm.origin;
    const p = new IVec2(i, j);
    return Boolean(this.looper.dstAddr?.toGlobal(o).coords.equals(p));
  }

  isLastDst(i: number, j: number) {
    const o = this.looper.vm.origin;
    const p = new IVec2(i, j);
    return Boolean(this.looper.prevDst?.toGlobal(o).coords.equals(p));
  }

  isOrigin(i: number, j: number) {
    const p = new IVec2(i, j);
    return this.looper.vm.origin.equals(p);
  }

  get statusColor() {
    const flag = this.looper.vm.flag;
    const startColor = flag === true ? '#77ff77' : flag === false ? '#ff7777' : 'transparent';
    const endColor = this.paused ? '#cccccc' : 'transparent';
    const horizontalColor = `linear-gradient(270deg, ${startColor} 0%, transparent 40% 60%, ${endColor} 100%)`;
    const modeColor = this.looper.mode === AddressMode.Global ? '#cccccc' : 'transparent';
    const verticalColor = `linear-gradient(180deg, ${modeColor} 0%, transparent 30%)`;
    return `${horizontalColor}, ${verticalColor}, #333333`;
  }

  cellColorAt(i: number, j: number) {
    return this.isOrigin(i, j)
      ? '#ffffff'
      : this.isSrc(i, j)
        ? '#ddddff'
        : this.isDst(i, j)
          ? '#ffdddd'
          : this.isLastSrc(i, j)
            ? '#7777ff'
            : this.isLastDst(i, j)
              ? '#ff7777'
              : '#000000';
  }

  textColorAt(i: number, j: number) {
    return this.isOrigin(i, j) ? 'black' : 'white';
  }

  dataAt(i: number, j: number): string {
    const cell = this.looper.vm.data.readAt(new IVec2(i, j));
    if (!cell) return '';
    switch (cell.kind) {
      case CellKind.Address: {
        const c = this.looper.vm.read(cell.addr);
        return '*' + (c && c.kind === CellKind.Data ? c.data : '');
      }
      case CellKind.Data:
        return String(cell.data);
      case CellKind.Code:
        return 'Fn';
    }
  }

  selectOperation(operation: Operation) {
    this.looper.selectOperation(operation);
    if (this.looper.vm.execute()) {
      this.cd.markForCheck();
    }
  }

  protected readonly open = open;
}
