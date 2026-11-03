const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')

function worker() {
  const listeners = {}, stores = new Map()
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map())
      const store = stores.get(name)
      return { match: async key => store.get(key)?.clone(), put: async (key, value) => store.set(key, value) }
    },
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'), {
    self: { location: { origin: 'https://beer.test' }, addEventListener: (name, fn) => listeners[name] = fn },
    caches, URL, Response, fetch: async () => { throw new Error('offline') },
  })
  function request(url = '/', options = {}) {
    let result
    listeners.fetch({ request: { url: new URL(url, 'https://beer.test').href, method: 'GET', mode: 'navigate', headers: new Headers(), ...options }, respondWith: promise => result = promise })
    return result
  }
  return { caches, request }
}

test('offline: la dernière page visitée prime sur la page précachée', async () => {
  const { caches, request } = worker()
  await (await caches.open('beer-road-pwa-v1-5-1-static')).put('/', new Response('ancienne'))
  await (await caches.open('beer-road-pwa-v1-5-1-pages')).put('/', new Response('récente'))
  assert.equal(await (await request()).text(), 'récente')
})

test('offline: repli sur la page précachée puis sur la page de secours', async () => {
  for (const key of ['/', '/offline.html']) {
    const { caches, request } = worker()
    await (await caches.open('beer-road-pwa-v1-5-1-static')).put(key, new Response(key))
    assert.equal(await (await request()).text(), key)
  }
})

test('les requêtes privées et les callbacks de connexion restent hors cache', () => {
  const { request } = worker()
  for (const url of ['https://project.supabase.co/rest/v1/posts', '/api/posts', '/?code=secret', '/?access_token=secret', '/?_rsc=abc']) {
    assert.equal(request(url), undefined)
  }
  assert.equal(request('/private.json', { headers: new Headers({ authorization: 'Bearer secret' }) }), undefined)
  assert.equal(request('/', { method: 'POST' }), undefined)
})
