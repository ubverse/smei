export type Optional<T> = T | undefined

export interface IHash<T = any> {
  [key: string]: T
}
