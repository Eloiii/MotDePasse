import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isFrenchWord } from './dictionary.ts'
import { normalize, pointsFor, Room, validateClue, type Clock } from './game.ts'
import { ROUND_DURATION_MS, type RoomView, type ServerMessage } from './protocol.ts'
import { WORDS } from './words.ts'

/** Fake clock where timers only fire when `advance` is called. */
function fakeClock() {
  let now = 0
  let timers: { at: number; fn: () => void; id: number }[] = []
  let nextId = 1
  const clock: Clock = {
    now: () => now,
    setTimeout: (fn, ms) => {
      const id = nextId++
      timers.push({ at: now + ms, fn, id })
      return id
    },
    clearTimeout: (id) => {
      timers = timers.filter((t) => t.id !== id)
    },
    random: () => 0.42,
  }
  const advance = (ms: number) => {
    now += ms
    for (const t of timers.filter((t) => t.at <= now)) {
      timers = timers.filter((x) => x !== t)
      t.fn()
    }
  }
  return { clock, advance }
}

function setup() {
  const { clock, advance } = fakeClock()
  const room = new Room('TEST', clock)
  const views: Record<'A' | 'B', RoomView | null> = { A: null, B: null }
  const inbox: Record<'A' | 'B', ServerMessage[]> = { A: [], B: [] }
  const sink = (seat: 'A' | 'B') => (msg: ServerMessage) => {
    inbox[seat].push(msg)
    if (msg.type === 'state') views[seat] = msg.room
  }
  room.addPlayer('Alice', sink('A'))
  room.addPlayer('Bob', sink('B'))
  return { room, views, inbox, advance }
}

test('normalize ignores case and accents', () => {
  assert.equal(normalize('  Éléphant '), 'elephant')
  assert.equal(normalize('Œuf'), 'oeuf')
})

test('clues must be a single word not resembling the answer', () => {
  assert.equal(validateClue('animal', 'éléphant'), null)
  assert.match(validateClue('gros animal', 'éléphant')!, /seul mot/)
  assert.match(validateClue('elephanteau', 'éléphant')!, /Interdit/)
  assert.match(validateClue('photo', 'appareil photo')!, /Interdit/)
  assert.equal(validateClue('manège', 'barbe à papa'), null)
  assert.equal(validateClue('ciel', 'arc-en-ciel') !== null, true)
  assert.match(validateClue('papa', 'barbe à papa')!, /Interdit/)
})

test('the dictionary accepts inflected forms, ignores accents and rejects gibberish', () => {
  for (const w of ['chevaux', 'mangeons', 'Éléphant', 'elephant', 'cœur', 'arc-en-ciel']) assert.ok(isFrenchWord(w), w)
  for (const w of ['qwxz', 'chienn', '']) assert.ok(!isFrenchWord(w), w)
})

test('every word to guess is in the dictionary', () => {
  assert.deepEqual(WORDS.filter((w) => !isFrenchWord(w)), [])
})

test('words that are not in the dictionary are refused without costing a turn', () => {
  const { room, views } = setup()
  room.start('A')
  assert.match(validateClue('zorglub', 'chat')!, /dictionnaire/)
  room.giveClue('B', 'indice')
  assert.throws(() => room.guess('A', 'chienn'), /dictionnaire/)
  assert.equal(views.A!.phase, 'guess')
  assert.equal(views.A!.history.length, 1)
})

test('points decrease with the number of clues', () => {
  assert.deepEqual([1, 2, 5, 9].map(pointsFor), [5, 4, 1, 1])
})

test('only the clue giver sees the word', () => {
  const { room, views } = setup()
  room.start('A')
  assert.equal(views.A!.guesser, 'A')
  assert.equal(views.A!.word, null)
  assert.ok(views.B!.word)
})

test('a full game alternates guessers and scores found words', () => {
  const { room, views, advance } = setup()
  room.start('A')
  for (let round = 0; round < 6; round++) {
    const guesser = views.A!.guesser!
    const giver = guesser === 'A' ? 'B' : 'A'
    assert.equal(guesser, round % 2 === 0 ? 'A' : 'B')
    const word = views[giver]!.word!
    assert.throws(() => room.guess(guesser, word), /Attendez/)
    room.giveClue(giver, 'indice')
    if (round === 5) {
      room.guess(guesser, 'raté')
      advance(ROUND_DURATION_MS) // time runs out
    } else {
      room.guess(guesser, word.toUpperCase())
      room.setReady('A')
      room.setReady('B')
    }
  }
  const final = views.B!
  assert.equal(final.phase, 'finished')
  assert.equal(final.rounds.filter((r) => r.found).length, 5)
  assert.equal(final.players[0].score, 25)
})

test('leaving mid-game sends the remaining player back to the lobby as host', () => {
  const { room, views } = setup()
  room.start('A')
  room.removePlayer('A')
  assert.equal(views.B!.phase, 'lobby')
  assert.equal(views.B!.you, 'A')
})

test('the next word only starts once both players are ready', () => {
  const { room, views, advance } = setup()
  room.start('A')
  room.giveClue('B', 'indice')
  room.guess('A', views.B!.word!)
  advance(60_000)
  assert.equal(views.A!.phase, 'reveal')
  room.setReady('B')
  assert.deepEqual(views.A!.ready, ['B'])
  assert.equal(views.A!.phase, 'reveal')
  room.setReady('A')
  assert.equal(views.A!.phase, 'clue')
  assert.equal(views.A!.round, 1)
  assert.deepEqual(views.A!.ready, [])
})

test('a forbidden clue warns the guesser without leaking the clue', () => {
  const { room, views, inbox } = setup()
  room.start('A')
  const word = views.B!.word!
  assert.throws(() => room.giveClue('B', word), /Interdit/)
  const warning = inbox.A.at(-1)!
  assert.equal(warning.type, 'forbidden')
  assert.ok(!JSON.stringify(warning).includes(word))
  assert.equal(views.A!.phase, 'clue')
})

test('typing is relayed to the other player only by whoever has to play', () => {
  const { room, inbox } = setup()
  room.start('A')
  room.typing('A', 3) // guesser, but it is the clue phase
  assert.equal(inbox.B.at(-1)!.type, 'state')
  room.typing('B', 5)
  assert.deepEqual(inbox.A.at(-1), { type: 'typing', seat: 'B', length: 5 })
})

test('chat is closed while a word is being played', () => {
  const { room, views } = setup()
  room.say('A', 'Salut !')
  assert.equal(views.B!.chat.at(-1)!.text, 'Salut !')
  room.start('A')
  assert.equal(views.B!.chatOpen, false)
  assert.throws(() => room.say('B', views.B!.word!), /fermé/)
})
