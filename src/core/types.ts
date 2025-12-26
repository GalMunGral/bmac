export enum AddressKind {
  DirectAddress = 'Direct',
  IndirectAddress = 'Indirect',
}

export enum AddressMode {
  Global = 'Global',
  Local = 'Local',
}

export class Coords2D {
  constructor(
    public i: number = 0,
    public j: number = 0,
  ) {}

  public equals(other: Coords2D) {
    return this.i === other.i && this.j === other.j;
  }

  public add(other: Coords2D) {
    return new Coords2D(this.i + other.i, this.j + other.j);
  }

  public sub(other: Coords2D) {
    return new Coords2D(this.i - other.i, this.j - other.j);
  }
}

export class Address {
  constructor(
    public kind: AddressKind,
    public mode: AddressMode,
    public coords: Coords2D,
  ) {}

  public toLocal(origin: Coords2D) {
    return new Address(
      this.kind,
      AddressMode.Local,
      this.mode === AddressMode.Local ? this.coords : this.coords.sub(origin),
    );
  }

  public toGlobal(origin: Coords2D) {
    return new Address(
      this.kind,
      AddressMode.Global,
      this.mode === AddressMode.Global ? this.coords : this.coords.add(origin),
    );
  }
}

export enum CellKind {
  Address = 'ADDR',
  Data = 'DATA',
  Code = 'CODE',
}

export interface DataCell {
  kind: CellKind.Data;
  data: number;
}

export interface AddressCell {
  kind: CellKind.Address;
  coords: Coords2D;
}

export interface CodeCell {
  kind: CellKind.Code;
  entry: InstructionRef;
}

export type Cell = AddressCell | DataCell | CodeCell;

export enum Operation {
  Nop = '_',
  Pointer = '&',
  PointerIncrement = '&++',
  Move = '->',
  Add = '+',
  Subtract = '-',
  Multiply = '*',
  Divide = '/',
  Modulo = '%',
  BranchIfEqual = '==',
  BranchIfLessThan = '<',
  BranchWithLink = 'call',
  Return = 'return',
}

export interface NopInstruction {
  kind: Operation.Nop;
}

export interface DataInstruction {
  kind:
    | Operation.Pointer
    | Operation.PointerIncrement
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
  origin: Coords2D;
  prevInstruction: InstructionRef;
  currInstruction: InstructionRef;
}
