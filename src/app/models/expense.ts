export interface Expense {
  amount: number;
  cost_type: string;
  transaction_date: Date;
  claim_date: Date;
  employee: string;
  id: number;
  note: string;
  status: {
    export_date: string;
    rnote: string;
    rnote_id: number;
    text: string;
  };
  flags: object;
}
