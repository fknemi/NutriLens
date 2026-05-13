import { getRandomValues } from "expo-crypto"
import { v4 as uuidv4 } from "uuid"

export const v4 = () => {
  const random = new Uint8Array(16)
  getRandomValues(random)

  return uuidv4({
    random,
  })
}
