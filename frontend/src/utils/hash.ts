/**
 * 计算文件的 SHA-256 哈希值
 * @param file - 要计算哈希的文件
 * @returns Promise<string> - 返回 0x 前缀的哈希字符串
 */
export async function calculateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        resolve('0x' + hashHex)
      } catch (err) {
        reject(err)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 计算文本的 SHA-256 哈希值
 * @param text - 要计算哈希的文本
 * @returns Promise<string> - 返回 0x 前缀的哈希字符串
 */
export async function calculateTextHash(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return '0x' + hashHex
}

/**
 * 格式化文件大小
 * @param bytes - 文件字节数
 * @returns string - 格式化后的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 截断哈希显示
 * @param hash - 完整哈希
 * @param startLen - 开头保留长度
 * @param endLen - 结尾保留长度
 * @returns string - 截断后的哈希
 */
// export function truncateHash(hash: string, startLen = 10, endLen = 8): string {
//   if (hash.length <= startLen + endLen) return hash
//   return `${hash.slice(0, startLen)}...${hash.slice(-endLen)}`
// }
/**
 * 截断哈希或大数字显示
 * @param value - 哈希值或数字 (string | number | bigint)
 * @param startLen - 开头保留长度
 * @param endLen - 结尾保留长度
 */
export function truncateHash(
  value: string | number | bigint,
  startLen = 10,
  endLen = 8
): string {
  // 转为字符串
  const str = String(value)

  // 如果是 bigint / number（一般是 ID），不截断，直接返回
  if (typeof value === 'bigint' || typeof value === 'number') {
    return str
  }

  // 如果不是典型的 hash（没有 0x），仍然不截断
  if (!str.startsWith('0x')) {
    return str
  }

  // 字符串太短，不截断
  if (str.length <= startLen + endLen) return str

  // 截断 hash 字符串
  return `${str.slice(0, startLen)}...${str.slice(-endLen)}`
}



/**
 * 截断地址显示
 * @param address - 完整地址
 * @returns string - 截断后的地址
 */
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}