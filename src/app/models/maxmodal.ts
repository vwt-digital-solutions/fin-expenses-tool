import { Expense } from "./expense";

export interface MaxModalResult {
  action: MaxModalAction,
  expense: Expense
}

export enum MaxModalAction {
  Approved,
  Rejected,
  Cancel,
  Submit,
  Save,
  None
}

export enum MaxModalMode {
  Creditor,
  Editor,
  Viewer,
  Manager
}
