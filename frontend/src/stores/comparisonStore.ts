import { defineStore } from 'pinia';
import { mockInspiration } from '../api/mockInspiration';
import { STYLE_COLORS } from '../constants/styleColors';
import { ComparisonPlan, DecorStyle, InspirationImage, MoodBoard, PlanImageSnapshot, PlanStatus } from '../types';
import { db } from '../utils/db';

function snapshotImages(images: InspirationImage[]): PlanImageSnapshot[] {
  return images.map((image) => ({
    id: image.id,
    imageUrl: image.imageUrl,
    style: image.style,
    tags: [...image.tags],
    sourceDescription: image.sourceDescription
  }));
}

export const useComparisonStore = defineStore('comparison', {
  state: () => ({ plans: [] as ComparisonPlan[] }),
  actions: {
    async load() {
      await this.reload();
      if (!this.plans.length) await this.seed();
    },
    async reload() {
      this.plans = await db.comparisons.orderBy('createdAt').reverse().toArray();
    },
    async seed() {
      const seeds: Array<[string, DecorStyle[], string[]]> = [
        ['晨光木色', [DecorStyle.Nordic, DecorStyle.Japanese], ['木色', '自然光']],
        ['克制都市', [DecorStyle.Modern, DecorStyle.Minimalist], ['黑白', '少物']]
      ];
      for (const [name, styles, boardTags] of seeds) {
        const images = mockInspiration.filter((image) => styles.includes(image.style));
        const plan = this.buildPlan(name, 'seed-board', '示例灵感板', images[0]?.imageUrl ?? '', boardTags, images, 1);
        await db.comparisons.put(plan);
      }
      await this.reload();
    },
    buildPlan(name: string, moodBoardId: string, boardName: string, coverImageUrl: string, boardTags: string[], images: InspirationImage[], version: number): ComparisonPlan {
      const styleTags = [...new Set(images.map((image) => image.style))];
      return {
        id: crypto.randomUUID(),
        name,
        moodBoardId,
        boardName,
        coverImageUrl,
        boardTags: [...boardTags],
        images: snapshotImages(images),
        styleTags,
        colors: styleTags.map((style) => STYLE_COLORS[style]),
        version,
        isCurrent: true,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
    },
    async generateFromBoard(board: MoodBoard, images: InspirationImage[]) {
      const siblings = this.plans.filter((plan) => plan.moodBoardId === board.id);
      const version = siblings.reduce((max, plan) => Math.max(max, plan.version), 0) + 1;
      for (const sibling of siblings) {
        if (sibling.isCurrent) await db.comparisons.put({ ...sibling, isCurrent: false });
      }
      const plan = this.buildPlan(`${board.name} · 第${version}版`, board.id, board.name, board.coverImageUrl, board.tags, images, version);
      await db.comparisons.put(plan);
      await this.reload();
      return plan;
    },
    async setStatus(planId: string, status: PlanStatus) {
      const plan = await db.comparisons.get(planId);
      if (!plan) return;
      await db.comparisons.put({ ...plan, status: plan.status === status ? 'pending' : status });
      await this.reload();
    }
  }
});
