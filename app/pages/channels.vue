<template>
  <div>
    <ChannelSetup v-for="(_, index) in channels" v-model:channel="channels[index]" 
      @delete="() => { channels = channels.filter((_, delInd) => delInd != index) }"/>
    <button @click="addChannel">+</button>
    <button @click="save">Save</button>
  </div>
</template>

<script setup lang="ts">
const channels: Ref<any[]> = ref([]);

fetch(httpHost + '/channels').then(res => res.json()).then(res => {
  channels.value = res.channels;
});

function addChannel() {
  let maxNum = 0;
  for (let channel of channels.value) {
    maxNum = Math.max(maxNum, channel.number);
  }
  channels.value.push({number: maxNum+1, name: 'channel ' + (maxNum+1), color: 'ffffff'})
}

function deleteChannel(index: number) {
  channels.value = channels.value.filter((_, delInd) => index != delInd); 
}

function save() {
  if (!check()) {
    alert('incorrect configuration: 2 channels have the same numbers');
    return;
  }
  channels.value.sort((a, b) => a.number - b.number);
  fetch(httpHost + '/channels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({channels: channels.value})
  }).then(res => {
    if (res.ok)
      alert('saved successfully')
    else
      alert('server answered with error');
  }).catch(() => alert('error saving'));
}

function check(): boolean {
  for (let i1 = 0; i1 < channels.value.length; i1++) {
    for (let i2 = 0; i2 < channels.value.length; i2++) {
      if (i1 != i2 && channels.value[i1].number == channels.value[i2].number) {
        return false
      }
    }
  }
  return true
}
</script>
