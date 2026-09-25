<template>
  <article class="overflow-hidden bg-paper ring-1 ring-ink/10">
    <div class="relative">
      <img v-if="plan.coverImageUrl && !coverFailed" :src="plan.coverImageUrl" :alt="plan.boardName" class="h-40 w-full object-cover" @error="coverFailed = true" />
      <div v-else class="flex h-40 items-center justify-center bg-ink/10 text-sm text-ink/50">无封面图</div>
      <div class="absolute left-3 top-3 flex gap-2">
        <span class="bg-ink/85 px-2 py-1 text-xs font-semibold text-paper">第 {{ plan.version }} 版</span>
        <span v-if="plan.isCurrent" class="bg-clay px-2 py-1 text-xs font-semibold text-paper">当前版</span>
      </div>
      <span v-if="statusLabel" class="absolute right-3 top-3 px-2 py-1 text-xs font-semibold" :class="statusBadgeClass">{{ statusLabel }}</span>
    </div>
    <div class="space-y-4 p-6">
      <div>
        <h3 class="font-display text-2xl text-ink">{{ plan.name }}</h3>
        <p class="mt-1 text-xs text-ink/50">生成于 {{ createdAtText }} · 快照不受原板变化影响</p>
      </div>
      <div v-if="plan.boardTags.length" class="flex flex-wrap gap-2">
        <span v-for="tag in plan.boardTags" :key="tag" class="bg-moss/10 px-2 py-1 text-xs text-moss">{{ tag }}</span>
      </div>
      <div v-if="plan.images.length" class="grid grid-cols-4 gap-2">
        <img v-for="image in visibleImages" :key="image.id" :src="image.imageUrl" :alt="image.tags.join(' ')" class="aspect-square w-full object-cover" />
        <div v-if="hiddenCount" class="flex aspect-square items-center justify-center bg-ink/5 text-sm text-ink/60">+{{ hiddenCount }}</div>
      </div>
      <p v-else class="border border-dashed border-ink/15 px-3 py-2 text-xs text-ink/50">生成这一版时灵感板暂无图片</p>
      <div class="flex flex-wrap gap-2">
        <StyleTag v-for="style in plan.styleTags" :key="style" :style-name="style" />
      </div>
      <div class="flex gap-3">
        <ColorSwatch v-for="color in plan.colors" :key="color" :color="color" />
      </div>
      <div class="flex flex-wrap gap-2 pt-1">
        <button
          class="px-4 py-2 text-sm font-semibold transition"
          :class="plan.status === PlanStatus.Adopted ? 'bg-moss text-paper' : 'border border-moss/50 text-moss'"
          @click="toggle(PlanStatus.Adopted)"
        >{{ plan.status === PlanStatus.Adopted ? '已定为装修方向' : '定为装修方向' }}</button>
        <button
          class="px-4 py-2 text-sm font-semibold transition"
          :class="plan.status === PlanStatus.Rejected ? 'bg-ink/70 text-paper' : 'border border-ink/25 text-ink/60'"
          @click="toggle(PlanStatus.Rejected)"
        >{{ plan.status === PlanStatus.Rejected ? '已标暂不采用' : '暂不采用' }}</button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ComparisonPlan, PlanStatus } from '../../types';
import ColorSwatch from './ColorSwatch.vue';
import StyleTag from './StyleTag.vue';

const props = defineProps<{ plan: ComparisonPlan }>();
const emit = defineEmits<{ 'set-status': [id: string, status: PlanStatus] }>();
const coverFailed = ref(false);

const MAX_VISIBLE = 8;
const visibleImages = computed(() => props.plan.images.slice(0, MAX_VISIBLE));
const hiddenCount = computed(() => Math.max(0, props.plan.images.length - MAX_VISIBLE));
const statusLabel = computed(() => (props.plan.status === PlanStatus.Adopted ? '装修方向' : props.plan.status === PlanStatus.Rejected ? '暂不采用' : ''));
const statusBadgeClass = computed(() => (props.plan.status === PlanStatus.Adopted ? 'bg-moss text-paper' : 'bg-ink/70 text-paper'));
const createdAtText = computed(() => new Date(props.plan.createdAt).toLocaleString('zh-CN'));

function toggle(status: PlanStatus) {
  emit('set-status', props.plan.id, props.plan.status === status ? PlanStatus.Pending : status);
}
</script>
