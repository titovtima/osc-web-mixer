<template>
  <div>
    <div>
      {{ name }}
    </div>
    <div style="display: flex;">
      <button style="flex: 0 1 auto;" ref="minusButton">
        -
      </button>
      <div style="flex: 1 1 20px; background-color: #aaa; padding: 2px; position: relative; touch-action: none;" ref="bar">
        <div style="background-color: #fff; height: 100%;" :style="{width: dbToSlider(valueRef) * 100 / maxValue + '%'}">

        </div>
        <div style="position: absolute; bottom: 0; left: 50%;">
          <div style="position: relative; left: -50%; height: min-content;">
            {{ Math.round(valueRef * roundWith) / roundWith }}
          </div>
        </div>
      </div>
      <button style="flex: 0 1 auto;" ref="plusButton">
        +
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
let props = defineProps({
  name: String,
  value: {
    type: Number,
    required: true
  }
});

let emit = defineEmits(['update:value']);

let bar = ref();
let plusButton = ref();
let minusButton = ref();

let valueRef = ref(props.value);
watch(() => props.value, () => {
  valueRef.value = props.value;
});

const maxValue = 100;
const minValue = 0;
const step = 0.5;

const minDbValue = -150;
const maxDbValue = 10;

const logBase = 100;

const roundWith = 10;

function sliderToDb(value: number): number {
  return ((Math.log(value*(logBase - 1)/(maxValue - minValue) + (1 - minValue)) / Math.log(logBase)) * (maxDbValue - minDbValue)) + minDbValue;
}

function dbToSlider(db: number): number {
	return (Math.pow(logBase, (db - minDbValue) / (maxDbValue - minDbValue)) - (1 - minValue)) * (maxValue - minValue)/(logBase - 1);
}

onMounted(() => {
  let handler1 = (x: number, y: number) => {
    let barRect = bar.value.getBoundingClientRect()
    let newValue = (x - barRect.x + 2) * maxValue / (barRect.width - 4)
    // console.log('click', barRect, event, newValue);

    newValue = Math.max(minValue, Math.min(maxValue, newValue));

    valueRef.value = sliderToDb(newValue);
    emit('update:value', valueRef.value);
  }

  let handler = (event: PointerEvent) => {
    // console.log('pointermove event', event);
    handler1(event.clientX, event.clientY);
  }

  bar.value.addEventListener('pointerdown', (event: PointerEvent) => {
    handler(event);
    bar.value.addEventListener('pointermove', handler);
  });

  document.addEventListener('pointerup', () => {
    bar.value.removeEventListener('pointermove', handler);
  });

  plusButton.value.onclick = () => {
    valueRef.value = Math.min(maxDbValue, valueRef.value + step);
    emit('update:value', valueRef.value);
  };

  minusButton.value.onclick = () => {
    valueRef.value = Math.max(minDbValue, valueRef.value - step);
    emit('update:value', valueRef.value);
  };
});
</script>
