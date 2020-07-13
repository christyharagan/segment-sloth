import { load_settings, get_settings_file } from '../settings'
import { run_exec } from '../sam'

export async function test() {
  let settings = await load_settings(get_settings_file())

  run_exec(settings, false)
}