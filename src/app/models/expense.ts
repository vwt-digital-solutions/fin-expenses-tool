export interface Expense {
  amount: number;
  cost_type: string;
  date_of_claim: number;
  date_of_transaction: number;
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
