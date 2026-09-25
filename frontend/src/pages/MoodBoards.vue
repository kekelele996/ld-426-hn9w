<template>
  <section class="space-y-7">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Moodboards</p>
        <h1 class="page-title mt-3">把收藏重排成方案线索</h1>
      </div>
      <button class="bg-ink px-5 py-3 font-semibold text-paper" @click="create">新建灵感板</button>
    </div>
    <EmptyState v-if="!boards.boards.length" text="还没有灵感板，先新建一块" />
    <div class="grid gap-5 lg:grid-cols-3">
      <MoodBoardCard
        v-for="board in boards.boards"
        :key="board.id"
        :board="board"
        selectable
        :selected="board.id === selectedBoardId"
        @select="select"
      />
    </div>
    <div v-if="selectedBoard" class="bg-paper p-6 ring-1 ring-ink/10">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="font-display text-3xl text-ink">{{ selectedBoard.name }}</h2>
          <p class="mt-1 text-sm text-ink/60">拖拽排列图片，或把当前状态生成为对比方案快照</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button class="bg-clay px-5 py-3 font-semibold text-paper" @click="generate">生成对比方案</button>
          <button class="border border-ink/20 px-5 py-3 text-sm text-ink" @click="clear">清空图片</button>
          <button class="border border-ink/20 px-5 py-3 text-sm text-ink" @click="remove">删除灵感板</button>
        </div>
      </div>
      <p v-if="feedback" class="mt-4 bg-moss/10 px-4 py-2 text-sm text-moss">
        {{ feedback }}
        <RouterLink to="/compare" class="font-semibold underline">前往方案对比</RouterLink>
      </p>
      <DraggableGrid v-if="selectedImages.length" class="mt-5" :images="selectedImages" @reorder="reorder" />
      <EmptyState v-else class="mt-5" text="这块板还没有图片，去灵感图集收藏几张" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import DraggableGrid from '../components/common/DraggableGrid.vue';
import EmptyState from '../components/common/EmptyState.vue';
import MoodBoardCard from '../components/common/MoodBoardCard.vue';
import { useComparisonStore } from '../stores/comparisonStore';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { InspirationImage, MoodBoard } from '../types';

const boards = useMoodboardStore();
const inspirations = useInspirationStore();
const comparison = useComparisonStore();
const selectedBoardId = ref('');
const selectedImages = ref<InspirationImage[]>([]);
const feedback = ref('');

const imageMap = computed(() => new Map(inspirations.images.map((image) => [image.id, image])));
const selectedBoard = computed(() => boards.boards.find((board) => board.id === selectedBoardId.value));

watch(
  [selectedBoard, imageMap],
  () => {
    const board = selectedBoard.value;
    selectedImages.value = board ? (board.imageIds.map((id) => imageMap.value.get(id)).filter(Boolean) as InspirationImage[]) : [];
  },
  { immediate: true }
);

async function create() {
  await boards.createBoard('材质实验 ' + (boards.boards.length + 1), '手动整理的风格方向', []);
  selectedBoardId.value = boards.boards[0]?.id ?? '';
}

function select(board: MoodBoard) {
  selectedBoardId.value = board.id;
  feedback.value = '';
}

async function reorder(images: InspirationImage[]) {
  selectedImages.value = images;
  if (selectedBoard.value) await boards.updateImages(selectedBoard.value.id, images.map((image) => image.id));
}

async function generate() {
  if (!selectedBoard.value) return;
  const plan = await comparison.generateFromBoard(selectedBoard.value, selectedImages.value);
  feedback.value = `已生成「${plan.name}」，原板后续改动不会影响这一版。`;
}

async function clear() {
  if (!selectedBoard.value) return;
  await boards.clearImages(selectedBoard.value.id);
}

async function remove() {
  if (!selectedBoard.value) return;
  await boards.removeBoard(selectedBoard.value.id);
  selectedBoardId.value = boards.boards[0]?.id ?? '';
}

onMounted(async () => {
  await inspirations.seed();
  await boards.load();
  await comparison.load();
  if (!selectedBoardId.value) selectedBoardId.value = boards.boards[0]?.id ?? '';
});
</script>
