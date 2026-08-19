import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const INBOX_REL = '../shared_mock/rep_inbox.json'

function emptyInbox() {
  return {
    supervisorReviews: [],
    notifications: [],
    planOfficialNotes: [],
    planRepReplies: [],
  }
}

function readFile(root: string) {
  const path = resolve(root, INBOX_REL)
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return emptyInbox()
  }
}

function writeFile(root: string, data: unknown) {
  const path = resolve(root, INBOX_REL)
  mkdirSync(resolve(root, '../shared_mock'), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/** يقرأ/يكتب shared_mock/rep_inbox.json من المتصفح عبر Vite */
export function sharedMockInboxPlugin(): Plugin {
  return {
    name: 'shared-mock-inbox',
    configureServer(server) {
      const root = server.config.root
      server.middlewares.use('/__shared_mock/inbox', (req, res, next) => {
        if (req.method === 'GET') {
          const data = readFile(root)
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(data))
          return
        }
        if (req.method === 'PUT' || req.method === 'POST') {
          const chunks: Buffer[] = []
          req.on('data', (c) => chunks.push(Buffer.from(c)))
          req.on('end', () => {
            try {
              const raw = Buffer.concat(chunks).toString('utf8')
              const data = JSON.parse(raw || '{}')
              writeFile(root, {
                supervisorReviews: data.supervisorReviews ?? [],
                notifications: data.notifications ?? [],
                planOfficialNotes: data.planOfficialNotes ?? [],
                planRepReplies: data.planRepReplies ?? [],
              })
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              res.statusCode = 400
              res.end(
                JSON.stringify({
                  ok: false,
                  error: err instanceof Error ? err.message : 'bad json',
                }),
              )
            }
          })
          return
        }
        next()
      })
    },
  }
}
