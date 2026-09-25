<template>
  <article
    class="overflow-hidden bg-paper ring-1 transition"
    :class="[selected ? 'ring-2 ring-clay' : 'ring-ink/10', selectable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : '']"
    @click="$emit('select', board)"
  >
    <img :src="board.coverImageUrl" :alt="board.name" class="h-44 w-full object-cover" />
    <div class="space-y-3 p-5">
      <div class="flex items-baseline justify-between gap-2">
        <h3 class="font-display text-2xl text-ink">{{ board.name }}</h3>
        <span class="shrink-0 text-xs text-ink/50">{{ board.imageIds.length }} 张图</span>
      </div>
      <p class="text-sm text-ink/70">{{ board.description }}</p>
      <div class="flex gap-2">
        <span v-for="tag in board.tags" :key="tag" class="bg-moss/10 px-2 py-1 text-xs text-moss">{{ tag }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { MoodBoard } from '../../types';
withDefaults(defineProps<{ board: MoodBoard; selected?: boolean; selectable?: boolean }>(), { selected: false, selectable: false });
defineEmits<{ select: [board: MoodBoard] }>();
</script>
