import { exec } from 'child_process'
import fetch from 'node-fetch'

export async function launch(port: number): Promise<[string, boolean]> {
  let url: string | undefined
  try {
    url = await get_proxy_url(port)
  } catch (e) { }
  if (url) {
    return [url, true]
  }
  exec('ngrok http ' + port, (error, stdout) => {
    if (error) {
      console.error(error)
    }
  })
  await new Promise(resolve => setTimeout(resolve, 1000))
  return [await get_proxy_url(port) as string, false]
}

export async function get_proxy_url(port: number): Promise<string | undefined> {
  let resp = await fetch('http://127.0.0.1:4040/api/tunnels')
  let j = await resp.json()
  let tunnels = j.tunnels as any[]
  let tunnel = tunnels.find(tunnel => tunnel.config.addr == 'http://localhost:' + port)

  return tunnel ? tunnel.public_url : undefined
}

export function ngrok_installed(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec(`ngrok --version`, (error, std_out) => {
      if (error) {
        if (error.code === 1) {
          resolve(false) // ngrok command not installed
        } else {
          reject(error)
        }
      } else {
        resolve(std_out.substring(0, 5) == 'ngrok')
      }
    })
  })
}
