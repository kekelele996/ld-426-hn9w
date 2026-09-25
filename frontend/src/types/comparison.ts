import { DecorStyle } from './enums';

export enum PlanStatus {
  Pending = 'pending',
  Adopted = 'adopted',
  Rejected = 'rejected'
}

export interface PlanImageSnapshot {
  id: string;
  imageUrl: string;
  tags: string[];
}

export interface ComparisonPlan {
  id: string;
  name: string;
  moodBoardId: string;
  boardName: string;
  coverImageUrl: string;
  images: PlanImageSnapshot[];
  boardTags: string[];
  styleTags: DecorStyle[];
  colors: string[];
  version: number;
  isCurrent: boolean;
  status: PlanStatus;
  createdAt: string;
}
