<template>
  <div class="mixer-container">
    <div class="mixer-header">
      <h1 class="mixer-title">DiGiCo AUX Mixer</h1>
      <div class="aux-selector-container">
        <label class="aux-selector-label">AUX Bus:</label>
        <select 
          ref="selectAuxElem" 
          @change="changeAux(selectAuxElem.value)"
          class="aux-selector"
        >
          <option 
            v-for="aux in auxes" 
            :value="aux.number" 
            :key="aux.number"
            :style="{ color: '#' + aux.color }"
            :selected="currentAuxNum == aux.number"
          >
            {{ aux.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="channels-container">
      <ChannelGroupShow 
        v-for="group in channels" 
        :group="group"
        :levels="levels[currentAuxNum]" 
        @update:level="(value, channelNum) => sendLevelToServer(channelNum, value)"
        :pans="pans[currentAuxNum]" 
        @update:pan="(value, channelNum) => sendPanToServer(channelNum, value)"
      />
      <!-- <ChannelShow 
        v-for="channel in channels" 
        :key="channel.number"
        :name="channel.name" 
        :number="channel.number"
      /> -->
    </div>

    <div class="mixer-footer">
      <div class="status-indicator" :class="{ connected: wsConnected }">
        {{ wsConnected ? 'Connected' : 'Disconnected' }}
      </div>
      <div class="current-aux-display">
        {{ auxes.find(a => a.number === currentAuxNum)?.name || 'None' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChannelGroupShow from '~/components/ChannelGroupShow.vue';

const selectAuxElem: Ref<any> = ref(null);
const currentAuxNum = ref(0);
const wsConnected = ref(false);

const channels: Ref<channelGroup[]> = ref([]);
const auxes: Ref<Array<any>> = ref([{number: 0, name: "aux 0", color: "ffffff"}]);

// console.log(config);
const levels: Ref<any> = ref(new Array(config.maxAux+1));
const pans: Ref<any> = ref(new Array(config.maxAux+1));
for (let i = 0; i <= config.maxAux; i++) {
  levels.value[i] = new Array<number>(config.maxChannel+1).fill(0);
  pans.value[i] = new Array<number>(config.maxChannel+1).fill(0);
}

const localStorageCurrentAuxKey = 'currentAux';
function changeAux(num: number) {
  console.log('changeAux for ' + num);
  currentAuxNum.value = num;
  localStorage.setItem(localStorageCurrentAuxKey, String(num));
}

loadConfigPromise.then(() => {
  fetch('http://' + config.host + "/channels").then(res => res.json()).then(res => {
    channels.value = res.channels;
    createWs();
  });

  fetch('http://' + config.host + "/auxes").then(res => res.json()).then(res => {
    auxes.value = res.auxes;
  });
});

let ws: WebSocket;

function createWs() {
  ws = new WebSocket("ws://" + config.host);

  ws.onmessage = (event) => {
    let data = JSON.parse(event.data);
    let addrLevels: string[] = data.address.split('/');
    if (config.consoleType == 's') {
      if (addrLevels.length == 6 && addrLevels[1] == 'channel' && addrLevels[3] == 'send' && addrLevels[5] == 'level') {
        let channelNum = Number(addrLevels[2]);
        let auxNum = Number(addrLevels[4]);
        levels.value[auxNum][channelNum] = data.args[0];
      }
      if (addrLevels.length == 6 && addrLevels[1] == 'channel' && addrLevels[3] == 'send' && addrLevels[5] == 'pan') { 
        let channelNum = Number(addrLevels[2]);
        let auxNum = Number(addrLevels[4]);
        pans.value[auxNum][channelNum] = data.args[0];
      }
    } else {
      if (addrLevels.length == 7 && addrLevels[2] == 'Input_Channels' && addrLevels[4] == 'Aux_Send' && addrLevels[6] == 'send_level') {
        let channelNum = Number(addrLevels[3]);
        let auxNum = Number(addrLevels[5]);
        levels.value[auxNum][channelNum] = sliderToDb(data.args[0] * 100);
      }
      if (addrLevels.length == 7 && addrLevels[2] == 'Input_Channels' && addrLevels[4] == 'Aux_Send' && addrLevels[6] == 'send_pan') {
        let channelNum = Number(addrLevels[3]);
        let auxNum = Number(addrLevels[5]);
        pans.value[auxNum][channelNum] = sliderToPan(data.args[0] * 100);
      }
    }
  };

  ws.onclose = () => {
    wsConnected.value = false;
    setTimeout(createWs, 2000);
  }

  ws.onerror = () => {
    wsConnected.value = false;
    ws.close();
  }

  ws.onopen = () => {
    wsConnected.value = true;
    ws.send(JSON.stringify({address: 'init', args:[]}));
  }
}

function sendLevelToServer(channel: number, value: number) {
  let aux = currentAuxNum.value;
  if (ws && ws.readyState === WebSocket.OPEN) {
    if (config.consoleType == 's') {
      ws.send(JSON.stringify({address: '/channel/' + channel + '/send/' + aux + '/level', args: [value]}))
    } else {
      ws.send(JSON.stringify({address: '/sd/Input_Channels/' + channel + '/Aux_Send/' + aux + '/send_level', 
      // ws.send(JSON.stringify({address: '/Input_Channels/' + channel + '/Aux_Send/' + aux + '/send_level', 
        args: [dbToSlider(value) / 100.0]}))
    }
    levels.value[aux][channel] = value;
  }
}

function sendPanToServer(channel: number, value: number) {
  let aux = currentAuxNum.value;
  if (ws && ws.readyState === WebSocket.OPEN) {
    if (config.consoleType == 's') {
      ws.send(JSON.stringify({address: '/channel/' + channel + '/send/' + aux + '/pan', args: [value]}))
    } else {
      ws.send(JSON.stringify({address: '/sd/Input_Channels/' + channel + '/Aux_Send/' + aux + '/send_pan',
      // ws.send(JSON.stringify({address: '/Input_Channels/' + channel + '/Aux_Send/' + aux + '/send_pan',
        args: [panToSlider(value) / 100.0]}))
    }
    pans.value[aux][channel] = value;
  }
}

onMounted(() => {
  try {
    currentAuxNum.value = Number(localStorage.getItem(localStorageCurrentAuxKey));
  } catch(_) {
  }
  if (currentAuxNum.value == 0)
    currentAuxNum.value = 1;
})
</script>

<style scoped>
.mixer-container {
  min-height: 100vh;
  min-height: 100dvh; /* Use dynamic viewport height for mobile */
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 0.5rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent double scrollbars */
}

.mixer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0; /* Prevent header from shrinking */
}

.mixer-title {
  font-size: 1.25rem;
  font-weight: 300;
  margin: 0;
  background: linear-gradient(45deg, #00b4db, #0083b0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.aux-selector-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.aux-selector-label {
  font-size: 0.9rem;
  color: #ccc;
}

.aux-selector {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.5rem;
  color: white;
  font-size: 0.9rem;
  min-width: 120px;
}

.channels-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex: 1; /* Take available space */
  overflow-y: auto; /* Enable scrolling only for channels */
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* Hide scrollbar for Webkit browsers */
.channels-container::-webkit-scrollbar {
  display: none;
}

.mixer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0; /* Prevent footer from shrinking */
  margin-top: auto; /* Push footer to bottom */
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  background: #e74c3c;
}

.status-indicator.connected {
  background: #27ae60;
}

.current-aux-display {
  font-size: 0.9rem;
  color: #00b4db;
  font-weight: 500;
}

@media (max-width: 768px) {
  .mixer-container {
    padding: 0.25rem;
    min-height: 100dvh; /* Ensure mobile viewport height */
    height: 100dvh; /* Fixed height for mobile */
  }
  
  .mixer-header {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .mixer-title {
    font-size: 1.1rem;
  }
  
  .channels-container {
    gap: 0.25rem;
    /* Remove max-height and let flex handle it */
  }
  
  .mixer-footer {
    padding: 0.5rem;
  }
}

/* Special fix for mobile browsers with bottom bars */
@supports (padding: max(0px)) {
  .mixer-container {
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  }
}

/* Fix for iOS Safari */
@supports (-webkit-touch-callout: none) {
  .mixer-container {
    min-height: -webkit-fill-available;
  }
}
</style>
