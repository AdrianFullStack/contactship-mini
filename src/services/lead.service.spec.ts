import { NotFoundException } from '@nestjs/common';
import { LeadsService } from './lead.service';

describe('LeadsService', () => {
  let service: LeadsService;

  const mockLead = {
    id: 'abc-123',
    name: 'María Gomez',
    email: 'maria@example.com',
    phone: '555-0000',
    source: 'test',
  } as any;

  const mockLogger = { warn: jest.fn(), debug: jest.fn(), log: jest.fn(), error: jest.fn() } as any;

  const mockLeadRepo = {
    findByEmail: jest.fn(),
    save: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  } as any;

  const mockRedisRepo = {
    save: jest.fn(),
    findById: jest.fn(),
  } as any;

  const mockQueue = {
    add: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LeadsService(mockLogger, mockLeadRepo, mockRedisRepo, mockQueue);
  });

  it('create() returns existing lead if email exists', async () => {
    mockLeadRepo.findByEmail.mockResolvedValue(mockLead);

    const dto = { name: 'X', email: 'maria@example.com' } as any;
    const result = await service.create(dto);

    expect(mockLeadRepo.findByEmail).toHaveBeenCalledWith(dto.email);
    expect(mockLeadRepo.save).not.toHaveBeenCalled();
    expect(mockRedisRepo.save).not.toHaveBeenCalled();
    expect(result).toEqual(mockLead);
  });

  it('create() saves new lead and caches it', async () => {
    mockLeadRepo.findByEmail.mockResolvedValue(null);
    mockLeadRepo.save.mockResolvedValue(mockLead);

    const dto = { name: 'María', email: 'maria@example.com' } as any;
    const result = await service.create(dto);

    expect(mockLeadRepo.findByEmail).toHaveBeenCalledWith(dto.email);
    expect(mockLeadRepo.save).toHaveBeenCalledWith(dto);
    expect(mockRedisRepo.save).toHaveBeenCalledWith(mockLead);
    expect(result).toEqual(mockLead);
  });

  it('findAll() returns array from repository', async () => {
    mockLeadRepo.findAll.mockResolvedValue([mockLead]);
    const result = await service.findAll();
    expect(mockLeadRepo.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockLead]);
  });

  it('findOne() returns cached lead when present', async () => {
    mockRedisRepo.findById.mockResolvedValue(mockLead);
    const result = await service.findOne('abc-123');
    expect(mockRedisRepo.findById).toHaveBeenCalledWith('abc-123');
    expect(result).toEqual(mockLead);
    expect(mockLeadRepo.findOne).not.toHaveBeenCalled();
  });

  it('findOne() throws NotFoundException when not found', async () => {
    mockRedisRepo.findById.mockResolvedValue(null);
    mockLeadRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('no-existe')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('queueSummaryGeneration() enqueues job and returns message', async () => {
    mockRedisRepo.findById.mockResolvedValue(mockLead);
    const result = await service.queueSummaryGeneration('abc-123');
    expect(mockQueue.add).toHaveBeenCalledWith('summarize-lead', { leadId: 'abc-123', leadData: mockLead });
    expect(result).toEqual({ message: 'Summary generation queued', leadId: 'abc-123' });
  });
});
