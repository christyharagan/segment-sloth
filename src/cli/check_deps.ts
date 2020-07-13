import { get_js } from '../deployer'
import { pack } from '../webpack'
import { load_settings, get_settings_file } from '../settings'

export async function check_deps() {
  let settings = await load_settings(get_settings_file())
  let js = await get_js(settings)
  await pack(js, true, false)
  console.log('Ok')
}