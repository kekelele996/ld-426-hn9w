import { DecorStyle } from './enums';

export type PlanStatus = 'pending' | 'adopted' | 'rejected';

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  pending: '待评估',
  adopted: '装修方向',
  rejected: '暂不采用'
};

export interface PlanImageSnapshot {
  id: string;
  imageUrl: string;
  style: DecorStyle;
  tags: string[];
  sourceDescription: string;
}

export interface ComparisonPlan {
  id: string;
  name: string;
  moodBoardId: string;
  boardName: string;
  coverImageUrl: string;
  boardTags: string[];
  images: PlanImageSnapshot[];
  styleTags: DecorStyle[];
  colors: string[];
  version: number;
  isCurrent: boolean;
  status: PlanStatus;
  createdAt: string;
}
