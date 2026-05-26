import { v4 as uuidv4 } from 'uuid'

export function genId(): string {
  return uuidv4()
}
