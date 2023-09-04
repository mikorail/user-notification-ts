export interface UserModel {
    id: number;
    first_name: string;
    last_name?: string | null;
    email: string | null;
    continent: string;
    city: string;
    birthday: Date | null;
    gen_status:boolean,
}