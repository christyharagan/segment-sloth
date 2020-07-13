import { generate_protocol_definitions, get_protocol_filename } from '../generate_protocol'
import { load_settings, get_settings_file } from '../settings'

export async function sync_tp(access_token?: string) {
  let settings = await load_settings(get_settings_file())
  if (!settings.work_slug) {
    console.error('Workspace slug must be provided in settings file to synchronise tracking plans')
    return
  }
  if (!settings.tp_name || settings.tp_name == 'none') {
    console.error('Tracking plan name must be provided in settings file to synchronise tracking plans')
    return
  }
  if (!settings.access_token && !access_token) {
    console.error('Access token must be provided as argument or provided in settings file to synchronise tracking plans')
    return
  }
  generate_protocol_definitions({
    work_slug: settings.work_slug,
    tp_name: settings.tp_name,
    access_token: (access_token || settings.access_token) as string,
    out_file: get_protocol_filename()
  })
}