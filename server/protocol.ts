// Types shared between the server and the Vue client.

export const ROUNDS_PER_GAME = 6
export const ROUND_DURATION_MS = 30_000
export const CHAT_HISTORY_SIZE = 50
export const CHAT_MESSAGE_MAX_LENGTH = 200

export type Seat = 'A' | 'B'

export type Phase =
  | 'lobby' // waiting for the second player / for the host to start
  | 'clue' // clue giver must type a clue
  | 'guess' // guesser must type a guess
  | 'reveal' // round over, the word is shown; waiting for both players to be ready
  | 'finished' // all rounds played

export interface PlayerView {
  seat: Seat
  name: string
  score: number
}

export interface HistoryEntry {
  kind: 'clue' | 'guess'
  text: string
  correct?: boolean
}

export interface ChatMessage {
  seat: Seat
  name: string
  text: string
}

export interface RoundSummary {
  word: string
  guesser: Seat
  found: boolean
  points: number
}

/** The state of a room as seen by one specific player. */
export interface RoomView {
  code: string
  you: Seat
  players: PlayerView[]
  phase: Phase
  /** 0-based index of the current round. */
  round: number
  totalRounds: number
  guesser: Seat | null
  clueGiver: Seat | null
  /** Only sent to the clue giver, or to everyone during reveal/finished. */
  word: string | null
  /** Number of letters in the word, always visible. */
  wordLength: number | null
  history: HistoryEntry[]
  /** Milliseconds left on the round timer when this view was sent. */
  remainingMs: number | null
  lastRound: RoundSummary | null
  rounds: RoundSummary[]
  /** Players who clicked "ready" during the reveal phase. */
  ready: Seat[]
  chat: ChatMessage[]
  /** Chat is closed while a word is being played, so nobody can whisper the answer. */
  chatOpen: boolean
}

export type ClientMessage =
  | { type: 'create'; name: string }
  | { type: 'join'; code: string; name: string }
  | { type: 'start' }
  | { type: 'clue'; text: string }
  | { type: 'guess'; text: string }
  | { type: 'ready' }
  /** Length of the text currently in the input (0 = empty). The text itself is never sent. */
  | { type: 'typing'; length: number }
  | { type: 'chat'; text: string }
  | { type: 'leave' }

export type ServerMessage =
  | { type: 'state'; room: RoomView }
  | { type: 'error'; message: string }
  | { type: 'left' }
  /** The other player is typing a clue or an answer; only the length is shared, to show "•••". */
  | { type: 'typing'; seat: Seat; length: number }
  /** The clue giver tried a forbidden clue (the clue itself is not sent, it may leak the word). */
  | { type: 'forbidden'; seat: Seat; reason: string }
