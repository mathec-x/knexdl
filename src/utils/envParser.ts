const fs = require('fs')
const regexpLine = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

/**
 * @description
 * read a.env file by path and convert to object
 */
export const envParser = (src: string) => {
  if(!fs.existsSync(src)){
    throw new Error(src + " file not found")
  }

  const obj: Record<string, unknown> = {}
  let lines = fs.readFileSync(src).toString()

  lines = lines.replace(/\r\n?/mg, '\n')

  let match: RegExpExecArray
  while ((match = regexpLine.exec(lines)) != null) {
    const key = match[1]
    let value = (match[2] || '')
    value = value.trim()
    const maybeQuote = value[0]
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n')
      value = value.replace(/\\r/g, '\r')
    }
    obj[key] = value
  }

  return obj
}