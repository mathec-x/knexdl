/**
 * @description
 * Mount models namespace
 */
export const parseNamespace = (title: string) => {
  title = title.replace(/models|model/gi, '') + 'Models'
  return title.charAt(0).toUpperCase() + title.slice(1)
}