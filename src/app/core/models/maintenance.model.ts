export interface MaintenanceRequest {
  id: number;
  requestNumber: string;
  propertyCode: string;
  roomId: number;
  roomNumber: string;
  roomType: string;
  maintenanceType: string;
  priority: string;
  status: string;
  issueDescription: string;
  resolutionNotes: string | null;
  reportedById: number;
  reportedByName: string;
  assignedToId: number;
  assignedToName: string;
  reportedAt: string;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedCost: number;
  actualCost: number | null;
  imageUrls: string;
  isUrgent: boolean;
  roomOutOfService: boolean;
  housekeepingTaskId: number | null;
  partsUsed: string | null;
  updatedAt: string | null;
}
