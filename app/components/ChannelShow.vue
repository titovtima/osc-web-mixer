<template>
  <div class="channel-strip">
    <div class="channel-header">
      <div class="channel-number">{{ data.number }}</div>
      <div class="channel-name">{{ data.name }}</div>
      <span v-if="currentAux.stereo">
        <button @click="panShow = true" class="pan-show-btn" :class="{ active: panShow }" style="float: right;">
          pan
        </button>
        <button @click="panShow = false" class="pan-show-btn" :class="{ active: !panShow }" style="float: right;">
          lvl
        </button>
      </span>
    </div>
    
    <div class="controls-row">
      <!-- Level Control -->
      <div v-if="!panShow || !currentAux.stereo" class="control-group">
        <div style="display: flex; flex-direction: row; gap: 0.5rem; align-items: center;">
          <button 
            class="control-button-small"
            style="flex: 0 1 2rem;"
            @click="decreaseLevel"
          >
            −
          </button>
          <div 
            class="level-track-container"
            style="display: inline-block; flex: 1 1 3rem"
            ref="barContainer"
          >
            <div 
              class="level-track-horizontal" 
              ref="bar"
              @click="handleLevelClick"
            >
              <div 
                class="level-fill-horizontal" 
                :style="{ width: dbToSlider(levelRef) * 100 / maxValue + '%' }"
              ></div>
            </div>
            <div 
              class="level-handle-horizontal" 
              :style="{ left: dbToSlider(levelRef) * 100 / maxValue + '%' }"
              @pointerdown="startLevelDrag"
            >
              <div class="level-value">{{ formatLevelValue(levelRef) }}</div>
            </div>
          </div>
          <button 
            class="control-button-small"
            style="flex: 0 1 2rem;"
            @click="increaseLevel"
          >
            +
          </button>
          <!-- <div class="level-buttons">
          </div> -->
        </div>
      </div>

      <!-- Pan Control -->
      <div v-else class="control-group">
        <div style="display: flex; flex-direction: row; gap: 0.5rem;">
          <button 
            class="control-button-small"
            style="flex: 0 1 2rem;"
            @click="decreasePan"
          >
            L
          </button>
          <div 
            class="pan-track-container"
            style="flex: 1 1 3rem;"
            ref="panContainer"
          >
            <div 
              class="pan-track-horizontal" 
              ref="panElem"
              @click="handlePanClick"
            >
              <div class="pan-center-marker"></div>
            </div>
            <div 
              class="pan-handle-horizontal" 
              :style="{ left: panToSlider(panRef) + '%' }"
              @pointerdown="startPanDrag"
            >
              <div class="pan-value">{{ formatPanValue(panRef) }}</div>
            </div>
          </div>
          <button 
            class="control-button-small"
            style="flex: 0 1 2rem;"
            @click="centerPan"
          >
            C
          </button>
          <button 
            class="control-button-small"
            style="flex: 0 1 2rem;"
            @click="increasePan"
          >
            R
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
let props = defineProps<{
  data: channel,
  level: number,
  pan: number,
}>();

let emit = defineEmits(['update:level', 'update:pan']);

let bar = ref();
let barContainer = ref();
let panElem = ref();
let panContainer = ref();
let panShow = ref(false);

let panRef = ref(props.pan);
watch(() => props.pan, () => {
  panRef.value = props.pan;
});

let levelRef = ref(props.level);
watch(() => props.level, () => {
  levelRef.value = props.level;
});

const currentAux: Ref<aux> = useState('currentAux');

// Drag state management
let isLevelDragging = false;
let isPanDragging = false;

function formatPanValue(pan: number): string {
  // Use larger epsilon (0.5%) to show C for values very close to center
  const epsilon = 0.005; // 0.5% of the range
  if (Math.abs(pan) < epsilon) return 'C';
  return (pan > 0 ? 'R' : 'L') + Math.abs(Math.round(pan * 100));
}

function formatLevelValue(level: number): string {
  if (level == -150) return '-inf';
  const rounded = Math.round(level * 10) / 10;
  return rounded >= 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1);
}

