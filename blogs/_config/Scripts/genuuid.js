function generateUUID(len) {
  const S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from(Array(len))
    .map(() => S[Math.floor(Math.random() * S.length)])
    .join("")
}
module.exports = generateUUID
