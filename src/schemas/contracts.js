import { z } from 'zod'

export const BookingPayloadSchema = z.object({
  hotelId: z.union([z.number().int().positive(), z.string().min(1)]),
  hotelName: z.string().min(1),
  hotelImg: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), 'URL gambar harus menggunakan http(s).')
    .optional(),
  checkIn: z.string().nullable().optional(),
  checkOut: z.string().nullable().optional(),
  nights: z.number().int().min(1),
  rooms: z.number().int().min(1),
  guests: z.number().int().min(0),
  roomTypeId: z.string().min(1),
  roomTypeName: z.string().min(1),
  roomPrice: z.number().int().positive(),
  couponCode: z.string().nullable().optional(),
  couponDiscount: z.number().min(0),
  memberDiscount: z.number().min(0),
  totalPrice: z.number().min(0),
  guestName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().regex(/^[0-9+\-\s]{8,15}$/),
})

export const MemberPayloadSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
})

/** Email dinormalisasi (trim + lowercase) supaya "Budi@Email.com" dan "budi@email.com" dianggap sama. */
const EmailField = z.string().trim().toLowerCase().email('Email tidak valid.')

/** Aturan password akun baru: minimal 8 karakter serta memuat huruf dan angka. */
const NewPasswordField = z
  .string()
  .min(8, 'Password minimal 8 karakter.')
  .refine((value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value), 'Password harus memuat huruf dan angka.')

export const UserPayloadSchema = z.object({
  name: z.string().trim().min(3),
  email: EmailField,
  password: NewPasswordField,
})

/**
 * Login sengaja TIDAK memakai aturan 8 karakter: akun lama (sebelum perbaikan
 * keamanan) bisa punya password 6 karakter dan tetap harus bisa masuk.
 */
export const LoginPayloadSchema = z.object({
  email: EmailField,
  password: z.string().min(1, 'Password wajib diisi.'),
})

export const ResetRequestSchema = z.object({ email: EmailField })

export const ChangePasswordSchema = z.object({ password: NewPasswordField })

export const PartnerPayloadSchema = z.object({
  ownerName: z.string().min(3),
  propertyName: z.string().min(3),
  city: z.string().min(2),
  email: z.string().email(),
})

export const ReviewPayloadSchema = z.object({
  hotelId: z.union([z.number().int().positive(), z.string().min(1)]),
  name: z.string().min(3, 'Nama minimal 3 karakter.'),
  city: z.string().min(2, 'Kota minimal 2 karakter.').optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(5, 'Ulasan minimal 5 karakter.').max(500, 'Ulasan maksimal 500 karakter.'),
})

export const parsePayload = (schema, payload) => {
  const result = schema.safeParse(payload)
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join('; '))
  }
  return result.data
}

export const schemaDocs = {
  BookingPayload: BookingPayloadSchema,
  MemberPayload: MemberPayloadSchema,
  UserPayload: UserPayloadSchema,
  LoginPayload: LoginPayloadSchema,
  PartnerPayload: PartnerPayloadSchema,
  ReviewPayload: ReviewPayloadSchema,
}
