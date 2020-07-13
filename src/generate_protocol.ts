import generate_tsd from 'segment-tsd-generator'
import { listAllTrackingPlans, getTrackingPlan } from 'segment-typescript-api/cjs/config_api'
import * as fs from 'fs'
import * as path from 'path'

export type ProtocolArgs = {
  work_slug: string
  access_token: string
  tp_name: string
  out_file: string
}

export function get_protocol_filename() {
  return path.join(process.cwd(), 'typings', 'protocol.d.ts')
}

export async function generate_protocol_definitions(args: ProtocolArgs) {
  let tps = (await listAllTrackingPlans(args.access_token, args.work_slug))
  let _tp = tps.tracking_plans.find(tp => tp.display_name == args.tp_name)
  if (!_tp) {
    throw 'No Tracking Plan with Display name ' + args.tp_name
  }
  let tp = await getTrackingPlan(args.access_token, args.work_slug, _tp.name)

  let tsd = await generate_tsd(tp)

  await fs.promises.writeFile(args.out_file, tsd, 'utf8')
}
