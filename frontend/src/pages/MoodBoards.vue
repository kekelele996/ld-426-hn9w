<template>
  <section class="space-y-7">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.25em] text-clay">Moodboards</p>
        <h1 class="page-title mt-3">把收藏重排成方案线索</h1>
        <p class="mt-3 text-sm text-ink/50">点击卡片选中一块灵感板，生成对比方案时会记下它当前的封面、图片和标签</p>
      </div>
      <button class="bg-ink px-5 py-3 font-semibold text-paper" @click="create">新建灵感板</button>
    </div>
    <div v-if="boards.boards.length" class="grid gap-5 lg:grid-cols-3">
      <div
        v-for="board in boards.boards"
        :key="board.id"
        class="cursor-pointer transition"
        :class="selectedId === board.id ? 'ring-2 ring-clay' : 'ring-1 ring-transparent hover:ring-ink/25'"
        @click="select(board.id)"
      >
        <MoodBoardCard :board="board" />
      </div>
    </div>
    <EmptyState v-else text="还没有灵感板，先新建一块" />
    <div v-if="selectedBoard" class="space-y-5 bg-paper p-6 ring-1 ring-ink/10">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="font-display text-3xl text-ink">「{{ selectedBoard.name }}」</h2>
          <p class="mt-1 text-sm text-ink/60">已选中 · 生成快照将记录封面、{{ selectedImages.length }} 张图片和 {{ selectedBoard.tags.length }} 个标签</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="bg-ink px-5 py-3 font-semibold text-paper transition hover:bg-clay" @click="generate">生成对比方案</button>
          <button class="border border-ink/20 px-4 py-3 text-sm text-ink" @click="clear">清空图片</button>
          <button class="border border-clay/60 px-4 py-3 text-sm text-clay" @click="remove">删除灵感板</button>
        </div>
      </div>
      <p v-if="generatedTip" class="bg-moss/10 px-4 py-3 text-sm text-moss">
        {{ generatedTip }}，<RouterLink to="/compare" class="font-semibold underline">去方案对比查看</RouterLink>
      </p>
      <DraggableGrid :images="selectedImages" @reorder="selectedImages = $event" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import DraggableGrid from '../components/common/DraggableGrid.vue';
import EmptyState from '../components/common/EmptyState.vue';
import MoodBoardCard from '../components/common/MoodBoardCard.vue';
import { useComparisonStore } from '../stores/comparisonStore';
import { useInspirationStore } from '../stores/inspirationStore';
import { useMoodboardStore } from '../stores/moodboardStore';
import { InspirationImage, MoodBoard } from '../types';

const boards = useMoodboardStore();
const inspirations = useInspirationStore();
const comparisons = useComparisonStore();
const selectedId = ref('');
const selectedImages = ref<InspirationImage[]>([]);
const generatedTip = ref('');

const imageMap = computed(() => new Map(inspirations.images.map((image) => [image.id, image])));
const selectedBoard = computed(() => boards.boards.find((board) => board.id === selectedId.value));

function resolveImages(board: MoodBoard) {
  return board.imageIds.map((id) => imageMap.value.get(id)).filter(Boolean) as InspirationImage[];
}

function select(boardId: string) {
  selectedId.value = boardId;
  generatedTip.value = '';
  const board = boards.boards.find((item) => item.id === boardId);
  selectedImages.value = board ? resolveImages(board) : [];
}

async function create() {
  await boards.createBoard('材质实验 ' + (boards.boards.length + 1), '手动整理的风格方向', []);
  const newest = boards.boards[0];
  if (newest) select(newest.id);
}

async function generate() {
  if (!selectedBoard.value) return;
  const plan = await comparisons.generateFromBoard(selectedBoard.value, selectedImages.value);
  generatedTip.value = `已生成「${plan.boardName}」第 ${plan.version} 版并标为当前版`;
}

async function clear() {
  if (!selectedBoard.value) return;
  await boards.clearImages(selectedBoard.value.id);
  selectedImages.value = [];
}

async function remove() {
  if (!selectedBoard.value) return;
  if (!window.confirm(`删除「${selectedBoard.value.name}」后不可恢复，已生成的对比方案会保留快照。确认删除？`)) return;
  await boards.removeBoard(selectedBoard.value.id);
  const first = boards.boards[0];
  if (first) select(first.id);
  else {
    selectedId.value = '';
    selectedImages.value = [];
  }
}

onMounted(async () => {
  await inspirations.seed();
  await boards.load();
  await comparisons.load();
  const first = boards.boards[0];
  if (first) select(first.id);
});
</script>
