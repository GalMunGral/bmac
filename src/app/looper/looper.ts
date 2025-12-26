import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Looper } from '../../core/Looper';
import { VirtualMachine } from '../../core/VirtualMachine';
import { ButtonModule } from 'primeng/button';
import { CellKind, Coords2D, Operation } from '../../core/types';
import { ToStringPipe } from '../to-string-pipe';

@Component({
  selector: 'app-looper',
  imports: [ButtonModule, ToStringPipe],
  templateUrl: './looper.html',
  styleUrl: './looper.css',
})
export class LooperComponent {
  looper = new Looper(new VirtualMachine());

  m = 100;
  n = 100;
  indices = Array(this.m)
    .fill(0)
    .map(() => Array(this.n).fill(0));

  private cd = inject(ChangeDetectorRef);

  constructor() {
    const tick = () => {
      if (this.looper.playing) {
        this.looper.vm.execute();
        this.cd.markForCheck();
      }
      setTimeout(tick, this.looper.clockCycle);
    };
    setTimeout(tick, this.looper.clockCycle);
  }

  get paused() {
    return this.looper.vm.currentContext.nextInstruction.instr.kind === Operation.Nop;
  }

  isSrc(i: number, j: number) {
    const o = this.looper.vm.origin;
    const p = new Coords2D(i, j);
    const instr = this.looper.vm.currentContext.nextInstruction.instr;
    return (
      (this.looper.srcAddr !== null && this.looper.srcAddr.coords.add(o).equals(p)) ||
      ('left' in instr && instr.left.coords.add(o).equals(p)) ||
      ('src' in instr && instr.src.coords.add(o).equals(p))
    );
  }

  isDst(i: number, j: number) {
    const o = this.looper.vm.origin;
    const p = new Coords2D(i, j);
    const instr = this.looper.vm.currentContext.nextInstruction.instr;
    return (
      (this.looper.dstAddr !== null && this.looper.dstAddr.coords.add(o).equals(p)) ||
      ('right' in instr && instr.right.coords.add(o).equals(p)) ||
      ('dst' in instr && instr.dst.coords.add(o).equals(p)) ||
      ('origin' in instr && instr.origin.coords.add(o).equals(p))
    );
  }

  isOrigin(i: number, j: number) {
    const p = new Coords2D(i, j);
    return this.looper.vm.origin.equals(p);
  }

  dataAt(i: number, j: number): string {
    const cell = this.looper.vm.data.readAt(i, j);
    if (!cell) return '';
    switch (cell.kind) {
      case CellKind.Address:
        return 'A';
      case CellKind.Data:
        return String(cell.data);
      case CellKind.Code:
        return 'C';
    }
  }

  selectOperation(operation: Operation) {
    this.looper.selectOperation(operation);
    this.looper.vm.execute();
    this.cd.markForCheck();
  }
}
