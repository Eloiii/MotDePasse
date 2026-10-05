<script setup lang="ts">
import { ref } from 'vue'
import ChatBox from './components/ChatBox.vue'
import GameBoard from './components/GameBoard.vue'
import { useGame } from './useGame'

const game = useGame()
const { room, error } = game

const name = ref(localStorage.getItem('mdp-name') ?? '')
const code = ref(new URLSearchParams(location.search).get('code')?.toUpperCase() ?? '')
const copied = ref(false)

function rememberName() {
  localStorage.setItem('mdp-name', name.value.trim())
}

function create() {
  rememberName()
  game.create(name.value)
}

function join() {
  if (!code.value.trim()) return
  rememberName()
  game.join(code.value, name.value)
}

async function copyLink() {
  await navigator.clipboard.writeText(`${location.origin}/?code=${room.value!.code}`)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <header>
    <h1>Mot <span>de</span> passe</h1>
  </header>

  <Transition name="toast">
    <div v-if="error" class="toast">{{ error }}</div>
  </Transition>

  <main>
    <!-- Accueil -->
    <section v-if="!room" class="card home">
      <label>
        Votre prénom
        <input v-model="name" maxlength="20" placeholder="ex. Camille" />
      </label>

      <button class="btn primary" @click="create">Créer une partie</button>

      <div class="separator">ou</div>

      <form class="join" @submit.prevent="join">
        <input v-model="code" maxlength="4" placeholder="CODE" class="code-input" @input="code = code.toUpperCase()" />
        <button class="btn secondary" :disabled="code.trim().length !== 4">Rejoindre</button>
      </form>

      <details class="rules">
        <summary>Règles du jeu</summary>
        <ul>
          <li>Deux joueurs, six mots : chacun devine trois mots, à tour de rôle.</li>
          <li>Celui qui connaît le mot donne un indice d’<strong>un seul mot</strong>, puis son partenaire propose une réponse.</li>
          <li>On alterne indice / réponse jusqu’à trouver le mot… en <strong>30 secondes</strong> maximum !</li>
          <li>Plus le mot est trouvé vite, plus il rapporte : 5 points au premier indice, puis 4, 3, 2, 1.</li>
          <li>Entre deux mots, cliquez sur « Prêt » : le mot suivant démarre quand vous êtes prêts tous les deux.</li>
        </ul>
      </details>
    </section>

    <!-- Salle d'attente -->
    <section v-else-if="room.phase === 'lobby'" class="card lobby">
      <p>Code de la partie</p>
      <div class="room-code">{{ room.code }}</div>
      <button class="btn ghost small" @click="copyLink">{{ copied ? 'Lien copié !' : 'Copier le lien d’invitation' }}</button>

      <ul class="players">
        <li v-for="p in room.players" :key="p.seat" :class="`seat-${p.seat}`">
          {{ p.name }} <small v-if="p.seat === room.you">(vous)</small>
        </li>
        <li v-if="room.players.length < 2" class="waiting">En attente d’un adversaire…</li>
      </ul>

      <button v-if="room.you === 'A'" class="btn primary" :disabled="room.players.length < 2" @click="game.start">
        Lancer la partie
      </button>
      <p v-else class="hint">L’hôte va lancer la partie…</p>

      <button class="btn ghost small" @click="game.leave">Quitter</button>
    </section>

    <!-- Partie -->
    <GameBoard v-else :game="game" />
  </main>

  <ChatBox v-if="room" :key="room.code" :game="game" />
</template>

<style scoped>
header h1 {
  margin: 0;
  font-size: clamp(2.2rem, 7vw, 3.6rem);
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--yellow);
  text-shadow:
    0 4px 0 var(--pink),
    0 8px 18px rgba(0, 0, 0, 0.35);
}

header h1 span {
  color: #fff;
  font-size: 0.6em;
}

.home,
.lobby {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
  text-align: center;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;
  font-weight: 600;
}

.separator {
  color: var(--muted);
  font-size: 0.9rem;
}

.join {
  display: flex;
  gap: 0.6rem;
}

.join input {
  flex: 1;
  min-width: 0;
}

.code-input {
  text-align: center;
  letter-spacing: 0.4em;
  font-weight: 800;
  text-transform: uppercase;
}

.rules {
  text-align: left;
  font-size: 0.9rem;
  color: var(--muted);
}

.rules summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--purple);
}

.rules li {
  margin: 0.4rem 0;
}

.room-code {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 0.3em;
  color: var(--purple);
}

.players {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.players li {
  padding: 0.7rem;
  border-radius: 12px;
  font-weight: 700;
  color: #fff;
}

.players .waiting {
  color: var(--muted);
  border: 2px dashed #ccc;
  font-weight: 500;
  animation: pulse 1.6s ease-in-out infinite;
}

.hint {
  color: var(--muted);
}

.toast {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--red);
  color: #fff;
  padding: 0.7rem 1.2rem;
  border-radius: 999px;
  font-weight: 600;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -1rem);
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
</style>
