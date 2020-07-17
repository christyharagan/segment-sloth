import * as i from 'inquirer'
import * as fs from 'fs-extra'
import * as path from 'path'
import { listAllTrackingPlans } from 'segment-typescript-api/cjs/config_api'
import * as Rx from 'rxjs'
import { generate_protocol_definitions, get_protocol_filename } from '../generate_protocol'
import { exec } from 'child_process'
import { Settings, save_settings, load_settings, get_settings_file } from '../settings'
import { build_function } from '../deployer'
import { ngrok_installed } from '../ngrok'

const TEMPLATE_DIR = path.join(__dirname, '..', '..', 'template')
const SAM_DIR = path.join(TEMPLATE_DIR, 'sam')
const JS_DIR = path.join(TEMPLATE_DIR, 'js')
const JS_FN_DIR = path.join(JS_DIR, 'fn')
const GIT_DIR = path.join(TEMPLATE_DIR, 'github')
const JS_SAM_DIR = path.join(JS_DIR, 'sam')
const JS_TESTS_DIR = path.join(JS_DIR, 'tests')
const JS_VSCODE_DIR = path.join(JS_DIR, 'vscode')
const JS_PROJECT_DIR = path.join(TEMPLATE_DIR, 'js-project')
const TS_DIR = path.join(TEMPLATE_DIR, 'ts')
const TS_PROJECT_DIR = path.join(TEMPLATE_DIR, 'ts-project')
const TS_FN_DIR = path.join(TS_DIR, 'fn')
const TS_SAM_DIR = path.join(TS_DIR, 'sam')
const TS_TESTS_DIR = path.join(TS_DIR, 'tests')
const TS_VSCODE_DIR = path.join(TS_DIR, 'vscode')
const TS_TYPINGS_DIR = path.join(TS_DIR, 'typings')

const cwd = process.cwd()

async function copy_file_with_substitution(src_path: string, dest_path: string, answers: Settings) {
  let contents = await fs.readFile(src_path, 'utf8')
  contents = contents
    .replace(/<fn_name>/g, answers.fn_name)
    .replace(/<fn_type>/g, answers.fn_type == 'source' ? 'Source' : 'Destination')
    .replace(/<debug_port>/g, answers.debug_port + '')
    .replace(/<sam_port>/g, answers.sam_port + '')

  if (answers.work_slug) {
    contents = contents.replace(/<work_slug>/g, answers.work_slug)
  }
  if (answers.work_id) {
    contents = contents.replace(/<work_id>/g, answers.work_id)
  }
  if (answers.access_token) {
    contents = contents.replace(/<access_token>/g, answers.access_token)
  }

  await fs.writeFile(dest_path, contents, 'utf8')
}

