<template>
  <div>
    <Channel name="channel name" :value="channelValue" @update:value="(value) => sendToServer(13, 1, value)"/>
  </div>
</template>

<script setup lang="ts">
// const host = '10.240.107.95:8002/'
// const host = '127.0.0.1:8002/'
const host = '192.168.1.109:8002'
// const host = 'http://10.96.250.95:8002/'
// const host = 'http://127.0.0.1:8002/'

const channelValue = ref(0);

let ws = new WebSocket("ws://" + host);

createWs();

function createWs() {
  let ws = new WebSocket("ws://" + host);

  ws.onmessage = (event) => {
    let data = JSON.parse(event.data);
    if (data.address == '/channel/13/fader') {
      channelValue.value = data.args[0];
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
  ws.send(JSON.stringify({address: '/channel/13/fader', args: [value]}))
}


</script>
