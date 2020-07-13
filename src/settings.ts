import YAML from 'yaml'
import * as fs from 'fs-extra'
import * as path from 'path'
import 'segment-typescript-definitions/common'
import 'segment-typescript-definitions/custom-source'
import 'segment-typescript-definitions/custom-destination'

export type SrcFn = (request: SegmentSourceRequest, settings: SegmentSettings) => Promise<void>
export type DestFns = {
  onAlias?: (event: SegmentAliasEvent, settings: SegmentSettings) => Promise<void>
  onScreen?: (event: SegmentScreenEvent, settings: SegmentSettings) => Promise<void>
  onPage?: (event: SegmentPageEvent, settings: SegmentSettings) => Promise<void>
  onIdentify?: (event: SegmentIdentifyEvent, settings: SegmentSettings) => Promise<void>
  onTrack?: (event: SegmentTrackEvent, settings: SegmentSettings) => Promise<void>
  onGroup?: (event: SegmentGroupEvent, settings: SegmentSettings) => Promise<void>
}

export type Settings = {
  language: 'typescript' | 'javascript'
  fn_name: string
  fn_type: 'source' | 'destination'
  work_slug?: string
  work_id?: string
  access_token?: string
  access_token_is_saved?: boolean
  tp_name?: string
  debug_port: number
  sam_port: number
  proxy_port?: number
  use_ngrok?: boolean
  github_deployment?: boolean
  fn_id: string
  generate_tests: boolean
}

export function get_source_file(settings: Settings) {
  return path.join(process.cwd(), 'src', settings.language == 'javascript' ? 'function.js' : 'function.ts')
}

export function get_deploy_file(settings: Settings) {
  return path.join(process.cwd(), settings.language == 'javascript' ? 'src' : 'out', 'function.js')
}

export function get_settings_file(dir?: string) {
  return path.join(dir || process.cwd(), 'sloth.yaml')
}

export async function load_settings(file: string): Promise<Settings> {
  let f = await fs.readFile(file, 'utf8')
  return YAML.parse(f)
}

export async function save_settings(file: string, settings: Settings) {
  await fs.writeFile(file, YAML.stringify(settings), 'utf8')
}