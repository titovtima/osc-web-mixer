<template>
  <div>
    <input type="number" style="width: 2rem;" v-model="model.number"/>
    <input type="number" style="width: 2rem;" v-model="model.order"/>
    <input type="text" v-model="model.name" placeholder="name"/>
    <input type="checkbox" v-model="model.hidden"/>
    <input type="text" v-model="model.color" placeholder="color"/>
    <button @click="$emit('delete')">x</button>
  </div>
</template>

<script setup lang="ts">
const model: Ref<channel> = defineModel({
  required: true
});

const emits = defineEmits(['delete']);
</script>
