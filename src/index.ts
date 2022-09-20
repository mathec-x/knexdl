import fs from 'fs'
import pt from 'path'
import knex, { Knex } from 'knex'
import { print } from './utils/print'
import { ucFirst } from './utils/ucFirst'
import { parseNamespace } from './utils/parseNamespace'

export { envParser } from './utils/envParser'
export { url2object } from './utils/url2object'

export const knexdl = <Layers>(config: Knex.Config) => (knex as any)(config) as Layers

export class KnexDl {
  private static makeType(tp: string, defaultValue: any) {
    const parentheses = tp.indexOf('(')
    if (parentheses !== -1) {
      tp = tp.substring(0, parentheses)
    }

    switch (tp) {
      case 'bool':
        return 'boolean'
      case 'text':
      case 'citext':
      case 'money':
      case 'numeric':
      case 'int8':
      case 'char':
      case 'character':
      case 'bpchar':
      case 'varchar':
      case 'time':
      case 'tsquery':
      case 'tsvector':
      case 'uuid':
      case 'xml':
      case 'cidr':
      case 'inet':
      case 'macaddr':
        return 'string'
      case 'tinyint':
      case 'smallint':
      case 'integer':
      case 'double':
      case 'int':
      case 'int4':
      case 'real':
      case 'float':
      case 'float4':
      case 'float8':
        return 'number'
      case 'datetime':
      case 'date':
      case 'timestamp':
      case 'timestamptz':
        return 'Date'
      case 'json':
      case 'jsonb':
        if (defaultValue) {
          if (defaultValue.startsWith("'{")) {
            return 'Record<string, unknown>'
          }
          if (defaultValue.startsWith("'[")) {
            return 'unknown[]'
          }
        }
        return 'unknown'
      default:
        console.log('non registered type for', tp)
        throw tp
    }
  }

  static async showDatabases(conn: Knex): Promise<string[]> {
    switch (conn.client.config.client) {
      case 'mysql':
      case 'mysql2':
        return (await conn.raw(`SHOW DATABASES WHERE \`Database\` NOT IN ('mysql', 'performance_schema', 'information_schema', 'sys')`)
          .then(e => e[0]))
          .map((e: any) => Object.values(e)[0])

      default:
        throw Error(conn.client.config.client + ' NOT IMPLEMENTED YET')
    }
  }

  static async showTables(conn: Knex, database: string): Promise<string[]> {
    switch (conn.client.config.client) {
      case 'mysql':
      case 'mysql2':
        return (await conn.raw(`SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = '${database}'`)
          .then(e => e[0]))
          .map((e: any) => Object.values(e)[0])

      default:
        throw Error(conn.client.config.client + ' NOT IMPLEMENTED YET')
    }
  }

  static async showFieldsFromTable(conn: Knex, database: string, table: string): Promise<{ Field: string, Null: boolean, Type: string, Default: string }[]> {
    switch (conn.client.config.client) {
      case 'mysql':
      case 'mysql2':
        return await conn.raw(`SHOW FIELDS FROM ${database}.${table}`).then(e => e[0])

      default:
        throw Error(conn.client.config.client + ' NOT IMPLEMENTED YET')
    }
  }


  static async introspect(name: string, conn: Knex) {
    const typesdir = pt.join(process.cwd(), '/node_modules/@types/knexdl', name)
    const knexdir = pt.join(process.cwd(), '/node_modules', 'knex')

    print.ln()
    print.magenta('client:', conn.client.config.client)
    print.magenta('generate types into:', typesdir)

    const declarations = fs
      // read file
      .readFileSync(pt.join(knexdir, 'types', 'index.d.ts'))
      .toString()
      .replace(/Knex/g, parseNamespace(name))
      // replace comments
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
      // replace break lines
      .replace(/\n\s*\n/g, '\n')
      // clear white spaces
      .trim()

    const databases = !conn.client.database() ? await this.showDatabases(conn) : [conn.client.database()]
    const dbm = databases.length > 1

    if (dbm) {
      await print.ask(`more databases (${databases.length}) were found, do you want to continue with all?`)
    }

    print.magenta('database:', databases.join())
    // save files
    fs.mkdirSync(typesdir, { recursive: true })
    fs.writeFileSync(pt.join(typesdir, 'index.d.ts'), declarations)
    fs.cpSync(pt.join(knexdir, 'types', 'result.d.ts'), pt.join(typesdir, 'result.d.ts'))

    const fsFile = fs.createWriteStream(pt.join(typesdir, 'tables.d.ts'), 'utf8')
    fsFile.write('import type { Knex } from \'knex\'\n')

    const composites: { table: string, database: string }[] = []
    for (const database of databases) {
      const ucDataBase = ucFirst(database)
      const tables = await this.showTables(conn, database)
      for (const table of tables) {
        const ucTable = ucFirst(table)
        print.f(' - generating', ucDataBase, ucTable)        
        const columns = await this.showFieldsFromTable(conn, database, table)

        let type = `export interface ${dbm ? ucDataBase : ''}${ucTable} {\n`
        for (const col of columns) {
          type += `  ${col.Field}${col.Null ? '?' : ''}: ${this.makeType(col.Type, col.Default)};\n`
        }
        type += '}\n'

        fsFile.write(type)
        composites.push({ table , database })
      }
    }

    fsFile.write('/* eslint-disable camelcase */')
    fsFile.write('\nexport interface Tables {')
    for (const cp of composites) {
      if (dbm) {
        fsFile.write(`\n  '${cp.database}.${cp.table}': Knex.CompositeTableType<${ucFirst(cp.database)}${ucFirst(cp.table)}>;`)
      } else {
        fsFile.write(`\n  ${cp.table}: Knex.CompositeTableType<${ucFirst(cp.table)}>;`)
      }
    }
    fsFile.write('\n}\n')
  }
}
