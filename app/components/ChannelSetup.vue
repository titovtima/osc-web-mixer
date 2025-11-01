<template>
  <div>
    <input type="number" style="width: 2rem;" v-model="channel.number"/>
    <input type="text" v-model="channelRef.name" placeholder="name"/>
    <input type="text" v-model="channelRef.color" placeholder="color"/>
    <button @click="$emit('delete')">x</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  channel: {
    number: number,
    name: string,
    color: string,
  }
}>();

const emits = defineEmits(['update:channel', 'delete']);

const channelRef = ref(props.channel);
watch(() => props.channel, () => {
  channelRef.value = props.channel;
});

watch(channelRef, () => {
  emits('update:channel', channelRef.value);
})
</script>
