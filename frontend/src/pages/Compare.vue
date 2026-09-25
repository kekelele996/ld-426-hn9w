<template>
  <section class="space-y-7">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Compare</p>
      <h1 class="page-title mt-3">并排看见方案差异</h1>
      <p class="mt-3 text-sm text-ink/60">每个方案都是生成时刻的快照，原灵感板之后的改动不会影响这里的历史版本。</p>
    </div>
    <EmptyState v-if="!store.plans.length" text="还没有对比方案，去灵感板页选中一块板生成快照" />
    <div v-for="group in groupedPlans" :key="group.boardId" class="space-y-4">
      <div class="flex items-baseline gap-3">
        <h2 class="font-display text-2xl text-ink">{{ group.boardName }}</h2>
        <span class="text-xs text-ink/50">{{ group.plans.length }} 个版本</span>
      </div>
      <div class="grid gap-5 lg:grid-cols-2">
        <ComparisonPanel v-for="plan in group.plans" :key="plan.id" :plan="plan" @decide="decide" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import ComparisonPanel from '../components/common/ComparisonPanel.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useComparisonStore } from '../stores/comparisonStore';
import { ComparisonPlan, PlanStatus } from '../types';

const store = useComparisonStore();

const groupedPlans = computed(() => {
  const groups = new Map<string, { boardId: string; boardName: string; plans: ComparisonPlan[]; latest: number }>();
  for (const plan of store.plans) {
    const group = groups.get(plan.moodBoardId) ?? { boardId: plan.moodBoardId, boardName: plan.boardName || '未命名灵感板', plans: [], latest: 0 };
    group.plans.push(plan);
    group.latest = Math.max(group.latest, new Date(plan.createdAt).getTime());
    groups.set(plan.moodBoardId, group);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, plans: group.plans.sort((a, b) => b.version - a.version) }))
    .sort((a, b) => b.latest - a.latest);
});

async function decide(plan: ComparisonPlan, status: PlanStatus) {
  await store.setStatus(plan.id, status);
}

onMounted(() => store.load());
</script>
