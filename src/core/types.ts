export enum AddressKind {
  DirectAddress = 'Direct',
  IndirectAddress = 'Indirect',
}

export enum AddressMode {
  Global = 'Global',
  Local = 'Local',
}

export class IVec2 {
  constructor(
    public i: number = 0,
    public j: number = 0,
  ) {}

  public equals(other: IVec2) {
    return this.i === other.i && this.j === other.j;
  }

  public add(other: IVec2) {
    return new IVec2(this.i + other.i, this.j + other.j);
  }

  public sub(other: IVec2) {
    return new IVec2(this.i - other.i, this.j - other.j);
  }
}

export class Address {
  constructor(
    public kind: AddressKind,
    public mode: AddressMode,
    public coords: IVec2,
  ) {}

  public add(offset: IVec2) {
    return new Address(this.kind, this.mode, this.coords.add(offset));
  }

  public toLocal(origin: IVec2) {
    return new Address(
      this.kind,
      AddressMode.Local,
      this.mode === AddressMode.Local ? this.coords : this.coords.sub(origin),
    );
  }

  public toGlobal(origin: IVec2) {
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
  addr: Address;
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
  target: IVec2;
  origin: IVec2;
  prevInstruction: InstructionRef;
  currInstruction: InstructionRef;
}