export async function init(save_only_to_file: boolean, settings_dir?: string, overwrite_fn?: boolean, advanced?: boolean) {
  let file = get_settings_file(settings_dir)
  if (settings_dir && !save_only_to_file && fs.existsSync(file)) {
    load_settings(file).then(async settings => {
      let can_continue = await deploy_function_first_time(settings, overwrite_fn || undefined)
      if (can_continue) {
        create_project(settings)
      }
    })
  } else {
    let answers: Settings = {
      fn_name: '',
      fn_type: 'source',
      language: 'javascript',
      debug_port: 5858,
      sam_port: 3001,
      proxy_port: 3002,
      github_deployment: true,
      access_token_is_saved: true,
      generate_tests: true
    }
    if (!advanced) {
      if (await ngrok_installed()) {
        answers.use_ngrok = true
      }
    }

    function advanced_questions() {
      if (advanced) {
        prompts.next({
          name: 'generate_tests',
          message: 'Generate sample tests',
          type: 'confirm',
          default: true
        })

        prompts.next({
          name: 'debug_port',
          message: 'Select debugger port',
          type: 'number',
          default: 5858
        })

        prompts.next({
          name: 'sam_port',
          message: 'Select SAM port',
          type: 'number',
          default: 3001
        })

        prompts.next({
          name: 'proxy_port',
          message: 'Select proxy_port http port (0 to disable: will disable remote debugging)',
          type: 'number',
          default: 0
        })
      } else {
        prompts.complete()
      }
    }

    function tracking_plan_prompt() {
      if (answers.access_token && answers.work_slug && answers.language == 'typescript') {
        listAllTrackingPlans(answers.access_token, answers.work_slug).then(tps => {
          prompts.next({
            name: 'tp_name',
            message: 'Select tracking plan',
            type: 'list',
            choices: ['none', ...tps.tracking_plans.map(tps => tps.display_name)]
          })
          advanced_questions()
        }).catch(e => {
          console.error('Error fetching tracking plans')
          console.error(e)
          advanced_questions()
        })
      } else {
        advanced_questions()
      }
    }
    function add_fn_name() {
      prompts.next({
        name: 'fn_name',
        message: 'Select function name',
        type: 'input',
        askAnswered: true,
        validate: (v: string) => {
          if (v.length >= 3) {
            if (v.match(/^[ a-zA-Z0-9-_]+$/)) {
              return true
            } else {
              return 'Function name must be alpha-numeric characters, spaces, underscores, or dashes'
            }
          } else {
            return 'Function name must be at least 3 characters long'
          }
        }
      })
    }
    function add_access_token_is_saved() {
      prompts.next({
        name: 'access_token_is_saved',
        message: 'Specify whether the access token should be saved in config files. If not, tokens will need to be provided for all future command line operations (and disables GitHub workflow deployment)',
        type: 'confirm',
        default: true
      })
    }

    var prompts = new Rx.Subject();
    i.prompt(prompts as any).ui.process.subscribe(answer => {
      let _answer = answer as any
      if (_answer.name == 'proxy_port' && _answer.answer == 0) {
        delete answers.proxy_port
      } else if (_answer.name !== 'overwrite_fn' && _answer.answer !== '') {
        (answers as any)[_answer.name as keyof Settings] = _answer.answer
      }

      if (answer.name == 'debug_port' && !answer.answer) {
        answers.debug_port = 5858
      }
      if (answer.name == 'sam_port' && !answer.answer) {
        answers.sam_port = 3001
      }

      if (answers.work_slug) {
        if (answer.name == 'work_slug') {
          prompts.next({
            name: 'work_id',
            message: 'Enter workspace ID (leaving blank disables deployment and Segment initialised debugging)',
            type: 'input'
          })

          prompts.next({
            name: 'access_token',
            message: 'Enter workspace access token (requires Function Admin permission)',
            type: 'input'
          })
        } else if (answer.name == 'access_token' || answer.name == 'fn_name') {
          deploy_function_first_time(answers).then(can_continue => {
            if (can_continue) {
              if (advanced) {
                add_access_token_is_saved()
              } else {
                tracking_plan_prompt()
              }
            } else {
              prompts.next({
                name: 'overwrite_fn',
                askAnswered: true,
                message: 'Function with name already exists. Overwrite?',
                type: 'confirm',
                default: false
              })
            }
          })
        } else if (answer.name == 'overwrite_fn') {
          if (answer.answer == true) {
            deploy_function_first_time(answers, true).then(() => {
              if (advanced) {
                add_access_token_is_saved()
              } else {
                tracking_plan_prompt()
              }
            })
          } else {
            add_fn_name()
          }
        } else if (answer.name == 'access_token_is_saved') {
          if (answers.access_token_is_saved && answers.work_id) {
            prompts.next({
              name: 'github_deployment',
              message: 'Enable automatic deployment of function on GitHub commit',
              type: 'confirm',
              default: true
            })
          } else {
            tracking_plan_prompt()
          }
        } else if (answer.name == 'github_deployment') {
          tracking_plan_prompt()
        } else if (answer.name == 'proxy_port') {
          if (answer.answer) {
            prompts.next({
              name: 'use_ngrok',
              message: 'Use ngrok to tunnel remote requests',
              type: 'confirm',
              default: true
            })
          } else {
            prompts.complete()
          }
        } else if (answer.name == 'use_ngrok') {
          prompts.complete()
        }
      } else if (answer.name == 'work_slug') {
        prompts.complete()
      }
    }, error => {
      console.error(error)
    }, () => {
      if (!save_only_to_file) {
        let saved_answers = { ...answers }
        if (!answers.access_token_is_saved) {
          delete saved_answers.access_token
        }
        save_settings(file, saved_answers)

        create_project(answers)
      }
    });

    prompts.next({
      name: 'language',
      message: 'Select language',
      type: 'list',
      choices: ['javascript', 'typescript']
    })

    prompts.next({
      name: 'fn_type',
      message: 'Select function type',
      type: 'list',
      choices: ['source', 'destination']
    })

    add_fn_name()

    prompts.next({
      name: 'work_slug',
      message: 'Enter workspace slug (leaving blank will disable deployment, Segment initialised debugging, and tracking plan definitions)',
      type: 'input'
    })
  }
}

