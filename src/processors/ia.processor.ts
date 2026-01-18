import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Inject, Logger } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { ILeadRepository } from 'src/interfaces/ILeadRepository';
import type { IRedisRepository } from 'src/interfaces/IRedisRepository';
import { Lead } from 'src/models/lead.entity';
import OpenAI from 'openai';

@Processor('ai-processing')
export class AIProcessor {
    private openai: OpenAI;

    constructor(
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
        @Inject('ILeadRepository')
        private leadRepository: ILeadRepository,
        @Inject('IRedisRepository')
        private redisRepository: IRedisRepository,
    ) {
        this.openai = new OpenAI({
            apiKey: process.env.API_KEY_OPENIA, 
        });
    }

    @Process('summarize-lead')
    async handleSummary(job: Job<{ leadId: string; leadData: Lead }>) {
        const { leadId, leadData } = job.data;
        this.logger.debug(`🤖 Procesando lead: ${leadId}`);
    
        try {
            const aiResult = await this.mockAICall(leadData);
            const lead: Lead = { ...leadData };
            lead.summary = aiResult.summary;
            lead.nextAction = aiResult.next_action;

            const req = await Promise.allSettled([
                this.leadRepository.update(leadId, lead),
                this.redisRepository.save(lead)
            ]);

            this.logger.debug(`✅ Lead actualizado exitosamente (ID: ${leadId})`);
        } catch(error) {
            this.logger.error(`❌ Fallo crítico procesando lead ${leadId}`, error.stack);
            throw error; // Solo lanzamos error si falla incluso el fallback
        }
    }

    private async mockAICall(lead: Lead): Promise<{ summary: string, next_action: string }> {
        try {
            const prompt = `
                Analiza los siguientes datos de un cliente potencial (Lead) y genera un perfil breve.
        
                Datos del Lead:
                - Nombre: ${lead.name}
                - Email: ${lead.email}
                - Teléfono: ${lead.phone || 'No disponible'}
                - Fuente: ${lead.source}
                
                Instrucciones:
                1. 'summary': Genera un resumen profesional de 1 frase sobre este lead. Si la fuente es 'external', asume que viene de una base de datos fría. Si es 'manual', asume que hubo contacto previo.
                2. 'next_action': Sugiere una acción concreta de venta (ej: "Llamar para ofrecer demo", "Enviar email de bienvenida").
                
                Responde EXCLUSIVAMENTE en formato JSON con las claves "summary" y "next_action".
            `;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Eres un experto asistente de ventas CRM. Tu salida es siempre JSON válido." },
                    { role: "user", content: prompt }
                ],
                // Importante: Forzamos el modo JSON para evitar errores de parseo
                response_format: { type: "json_object" }, 
                temperature: 0.7,
            });

            const response = {
                summary: '',
                next_action: ''
            }

            const content: string = completion.choices[0].message.content ?? JSON.stringify(response);
            const result = JSON.parse(content);

            response.next_action = result.next_action;
            response.summary = result.summary;

            return response;
        } catch (error) {
            if (error.status === 429) {
                this.logger.warn('⚠️ Cuota de OpenAI excedida. Usando generador simulado (Mock).');
            } else {
                this.logger.warn(`⚠️ Error en OpenAI (${error.message}). Usando generador simulado.`);
            }

            return this.mockResponse(lead)
        }
    }

    private mockResponse(lead: Lead) {
        return {
            summary: `[MOCK] Lead ${lead.source === 'external' ? 'frío' : 'interesado'} importado el ${new Date().toLocaleDateString()}. (Simulación por falta de cuota)`,
            next_action: "Verificar disponibilidad de créditos en OpenAI y contactar cliente."
        };
    }
}