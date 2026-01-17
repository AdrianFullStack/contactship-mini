import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { CreateLeadDto } from 'src/dto/create-lead.dto';
import { ILeadService } from 'src/interfaces/ILeadService';
import type { ILeadRepository } from 'src/interfaces/ILeadRepository';
import { Lead } from 'src/models/lead.entity';
import type { IRedisRepository } from 'src/interfaces/IRedisRepository';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class LeadsService implements ILeadService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
        @Inject('ILeadRepository')
        private leadRepository: ILeadRepository,
        @Inject('IRedisRepository')
        private redisRepository: IRedisRepository,
        @InjectQueue('ai-processing')
        private aiQueue: Queue
    ) {}

    async create(data: CreateLeadDto): Promise<Lead> {
        const existingLead = await this.leadRepository.findByEmail(data.email);
        
        if (existingLead) {
            this.logger.debug(`Lead with email ${data.email} already exists.`);
            return existingLead;
        }

        const lead: Lead = await this.leadRepository.save(data);
        await this.redisRepository.save(lead);
        return lead;
    }

    async findAll(): Promise<Lead[]> {
        return this.leadRepository.findAll();
    }

    async findOne(id: string): Promise<Lead | null> {
        const cachedData = await this.redisRepository.findById(id);

        if (cachedData) {
            this.logger.debug(`Cache hit for lead ${id}`);
            return cachedData as Lead;
        }

        const lead = await this.leadRepository.findOne(id);
        if (!lead) throw new NotFoundException(`Lead ${id} not found`);
        return lead;
    }

    async queueSummaryGeneration(id: string) {
        const lead = await this.findOne(id);
        await this.aiQueue.add('summarize-lead', { leadId: id, leadData: lead });
        return { message: 'Summary generation queued', leadId: id };
    }
}