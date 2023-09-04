export interface MessageModel {
    id: number;
    userid: number;
    email?: string;
    message?: string;
    status:boolean,
    sent_at?: Date;
    created_at?: Date;
    continent: string;
    city: string;
    birthday?: Date;
}