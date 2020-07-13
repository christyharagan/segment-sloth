import { transpile, ScriptTarget } from 'typescript'
import { listFunctions, updateFunction, createFunction, getWorkspace } from 'segment-typescript-api/cjs/config_api'

import * as fs from 'fs-extra'
import { Settings, get_source_file } from './settings'
import { pack } from './webpack'

export async function get_js(settings: Settings) {
  let fn_path = get_source_file(settings)
  if (settings.language == 'typescript') {
    let ts = await fs.readFile(fn_path, 'utf8')
    return transpile(ts, {
      target: ScriptTarget.ES2017
    })
  } else {
    return await fs.readFile(fn_path, 'utf8')
  }

}

export type RequiredFunctionSetting = 'map' | 'boolean' | 'array' | 'string' | 'secret' | { type: 'map' | 'boolean' | 'array' | 'string' | 'secret', description: string }

export type RequiredFunctionSettings = { [K: string]: RequiredFunctionSetting }
export type OptionalFunctionSettings = { [K: string]: 'string' | 'secret' | { type: 'string' | 'secret', description: string } }

export async function deploy_source(settings: Settings, is_dev: boolean, req_fn_settings?: RequiredFunctionSettings, op_fn_settings?: OptionalFunctionSettings, access_token?: string, work_slug?: string, work_id?: string, debug_url?: string, out_file?: string) {
  if (!(work_slug || settings.work_slug) || !(settings.work_id || work_id) || !(settings.access_token || access_token)) {
    throw 'Cannot deploy without workspace Slug, workspace ID, and access token'
  }
  let js = ''

  if (debug_url) {
    if (debug_url.charAt(debug_url.length - 1)) {
      debug_url = debug_url + '/'
    }
    js = `
async function onRequest(request, settings) {
  let headers = {}
  let body = await request.text()
  request.headers.forEach((v, k) => {
    headers[k] = v
  })
  let queryParams = {}
  request.url.searchParams.forEach((value, key) => {
    queryParams[key] = value
  })
  let payload = {
    headers,
    body,
    settings,
    queryParams
  }
  return fetch('${debug_url}', {
    method: 'post',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}`
  } else {
    js = await get_js(settings)
    js = await pack(js, true, is_dev)
  }

  if (out_file) {
    await fs.writeFile(out_file, js, 'utf8')
  } else {
    await build_function(settings.fn_name, true, (work_slug || settings.work_slug) as string, (work_id || settings.work_id) as string, js, (access_token || settings.access_token) as string, convert_function_settings(req_fn_settings, op_fn_settings))
  }
}

function to_camel_case(input: string) {
  let regex = /[A-Z\xC0-\xD6\xD8-\xDE]?[a-z\xDF-\xF6\xF8-\xFF]+|[A-Z\xC0-\xD6\xD8-\xDE]+(?![a-z\xDF-\xF6\xF8-\xFF])|\d+/g;
  let words = input.match(regex)

  if (words) {
    return words.reduce((result, word, i) => {
      let temp = word.toLowerCase()
      return result + (i == 0 ? temp : (temp = temp.substr(0, 1).toUpperCase() + temp.substr(1)))
    }, '')
  } else {
    throw 'Regex didnt match'
  }
}

function to_snake_case(string: string) {
  let words = string.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
  if (words) {
    return words.map(word => word.toLowerCase()).join('_')
  } else {
    throw 'Regex didnt match'
  }
}

function build_setting(k: string, v: RequiredFunctionSetting): BuildFunctionSetting {
  let setting: BuildFunctionSetting = {
    name: to_camel_case(k),
    label: to_snake_case(k),
    type: 'string'
  }

  if (typeof v !== 'string') {
    setting.description = v.description
    v = v.type
  }

  switch (v) {
    case 'array': {
      setting.type = 'array'
      break
    }
    case 'boolean': {
      setting.type = 'boolean'
      break
    }
    case 'map': {
      setting.type = 'text-map'
      break
    }
    case 'secret': {
      setting.sensitive = true
      break
    }
  }

  return setting
}

