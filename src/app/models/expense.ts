export interface Expense {
  amount: number;
  cost_type: string;
  date_of_claim: number;
  date_of_transaction: number;
  employee: string;
  id: number;
  note: string;
  status: {
    date_exported: string;
    rnote: string;
    text: string;
  };
}