export interface Attachment {
    content: string | ArrayBuffer;
    content_type: string;
    from_db: boolean;
    db_name?: string;
    expense_id?: string | number;
}
