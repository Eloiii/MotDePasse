import {
  CHAT_HISTORY_SIZE,
  CHAT_MESSAGE_MAX_LENGTH,
  ROUND_DURATION_MS,
  ROUNDS_PER_GAME,
  type ChatMessage,
  type HistoryEntry,
  type Phase,
  type RoomView,
  type RoundSummary,
  type Seat,
  type ServerMessage,
} from './protocol.ts'
import { isFrenchWord, normalize } from './dictionary.ts'
import { pickWords } from './words.ts'

export { normalize }

/** Points earned when the word is found after `clues` clues: 5, 4, 3, 2, then 1. */
export function pointsFor(clues: number): number {
  return Math.max(1, 6 - clues)
}

/** Returns an error message if the clue is not allowed for this word, otherwise null. */
export function validateClue(clue: string, word: string): string | null {
  const c = normalize(clue)
  if (!c) return 'L’indice est vide.'
  if (/\s/.test(c)) return 'Un seul mot par indice !'
  if (c.length > 30) return 'Indice trop long.'
  const parts = normalize(word).split(/[\s-]+/)
  for (const part of parts) {
    if (c.includes(part) || (c.length >= 3 && part.includes(c))) {
      return 'Interdit : l’indice ressemble trop au mot à deviner !'
    }
  }
  if (!isFrenchWord(c)) return `« ${clue.trim()} » n’est pas dans le dictionnaire.`
  return null
}

export interface Player {
  seat: Seat
  name: string
  score: number
  send: (msg: ServerMessage) => void
}

export interface Clock {
  now: () => number
  setTimeout: (fn: () => void, ms: number) => unknown
  clearTimeout: (handle: unknown) => void
  random: () => number
}

const realClock: Clock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
  random: Math.random,
}

export class GameError extends Error {}

export class Room {
  readonly code: string
  private players = new Map<Seat, Player>()
  private phase: Phase = 'lobby'
  private round = 0
  private words: string[] = []
  private history: HistoryEntry[] = []
  private rounds: RoundSummary[] = []
  private ready = new Set<Seat>()
  private chat: ChatMessage[] = []
  private roundEndsAt: number | null = null
  private timer: unknown = null
  private readonly clock: Clock

  constructor(code: string, clock: Clock = realClock) {
    this.code = code
    this.clock = clock
  }

  get isEmpty(): boolean {
    return this.players.size === 0
  }

  get isFull(): boolean {
    return this.players.size === 2
  }

  /** Guesser alternates: A guesses rounds 1, 3, 5 and B guesses rounds 2, 4, 6. */
  private get guesser(): Seat {
    return this.round % 2 === 0 ? 'A' : 'B'
  }

  private get clueGiver(): Seat {
    return this.guesser === 'A' ? 'B' : 'A'
  }

  private get currentWord(): string {
    return this.words[this.round]
  }

  private get chatOpen(): boolean {
    return this.phase !== 'clue' && this.phase !== 'guess'
  }

  private other(seat: Seat): Seat {
    return seat === 'A' ? 'B' : 'A'
  }

  addPlayer(name: string, send: Player['send']): Player {
    if (this.isFull) throw new GameError('Cette partie est déjà complète.')
    const seat: Seat = this.players.has('A') ? 'B' : 'A'
    const player: Player = { seat, name: name.trim().slice(0, 20) || `Joueur ${seat}`, score: 0, send }
    this.players.set(seat, player)
    this.broadcast()
    return player
  }

  removePlayer(seat: Seat): void {
    this.players.delete(seat)
    this.stopTimer()
    // The remaining player becomes the host (seat A) and goes back to the lobby.
    const remaining = [...this.players.values()][0]
    if (remaining && remaining.seat !== 'A') {
      this.players.delete(remaining.seat)
      remaining.seat = 'A'
      this.players.set('A', remaining)
    }
    this.resetToLobby()
    this.broadcast()
  }

  start(seat: Seat): void {
    if (seat !== 'A') throw new GameError('Seul l’hôte peut lancer la partie.')
    if (!this.isFull) throw new GameError('Il faut deux joueurs pour commencer.')
    if (this.phase !== 'lobby' && this.phase !== 'finished') throw new GameError('La partie est déjà en cours.')
    this.resetToLobby()
    this.words = pickWords(ROUNDS_PER_GAME, this.clock.random)
    this.startRound(0)
  }

  giveClue(seat: Seat, text: string): void {
    if (this.phase !== 'clue') throw new GameError('Ce n’est pas le moment de donner un indice.')
    if (seat !== this.clueGiver) throw new GameError('Ce n’est pas à vous de donner l’indice.')
    const error = validateClue(text, this.currentWord)
    if (error) {
      this.sendTo(this.guesser, { type: 'forbidden', seat, reason: error })
      throw new GameError(error)
    }
    this.history.push({ kind: 'clue', text: text.trim() })
    this.phase = 'guess'
    this.broadcast()
  }

  guess(seat: Seat, text: string): void {
    if (this.phase !== 'guess') throw new GameError('Attendez l’indice avant de répondre.')
    if (seat !== this.guesser) throw new GameError('Ce n’est pas à vous de deviner.')
    const answer = text.trim().slice(0, 40)
    if (!answer) throw new GameError('Votre réponse est vide.')
    const correct = normalize(answer) === normalize(this.currentWord)
    // A typo does not cost a turn: the guesser can fix it and send again.
    if (!correct && !isFrenchWord(answer)) throw new GameError(`« ${answer} » n’est pas dans le dictionnaire.`)
    this.history.push({ kind: 'guess', text: answer, correct })
    if (correct) {
      this.endRound(true)
    } else {
      this.phase = 'clue'
      this.broadcast()
    }
  }

