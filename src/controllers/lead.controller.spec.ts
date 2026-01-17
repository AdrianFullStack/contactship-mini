import { Test, TestingModule } from '@nestjs/testing';
import { LeadController } from './lead.controller';

describe('LeadController', () => {
  let controller: LeadController;

  const mockLead = {
    id: '123',
    name: 'Juan Perez',
    email: 'juan@example.com',
    phone: '555-1234',
    source: 'test',
  } as any;

  const mockService = {
    create: jest.fn().mockResolvedValue(mockLead),
    findAll: jest.fn().mockResolvedValue([mockLead]),
    findOne: jest.fn().mockResolvedValue(mockLead),
    queueSummaryGeneration: jest.fn().mockResolvedValue({ message: 'Summary generation queued', leadId: mockLead.id }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadController],
      providers: [
        {
          provide: 'ILeadService',
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<LeadController>(LeadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create() should call service.create and return created lead', async () => {
    const dto = { name: 'Juan Perez', email: 'juan@example.com', phone: '555-1234' };
    const result = await controller.create(dto as any);
    expect(mockService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockLead);
  });

  it('findAll() should return array of leads', async () => {
    const result = await controller.findAll();
    expect(mockService.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockLead]);
  });

  it('findOne() should return a lead by id', async () => {
    const result = await controller.findOne('123');
    expect(mockService.findOne).toHaveBeenCalledWith('123');
    expect(result).toEqual(mockLead);
  });

  it('summarize() should enqueue summary generation and return message', async () => {
    const result = await controller.summarize('123');
    expect(mockService.queueSummaryGeneration).toHaveBeenCalledWith('123');
    expect(result).toEqual({ message: 'Summary generation queued', leadId: mockLead.id });
  });
});
