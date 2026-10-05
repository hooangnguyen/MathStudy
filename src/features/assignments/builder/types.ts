import type { DraftAssignmentData } from '../assignmentService';

export interface AssignmentBuilderProps {
  classId?: string;
  totalStudents?: number;
  initialDraft?: DraftAssignmentData;
  onClose: () => void;
  onAssigned?: () => void;
  onDraftSaved?: () => void;
}
