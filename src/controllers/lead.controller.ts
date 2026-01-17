import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, Inject } from '@nestjs/common';
import type { ILeadService } from 'src/interfaces/ILeadService';
import { CreateLeadDto } from 'src/dto/create-lead.dto';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';

@Controller('leads')
export class LeadController {
    constructor(
        @Inject('ILeadService')
        private readonly leadsService: ILeadService
    ) {}

    @Post()
    @UseGuards(ApiKeyGuard)
    create(@Body() createLeadDto: CreateLeadDto) {
        return this.leadsService.create(createLeadDto);
    }

    @Get()
    findAll() {
        return this.leadsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.leadsService.findOne(id);
    }

    @Post(':id/summarize')
    @UseGuards(ApiKeyGuard)
    async summarize(@Param('id') id: string) {
        return this.leadsService.queueSummaryGeneration(id);
    }
}