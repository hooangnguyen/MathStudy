import type { DraftAssignmentData } from '../../../services/assignmentService';

export interface AssignmentBuilderProps {
  classId?: string;
  totalStudents?: number;
  initialDraft?: DraftAssignmentData;
  onClose: () => void;
  onAssigned?: () => void;
  onDraftSaved?: () => void;
}