function convert_function_settings(req_fn_settings?: RequiredFunctionSettings, op_fn_settings?: OptionalFunctionSettings): BuildFunctionSettings | undefined {
  let output: BuildFunctionSettings = []

  if (req_fn_settings) {
    Object.keys(req_fn_settings).forEach(k => {
      let v = req_fn_settings[k]
      let s = build_setting(k, v)
      s.required = true
      output.push(s)
    })
  }
  if (op_fn_settings) {
    Object.keys(op_fn_settings).forEach(k => {
      let v = op_fn_settings[k]
      let s = build_setting(k, v)
      output.push(s)
    })
  }

  return req_fn_settings || op_fn_settings ? output : undefined
}

export async function deploy_destination(settings: Settings, is_dev: boolean, req_fn_settings?: RequiredFunctionSettings, op_fn_settings?: OptionalFunctionSettings, access_token?: string, work_slug?: string, work_id?: string, debug_url?: string, out_file?: string) {
  if (!(work_slug || settings.work_slug) || !(settings.work_id || work_id) || !(settings.access_token || access_token)) {
    throw 'Cannot deploy without workspace ID and access token'
  }
  let js = ''

  if (debug_url) {
    js = `async function onTrack(event, settings) {
  await fetch('${debug_url}', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event, settings
    })
  })
}
async function onIdentify(event, settings) {
  await fetch('${debug_url}', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event, settings
    })
  })
}
async function onAlias(event, settings) {
  await fetch('${debug_url}', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event, settings
    })
  })
}
async function onPage(event, settings) {
  await fetch('${debug_url}', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event, settings
    })
  })
}
async function onScreen(event, settings) {
  await fetch('${debug_url}', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event, settings
    })
  })
}
async function onGroup(event, settings) {
  await fetch('${debug_url}', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event, settings
    })
  })
}`
  } else {
    js = await get_js(settings)
    js = await pack(js, false, is_dev)
  }

  if (out_file) {
    await fs.writeFile(out_file, js, 'utf8')
  } else {
    await build_function(settings.fn_name, false, (work_slug || settings.work_slug) as string, (work_id || settings.work_id) as string, js, (access_token || settings.access_token) as string, convert_function_settings(req_fn_settings, op_fn_settings))
  }
}

export type BuildFunctionSetting = {
  name: string;
  label: string;
  type: 'string' | 'boolean' | 'text-map' | 'array';
  description?: string;
  required?: boolean;
  sensitive?: boolean;
}

export type BuildFunctionSettings = BuildFunctionSetting[]

export async function build_function(fn_name: string, is_src: boolean, work_slug: string, work_id: string, code: string, access_token: string, settings?: BuildFunctionSettings, dont_overwrite?: true): Promise<string | false> {
  let wks = is_src ? '' : (await getWorkspace(access_token, work_slug)).display_name

  let fns = await listFunctions(access_token, work_id, { type: is_src ? 'SOURCE' : 'DESTINATION', page_size: 100 })
  let fn = fns.functions ? fns.functions.find(fn => fn.display_name == (is_src ? fn_name : fn_name + ' (' + wks + ')')) : undefined

  if (fn) {
    if (dont_overwrite) {
      return false
    }
    let _fn = fn
    let r = await updateFunction(access_token, work_id, _fn.id, {
      function: {
        ...settings ? { settings } : {},
        code,
        buildpack: 'boreal'
      },
      update_mask: {
        paths: ['function.code', 'function.buildpack', ...settings ? ['function.settings' as 'function.settings'] : []]
      }
    })
    return r.id
  } else {
    let r = await createFunction(access_token, work_id, is_src ? 'SOURCE' : 'DESTINATION', {
      ...settings ? { settings } : {},
      code,
      buildpack: 'boreal',
      display_name: fn_name,
    })
    return r.id
  }
}