async function deploy_function_first_time(answers: Settings, can_overwrite?: true): Promise<boolean> {
  if (answers.work_slug && answers.work_id && answers.access_token) {
    let c = await fs.readFile(path.join(JS_FN_DIR, answers.fn_type == 'source' ? 'source.js' : 'destination.js'), 'utf8')
    let id = await build_function(answers.fn_name, answers.fn_type == 'source', answers.work_slug, answers.work_id, c, answers.access_token, undefined, can_overwrite ? undefined : true)
    if (!id) {
      return false
    }
    return true
  } else {
    return true
  }
}

function create_project(answers: Settings) {
  console.log('Building project...')
  fs.mkdirpSync(path.join(cwd, 'src', 'tests'))
  fs.mkdirpSync(path.join(cwd, 'typings'))
  fs.mkdirpSync(path.join(cwd, '.github', 'workflows'))
  fs.mkdirpSync(path.join(cwd, '.vscode'))

  if (answers.language == 'javascript') {
    fs.copy(JS_PROJECT_DIR, cwd).then(() => {
      exec('npm i', (error) => {
        if (error) {
          console.error(error)
        }
      })
    })

    copy_file_with_substitution(path.join(JS_VSCODE_DIR, 'launch.json'), path.join(cwd, '.vscode', 'launch.json'), answers)
  } else {
    fs.copy(TS_PROJECT_DIR, cwd).then(() => {
      exec('npm i', (error) => {
        if (error) {
          console.error(error)
        }
      })
    })

    copy_file_with_substitution(path.join(TS_VSCODE_DIR, 'launch.json'), path.join(cwd, '.vscode', 'launch.json'), answers)

    if (answers.fn_type == 'source') {
      fs.copyFile(path.join(TS_TYPINGS_DIR, 'segment-src.d.ts'), path.join(cwd, 'typings', 'segment.d.ts'))
    } else {
      fs.copyFile(path.join(TS_TYPINGS_DIR, 'segment-dest.d.ts'), path.join(cwd, 'typings', 'segment.d.ts'))
    }
  }

  fs.copyFile(path.join(SAM_DIR, 'template.yaml'), path.join(cwd, 'template.yaml'))

  if (answers.github_deployment) {
    copy_file_with_substitution(path.join(GIT_DIR, 'workflows', 'sloth.yaml'), path.join(cwd, '.github', 'workflows', 'sloth.yaml'), answers)
  }

  if (answers.fn_type == 'source') {
    if (answers.language == 'javascript') {
      fs.copyFile(path.join(JS_SAM_DIR, 'sam-src.js'), path.join(cwd, 'sam.js'))
      fs.copy(path.join(JS_FN_DIR, 'source.js'), path.join(cwd, 'src', 'function.js'))
      if (answers.generate_tests) {
        fs.copyFile(path.join(JS_TESTS_DIR, 'payload-src.js'), path.join(cwd, 'src', 'tests', 'payload.js'))
        copy_file_with_substitution(path.join(JS_TESTS_DIR, 'debug-src-handler.js'), path.join(cwd, 'src', 'tests', 'debug.js'), answers)
        copy_file_with_substitution(path.join(JS_TESTS_DIR, 'test-src-handler.js'), path.join(cwd, 'src', 'tests', 'test.js'), answers)
      }
    } else {
      fs.copyFile(path.join(TS_SAM_DIR, 'sam-src.js'), path.join(cwd, 'sam.js'))
      fs.copy(path.join(TS_FN_DIR, 'source.ts'), path.join(cwd, 'src', 'function.ts'))
      if (answers.generate_tests) {
        fs.copyFile(path.join(TS_TESTS_DIR, 'payload-src.ts'), path.join(cwd, 'src', 'tests', 'payload.ts'))
        copy_file_with_substitution(path.join(TS_TESTS_DIR, 'debug-src-handler.ts'), path.join(cwd, 'src', 'tests', 'debug.ts'), answers)
        copy_file_with_substitution(path.join(TS_TESTS_DIR, 'test-src-handler.ts'), path.join(cwd, 'src', 'tests', 'test.ts'), answers)
      }
      // if (answers.github_deployment) {
      //   copy_file_with_substitution(path.join(TS_GIT_DIR, 'workflow-src.yaml'), path.join(cwd, '.git', 'workflows', 'deploy_function.yaml'), answers)
      // }
    }
  } else {
    if (answers.language == 'javascript') {
      fs.copyFile(path.join(JS_SAM_DIR, 'sam-dest.js'), path.join(cwd, 'sam.js'))
      fs.copy(path.join(JS_FN_DIR, 'destination.js'), path.join(cwd, 'src', 'function.js'))
      if (answers.generate_tests) {
        fs.copyFile(path.join(JS_TESTS_DIR, 'payload-dest.js'), path.join(cwd, 'src', 'tests', 'payload.js'))
        copy_file_with_substitution(path.join(JS_TESTS_DIR, 'debug-dest-handler.js'), path.join(cwd, 'src', 'tests', 'debug.js'), answers)
        copy_file_with_substitution(path.join(JS_TESTS_DIR, 'test-dest-handler.js'), path.join(cwd, 'src', 'tests', 'test.js'), answers)
      }
      // if (answers.github_deployment) {
      //   copy_file_with_substitution(path.join(JS_GIT_DIR, 'workflow-dest.yaml'), path.join(cwd, '.git', 'workflows', 'deploy_function.yaml'), answers)
      // }
    } else {
      fs.copyFile(path.join(TS_SAM_DIR, 'sam-dest.js'), path.join(cwd, 'sam.js'))
      fs.copy(path.join(TS_FN_DIR, 'destination.ts'), path.join(cwd, 'src', 'function.ts'))
      if (answers.generate_tests) {
        fs.copyFile(path.join(TS_TESTS_DIR, 'payload-dest.ts'), path.join(cwd, 'src', 'tests', 'payload.ts'))
        copy_file_with_substitution(path.join(TS_TESTS_DIR, 'debug-dest-handler.ts'), path.join(cwd, 'src', 'tests', 'debug.ts'), answers)
        copy_file_with_substitution(path.join(TS_TESTS_DIR, 'test-dest-handler.ts'), path.join(cwd, 'src', 'tests', 'test.ts'), answers)
      }
      // if (answers.github_deployment) {
      //   copy_file_with_substitution(path.join(TS_GIT_DIR, 'workflow-dest.yaml'), path.join(cwd, '.git', 'workflows', 'deploy_function.yaml'), answers)
      // }
    }
  }

  if (answers.tp_name && answers.tp_name !== 'none' && answers.access_token && answers.work_slug) {
    generate_protocol_definitions({
      access_token: answers.access_token,
      tp_name: answers.tp_name,
      work_slug: answers.work_slug,
      out_file: get_protocol_filename()
    })
  } else if (answers.language == 'typescript') {
    fs.copyFile(path.join(TS_TYPINGS_DIR, 'protocol.d.ts'), get_protocol_filename())
  }
}