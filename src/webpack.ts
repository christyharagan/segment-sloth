import { Volume } from 'memfs'
import * as fs from 'fs'
import * as path from 'path'
import webpack from 'webpack'
import { ufs } from 'unionfs'
import join from 'memory-fs/lib/join'
import normalize from 'memory-fs/lib/normalize'

ufs.use(fs)

export function pack(code: string, is_src: boolean, is_dev: boolean): Promise<string> {
  const memfs = new Volume()
  const out_fs = new Volume();
  (out_fs as any).join = join;
  (out_fs as any).normalize = normalize
  memfs.writeFileSync('/in.js', code, { encoding: 'utf8' })
  ufs.use(memfs as any)

  let compiler = webpack({
    mode: is_dev ? 'development' : 'production',
    entry: {
      app: '/in.js'
    },

    externals: ['aws-sdk', 'lodash', 'atob', 'btoa', 'form-data', 'crypto', 'events', 'stream', 'node-fetch', 'oauth', 'xml'],
    output: {
      libraryTarget: 'var',
      library: 'webpack',
      path: '/',
      filename: './out.js'
    },
    context: process.cwd(),
    resolve: {
      modules: [path.join(process.cwd(), './node_modules')]
    }
  })

  compiler.inputFileSystem = ufs
  compiler.outputFileSystem = out_fs as any

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (stats.hasErrors()) {
        reject(stats.toJson('verbose').errors)
      } else if (err) {
        reject(err)
      } else {
        resolve(`var lodash = _;
var crypto = Crypto;
var aws_sdk = AWS;
var form_data = FormData;
var oauth = OAuth;
        ` + (is_dev ? (out_fs.readFileSync('/out.js', { encoding: 'utf8' }) as string) : ((out_fs.readFileSync('/out.js', { encoding: 'utf8' }) as string)
            .replace(/module\.exports \= aws\-sdk/, 'module.exports = aws_sdk')
            .replace(/module\.exports \= form\-data/, 'module.exports = form_data') + (is_src ? `
onRequest = webpack['onRequest']` : `
onTrack = webpack['onTrack']
onAlias = webpack['onAlias']
onIdentify = webpack['onIdentify']
onGroup = webpack['onGroup']
onPage = webpack['onPage']
onScreen = webpack['onScreen']`))))
      }
    })
  })
}
