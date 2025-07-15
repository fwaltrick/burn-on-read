import * as fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

// Define the directory where files will be saved
const DATA_DIR = path.join(__dirname, '..', '..', 'data')

export const saveContentToFile = async (content: string): Promise<string> => {
  try {
    const filename = randomUUID()
    const filePath = path.join(DATA_DIR, filename)

    await fs.mkdir(DATA_DIR, { recursive: true })

    await fs.writeFile(filePath, content, 'utf-8')

    return filename
  } catch (error) {
    console.error('Failed to save file:', error)
    throw new Error('Could not save the message.')
  }
}
