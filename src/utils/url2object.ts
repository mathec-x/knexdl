/**
 * @description
 * Converts a string url into object
 */
export function url2object (url: string) {
  // eslint-disable-next-line no-useless-escape
  const pattern = /^(?:([^:\/?#\s]+):\/{2})?(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$/
  const matches = url.match(pattern)
  const params: { [key: string]: any } = {}
  let a: string[]

  if (matches[5] !== undefined) {
    matches[5].split('&').map(function (x) {
      a = x.split('=')
      params[a[0]] = a[1]
    })
  }

  return {
    protocol: matches[1],
    user: matches[2] ? matches[2].split(':')[0] : undefined,
    password: matches[2] ? matches[2].split(':')[1] : undefined,
    host: matches[3],
    hostname: matches[3] ? matches[3].split(/:(?=\d+$)/)[0] : undefined,
    port: matches[3] ? Number(matches[3].split(/:(?=\d+$)/)[1]) : undefined,
    segments: matches[4] ? matches[4].split('/') : undefined,
    params: params
  }
}
