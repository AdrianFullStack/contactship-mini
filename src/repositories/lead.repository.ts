import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ILeadRepository } from 'src/interfaces/ILeadRepository';
import { Lead } from 'src/models/lead.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LeadRepository implements ILeadRepository {
    constructor(
        @InjectRepository(Lead)
        private leadsRepository: Repository<Lead>,
    ) {}
    
    async save(data: Lead): Promise<Lead> {
        const newLead = this.leadsRepository.create(data);
        const create = await this.leadsRepository.save(newLead);   
        return create;
    }

    async update(id: string, data: Lead): Promise<Lead> {
        await this.leadsRepository.update(id, data);
        return data;
    }

    async findAll(): Promise<Lead[]> {
        return this.leadsRepository.find({ order: { createdAt: 'DESC' } });
    }

    async findOne(id: string): Promise<Lead | null> {
        return this.leadsRepository.findOne({ where: { id } });
    }
    async findByEmail(email: string): Promise<Lead | null> {
        return this.leadsRepository.findOne({ where: { email } });
    }
}