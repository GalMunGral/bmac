export enum AddressMode {
  Global = 'Global',
  Local = 'Local',
}

export class GridIndex {
  constructor(
    public i: number = 0,
    public j: number = 0,
  ) {}

  public clone() {
    return new GridIndex(this.i, this.j);
  }

  public equals(other: GridIndex) {
    return this.i === other.i && this.j === other.j;
  }

  public add(other: GridIndex) {
    return new GridIndex(this.i + other.i, this.j + other.j);
  }

  public sub(other: GridIndex) {
    return new GridIndex(this.i - other.i, this.j - other.j);
  }
}

export class Address {
  constructor(
    public mode: AddressMode,
    public coords: GridIndex,
  ) {}

  public clone() {
    return new Address(this.mode, this.coords.clone());
  }

  public toLocal(origin: GridIndex) {
    return new Address(
      AddressMode.Local,
      this.mode === AddressMode.Local ? this.coords : this.coords.sub(origin),
    );
  }

  public toGlobal(origin: GridIndex) {
    return new Address(
      AddressMode.Global,
      this.mode === AddressMode.Global ? this.coords : this.coords.add(origin),
    );
  }
}

export abstract class Cell {
  abstract clone(): Cell;
}

export class DataCell extends Cell {
  constructor(public data: number) {
    super();
  }
  clone(): Cell {
    return new DataCell(this.data);
  }
}

export class AddressCell extends Cell {
  constructor(public addr: Address) {
    super();
  }
  clone(): Cell {
    return new AddressCell(this.addr.clone());
  }
}

export class CodeCell extends Cell {
  constructor(public entry: InstructionRef) {
    super();
  }
  clone(): Cell {
    return new CodeCell({
      instr: this.entry.instr,
    });
  }
}

export enum Operation {
  Nop,
  AddressOf,
  Shift,
  Read,
  Write,
  Move,
  Add,
  Subtract,
  Multiply,
  Divide,
  Modulo,
  BranchIfEqual,
  BranchIfLessThan,
  BranchWithLink,
  Return,
}

export interface NopInstruction {
  kind: Operation.Nop;
}

export interface DataInstruction {
  kind:
    | Operation.AddressOf
    | Operation.Shift
    | Operation.Read
    | Operation.Write
    | Operation.Move
    | Operation.Add
    | Operation.Subtract
    | Operation.Multiply
    | Operation.Divide
    | Operation.Modulo;
  src: Address;
  dst: Address;
  next: InstructionRef;
}

export interface ConditionalBranchInstruction {
  kind: Operation.BranchIfEqual | Operation.BranchIfLessThan;
  left: Address;
  right: Address;
  ifTrue: InstructionRef;
  ifFalse: InstructionRef;
}

export interface BranchWithLinkInstruction {
  kind: Operation.BranchWithLink;
  origin: Address;
  target: Address;
  link: InstructionRef;
}

export interface ReturnInstruction {
  kind: Operation.Return;
}

export type Instruction =
  | NopInstruction
  | DataInstruction
  | ConditionalBranchInstruction
  | BranchWithLinkInstruction
  | ReturnInstruction;

export interface InstructionRef {
  instr: Instruction;
}

export interface ExecutionContext {
  target: GridIndex;
  origin: GridIndex;
  prevInstruction: InstructionRef;
  currInstruction: InstructionRef;
}
