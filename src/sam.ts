import { exec, spawn } from 'child_process'
import { Settings } from './settings'
import * as path from 'path'
import * as fs from 'fs-extra'

export function nodemon_installed(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec(`nodemon --version`, (error, std_out) => {
      if (error) {
        reject(error)
      } else {
        resolve(std_out.substring(0, 1).match(/\d/) !== null)
      }
    })
  })
}

export async function run_exec(settings: Settings, is_debug: boolean) {
  let is_nodemon = await nodemon_installed()
  if (is_debug) {
    if (settings.language == 'typescript') {
      let is_nodemon = await nodemon_installed()
      let te = is_nodemon ? `nodemon --watch src -e ts --exec "tsc -p ."` : 'tsc -p .'
      spawn(te, { shell: true, stdio: 'inherit' })
    }
  } else {
    await fs.mkdirp(path.join(process.cwd(), 'out'))

    let deploy_exec = `node ../segment-local-functions/out/cli/sloth.js deploy --is_dev --out_file=${path.join(process.cwd(), 'out', 'function.js')}`
    let te = is_nodemon ?
      `nodemon --watch src -e ${settings.language == 'javascript' ? 'js' : 'ts'} --exec "${deploy_exec}"` :
      deploy_exec
    spawn(te, { shell: true, stdio: 'inherit' })
  }

  // if (settings.language == 'typescript') {
  //   let is_nodemon = await nodemon_installed()
  //   let te = is_nodemon ? `nodemon --watch src -e ts --exec "tsc -p ."` : 'tsc -p .'
  //   spawn(te, { shell: true, stdio: 'inherit' })
  // }

  let e = `sam local start-api --port ${settings.sam_port}`
  if (is_debug) {
    e = `${e} --debug-port ${settings.debug_port}`
  }

  spawn(e, { shell: true, stdio: 'inherit' })
}