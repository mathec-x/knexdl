/**
 * @description
 * Uppercase first letter
 */
export const ucFirst = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}