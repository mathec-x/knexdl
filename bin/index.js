#!/usr/bin/env node

const knex = require('knex')
const pt = require('path')
const { Command } = require('commander');
const { ucFirst } = require('../lib/utils/ucFirst');
const { envParser } = require('../lib/utils/envParser');
const { parseNamespace } = require('../lib/utils/parseNamespace');
const { print, COLORS: C} = require('../lib/utils/print');
const { KnexDl } = require('../')

const program = new Command();

/**
 * @todo ok
 * - auto generate types from database 
 */
program
  .command('introspect')
  .description('introspect database.')
  .argument('<env>', 'environment name containing connection string')
  .argument('<model>', 'model name')
  .option('-e, --env <char>', 'path to environments file', '.env')
  .action(async (env, model, options) => {
    try {
      const enviroments_path = options.env.startsWith('/') ? options.env : pt.join(process.cwd(), options.env)
      const enviroment_objct = envParser(enviroments_path)

      if (!enviroment_objct[env]) {
        throw Error(`Env: ${env} not defined`)
      }

      const enviroment_conn = enviroment_objct[env]
      print.ln()
      print.info(`model: ${model}`)
      print.info(`loaded enviroment '${env}' from: ${enviroments_path}`)
      print.info(`connection string: ${enviroment_conn.replace(/:.*@/, '://****:************************@')}`)
      print.ln()
      if(await print.ask('Continue?')){
        const conn = knex(enviroment_conn)
        await KnexDl.introspect(model, conn)
        conn.destroy()

        print.done('all types were generated successfully')
        print.done('the connection file should look like this')
        print.colorful(`
        <MAGENTA>import <DONE>knex <MAGENTA>from <YELLOW>'knex'
        <MAGENTA>import type { <DONE>${parseNamespace(model)} } <MAGENTA>from <YELLOW>'knexdl/${model}'

        <BLUE>const <DONE>${model.toLowerCase()} = <YELLOW>knex({ 
            ... 
        }) <MAGENTA>as <GREEN>unknown <MAGENTA>as <GREEN>${parseNamespace(model)}<YELLOW>
        <MAGENTA>export default <DONE>${model.toLowerCase()}`)
      }
    } catch (error) {
      print.ln()
      print.red('Error: ', error.message)
    }

    print.ln()
  });

/**
 * @todo autogenerate models
 */
program
  .command('generate')
  .description('generate models.')
  .argument('<env>', 'env name containing connection string')
  .argument('<model>', 'model name')
  .option('-e, --env <char>', 'path to .env file', '.env')
  .option('-o, --output <char>', 'output models', 'src/')
  .action(async (env, model, options) => {
    try {
      const output_path = pt.join(options.output.startsWith('/') ? options.output : process.cwd(), model)
      const enviroments_path = options.env.startsWith('/') ? options.env : pt.join(process.cwd(), options.env)
      const enviroment_objct = envParser(enviroments_path)

      if (!enviroment_objct[env]) {
        throw Error(`Env: ${env} not defined`)
      }

      const log = new print.dir('logs/teste')
      log.add({t: new Date()})
      log.add({t: new Date()})
      log.close()
      await print.delay(10000)
      log.rm()

      const enviroment_conn = enviroment_objct[env]
      print.ln()
      print.done(`output: ${output_path.replace(process.cwd(), '.')}`)
      print.info(`loaded enviroment '${env}' from: ${enviroments_path}`)

      print.info(`connection string: ${enviroment_conn.replace(/:.*@/, '://****:************************@')}`)
      print.ln()

    } catch (error) {
      print.ln()
      print.red('Error: ', error.message)
    }

    print.ln()
  });

program.parse()