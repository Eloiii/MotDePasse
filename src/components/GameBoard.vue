<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ROUND_DURATION_MS, type HistoryEntry } from '../../server/protocol.ts'
import type { Game } from '../useGame'

const props = defineProps<{ game: Game }>()
const room = computed(() => props.game.room.value!)

const input = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const isGiver = computed(() => room.value.clueGiver === room.value.you)
const myTurn = computed(
  () => (room.value.phase === 'clue' && isGiver.value) || (room.value.phase === 'guess' && !isGiver.value),
)
const teamScore = computed(() => room.value.players[0]?.score ?? 0)
const nameOf = (seat: string | null) => room.value.players.find((p) => p.seat === seat)?.name ?? '?'

const seconds = computed(() => Math.ceil((props.game.remainingMs.value ?? 0) / 1000))
const timerRatio = computed(() => (props.game.remainingMs.value ?? 0) / ROUND_DURATION_MS)
const timerColor = computed(() =>
  timerRatio.value > 0.5 ? 'var(--green)' : timerRatio.value > 0.2 ? 'var(--orange)' : 'var(--red)',
)

const status = computed(() => {
  const r = room.value
  if (r.phase === 'clue') return isGiver.value ? 'Donnez un indice !' : `${nameOf(r.clueGiver)} cherche un indice`
  if (r.phase === 'guess') return isGiver.value ? `${nameOf(r.guesser)} réfléchit` : 'À vous de deviner !'
  return ''
})
/** History grouped as rows: one clue and the answer it led to. */
const exchanges = computed(() => {
  const rows: { clue: string; guess: HistoryEntry | null }[] = []
  for (const h of room.value.history) {
    if (h.kind === 'clue') rows.push({ clue: h.text, guess: null })
    else if (rows.length) rows[rows.length - 1].guess = h
  }
  return rows
})

const typer = computed(() => nameOf(room.value.phase === 'clue' ? room.value.clueGiver : room.value.guesser))
const censored = computed(() => '•'.repeat(props.game.otherTyping.value))

const iAmReady = computed(() => room.value.ready.includes(room.value.you))
const otherSeat = computed(() => (room.value.you === 'A' ? 'B' : 'A'))
const otherReady = computed(() => room.value.ready.includes(otherSeat.value))

// Live-share the length of our input so the other player sees it censored as "•••".
let sentLength = 0
function onInput() {
  const length = input.value.trim().length
  if (length === sentLength) return
  props.game.typing(length)
  sentLength = length
}

watch(
  () => [room.value.phase, room.value.round],
  async () => {
    input.value = ''
    sentLength = 0
    await nextTick()
    if (myTurn.value) inputEl.value?.focus()
  },
  { immediate: true },
)

function submit() {
  const text = input.value.trim()
  if (!text) return
  // The input is cleared by the phase change; if the clue is refused, it stays so it can be fixed.
  if (room.value.phase === 'clue') props.game.clue(text)
  else props.game.guess(text)
}
</script>

