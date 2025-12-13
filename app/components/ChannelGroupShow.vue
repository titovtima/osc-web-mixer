<template>
  <div style="background: rgba(255, 255, 255, 0.05); border-radius: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;">
    <ChannelShow 
      v-for="channel in group.channels"
      :style="{ display: channel.hidden ? 'none' : 'block' }"
      :data="channel" 
      :level="levels[channel.number]"
      :pan="pans[channel.number]"
      @update:level="value => $emit('update:level', value, channel.number)"
      @update:pan="value => $emit('update:pan', value, channel.number)"
      />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  group: channelGroup,
  levels: any[],
  pans: any[]
}>();

watch(() => props.group, () => {
  props.group.channels.sort((a, b) => a.order - b.order);
});

const emit = defineEmits(['update:level', 'update:pan']);
</script>
