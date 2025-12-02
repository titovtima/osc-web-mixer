<template>
  <div>
    <NuxtPage/>
  </div>
</template>

<script setup lang="ts">
useHead({link: [{rel: 'manifest', href: '/manifest.json'}], htmlAttrs: { lang: 'ru' }});
</script>

<style>
* {
  margin: 0;
}
</style>