<template>
  <section class="board">
    <!-- Scores -->
    <div class="topbar">
      <div class="player" :class="[`seat-${p.seat}`, { active: p.seat === room.guesser }]" v-for="p in room.players" :key="p.seat">
        <span class="name">{{ p.name }}<small v-if="p.seat === room.you"> (vous)</small></span>
        <span class="role">{{ p.seat === room.guesser ? '🔍 devine' : '💡 indices' }}</span>
      </div>
      <div class="score">
        <small>Score</small>
        <strong>{{ teamScore }}</strong>
      </div>
    </div>

    <!-- Progression des 6 mots -->
    <ol class="progress">
      <li
        v-for="i in room.totalRounds"
        :key="i"
        :class="{
          current: i - 1 === room.round && room.phase !== 'finished',
          found: room.rounds[i - 1]?.found,
          missed: room.rounds[i - 1] && !room.rounds[i - 1].found,
        }"
      >
        {{ i }}
      </li>
    </ol>

    <!-- Fin de partie -->
    <div v-if="room.phase === 'finished'" class="card finished">
      <h2>Partie terminée !</h2>
      <p class="final-score">{{ teamScore }} <small>points</small></p>
      <ul class="summary">
        <li v-for="(r, i) in room.rounds" :key="i" :class="r.found ? 'ok' : 'ko'">
          <span class="word">{{ r.word }}</span>
          <span>{{ nameOf(r.guesser) }}</span>
          <span>{{ r.found ? `+${r.points}` : '✗' }}</span>
        </li>
      </ul>
      <button v-if="room.you === 'A'" class="btn primary" @click="game.start">Rejouer</button>
      <p v-else class="hint">L’hôte peut relancer une partie.</p>
      <button class="btn ghost small" @click="game.leave">Quitter</button>
    </div>

    <!-- Manche en cours / révélation -->
    <div v-else class="card round">
      <div v-if="room.phase !== 'reveal'" class="timer">
        <div class="bar" :style="{ width: `${timerRatio * 100}%`, background: timerColor }" />
        <span :style="{ color: timerColor }">{{ seconds }}s</span>
      </div>

      <div class="secret" :class="{ reveal: room.phase === 'reveal' }">
        <template v-if="room.word">
          <small v-if="room.phase === 'reveal'">
            {{ room.lastRound?.found ? `Trouvé ! +${room.lastRound.points} points` : 'Temps écoulé ! Le mot était' }}
          </small>
          <small v-else>Le mot à faire deviner</small>
          <div class="word" :class="{ ok: room.phase === 'reveal' && room.lastRound?.found, ko: room.phase === 'reveal' && !room.lastRound?.found }">
            {{ room.word }}
          </div>
        </template>
        <template v-else>
          <small>Mot mystère — {{ room.wordLength }} lettres</small>
          <div class="blanks">
            <span v-for="n in room.wordLength ?? 0" :key="n" />
          </div>
        </template>
      </div>

      <div v-if="room.phase !== 'reveal' || exchanges.length" class="history">
        <div class="head">
          <span />
          <span :class="`tint-${room.clueGiver}`">💡 {{ nameOf(room.clueGiver) }}</span>
          <span :class="`tint-${room.guesser}`">🔍 {{ nameOf(room.guesser) }}</span>
        </div>
        <ol>
          <li v-for="(x, i) in exchanges" :key="i" :class="{ latest: i === exchanges.length - 1 }">
            <span class="num">{{ i + 1 }}</span>
            <span class="clue" :class="`tint-${room.clueGiver}`">{{ x.clue }}</span>
            <span v-if="x.guess" class="guess" :class="x.guess.correct ? 'ok' : 'ko'">
              {{ x.guess.correct ? '✓' : '✗' }} {{ x.guess.text }}
            </span>
            <span v-else class="guess pending">…</span>
          </li>
          <li v-if="!exchanges.length" class="empty">Pas encore d’indice</li>
        </ol>
      </div>

      <template v-if="room.phase !== 'reveal'">
        <p
          v-if="!myTurn && game.otherTyping.value"
          :key="game.forbidden.value?.id"
          class="status typing"
          :class="{ refused: game.forbidden.value }"
          :title="game.forbidden.value?.reason"
        >
          ✍️ {{ typer }} <span class="censored">{{ censored }}</span><span class="caret" />
        </p>
        <p v-else class="status" :class="{ mine: myTurn }">
          {{ status }}<span v-if="!myTurn" class="dots"><i>.</i><i>.</i><i>.</i></span>
        </p>
        <form class="play" @submit.prevent="submit">
          <input
            ref="inputEl"
            v-model="input"
            :disabled="!myTurn"
            :placeholder="room.phase === 'clue' ? 'Un seul mot…' : 'Votre réponse…'"
            maxlength="40"
            autocomplete="off"
            @input="onInput"
          />
          <button class="btn primary" :disabled="!myTurn || !input.trim()">
            {{ room.phase === 'clue' ? 'Indice' : 'Valider' }}
          </button>
        </form>
      </template>
      <div v-else class="next">
        <button class="btn primary" :disabled="iAmReady" @click="game.ready">
          {{ iAmReady ? 'Prêt ✓' : 'Prêt pour le mot suivant' }}
        </button>
        <p class="status">
          <template v-if="otherReady">✅ {{ nameOf(otherSeat) }} est prêt·e</template>
          <template v-else>⏳ En attente de {{ nameOf(otherSeat) }}<span class="dots"><i>.</i><i>.</i><i>.</i></span></template>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.6rem;
  align-items: stretch;
}

.topbar .player:nth-child(2) {
  order: 3;
  text-align: right;
}

.topbar .score {
  order: 2;
}

.player {
  padding: 0.6rem 0.9rem;
  border-radius: 14px;
  color: #fff;
  display: flex;
  flex-direction: column;
  opacity: 0.75;
  transition: all 0.2s;
}

.player.active {
  opacity: 1;
  transform: scale(1.04);
  box-shadow: 0 0 0 3px var(--yellow);
}

.player .name {
  font-weight: 800;
}

.player .role {
  font-size: 0.8rem;
}

