<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { CHAT_MESSAGE_MAX_LENGTH } from '../../server/protocol.ts'
import type { Game } from '../useGame'

const props = defineProps<{ game: Game }>()
const room = computed(() => props.game.room.value!)

const open = ref(false)
const text = ref('')
const seen = ref(room.value.chat.length)
const list = ref<HTMLElement | null>(null)

const unread = computed(() => Math.max(0, room.value.chat.length - seen.value))

watch(
  () => [room.value.chat.length, open.value],
  async () => {
    if (!open.value) return
    seen.value = room.value.chat.length
    await nextTick()
    list.value?.scrollTo({ top: list.value.scrollHeight })
  },
)

function send() {
  if (!text.value.trim()) return
  props.game.say(text.value)
  text.value = ''
}
</script>

<template>
  <div class="chat" :class="{ open }">
    <div v-if="open" class="panel">
      <header>
        <span>💬 Chat</span>
        <button class="close" title="Fermer" @click="open = false">✕</button>
      </header>
      <ul ref="list">
        <li v-if="!room.chat.length" class="empty">Aucun message pour l’instant.</li>
        <li v-for="(m, i) in room.chat" :key="i" :class="{ mine: m.seat === room.you }">
          <b :class="`name-${m.seat}`">{{ m.name }}</b> {{ m.text }}
        </li>
      </ul>
      <form @submit.prevent="send">
        <input
          v-model="text"
          :disabled="!room.chatOpen"
          :placeholder="room.chatOpen ? 'Message…' : 'Fermé pendant la manche 🤫'"
          :maxlength="CHAT_MESSAGE_MAX_LENGTH"
          autocomplete="off"
        />
      </form>
    </div>
    <button v-else class="bubble" title="Chat" @click="open = true">
      💬
      <span v-if="unread" class="badge">{{ unread }}</span>
    </button>
  </div>
</template>

<style scoped>
.chat {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 5;
  text-align: left;
}

.bubble {
  position: relative;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: none;
  font-size: 1.3rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.badge {
  position: absolute;
  top: -0.2rem;
  right: -0.2rem;
  min-width: 1.3rem;
  height: 1.3rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: var(--pink);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  display: grid;
  place-items: center;
}

.panel {
  width: min(280px, calc(100vw - 2rem));
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  font-size: 0.85rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.7rem;
  background: var(--purple);
  color: #fff;
  font-weight: 700;
}

.close {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0.7rem;
  height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

li {
  overflow-wrap: anywhere;
}

.empty {
  color: var(--muted);
  font-style: italic;
}

.name-A {
  color: var(--orange);
}

.name-B {
  color: var(--teal);
}

form {
  border-top: 1px solid #eee;
}

input {
  width: 100%;
  border: none;
  border-radius: 0;
  padding: 0.55rem 0.7rem;
  font-size: 0.85rem;
}
</style>
