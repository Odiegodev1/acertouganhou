export function formatGameTime(ms: number) {
    const total = Math.max(0, Math.floor(ms))
  
    const seconds = Math.floor(total / 1000)
    const milliseconds = total % 1000
  
    return `${String(seconds).padStart(2, "0")}.${String(
      milliseconds
    ).padStart(3, "0")}`
  }
  
  export function formatDemoMoney(cents: number) {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }