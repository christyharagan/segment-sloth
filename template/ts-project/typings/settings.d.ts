declare const secret: 'secret'
declare const boolean: 'boolean'
declare const string: 'string'
declare const array: 'array'
declare const map: 'map'

declare type FunctionSettings = { [K in keyof typeof RequiredSettings]:
  typeof RequiredSettings[K] extends 'map' ? { [k: string]: string } :
  typeof RequiredSettings[K] extends 'boolean' ? boolean :
  typeof RequiredSettings[K] extends 'array' ? string[] :
  typeof RequiredSettings[K] extends 'secret' ? string :
  typeof RequiredSettings[K] extends 'string' ? string :
  typeof RequiredSettings[K] extends { type: 'map', description: string } ? { [k: string]: string } :
  typeof RequiredSettings[K] extends { type: 'boolean', description: string } ? boolean :
  typeof RequiredSettings[K] extends { type: 'array', description: string } ? string[] :
  typeof RequiredSettings[K] extends { type: 'secret', description: string } ? string :
  typeof RequiredSettings[K] extends { type: 'string', description: string } ? string :
  never
} & { [K in keyof typeof OptionalSettings]?: string }

type RequiredFunctionSettings = { [K: string]: 'map' | 'boolean' | 'array' | 'string' | 'secret' | {type: 'map' | 'boolean' | 'array' | 'string' | 'secret', description: string} }
type OptionalFunctionSettings = { [K: string]: 'string' | 'secret' | {type: 'string' | 'secret', description: string} }

declare function validate(a: OptionalFunctionSettings, b: RequiredFunctionSettings):void
