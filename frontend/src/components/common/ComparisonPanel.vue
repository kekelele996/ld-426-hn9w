<template>
  <article class="flex flex-col overflow-hidden bg-paper ring-1 ring-ink/10">
    <div class="relative">
      <img v-if="!coverFailed && plan.coverImageUrl" :src="plan.coverImageUrl" :alt="plan.boardName" class="h-40 w-full object-cover" @error="coverFailed = true" />
      <div v-else class="flex h-40 w-full items-center justify-center bg-ink/10 text-sm text-ink/50">封面不可用</div>
      <div class="absolute left-3 top-3 flex gap-2">
        <span class="bg-ink/80 px-2 py-1 text-xs font-semibold text-paper">第 {{ plan.version }} 版</span>
        <span v-if="plan.isCurrent" class="bg-clay px-2 py-1 text-xs font-semibold text-paper">当前版</span>
      </div>
      <span class="absolute right-3 top-3 px-2 py-1 text-xs font-semibold" :class="statusBadgeClass">{{ statusLabel }}</span>
    </div>
    <div class="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h3 class="font-display text-3xl text-ink">{{ plan.name }}</h3>
        <p class="mt-1 text-xs text-ink/50">来源：{{ plan.boardName || '未命名灵感板' }} · 生成于 {{ createdAtLabel }}</p>
      </div>
      <div v-if="plan.boardTags.length" class="flex flex-wrap gap-2">
        <span v-for="tag in plan.boardTags" :key="tag" class="bg-moss/10 px-2 py-1 text-xs text-moss">{{ tag }}</span>
      </div>
      <div v-if="plan.styleTags.length" class="flex flex-wrap gap-2">
        <StyleTag v-for="style in plan.styleTags" :key="style" :style-name="style" />
      </div>
      <div v-if="plan.colors.length" class="flex gap-3">
        <ColorSwatch v-for="color in plan.colors" :key="color" :color="color" />
      </div>
      <div v-if="plan.images.length" class="grid grid-cols-3 gap-2">
        <div v-for="image in plan.images" :key="image.id" class="aspect-square w-full">
          <img v-if="!failedImages.has(image.id)" :src="image.imageUrl" :alt="image.sourceDescription" :title="image.sourceDescription" class="h-full w-full object-cover" @error="markFailed(image.id)" />
          <div v-else class="flex h-full w-full items-center justify-center bg-ink/10 text-xs text-ink/50">图片失效</div>
        </div>
      </div>
      <p v-else class="border border-dashed border-ink/20 p-4 text-center text-xs text-ink/50">生成这一版时灵感板没有图片</p>
      <div class="mt-auto flex gap-3 pt-2">
        <button
          class="flex-1 px-4 py-2 text-sm font-semibold transition"
          :class="plan.status === 'adopted' ? 'bg-ink text-paper' : 'border border-ink/20 text-ink hover:bg-ink hover:text-paper'"
          @click="$emit('decide', plan, 'adopted')"
        >定为装修方向</button>
        <button
          class="flex-1 px-4 py-2 text-sm font-semibold transition"
          :class="plan.status === 'rejected' ? 'bg-ink/50 text-paper' : 'border border-ink/20 text-ink/70 hover:bg-ink/10'"
          @click="$emit('decide', plan, 'rejected')"
        >暂不采用</button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ComparisonPlan, PLAN_STATUS_LABELS, PlanStatus } from '../../types';
import ColorSwatch from './ColorSwatch.vue';
import StyleTag from './StyleTag.vue';

const props = defineProps<{ plan: ComparisonPlan }>();
defineEmits<{ decide: [plan: ComparisonPlan, status: PlanStatus] }>();

const coverFailed = ref(false);
const failedImages = ref(new Set<string>());

const statusLabel = computed(() => PLAN_STATUS_LABELS[props.plan.status]);
const statusBadgeClass = computed(
  () =>
    ({
      adopted: 'bg-ink text-paper',
      rejected: 'bg-ink/40 text-paper',
      pending: 'bg-paper/90 text-ink'
    })[props.plan.status]
);
const createdAtLabel = computed(() => new Date(props.plan.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }));

function markFailed(id: string) {
  failedImages.value = new Set([...failedImages.value, id]);
}
</script>
