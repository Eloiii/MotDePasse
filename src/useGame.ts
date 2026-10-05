import { computed, onUnmounted, ref, shallowRef } from 'vue'
import type { ClientMessage, RoomView, ServerMessage } from '../server/protocol.ts'

/** Connects to the game server and exposes the room state reactively. */
export function useGame() {
  const room = shallowRef<RoomView | null>(null)
  const error = ref<string | null>(null)
  const connected = ref(false)
  const remainingMs = ref<number | null>(null)
  /** Number of characters the other player currently has in their input. */
  const otherTyping = ref(0)
  /** Set when the clue giver tried a forbidden clue; `id` changes so the alert replays. */
  const forbidden = ref<{ id: number; reason: string } | null>(null)

  let ws: WebSocket | null = null
  let queue: ClientMessage[] = []
  let endsAt: number | null = null
  let errorTimer: ReturnType<typeof setTimeout> | undefined
  let forbiddenTimer: ReturnType<typeof setTimeout> | undefined

  const tick = setInterval(() => {
    remainingMs.value = endsAt === null ? null : Math.max(0, endsAt - performance.now())
  }, 100)

  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    ws = new WebSocket(`${protocol}://${location.host}/ws`)
    ws.onopen = () => {
      connected.value = true
      queue.forEach((m) => ws!.send(JSON.stringify(m)))
      queue = []
    }
    ws.onclose = () => {
      connected.value = false
      if (room.value) showError('Connexion perdue avec le serveur.')
      room.value = null
      endsAt = null
      ws = null
    }
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage
      if (msg.type === 'state') {
        if (msg.room.phase !== room.value?.phase || msg.room.round !== room.value?.round) {
          otherTyping.value = 0
          forbidden.value = null
        }
        room.value = msg.room
        // Use our own clock from the remaining time to avoid client/server clock skew.
        endsAt = msg.room.remainingMs === null ? null : performance.now() + msg.room.remainingMs
      } else if (msg.type === 'error') {
        showError(msg.message)
      } else if (msg.type === 'typing') {
        otherTyping.value = msg.length
        forbidden.value = null
      } else if (msg.type === 'forbidden') {
        forbidden.value = { id: Date.now(), reason: msg.reason }
        clearTimeout(forbiddenTimer)
        forbiddenTimer = setTimeout(() => (forbidden.value = null), 1800)
      } else if (msg.type === 'left') {
        room.value = null
        endsAt = null
      }
    }
  }

  function showError(message: string) {
    error.value = message
    clearTimeout(errorTimer)
    errorTimer = setTimeout(() => (error.value = null), 3500)
  }

  function send(msg: ClientMessage) {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
    else {
      queue.push(msg)
      if (!ws) connect()
    }
  }

  connect()

  onUnmounted(() => {
    clearInterval(tick)
    ws?.close()
  })

  const me = computed(() => room.value?.players.find((p) => p.seat === room.value!.you) ?? null)
  const opponent = computed(() => room.value?.players.find((p) => p.seat !== room.value!.you) ?? null)

  return {
    room,
    me,
    opponent,
    error,
    connected,
    remainingMs,
    otherTyping,
    forbidden,
    create: (name: string) => send({ type: 'create', name }),
    join: (code: string, name: string) => send({ type: 'join', code, name }),
    start: () => send({ type: 'start' }),
    clue: (text: string) => send({ type: 'clue', text }),
    guess: (text: string) => send({ type: 'guess', text }),
    ready: () => send({ type: 'ready' }),
    typing: (length: number) => send({ type: 'typing', length }),
    say: (text: string) => send({ type: 'chat', text }),
    leave: () => send({ type: 'leave' }),
  }
}

export type Game = ReturnType<typeof useGame>
