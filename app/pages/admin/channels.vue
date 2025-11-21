<template>
  <div>
    <ChannelGroupSetup v-for="(_, index) in channelGroups" v-model="channelGroups[index]" 
      @delete="() => { channelGroups = channelGroups.filter((_, delInd) => delInd != index) }"/>
    <button @click="addGroup">+</button>
    <button @click="save">Save</button>
  </div>
</template>

<script setup lang="ts">
import ChannelGroupSetup from '~/components/ChannelGroupSetup.vue';

const channelGroups: Ref<channelGroup[]> = ref([]);

loadConfigPromise.then(() => {
  fetch('http://' + config.host + '/channels').then(res => res.json()).then(res => {
    channelGroups.value = res.channels;
  });
});

function addGroup() {
  let maxOrd = 0;
  for (let group of channelGroups.value) {
    maxOrd = Math.max(maxOrd, group.order);
  }
  channelGroups.value.push({order: maxOrd+1, name: 'group ' + (maxOrd+1), hidden: false, channels: []})
}

function save() {
  if (!check()) {
    // alert('incorrect configuration: 2 channels have the same numbers');
    return;
  }
  channelGroups.value.sort((a, b) => a.order - b.order);
  fetch('http://' + config.host + '/channels', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({channels: channelGroups.value})
  }).then(res => {
    if (res.ok)
      alert('saved successfully')
    else
      alert('server answered with error');
  }).catch(() => alert('error saving'));
}

function check(): boolean {
  for (let group1 of channelGroups.value) {
    for (let group2 of channelGroups.value) {
      if (group1 != group2 && group1.order == group2.order) {
        alert('groups ' + group1.name + ' and ' + group2.name + ' have the same order');
        return false
      }
      for (let channel1 of group1.channels) {
        for (let channel2 of group2.channels) {
          if (channel1 != channel2 && channel1.number == channel2.number) {
            alert('channels ' + channel1.name + ' and ' + channel2.name + ' have the same number');
            return false
          } else if (channel1 != channel2 && group1 == group2 && channel1.order == channel2.order) {
            alert('channels ' + channel1.name + ' and ' + channel2.name + ' have the same order in one group');
            return false
          }
        }
      }
    }
  }
  return true
}
</script>
