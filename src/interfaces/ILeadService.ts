import { CreateLeadDto } from "src/dto/create-lead.dto";
import { Lead } from "src/models/lead.entity";

export interface ILeadService {
    create(data: CreateLeadDto): Promise<Lead>;
    findAll(): Promise<Lead[]>;
    findOne(id: string): Promise<Lead | null>;
    queueSummaryGeneration(id: string): Promise<{ message: string; leadId: string }>;
}