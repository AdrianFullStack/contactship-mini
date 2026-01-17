import { Lead } from "src/models/lead.entity";

export interface IRedisRepository {
    save(data: Lead): Promise<void>;
    findById(id: string): Promise<Object | null>;
}