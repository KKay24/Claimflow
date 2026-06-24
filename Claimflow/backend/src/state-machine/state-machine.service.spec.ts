import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationStateMachineService } from './state-machine.service';
import { ApplicationStatus } from '../database/entities/application.entity';
import { UserRole } from '../database/entities/user.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ApplicationStateMachineService', () => {
  let service: ApplicationStateMachineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationStateMachineService],
    }).compile();

    service = module.get<ApplicationStateMachineService>(ApplicationStateMachineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Applicant Transitions', () => {
    it('should allow DRAFT -> SUBMITTED', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.DRAFT,
          ApplicationStatus.SUBMITTED,
          UserRole.APPLICANT,
        ),
      ).not.toThrow();
    });

    it('should allow RETURNED_FOR_CHANGES -> DRAFT', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.RETURNED_FOR_CHANGES,
          ApplicationStatus.DRAFT,
          UserRole.APPLICANT,
        ),
      ).not.toThrow();
    });

    it('should forbid SUBMITTED -> UNDER_REVIEW (ForbiddenException)', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.UNDER_REVIEW,
          UserRole.APPLICANT,
        ),
      ).toThrow(ForbiddenException);
    });

    it('should reject DRAFT -> APPROVED (BadRequestException)', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.DRAFT,
          ApplicationStatus.APPROVED,
          UserRole.APPLICANT,
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('Reviewer Transitions', () => {
    it('should allow SUBMITTED -> UNDER_REVIEW', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.UNDER_REVIEW,
          UserRole.REVIEWER,
        ),
      ).not.toThrow();
    });

    it('should allow UNDER_REVIEW -> APPROVED', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.APPROVED,
          UserRole.REVIEWER,
        ),
      ).not.toThrow();
    });

    it('should allow UNDER_REVIEW -> REJECTED with a comment', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.REJECTED,
          UserRole.REVIEWER,
          'Not eligible reimbursement',
        ),
      ).not.toThrow();
    });

    it('should reject UNDER_REVIEW -> REJECTED without comment', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.REJECTED,
          UserRole.REVIEWER,
        ),
      ).toThrow(BadRequestException);
    });

    it('should allow UNDER_REVIEW -> RETURNED_FOR_CHANGES with comment', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.RETURNED_FOR_CHANGES,
          UserRole.REVIEWER,
          'Please attach fuel invoice',
        ),
      ).not.toThrow();
    });

    it('should reject UNDER_REVIEW -> RETURNED_FOR_CHANGES without comment', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.RETURNED_FOR_CHANGES,
          UserRole.REVIEWER,
          '',
        ),
      ).toThrow(BadRequestException);
    });

    it('should forbid DRAFT -> SUBMITTED for Reviewer (ForbiddenException)', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.DRAFT,
          ApplicationStatus.SUBMITTED,
          UserRole.REVIEWER,
        ),
      ).toThrow(ForbiddenException);
    });

    it('should reject DRAFT -> APPROVED (BadRequestException)', () => {
      expect(() =>
        service.validateTransition(
          ApplicationStatus.DRAFT,
          ApplicationStatus.APPROVED,
          UserRole.REVIEWER,
        ),
      ).toThrow(BadRequestException);
    });
  });
});
