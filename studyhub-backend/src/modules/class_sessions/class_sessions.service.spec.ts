import { Test, TestingModule } from '@nestjs/testing';
import { ClassSessionsService } from './class_sessions.service';

describe('ClassSessionsService', () => {
  let service: ClassSessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassSessionsService],
    }).compile();

    service = module.get<ClassSessionsService>(ClassSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
