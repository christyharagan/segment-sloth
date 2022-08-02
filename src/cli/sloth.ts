#!/usr/bin/env node

import * as yargs from 'yargs'
import { init } from './init'
import { test } from './test'
import { deploy } from '..'
import { debug } from './debug'
import { sync_tp } from './sync_tp'
import { check_deps } from './check_deps'

yargs
  .command('init [options_dir]', 'Create and initialise a new project in the current working directory. If the options_dir is provided, then a sloth.yaml is checked for, and if exists, uses that to initialise the project folder.', {
    'options_only': {
      description: 'When this argument is provided, only the settings file (sloth.yaml) will be written; the project files won\'t be created',
      boolean: true,
      alias: 'oo'
    },
    'overwrite_fn': {
      description: 'When an options file is provided, use this argument to enable overwriting of existing functions in the workspace',
      boolean: true,
      alias: 'of'
    },
    'advanced': {
      description: 'Pass this argument to run the fully wizard with all options configurable. Default is to run standard mode with certain options predefined.',
      boolean: true,
      alias: 'a'
    }
  }, args => {
    init(args.options_only || false, args.options_dir as string | undefined, args.overwrite_fn as boolean | undefined, args.advanced)
  })
  .command('deploy [access_token] [work_id] [work_slug]', 'Deploy the function to your Segment workspace (or output to a file)', {
    'out_file': {
      description: 'When this argument is provided, this command will output the deployment code to this file, rather than upload to your Segment workspace',
      string: true,
      alias: 'o'
    },
    'is_dev': {
      description: 'Use this when out_file is provided. Will deploy code with source-maps back to the original code; useful for tests or development where stack traces need to display line numbers',
      boolean: true,
      alias: 'd'
    },
    'pretty': {
      description: 'Output the javascript in human-readable form. !WARNING! You cannot use javascript module imports with this mode',
      boolean: true,
      alias: 'p'
    }
  }, args => {
    deploy(!!args.is_dev, args.access_token as string | undefined, args.work_slug as string | undefined, args.work_id as string | undefined, args.out_file, undefined, args.pretty)
  })
  .command('sync_tp [access_token]', 'Sync the Segment tracking plan locally', args => {
    sync_tp(args.argv.access_token as string | undefined)
  })
  .command('test', 'Launch the test environment', () => {
    test()
  })
  .command('debug <type> [access_token]', 'Launch the debug environment (local, remote, segment)', {
    'tunnel': {
      description: 'This is the external URL of the SAM instance. Use this if running on a server that will expose the SAM instance, instead of using ngrok',
      string: true,
      alias: 't'
    }
  }, args => {
    let t = args.type
    if (t !== 'local' && t !== 'remote' && t !== 'segment') {
      console.error('Type argument must be either "local", "remote", or "segment"')
      return
    }
    debug(t as 'local' | 'remote' | 'segment', args.access_token as string | undefined, args.tunnel)
  })
  .command('check_deps', 'Check the function dependencies will work in the Segment environment', args => {
    check_deps()
  })
  .demandCommand()
  .argv