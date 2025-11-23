<template>
  <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;">
    <div style="background: rgba(255, 255, 255, 0.08); cursor: pointer; user-select: none; padding: 0.75rem 1rem"
      @click="isExpanded = !isExpanded">
      <span>
        {{ isExpanded ? '▼' : '►' }}
      </span>
      {{ group.name }}
    </div>
    <div v-if="isExpanded">
      <ChannelShow 
        v-for="channel in group.channels"
        :data="channel" 
        :level="levels[channel.number]"
        :pan="pans[channel.number]"
        @update:level="value => $emit('update:level', value, channel.number)"
        @update:pan="value => $emit('update:pan', value, channel.number)"
        />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  group: channelGroup,
  levels: any[],
  pans: any[]
}>();

const emit = defineEmits(['update:level', 'update:pan']);

const isExpanded = ref(true);
</script>
