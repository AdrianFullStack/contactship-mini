import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Inject, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { ILeadRepository } from 'src/interfaces/ILeadRepository';
import type { IRedisRepository } from 'src/interfaces/IRedisRepository';
import { Lead } from 'src/models/lead.entity';

@Processor('ai-processing')
export class AIProcessor {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
        @Inject('ILeadRepository')
        private leadRepository: ILeadRepository,
        @Inject('IRedisRepository')
        private redisRepository: IRedisRepository,
    ) {}

    @Process('summarize-lead')
    async handleSummary(job: Job<{ leadId: string; leadData: Lead }>) {
        this.logger.debug(`Processing AI summary for lead: ${job.data.leadId}`);
    
        const aiResult = await this.mockAICall(job.data.leadData);
        const lead: Lead = { ...job.data.leadData };
        lead.summary = aiResult.summary;
        lead.nextAction = aiResult.next_action;

        await Promise.all([
            this.leadRepository.update(job.data.leadId, lead),
            this.redisRepository.save(lead)
        ]);

        this.logger.debug(`Finish processing AI summary for lead: ${job.data.leadId}`);
    }

    // Simulación para cumplir el requisito sin gastar créditos en la prueba
    private async mockAICall(lead: any): Promise<{ summary: string, next_action: string }> {
        // Aquí iría la llamada real a OpenAI API
        return new Promise(resolve => setTimeout(() => {
            resolve({
                summary: `Resumen generado por IA para ${lead.name}. Cliente potencial interesado en servicios backend.`,
                next_action: "Contactar vía email para agendar demo técnica."
            });
        } , 1000));
    }
}