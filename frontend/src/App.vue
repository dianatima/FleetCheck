<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useAppStore } from './stores/app'
// initialize store (applies theme class on mount)
useAppStore()
</script>
