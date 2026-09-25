<template>
  <section class="space-y-7">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Compare</p>
      <h1 class="page-title mt-3">并排看见方案差异</h1>
    </div>
    <EmptyState v-if="!groups.length" text="还没有对比方案，去灵感板页选中一块板生成" />
    <div v-for="group in groups" :key="group.boardId" class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="font-display text-2xl text-ink">{{ group.boardName }}</h2>
        <span class="text-xs text-ink/50">共 {{ group.plans.length }} 版</span>
        <span v-if="group.sourceNote" class="bg-ochre/15 px-2 py-1 text-xs text-ochre">{{ group.sourceNote }}</span>
      </div>
      <div class="grid gap-5 lg:grid-cols-2">
        <ComparisonPanel v-for="plan in group.plans" :key="plan.id" :plan="plan" @set-status="setStatus" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import ComparisonPanel from '../components/common/ComparisonPanel.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useComparisonStore } from '../stores/comparisonStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { ComparisonPlan, PlanStatus } from '../types';

const store = useComparisonStore();
const boards = useMoodboardStore();

const groups = computed(() => {
  const byBoard = new Map<string, ComparisonPlan[]>();
  for (const plan of store.plans) {
    const group = byBoard.get(plan.moodBoardId) ?? [];
    group.push(plan);
    byBoard.set(plan.moodBoardId, group);
  }
  return [...byBoard.entries()].map(([boardId, plans]) => {
    const sorted = [...plans].sort((a, b) => b.version - a.version);
    const source = boards.boards.find((board) => board.id === boardId);
    const sourceNote = !source
      ? '原板已删除 · 快照完整保留'
      : source.imageIds.length === 0 && sorted.some((plan) => plan.images.length)
        ? '原板已清空 · 快照完整保留'
        : '';
    return { boardId, boardName: sorted[0].boardName, plans: sorted, sourceNote };
  });
});

async function setStatus(id: string, status: PlanStatus) {
  await store.setStatus(id, status);
}

onMounted(async () => {
  await boards.load();
  await store.load();
});
</script>
