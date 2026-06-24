import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApplicationStatus } from '../database/entities/application.entity';
import { UserRole } from '../database/entities/user.entity';

@Injectable()
export class ApplicationStateMachineService {
  /**
   * Validates a status transition based on current status, target status, user role, and comment availability.
   * Throws BadRequestException for invalid status changes or missing comments.
   * Throws ForbiddenException if the user's role is not authorized for the transition.
   */
  validateTransition(
    currentStatus: ApplicationStatus,
    targetStatus: ApplicationStatus,
    userRole: UserRole,
    comment?: string,
  ): void {
    // 1. Enforce Role restrictions on transitions
    if (userRole === UserRole.APPLICANT) {
      const allowedApplicantTransitions = [
        { from: ApplicationStatus.DRAFT, to: ApplicationStatus.SUBMITTED },
        { from: ApplicationStatus.RETURNED_FOR_CHANGES, to: ApplicationStatus.DRAFT },
      ];

      const isValid = allowedApplicantTransitions.some(
        (t) => t.from === currentStatus && t.to === targetStatus,
      );

      if (!isValid) {
        // If it's a valid reviewer transition but requested by an applicant
        if (this.isValidReviewerTransition(currentStatus, targetStatus)) {
          throw new ForbiddenException('You are not allowed to perform this action');
        }
        throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
      }
    } else if (userRole === UserRole.REVIEWER) {
      const allowedReviewerTransitions = [
        { from: ApplicationStatus.SUBMITTED, to: ApplicationStatus.UNDER_REVIEW },
        { from: ApplicationStatus.UNDER_REVIEW, to: ApplicationStatus.APPROVED },
        { from: ApplicationStatus.UNDER_REVIEW, to: ApplicationStatus.REJECTED },
        { from: ApplicationStatus.UNDER_REVIEW, to: ApplicationStatus.RETURNED_FOR_CHANGES },
      ];

      const isValid = allowedReviewerTransitions.some(
        (t) => t.from === currentStatus && t.to === targetStatus,
      );

      if (!isValid) {
        if (this.isValidApplicantTransition(currentStatus, targetStatus)) {
          throw new ForbiddenException('You are not allowed to perform this action');
        }
        throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
      }

      // Enforce comment constraint
      if (
        (targetStatus === ApplicationStatus.REJECTED || targetStatus === ApplicationStatus.RETURNED_FOR_CHANGES) &&
        (!comment || comment.trim().length === 0)
      ) {
        throw new BadRequestException(`Comment is required for ${targetStatus}`);
      }
    } else {
      throw new ForbiddenException('Invalid user role');
    }
  }

  private isValidApplicantTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
    return (
      (from === ApplicationStatus.DRAFT && to === ApplicationStatus.SUBMITTED) ||
      (from === ApplicationStatus.RETURNED_FOR_CHANGES && to === ApplicationStatus.DRAFT)
    );
  }

  private isValidReviewerTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
    return (
      (from === ApplicationStatus.SUBMITTED && to === ApplicationStatus.UNDER_REVIEW) ||
      (from === ApplicationStatus.UNDER_REVIEW && to === ApplicationStatus.APPROVED) ||
      (from === ApplicationStatus.UNDER_REVIEW && to === ApplicationStatus.REJECTED) ||
      (from === ApplicationStatus.UNDER_REVIEW && to === ApplicationStatus.RETURNED_FOR_CHANGES)
    );
  }
}
