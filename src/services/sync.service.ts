import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { ILeadRepository } from 'src/interfaces/ILeadRepository';
import type { IRedisRepository } from 'src/interfaces/IRedisRepository';
import { Lead } from 'src/models/lead.entity';

@Injectable()
export class SyncService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
        @Inject('ILeadRepository')
        private leadRepository: ILeadRepository,
        @Inject('IRedisRepository')
        private redisRepository: IRedisRepository,
    ) {}

    @Cron(CronExpression.EVERY_HOUR)
    async handleCron() {
        this.logger.debug('Starting external leads sync...');
    
        try {
            const response = await axios.get('https://randomuser.me/api/?results=10');
            const users = response.data.results;

            let newCount = 0;
            for (const user of users) {
                const email = user.email;

                const existingLead = await this.leadRepository.findByEmail(email);
                if (!existingLead) {
                    const lead: Lead = await this.leadRepository.save({
                        name: `${user.name.first} ${user.name.last}`,
                        email: email,
                        phone: user.phone,
                        source: 'external'
                    });
                    
                    await this.redisRepository.save(lead);

                    newCount++;
                }
            }
            this.logger.debug(`Sync finished. Created ${newCount} new leads.`);
        } catch (error) {
            this.logger.error('Error syncing leads', error);
        }
    }
}