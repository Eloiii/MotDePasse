import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { WebSocketServer, type WebSocket } from 'ws'
import { GameError, Lobby, type Player, type Room } from './game.ts'
import type { ClientMessage, ServerMessage } from './protocol.ts'

const PORT = Number(process.env.PORT ?? 3001)
const DIST = resolve(import.meta.dirname, '../dist')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

// Serves the built client (npm run build) so a single process hosts the whole game.
const http = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (url.pathname === '/healthz') {
    res.writeHead(200).end('ok')
    return
  }
  let file = normalize(join(DIST, decodeURIComponent(url.pathname)))
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) {
    file = join(DIST, 'index.html')
  }
  if (!existsSync(file)) {
    res.writeHead(404).end('Client non construit : lancez "npm run build" ou utilisez "npm run dev".')
    return
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
})

const wss = new WebSocketServer({ server: http, path: '/ws' })
const lobby = new Lobby()

wss.on('connection', (ws: WebSocket) => {
  let room: Room | null = null
  let player: Player | null = null

  const send = (msg: ServerMessage) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg))
  }

  const leave = () => {
    if (room && player) lobby.leave(room, player.seat)
    room = null
    player = null
  }

  const handle = (msg: ClientMessage) => {
    switch (msg.type) {
      case 'create': {
        leave()
        room = lobby.create()
        player = room.addPlayer(msg.name, send)
        return
      }
      case 'join': {
        const target = lobby.get(msg.code)
        if (!target) throw new GameError('Aucune partie avec ce code.')
        leave()
        player = target.addPlayer(msg.name, send)
        room = target
        return
      }
      case 'leave':
        leave()
        send({ type: 'left' })
        return
    }
    if (!room || !player) throw new GameError('Vous n’êtes dans aucune partie.')
    switch (msg.type) {
      case 'start':
        return room.start(player.seat)
      case 'clue':
        return room.giveClue(player.seat, String(msg.text))
      case 'guess':
        return room.guess(player.seat, String(msg.text))
      case 'ready':
        return room.setReady(player.seat)
      case 'typing':
        return room.typing(player.seat, Number(msg.length))
      case 'chat':
        return room.say(player.seat, String(msg.text))
    }
  }

  ws.on('message', (data) => {
    try {
      handle(JSON.parse(String(data)) as ClientMessage)
    } catch (err) {
      if (err instanceof GameError) send({ type: 'error', message: err.message })
      else {
        console.error(err)
        send({ type: 'error', message: 'Message invalide.' })
      }
    }
  })

  ws.on('close', leave)
})

http.listen(PORT, () => {
  console.log(`Mot de passe server on http://localhost:${PORT} (WebSocket: /ws)`)
})
