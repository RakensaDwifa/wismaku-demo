/**
 * Utilitas Dynamic Weekend Pricing WismaKu
 * Menghitung harga menginap dengan penyesuaian malam akhir pekan (Jumat & Sabtu malam).
 */

export function isWeekendNight(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false
  const day = d.getDay()
  // Jumat malam (5) dan Sabtu malam (6)
  return day === 5 || day === 6
}

export function calculateStayPricing({
  basePrice = 0,
  checkIn,
  nights = 1,
  rooms = 1,
  weekendSurchargePercent = 0,
} = {}) {
  const cleanPrice = Math.max(0, Number(basePrice) || 0)
  const cleanNights = Math.max(1, Number(nights) || 1)
  const cleanRooms = Math.max(1, Number(rooms) || 1)
  const surchargePct = Math.max(0, Math.min(100, Number(weekendSurchargePercent) || 0))

  let weekendNights = 0
  let weekdayNights = 0

  if (checkIn) {
    const startDate = new Date(checkIn)
    if (!isNaN(startDate.getTime())) {
      for (let i = 0; i < cleanNights; i++) {
        const cur = new Date(startDate)
        cur.setDate(startDate.getDate() + i)
        const day = cur.getDay()
        if (day === 5 || day === 6) {
          weekendNights++
        } else {
          weekdayNights++
        }
      }
    } else {
      weekdayNights = cleanNights
    }
  } else {
    weekdayNights = cleanNights
  }

  const baseTotal = cleanPrice * cleanNights * cleanRooms
  const weekendSurchargePerRoomPerNight = Math.round((cleanPrice * surchargePct) / 100)
  const weekendSurchargeTotal = weekendSurchargePerRoomPerNight * weekendNights * cleanRooms
  const subtotal = baseTotal + weekendSurchargeTotal
  const effectiveAveragePerNight = Math.round(subtotal / (cleanNights * cleanRooms))

  return {
    basePrice: cleanPrice,
    nights: cleanNights,
    rooms: cleanRooms,
    weekdayNights,
    weekendNights,
    weekendSurchargePercent: surchargePct,
    weekendSurchargePerNight: weekendSurchargePerRoomPerNight,
    weekendSurchargeTotal,
    baseTotal,
    subtotal,
    effectiveAveragePerNight,
    hasWeekendSurcharge: weekendNights > 0 && surchargePct > 0,
  }
}
