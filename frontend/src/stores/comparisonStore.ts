import { defineStore } from 'pinia';
import { mockInspiration } from '../api/mockInspiration';
import { STYLE_COLORS } from '../constants/styleColors';
import { ComparisonPlan, DecorStyle, InspirationImage, MoodBoard, PlanImageSnapshot, PlanStatus } from '../types';
import { db } from '../utils/db';

function snapshotOf(images: InspirationImage[]): PlanImageSnapshot[] {
  return images.map((image) => ({ id: image.id, imageUrl: image.imageUrl, tags: [...image.tags] }));
}

function topStyles(images: InspirationImage[], limit = 3): DecorStyle[] {
  const counts = new Map<DecorStyle, number>();
  for (const image of images) counts.set(image.style, (counts.get(image.style) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([style]) => style);
}

function normalizePlan(plan: ComparisonPlan): ComparisonPlan {
  return {
    ...plan,
    boardName: plan.boardName ?? plan.name,
    coverImageUrl: plan.coverImageUrl ?? '',
    images: plan.images ?? [],
    boardTags: plan.boardTags ?? [],
    version: plan.version ?? 1,
    isCurrent: plan.isCurrent ?? true,
    status: plan.status ?? PlanStatus.Pending
  };
}

function needsNormalize(plan: ComparisonPlan) {
  return plan.status === undefined || plan.version === undefined || plan.isCurrent === undefined || plan.images === undefined || plan.boardTags === undefined || plan.boardName === undefined || plan.coverImageUrl === undefined;
}

async function sortedPlans() {
  return db.comparisons.orderBy('createdAt').reverse().toArray();
}

export const useComparisonStore = defineStore('comparison', {
  state: () => ({ plans: [] as ComparisonPlan[] }),
  actions: {
    async load() {
      let plans = await sortedPlans();
      if (!plans.length) {
        await this.seedDefaults();
        plans = await sortedPlans();
      }
      const changed = new Map<string, ComparisonPlan>();
      const normalized = plans.map((plan) => {
        if (!needsNormalize(plan)) return plan;
        const fixed = normalizePlan(plan);
        changed.set(fixed.id, fixed);
        return fixed;
      });
      const byBoard = new Map<string, ComparisonPlan[]>();
      for (const plan of normalized) {
        const group = byBoard.get(plan.moodBoardId) ?? [];
        group.push(plan);
        byBoard.set(plan.moodBoardId, group);
      }
      for (const group of byBoard.values()) {
        const currentVersion = Math.max(...group.map((plan) => plan.version));
        for (const plan of group) {
          if (plan.isCurrent !== (plan.version === currentVersion)) {
            plan.isCurrent = plan.version === currentVersion;
            changed.set(plan.id, plan);
          }
        }
      }
      if (changed.size) await db.comparisons.bulkPut([...changed.values()]);
      this.plans = normalized;
    },
    async generateFromBoard(board: MoodBoard, images: InspirationImage[]) {
      const siblings = this.plans.filter((plan) => plan.moodBoardId === board.id);
      const version = siblings.reduce((max, plan) => Math.max(max, plan.version), 0) + 1;
      for (const sibling of siblings) {
        if (sibling.isCurrent) await db.comparisons.put({ ...sibling, isCurrent: false });
      }
      const styleTags = topStyles(images);
      const plan: ComparisonPlan = {
        id: crypto.randomUUID(),
        name: board.name,
        moodBoardId: board.id,
        boardName: board.name,
        coverImageUrl: board.coverImageUrl,
        images: snapshotOf(images),
        boardTags: [...board.tags],
        styleTags,
        colors: styleTags.map((style) => STYLE_COLORS[style]),
        version,
        isCurrent: true,
        status: PlanStatus.Pending,
        createdAt: new Date().toISOString()
      };
      await db.comparisons.put(plan);
      this.plans = await sortedPlans();
      return plan;
    },
    async setStatus(planId: string, status: PlanStatus) {
      const plan = await db.comparisons.get(planId);
      if (!plan) return;
      await db.comparisons.put({ ...plan, status });
      this.plans = await sortedPlans();
    },
    async seedDefaults() {
      const byIds = (ids: string[]) => mockInspiration.filter((image) => ids.includes(image.id));
      const seeds: ComparisonPlan[] = [
        {
          id: crypto.randomUUID(),
          name: '晨光木色',
          moodBoardId: 'seed-board-1',
          boardName: '晨光木色',
          coverImageUrl: mockInspiration[0].imageUrl,
          images: snapshotOf(byIds(['img-1', 'img-3'])),
          boardTags: ['木色', '自然光'],
          styleTags: [DecorStyle.Nordic, DecorStyle.Japanese],
          colors: [DecorStyle.Nordic, DecorStyle.Japanese].map((style) => STYLE_COLORS[style]),
          version: 1,
          isCurrent: true,
          status: PlanStatus.Pending,
          createdAt: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: '克制都市',
          moodBoardId: 'seed-board-2',
          boardName: '克制都市',
          coverImageUrl: mockInspiration[1].imageUrl,
          images: snapshotOf(byIds(['img-2', 'img-4'])),
          boardTags: ['黑白', '少物'],
          styleTags: [DecorStyle.Modern, DecorStyle.Minimalist],
          colors: [DecorStyle.Modern, DecorStyle.Minimalist].map((style) => STYLE_COLORS[style]),
          version: 1,
          isCurrent: true,
          status: PlanStatus.Pending,
          createdAt: new Date().toISOString()
        }
      ];
      await db.comparisons.bulkPut(seeds);
    }
  }
});