// Simple click handlers for buttons (no hold functionality)
function increaseLevel() {
  let newValue = Math.min(maxDbValue, levelRef.value + step);
  if (levelRef.value == -150)
    newValue = minDbValue + step;
  levelRef.value = newValue;
  emit('update:level', newValue);
}

function decreaseLevel() {
  let newValue = levelRef.value - step;
  if (newValue <= minDbValue)
    newValue = -150;
  levelRef.value = newValue;
  emit('update:level', newValue);
}

function increasePan() {
  const newValue = Math.min(maxPanValue, panRef.value + panStep);
  panRef.value = newValue;
  emit('update:pan', newValue);
}

function decreasePan() {
  const newValue = Math.max(minPanValue, panRef.value - panStep);
  panRef.value = newValue;
  emit('update:pan', newValue);
}

function centerPan() {
  panRef.value = 0;
  emit('update:pan', 0);
}

// Click handlers
function handleLevelClick(event: MouseEvent) {
  if (isLevelDragging) return;
  
  const rect = bar.value.getBoundingClientRect();
  const newValue = ((event.clientX - rect.left) / rect.width) * maxValue;
  const clampedValue = Math.max(minValue, Math.min(maxValue, newValue));
  console.log('clampedValue', clampedValue);
  levelRef.value = sliderToDb(clampedValue);
  console.log('levelRef', levelRef.value);
  emit('update:level', levelRef.value);
}

function handlePanClick(event: MouseEvent) {
  if (isPanDragging) return;
  
  const rect = panElem.value.getBoundingClientRect();
  const newValue = ((event.clientX - rect.left) / rect.width) * 100;
  const clampedValue = Math.max(minValue, Math.min(maxValue, newValue));
  panRef.value = sliderToPan(clampedValue);
  emit('update:pan', panRef.value);
}

// Optimized drag handlers for smooth movement
function startLevelDrag(event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  if (isLevelDragging) return;
  
  isLevelDragging = true;
  
  // Add active class for better visual feedback
  if (event.target instanceof HTMLElement) {
    event.target.classList.add('active');
  }
  
  const handleLevelDrag = (e: PointerEvent) => {
    if (!isLevelDragging) return;
    
    const rect = barContainer.value.getBoundingClientRect();
    let newValue = ((e.clientX - rect.left) / rect.width) * maxValue;
    
    // Ensure we can reach the edges
    if (e.clientX <= rect.left) newValue = minValue;
    if (e.clientX >= rect.right) newValue = maxValue;
    
    const clampedValue = Math.max(minValue, Math.min(maxValue, newValue));
    levelRef.value = sliderToDb(clampedValue);
    emit('update:level', levelRef.value);
  };

  const stopLevelDrag = () => {
    isLevelDragging = false;
    document.removeEventListener('pointermove', handleLevelDrag);
    document.removeEventListener('pointerup', stopLevelDrag);
    document.removeEventListener('pointercancel', stopLevelDrag);
    
    // Remove active class
    if (event.target instanceof HTMLElement) {
      event.target.classList.remove('active');
    }
  };

  document.addEventListener('pointermove', handleLevelDrag);
  document.addEventListener('pointerup', stopLevelDrag);
  document.addEventListener('pointercancel', stopLevelDrag);
  
  // Set pointer capture for better mobile handling
  if (event.target instanceof HTMLElement) {
    event.target.setPointerCapture(event.pointerId);
  }
}

function startPanDrag(event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  if (isPanDragging) return;
  
  isPanDragging = true;
  
  // Add active class for better visual feedback
  if (event.target instanceof HTMLElement) {
    event.target.classList.add('active');
  }
  
  const handlePanDrag = (e: PointerEvent) => {
    if (!isPanDragging) return;
    
    const rect = panContainer.value.getBoundingClientRect();
    let newValue = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Ensure we can reach the edges
    if (e.clientX <= rect.left) newValue = minValue;
    if (e.clientX >= rect.right) newValue = maxValue;
    
    const clampedValue = Math.max(minValue, Math.min(maxValue, newValue));
    panRef.value = sliderToPan(clampedValue);
    emit('update:pan', panRef.value);
  };

  const stopPanDrag = () => {
    isPanDragging = false;
    document.removeEventListener('pointermove', handlePanDrag);
    document.removeEventListener('pointerup', stopPanDrag);
    document.removeEventListener('pointercancel', stopPanDrag);
    
    // Remove active class
    if (event.target instanceof HTMLElement) {
      event.target.classList.remove('active');
    }
  };

  document.addEventListener('pointermove', handlePanDrag);
  document.addEventListener('pointerup', stopPanDrag);
  document.addEventListener('pointercancel', stopPanDrag);
  
  // Set pointer capture for better mobile handling
  if (event.target instanceof HTMLElement) {
    event.target.setPointerCapture(event.pointerId);
  }
}

