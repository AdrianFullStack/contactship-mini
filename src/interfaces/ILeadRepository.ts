import { Lead } from "src/models/lead.entity";

export interface ILeadRepository {
    save(data: any): Promise<Lead>;
    update(id: string, data: Lead): Promise<Lead>;
    findAll(): Promise<Lead[]>;
    findOne(id: string): Promise<Lead | null>;
    findByEmail(email: string): Promise<Lead | null>;
}