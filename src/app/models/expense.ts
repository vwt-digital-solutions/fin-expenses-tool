export interface Expense {
  amount: number;
  cost_type: string;
  transaction_date: Date;
  claim_date: Date;
  employee: string;
  id: number;
  note: string;
  status: {
    date_exported: string;
    rnote: string;
    text: string;
  };
}
