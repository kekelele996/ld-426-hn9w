import Dexie, { Table } from 'dexie';
import { ComparisonPlan, InspirationImage, MoodBoard, StyleProfile } from '../types';

export class DecorDatabase extends Dexie {
  profiles!: Table<StyleProfile, string>;
  images!: Table<InspirationImage, string>;
  moodboards!: Table<MoodBoard, string>;
  comparisons!: Table<ComparisonPlan, string>;

  constructor() {
    super('decor-style-lab');
    this.version(1).stores({
      profiles: 'userId, primaryStyle, testedAt',
      images: 'id, style, roomType',
      moodboards: 'id, createdAt',
      comparisons: 'id, moodBoardId, createdAt'
    });
    this.version(2)
      .stores({
        profiles: 'userId, primaryStyle, testedAt',
        images: 'id, style, roomType',
        moodboards: 'id, createdAt',
        comparisons: 'id, moodBoardId, createdAt'
      })
      .upgrade((tx) =>
        tx
          .table('comparisons')
          .toCollection()
          .modify((plan) => {
            plan.boardName ??= '';
            plan.coverImageUrl ??= '';
            plan.boardTags ??= [];
            plan.images ??= [];
            plan.version ??= 1;
            plan.isCurrent ??= true;
            plan.status ??= 'pending';
          })
      );
  }
}

export const db = new DecorDatabase();
