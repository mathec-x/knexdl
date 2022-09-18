import readline from 'readline';
import fs, { mkdirSync } from 'fs'
import pt from 'path'

export const COLORS = {
  RESET: '\u001B[0m',
  BLACK: '\u001B[30m',
  RED: '\u001B[31m',
  GREEN: '\u001B[32m',
  YELLOW: '\u001B[33m',
  BLUE: '\u001B[34m',
  PURPLE: '\u001B[35m',
  CYAN: '\u001B[36m',
  WHITE: '\u001B[37m',
  GREY: '\u001B[90m',
  ERROR: '\u001B[91m',
  SUCCESS: '\u001B[92m',
  INFO: '\u001B[93m',
  VIOLET: '\u001B[94m',
  MAGENTA: '\u001B[95m',
  DONE: '\u001B[96m'
}

const printTree = (COLOR: any, args: any) => {
  console.log(COLOR, "-", ...args, COLORS.RESET)
}

/**
 * @description
 * print full color text
 * @example 
 * print.colorful(`<MAGENTA>import <CYAN>knex <MAGENTA>from <YELLOW>'knex'`)
 */
function colorful(text: string) {
  for (const key in COLORS) {
    const regexp = new RegExp('<' + key + '>', 'gmi')
    text = text.replace(regexp, COLORS[key.toUpperCase()])
  }
  text = text.replace(/({|})/g, COLORS.WHITE + '$1' + COLORS.RESET)
  console.log(text, COLORS.RESET)
}

/**
 * @description ask a question, answer yes or not, returns true or false
 */
const ask = (query: string): Promise<boolean> => new Promise((resolve, reject) => {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const exit = () => {
    reject('exited code SIGINT')
    rl.close()
  }

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdout.write(` - ${query} (y/n): `)
  process.stdin.on('keypress', (str) => {
    const value = str.toLowerCase().startsWith('y') ? true : false
    console.log(' -', value ? 'Ok' : 'Nop')
    resolve(value)
    rl.close()
  });

  rl.on('SIGINT', exit)
  rl.on('SIGCONT', exit)
  rl.on('SIGTSTP', exit)
})

class Dir {
  stream: fs.WriteStream;
  counter = 0;
  path: string;
  type: 'array' | 'object'
  /**
   * @description 
   * Caches any object into writeble file
   *
   * @example
   * const log = new Dir('logs/test');
   * rows.map(row => {
   *    log.add(row);
   * })
   * log.close();
   * 
   * @constructor @example
   * new Dir('{cwd}/logs/test')
   * new Dir('/tmp/logs/test')
   * new Dir('./logs/test')
   * 
   */
  constructor(path: string, type: 'array' | 'object' = 'array') {
    const filename = path
      .replace('{cwd}', process.cwd())
      .replace(/\.[^/.]+$/, '')
      + '.json'

    this.path = filename[0] === '/' ? filename : pt.join(pt.dirname(require.main.filename), filename)

    if (!fs.existsSync(pt.dirname(this.path))) {
      mkdirSync(pt.dirname(this.path))
    }

    print.grey('[print.dir]', 'open:', this.path)
    this.type = type
    this.stream = fs.createWriteStream(this.path, 'utf-8')
    this.stream.write(this.type === 'array' ? '[' : '{')
  }

  add = (object: { [key: string]: any }) => {
    this.counter++
    this.stream.write((this.counter > 1 ? ',' : '') + JSON.stringify(object, null, 2))
  }

  close = () => {
    this.stream.write(this.type === 'array' ? ']' : '}')
    this.stream.close()
    print.grey('[print.dir] closed')
  }

  rm = () => fs.unlinkSync(this.path)
  count = () => this.counter;
}

/**
 * @example
 * await print.delay(3000)
 * 
 * @description sleep program in a few miliseconds
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => {
  let seconds = (ms / 1000) - 1;
  const timer = setInterval(() => {
    printf(' - awaiting: ' + seconds-- + 's')
  }, 1000)

  setTimeout(() => {
    printf(' - resolved: ' + (ms / 1000) + 's')
    clearInterval(timer)
    resolve()
  }, ms)
})

/**
 * 
 * @description 
 * print same line - only development not production
 */
export const printf = (...args: any) => {
  if (process.env.NODE_ENV?.indexOf('prod') !== -1) {
    for (const key in args) {
      if (typeof args[key] === 'object') {
        args[key] = JSON.stringify(args[key], null, 2)
      }
    }
    process.stdout.write(args.join(' ') + ' '.repeat(15) + '\r')
  }
}

export const print = {
  black: (...args: any) => printTree(COLORS.BLACK, args),
  blue: (...args: any) => printTree(COLORS.BLUE, args),
  cyan: (...args: any) => printTree(COLORS.CYAN, args),
  purple: (...args: any) => printTree(COLORS.PURPLE, args),
  green: (...args: any) => printTree(COLORS.GREEN, args),
  grey: (...args: any) => printTree(COLORS.GREY, args),
  magenta: (...args: any) => printTree(COLORS.MAGENTA, args),
  red: (...args: any) => printTree(COLORS.RED, args),
  violet: (...args: any) => printTree(COLORS.VIOLET, args),
  yellow: (...args: any) => printTree(COLORS.YELLOW, args),
  white: (...args: any) => printTree(COLORS.WHITE, args),
  success: (...args: any) => printTree(COLORS.SUCCESS, args),
  done: (...args: any) => printTree(COLORS.DONE, args),
  info: (...args: any) => printTree(COLORS.INFO, args),
  error: (...args: any) => printTree(COLORS.ERROR, args),
  ln: () => console.log(''),
  colorful: colorful,
  ask: ask,
  delay: delay,
  f: printf,
  dir: Dir
}