  /** Between words, the next one only starts once both players are ready. */
  setReady(seat: Seat): void {
    if (this.phase !== 'reveal') throw new GameError('Ce n’est pas le moment.')
    this.ready.add(seat)
    if (this.ready.size === this.players.size) this.startRound(this.round + 1)
    else this.broadcast()
  }

  /** Relays how many characters are being typed to the other player, only for whoever has to play right now. */
  typing(seat: Seat, length: number): void {
    const playing = (this.phase === 'clue' && seat === this.clueGiver) || (this.phase === 'guess' && seat === this.guesser)
    if (!playing) return
    const clamped = Math.max(0, Math.min(40, Math.floor(length) || 0))
    this.sendTo(this.other(seat), { type: 'typing', seat, length: clamped })
  }

  say(seat: Seat, text: string): void {
    if (!this.chatOpen) throw new GameError('Le chat est fermé pendant la manche.')
    const message = text.trim().slice(0, CHAT_MESSAGE_MAX_LENGTH)
    if (!message) return
    const name = this.players.get(seat)?.name ?? seat
    this.chat = [...this.chat, { seat, name, text: message }].slice(-CHAT_HISTORY_SIZE)
    this.broadcast()
  }

  private resetToLobby(): void {
    this.stopTimer()
    this.phase = 'lobby'
    this.round = 0
    this.words = []
    this.history = []
    this.rounds = []
    this.ready.clear()
    this.roundEndsAt = null
    for (const p of this.players.values()) p.score = 0
  }

  private startRound(index: number): void {
    this.round = index
    this.history = []
    this.ready.clear()
    this.phase = 'clue'
    this.roundEndsAt = this.clock.now() + ROUND_DURATION_MS
    this.schedule(() => this.endRound(false), ROUND_DURATION_MS)
    this.broadcast()
  }

  private endRound(found: boolean): void {
    const clues = this.history.filter((h) => h.kind === 'clue').length
    const points = found ? pointsFor(clues) : 0
    // Mot de passe is cooperative: both players earn the points of a found word.
    for (const p of this.players.values()) p.score += points
    this.rounds.push({ word: this.currentWord, guesser: this.guesser, found, points })
    this.roundEndsAt = null
    this.stopTimer()
    this.phase = this.round + 1 >= ROUNDS_PER_GAME ? 'finished' : 'reveal'
    this.broadcast()
  }

  private schedule(fn: () => void, ms: number): void {
    this.stopTimer()
    this.timer = this.clock.setTimeout(() => {
      this.timer = null
      fn()
    }, ms)
  }

  private stopTimer(): void {
    if (this.timer !== null) this.clock.clearTimeout(this.timer)
    this.timer = null
  }

  viewFor(seat: Seat): RoomView {
    const inRound = this.phase === 'clue' || this.phase === 'guess'
    const showWord =
      (inRound && seat === this.clueGiver) || this.phase === 'reveal' || this.phase === 'finished'
    const word = this.phase === 'lobby' ? null : this.phase === 'finished' ? this.rounds.at(-1)!.word : this.currentWord
    return {
      code: this.code,
      you: seat,
      players: (['A', 'B'] as const)
        .map((s) => this.players.get(s))
        .filter((p): p is Player => !!p)
        .map((p) => ({ seat: p.seat, name: p.name, score: p.score })),
      phase: this.phase,
      round: this.round,
      totalRounds: ROUNDS_PER_GAME,
      guesser: this.phase === 'lobby' ? null : this.guesser,
      clueGiver: this.phase === 'lobby' ? null : this.clueGiver,
      word: showWord ? word : null,
      wordLength: word ? word.length : null,
      history: this.history,
      remainingMs: this.roundEndsAt === null ? null : Math.max(0, this.roundEndsAt - this.clock.now()),
      lastRound: this.rounds.at(-1) ?? null,
      rounds: this.rounds,
      ready: [...this.ready],
      chat: this.chat,
      chatOpen: this.chatOpen,
    }
  }

  private sendTo(seat: Seat, msg: ServerMessage): void {
    this.players.get(seat)?.send(msg)
  }

  private broadcast(): void {
    for (const p of this.players.values()) {
      p.send({ type: 'state', room: this.viewFor(p.seat) })
    }
  }

  dispose(): void {
    this.stopTimer()
  }
}

/** Keeps track of all rooms, keyed by a short code players share with each other. */
export class Lobby {
  private rooms = new Map<string, Room>()
  private readonly clock: Clock

  constructor(clock: Clock = realClock) {
    this.clock = clock
  }

  create(): Room {
    let code: string
    do {
      code = Array.from({ length: 4 }, () =>
        'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(this.clock.random() * 24)],
      ).join('')
    } while (this.rooms.has(code))
    const room = new Room(code, this.clock)
    this.rooms.set(code, room)
    return room
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.trim().toUpperCase())
  }

  leave(room: Room, seat: Seat): void {
    room.removePlayer(seat)
    if (room.isEmpty) {
      room.dispose()
      this.rooms.delete(room.code)
    }
  }
}
