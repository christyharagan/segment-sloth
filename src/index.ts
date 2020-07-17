import { DestFns, SrcFn, load_settings, get_settings_file } from './settings'
import fetch, { Headers } from 'node-fetch'
import { transpile, ScriptTarget } from 'typescript'
import { deploy_source, deploy_destination, OptionalFunctionSettings, RequiredFunctionSettings } from './deployer'
import 'segment-typescript-definitions/common'
import * as fs from 'fs-extra'
import * as path from 'path'

export async function deploy(is_dev: boolean, access_token?: string, work_slug?: string, work_id?: string, out_file?: string, debug_url?: string) {
  let settings = await load_settings(get_settings_file())
  let settings_js: string
  if (settings.language == 'javascript') {
    settings_js = await fs.readFile(path.join(process.cwd(), 'src', 'settings.js'), 'utf8')
  } else {
    let settings_ts = await fs.readFile(path.join(process.cwd(), 'src', 'settings.ts'), 'utf8')
    settings_js = transpile(settings_ts, {
      target: ScriptTarget.ES2017
    })
  }
  // = await fs.readFile(settings.language == 'javascript' ? path.join(process.cwd(), 'src', 'settings.js') : path.join(process.cwd(), 'out', 'settings.js'), 'utf8')

  let optionalSettings: OptionalFunctionSettings = {}
  let requiredSettings: RequiredFunctionSettings = {}
  const secret = 'secret'
  const string = 'string'
  const array = 'array'
  const map = 'map'
  const boolean = 'boolean'
  function validate() { }
  eval(`${settings_js}
optionalSettings = OptionalSettings
requiredSettings = RequiredSettings`)

  if (settings.fn_type == 'source') {
    await deploy_source(settings, is_dev, requiredSettings, optionalSettings, access_token, work_slug, work_id, debug_url, out_file)
  } else {
    await deploy_destination(settings, is_dev, requiredSettings, optionalSettings, access_token, work_slug, work_id, debug_url, out_file)
  }
}

export type SrcPayload = {
  body: string | object
  headers: { [key: string]: string },
  queryParameters: { [key: string]: string | number | boolean }
}

function urlArgsToString(urlArgs: { [key: string]: string | number | boolean }) {
  if (!urlArgs) {
    return ''
  }
  let keys = Object.keys(urlArgs);
  if (keys.length == 0) {
    return ''
  }
  let s = '?'
  keys.forEach(key => {
    let value = urlArgs[key]
    let value_str = value
    s += '&' + key + '=' + value_str
  })
  return s
}

// export type FunctionSettings = { [s: string]: string | boolean | string[] | { [k: string]: string } }

export function test_src(payload: SrcPayload, settings: SegmentSettings, sam_port: number, sam_host?: string) {
  if (typeof payload.body !== 'string') {
    payload.headers['Content-Type'] = 'application/json'
  }
  (payload as any).settings = settings
  return fetch(`http://${sam_host || '127.0.0.1'}:${sam_port}/function`, {//${urlArgsToString(payload.queryParameters)}
    method: 'post',
    body: JSON.stringify(payload), //typeof payload.body == 'string' ? payload.body : JSON.stringify(payload.body),
    headers: {
      'Content-Type': 'application/json'
    },
    // headers: payload.headers
  }).then(r => r.json())
}

export async function test_dest(event: SegmentTrackEvent | SegmentGroupEvent | SegmentIdentifyEvent | SegmentAliasEvent | SegmentScreenEvent | SegmentPageEvent, settings: SegmentSettings, sam_port: number, sam_host?: string) {
  return fetch(`http://${sam_host || '127.0.0.1'}:${sam_port}/function`, {
    method: 'post',
    body: JSON.stringify({ event, settings }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export async function call_src(_payload: any, onRequest: SrcFn, output: any) {
  output.tracks = []
  output.identifies = []
  output.groups = []
  output.aliases = []
  output.screens = []
  output.pages = [];

  (global as any).Segment = {
    identify(i: SegmentOptions & SegmentSourceIdentify & SegmentId) {
      output.identifies.push(i)
    },
    track<E extends SegmentEvents>(t: SegmentOptions & SegmentTrackObject<E> & SegmentId) {
      output.tracks.push(t)
    },
    group(t: SegmentOptions & SegmentGroup & SegmentId) {
      output.groups.push(t)
    },
    alias(t: SegmentOptions & SegmentAlias & SegmentId) {
      output.aliases.push(t)
    },
    page(t: SegmentOptions & SegmentPage & SegmentId) {
      output.pages.push(t)
    },
    screen(t: SegmentOptions & SegmentScreen & SegmentId) {
      output.screens.push(t)
    }
  };

  let payload = JSON.parse(_payload.body)

  let body = payload.body
  const settings = payload.settings

  await onRequest({
    json() {
      return JSON.parse(body)
    },
    text() {
      return body
    },
    headers: new Headers(payload.headers) as any,
    // TODO: This mimics the Segment Test approach. I suspect no one uses this in reality, but does this need to match the actual URL called by the test?
    url: new URL('https://fn.segmentapis.com/' + urlArgsToString(payload.queryParameters))
  }, settings)
}

export async function call_dest(_event: any, fns: DestFns) {
  const event_and_settings = JSON.parse(_event.body)
  const event = event_and_settings.event
  const settings = event_and_settings.settings
  switch (event.type) {
    case 'alias': {
      if (fns.onAlias) {
        await fns.onAlias(event, settings)
      }
      break
    }
    case 'identify': {
      if (fns.onIdentify) {
        await fns.onIdentify(event, settings)
      }
      break
    }
    case 'page': {
      if (fns.onPage) {
        await fns.onPage(event, settings)
      }
      break
    }
    case 'screen': {
      if (fns.onScreen) {
        await fns.onScreen(event, settings)
      }
      break
    }
    case 'track': {
      if (fns.onTrack) {
        await fns.onTrack(event, settings)
      }
      break
    }
    case 'group': {
      if (fns.onGroup) {
        await fns.onGroup(event, settings)
      }
      break
    }
  }
}