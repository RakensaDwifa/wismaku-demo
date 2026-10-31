import { describe, expect, it } from 'vitest'
import { sortFilterReviews } from './reviews.js'

const a = { id: 'a', rating: 3, date: '2026-01-01' }
const b = { id: 'b', rating: 5, date: '2026-03-01' }
const c = { id: 'c', rating: 5, date: '2026-02-01' }
const d = { id: 'd', rating: 1, date: null }
const list = [a, b, c, d]
const ids = (r) => r.map((x) => x.id).join('')

describe('sortFilterReviews', () => {
  it('terbaru: tanggal menurun, tanpa tanggal paling akhir', () => {
    expect(ids(sortFilterReviews(list))).toBe('bcad')
  })
  it('tertinggi: rating menurun, seri diurut terbaru', () => {
    expect(ids(sortFilterReviews(list, { sort: 'highest' }))).toBe('bcad')
  })
  it('terendah: rating menaik', () => {
    expect(ids(sortFilterReviews(list, { sort: 'lowest' }))).toBe('dabc')
  })
  it('filter per bintang', () => {
    expect(ids(sortFilterReviews(list, { star: 5 }))).toBe('bc')
    expect(sortFilterReviews(list, { star: 2 })).toEqual([])
  })
  it('ulasan milik user disematkan di atas bila lolos filter', () => {
    expect(ids(sortFilterReviews(list, { pinned: a }))).toBe('abcd')
    expect(ids(sortFilterReviews(list, { pinned: a, star: 5 }))).toBe('bc')
  })
  it('sort tidak dikenal jatuh ke terbaru dan input tidak dimutasi', () => {
    expect(ids(sortFilterReviews(list, { sort: 'x' }))).toBe('bcad')
    expect(ids(list)).toBe('abcd')
  })
})
