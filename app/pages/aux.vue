<template>
  <div>
    <div>
      <select ref="selectAuxElem" @change="changeAux(selectAuxElem.value)">
        <option v-for="aux in auxes" :value="aux.number">{{ aux.name }}</option>
      </select>
    </div>
    <ChannelShow v-for="channel in channels" :name="channel.name" 
      :value="values[currentAuxNum][channel.number]" @update:value="(value) => sendToServer(channel.number, currentAuxNum, value)"/>
  </div>
</template>

<script setup lang="ts">
const selectAuxElem: Ref<any> = ref(null);
const currentAuxNum = ref(0);

const channels: Ref<Array<any>> = ref([]);
const auxes: Ref<Array<any>> = ref([{number: 0, name: "aux 0", color: "ffffff"}]);

const maxAux = 32;
const maxChannel = 64;

const values: Ref<any> = ref(new Array(maxAux+1));
for (let i = 0; i <= maxAux; i++) {
  values.value[i] = new Array<number>(maxChannel+1).fill(0);
}

function changeAux(num: number) {
  console.log('changeAux for ' + num);
  currentAuxNum.value = num;
}

fetch(httpHost + "/channels").then(res => res.json()).then(res => {
  channels.value = res.channels;
  createWs();
});

fetch(httpHost + "/auxes").then(res => res.json()).then(res => {
  auxes.value = res.auxes;
  currentAuxNum.value = 1;
});

let ws = new WebSocket("ws://" + host);

function createWs() {
  let ws = new WebSocket("ws://" + host);

  ws.onmessage = (event) => {
    let data = JSON.parse(event.data);
    let levels: string[] = data.address.split('/');
    if (levels.length == 6 && levels[1] == 'channel' && levels[3] == 'send' && levels[5] == 'level') {
      let channelNum = Number(levels[2]);
      let auxNum = Number(levels[4]);
      values.value[auxNum][channelNum] = data.args[0];
    }
  };

  ws.onclose = () => {
    createWs();
  }

  ws.onerror = () => {
    ws.close();
    createWs();
  }

  ws.onopen = () => {
    ws.send(JSON.stringify({address: 'init', args:[]}));
  }
}

function sendToServer(channel: number, aux: number, value: number) {
  ws.send(JSON.stringify({address: '/channel/' + channel + '/send/' + aux + '/level', args: [value]}))
}
</script>
