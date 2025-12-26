export enum AddressKind {
  DirectAddress = 'DA',
  IndirectAddress = 'IA',
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
    public coords: Coords2D,
  ) {}

  public offset(origin: Coords2D) {
    return new Address(this.kind, this.coords.add(origin));
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
  Nop = 'NOP',
  Pointer = 'PTR',
  PointerIncrement = 'INC',
  Move = 'MOV',
  Add = 'ADD',
  Subtract = 'SUB',
  Multiply = 'MUL',
  Divide = 'DIV',
  Modulo = 'MOD',
  BranchIfEqual = 'BEQ',
  BranchIfLessThan = 'BLT',
  BranchWithLink = 'BL',
  Return = 'RET',
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
  nextInstruction: InstructionRef;
}
