import Koa from 'koa'
import Router from 'koa-router'
import body from 'koa-body'
import _fetch from 'node-fetch'
import { Settings } from './settings'
import { test_src, test_dest } from '.'

export async function server(settings: Settings) {
  if (!settings.proxy_port) {
    throw 'Cannot run proxy server without proxy port defined'
  }
  const server = new Koa()
  const router = new Router()

  server.use(body())

  router.post('/', async ctx => {
    if (settings.fn_type == 'source') {
      test_src(ctx.request.body, ctx.request.body.settings, settings.sam_port)
    } else {
      test_dest(ctx.request.body.event, ctx.request.body.settings, settings.sam_port)
    }

    ctx.body = ''
  })

  let port = settings.proxy_port

  server.use(router.routes())
  server.listen(port)
}
