#!/usr/bin/env node

import * as yargs from 'yargs'
import * as os from 'os'
import * as fs from 'fs-extra'
import * as path from 'path'
import YAML from 'yaml'
import { exec, spawn } from 'child_process'

const HOME_DIR = os.homedir()
const SPM_DIR = path.join(HOME_DIR, '.spm')
const SPM_PACKAGES_DIR = path.join(SPM_DIR, 'packages')
const SPM_SETTINGS_FILE = path.join(SPM_DIR, 'settings.yaml')

type SPMSettings = {
  work_slug: string
  work_id: string
  access_token: string
}

async function load_settings(file: string): Promise<SPMSettings | undefined> {
  if (fs.existsSync(file)) {
    let f = await fs.readFile(file, 'utf8')
    return YAML.parse(f)
  } else {
    return undefined
  }
}

async function save_settings(file: string, settings: SPMSettings) {
  await fs.writeFile(file, YAML.stringify(settings), 'utf8')
}

yargs
  .command('install <github_repo>', '', {}, async args => {
      let r = args.github_repo as string
      let rs = r.split('/')
      if (rs.length !== 2) {
        throw 'Invalid package name. Package name must follow the pattern: GITHUB_USER/GITHUB_REPO'
      }
      let [u, p] = rs

      let settings = await load_settings(SPM_SETTINGS_FILE)
      if (settings) {
        let access_token = settings.access_token
        let work_id = settings.work_id
        let work_slug = settings.work_slug
        let user_dir = path.join(SPM_PACKAGES_DIR, u)
        await fs.mkdirp(user_dir)
        let package_dir = path.join(user_dir, p)

        if (fs.existsSync(package_dir) && fs.existsSync(path.join(package_dir, '.git'))) {
          // Package already exists, pull latest changes
          await new Promise((resolve, reject) => {
            exec(`cd ${user_dir} && git pull`, (error, std_out) => {
              if (error) {
                reject(error)
              } else {
                resolve()
              }
            })
          })
        } else {
          // Clone package
          let ghr = `https://github.com/${u}/${p}.git`
          await new Promise((resolve, reject) => {
            exec(`cd ${user_dir} && git clone ${ghr}`, (error, std_out) => {
              if (error) {
                reject(error)
              } else {
                resolve()
              }
            })
          })
        }
        
        await new Promise((resolve, reject) => {
          exec(`cd ${package_dir} && npm i && sloth deploy ${access_token} ${work_id} ${work_slug}`, (error, std_out) => {
            if (error) {
              reject(error)
            } else {
              resolve()
            }
          })
        })
      } else {
        console.log('SPM hasn\'t been setup. Run "spm setup --help" for details')
      }
    // }
  })
  .command('setup', '', {
    aliases: 's',
    builder: {
      'access_token': {
        description: 'The access token for the workspace',
        string: true,
        alias: 'a',
        required: true
      },
      'work_id': {
        description: 'The workspace ID',
        string: true,
        alias: 'i',
        required: true
      },
      'work_slug': {
        description: 'The workspace slug',
        string: true,
        alias: 's',
        required: true
      }
    },
    handler: async args => {
      await fs.mkdirp(SPM_DIR)
      const settings: SPMSettings = {
        access_token: args.access_token as string,
        work_id: args.work_id as string,
        work_slug: args.work_slug as string
      }
      await save_settings(SPM_SETTINGS_FILE, settings)
    }
  })
  .demandCommand()
  .argv