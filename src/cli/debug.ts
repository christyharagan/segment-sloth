import { launch } from '../ngrok'
import { load_settings, get_settings_file } from '../settings'
import { server } from '../server'
import { run_exec } from '../sam'
import { deploy } from '..'

export async function debug(type: 'local' | 'remote' | 'segment', access_token?: string, tunnel?: string) {
  let settings = await load_settings(get_settings_file())

  let debug_url: string | undefined
  if ((type == 'remote' || type == 'segment') && !tunnel && settings.proxy_port && settings.use_ngrok) {
    [debug_url] = await launch(settings.proxy_port)
    console.log('Local instance publicly available at: ' + debug_url)
  }

  if ((type == 'segment') && !(debug_url || tunnel)) {
    console.error('No public URL available for running this type of debug instance (' + type + ')')
    return
  }

  if (type == 'segment') {
    if (!settings.work_id) {
      console.error('Workspace ID must be provided for running this type of debug instance (' + type + ')')
      return
    }
    if (!settings.access_token && !access_token) {
      console.error('Access token must be provided for running this type of debug instance (' + type + ')')
      return
    }

    deploy(false, access_token, undefined, undefined, undefined, debug_url || tunnel)
  }

  if (type == 'remote' || type == 'segment') {
    await server(settings)
  }

  run_exec(settings, true)
}