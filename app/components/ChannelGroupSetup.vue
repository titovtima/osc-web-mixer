<template>
  <div>
    <div>
      <input type="text" v-model="model.name"/>
      <button @click="deleteGroup">x</button>
    </div>
    <div style="padding-left: 1rem;">
      <div>
        Порядок:
        <input type="number" v-model="model.order" />
      </div>
      <div>
        Скрыть
        <input type="checkbox" v-model="model.hidden"/>
      </div>
      <ChannelSetup v-for="(_, index) in model.channels" v-model="model.channels[index]"
        @delete="() => { model.channels = model.channels.filter((_, delInd) => delInd != index) }"/>
      <button @click="addChannel()">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const model: Ref<channelGroup> = defineModel({ required: true });

const emit = defineEmits(['delete']);

function addChannel() {
  let maxNum = 0;
  let maxOrd = 0;
  for (let channel of model.value.channels) {
    maxNum = Math.max(maxNum, channel.number);
    maxOrd = Math.max(maxOrd, channel.order);
  }
  model.value.channels.push({number: maxNum+1, name: 'channel ' + (maxNum+1), order: maxOrd+1, hidden: false, color: 'ffffff'})
}

function deleteGroup() {
  emit('delete');
}
</script>