// Clean up any remaining event listeners
onUnmounted(() => {
  isLevelDragging = false;
  isPanDragging = false;
});

// Additional cleanup when component loses focus
onDeactivated(() => {
  isLevelDragging = false;
  isPanDragging = false;
});
</script>

<style scoped>
.channel-strip {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.75rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  touch-action: pan-y; /* Improve touch scrolling */
  position: relative;
  z-index: 1; /* Base z-index for the channel */
}

.channel-strip:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(0, 180, 219, 0.3);
}

.channel-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.channel-number, .pan-show-btn {
  font-size: 0.8rem;
  color: #00b4db;
  font-weight: 600;
  background: rgba(0, 180, 219, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  min-width: 30px;
  text-align: center;
}

.pan-show-btn {
  border-color: #535353 #000000 #000000 #53535300;
  border-style: solid;
}

.pan-show-btn.active {
  border-color: #000000 #535353 #535353 #000000;
  border-style: solid;
}

.channel-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.controls-row {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.control-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-label {
  font-size: 0.75rem;
  color: #ccc;
  font-weight: 600;
  text-align: center;
}

/* Level Control Styles */
.level-track-container {
  position: relative;
  height: 30px;
  touch-action: none; /* Prevent scrolling when dragging */
}

.level-track-horizontal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
}

.level-fill-horizontal {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(to right, #27ae60, #00b4db);
  /* Remove transition for instant response during drag */
}

.level-handle-horizontal {
  position: absolute;
  top: 50%;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6); /* Stronger shadow */
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
  z-index: 100; /* High z-index to ensure visibility */
  /* Remove transition for direct positioning */
}

.level-handle-horizontal.active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.1);
}

.level-value {
  font-size: 0.6rem;
  font-weight: 700; /* Bolder for better readability */
  color: #2c3e50;
  user-select: none;
}

/* Pan Control Styles */
.pan-track-container {
  position: relative;
  height: 30px;
  touch-action: none;
}

.pan-track-horizontal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
}

.pan-center-marker {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.5);
  transform: translateX(-50%);
}

.pan-handle-horizontal {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  background: #00b4db;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0, 180, 219, 0.5); /* Stronger shadow */
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
  z-index: 100; /* High z-index to ensure visibility */
  /* Remove transition for direct positioning */
}

.pan-handle-horizontal.active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.1);
}

.pan-value {
  font-size: 0.55rem;
  font-weight: 700; /* Bolder for better readability */
  color: white;
  user-select: none;
}

.control-button-small {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  /* min-width: 30px; */
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: manipulation;
  /* flex: 1; */
}

/* Remove hover effects on touch devices */
@media (hover: hover) and (pointer: fine) {
  .control-button-small:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.control-button-small:active {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(0.95);
}

.unselectable {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

@media (max-width: 768px) {
  .channel-strip {
    padding: 0.5rem;
  }
  
  .controls-row {
    gap: 0.5rem;
  }
  
  .channel-header {
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .channel-number {
    font-size: 0.7rem;
    min-width: 25px;
    padding: 0.2rem 0.4rem;
  }
  
  .channel-name {
    font-size: 0.8rem;
  }
  
  .level-track-container,
  .pan-track-container {
    height: 30px;
  }
  
  .level-handle-horizontal {
    width: 25px;
    height: 25px;
  }
  
  .pan-handle-horizontal {
    width: 25px;
    height: 25px;
  }
  
  .control-button-small {
    height: 100%;
    font-size: 0.65rem;
    padding: 0.2rem 0.4rem;
  }
  
  /* Completely remove hover effects on mobile */
  .control-button-small:hover {
    background: rgba(0, 0, 0, 0.4) !important;
    transform: none !important;
  }
}
</style>