.score {
  background: var(--yellow);
  color: var(--ink);
  border-radius: 14px;
  padding: 0.3rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score strong {
  font-size: 1.8rem;
  line-height: 1;
}

.progress {
  list-style: none;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
}

.progress li {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.progress li.current {
  background: var(--yellow);
  color: var(--ink);
}

.progress li.found {
  background: var(--green);
}

.progress li.missed {
  background: var(--red);
}

.round {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timer {
  position: relative;
  height: 1.8rem;
  background: #eee;
  border-radius: 999px;
  overflow: hidden;
}

.timer .bar {
  height: 100%;
  transition:
    width 0.1s linear,
    background 0.3s;
}

.timer span {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-weight: 900;
  mix-blend-mode: multiply;
}

.secret {
  text-align: center;
  padding: 1rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #f3ecff, #e6f4ff);
}

.secret small {
  color: var(--muted);
  font-weight: 600;
}

.word {
  font-size: clamp(2rem, 8vw, 3rem);
  font-weight: 900;
  color: var(--purple);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.word.ok {
  color: var(--green);
  animation: pop 0.4s ease;
}

.word.ko {
  color: var(--red);
  animation: pop 0.4s ease;
}

.blanks {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.9rem 0;
}

.blanks span {
  width: 1.4rem;
  height: 0.35rem;
  border-radius: 4px;
  background: var(--purple);
}

.history {
  font-size: 0.95rem;
}

.history .head,
.history li {
  display: grid;
  grid-template-columns: 1.6rem 1fr 1fr;
  gap: 0.5rem;
  align-items: center;
}

.history .head {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0 0.4rem 0.3rem;
  text-align: left;
}

.history ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.history li {
  padding: 0.3rem 0.4rem;
  border-radius: 10px;
  text-align: left;
  animation: pop 0.25s ease;
}

.history li.latest {
  background: #f1ebfd;
}

.history .num {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--muted);
  text-align: center;
}

.history .clue,
.history .guess {
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.history .clue {
  background: #fff;
  color: var(--ink);
  border-left: 4px solid;
}

.history .clue.tint-A {
  border-left-color: var(--orange);
}

.history .clue.tint-B {
  border-left-color: var(--teal);
}

.history .guess.ko {
  background: #fdecee;
  color: #b3172c;
}

.history .guess.ok {
  background: var(--green);
  color: #fff;
}

.history .guess.pending {
  color: var(--muted);
}

.history .empty {
  display: block;
  text-align: center;
  color: var(--muted);
  font-style: italic;
  animation: none;
}

/* Player colours as text (A orange, B teal), matching the score bar. */
.tint-A {
  color: #c96f00;
}

.tint-B {
  color: #0b8a7e;
}

.status {
  text-align: center;
  margin: 0;
  color: var(--muted);
  font-weight: 600;
}

.status.mine {
  color: var(--pink);
  font-size: 1.2rem;
  animation: pulse 1.2s ease-in-out infinite;
}

.status.typing {
  color: var(--blue);
  transition: color 0.3s;
}

.censored {
  letter-spacing: 0.15em;
}

.caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: -0.15em;
  background: currentColor;
  animation: blink 1s steps(1) infinite;
}

/* Refused clue: the censored text turns red with a small, smooth wobble. */
.status.typing.refused {
  color: var(--red);
}

.status.typing.refused .censored {
  display: inline-block;
  animation: wobble 0.6s ease-in-out;
}

.dots i {
  font-style: normal;
  animation: blink 1.2s infinite;
}

.dots i:nth-child(2) {
  animation-delay: 0.2s;
}

.dots i:nth-child(3) {
  animation-delay: 0.4s;
}

.next {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.play {
  display: flex;
  gap: 0.6rem;
}

.play input {
  flex: 1;
  min-width: 0;
}

.finished {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.finished h2 {
  margin: 0;
  color: var(--purple);
}

.final-score {
  font-size: 3.5rem;
  font-weight: 900;
  margin: 0;
  color: var(--pink);
}

.final-score small {
  font-size: 1rem;
  color: var(--muted);
}

.summary {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.summary li {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  text-align: left;
  font-weight: 600;
}

.summary .word {
  font-size: 1rem;
  color: inherit;
}

.summary .ok {
  background: #dcf7e8;
  color: #0e7a45;
}

.summary .ko {
  background: #ffe0e3;
  color: #b3172c;
}

.hint {
  color: var(--muted);
  margin: 0;
}

@keyframes pop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  70% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.2;
  }
  40% {
    opacity: 1;
  }
}

@keyframes wobble {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

@keyframes pulse {
  50% {
    opacity: 0.55;
  }
}
</style>
