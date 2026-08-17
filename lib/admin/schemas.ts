import { z } from "zod"

function urlOrEmpty(message: string) {
  return z
    .string()
    .refine((value) => value.trim() === "" || /^https?:\/\//.test(value), {
      message,
    })
}

export const contactSettingsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
  address: z.string().trim().min(1, "Vui lòng nhập địa chỉ"),
  zaloLink: urlOrEmpty(
    "Link Zalo không hợp lệ (cần bắt đầu bằng http:// hoặc https://)"
  ),
  facebookLink: urlOrEmpty(
    "Link Facebook không hợp lệ (cần bắt đầu bằng http:// hoặc https://)"
  ),
  instagramLink: urlOrEmpty(
    "Link Instagram không hợp lệ (cần bắt đầu bằng http:// hoặc https://)"
  ),
})

export type ContactSettingsFormErrors = Partial<
  Record<keyof z.infer<typeof contactSettingsSchema>, string>
>

export const heroSettingsSchema = z
  .object({
    heroBackgroundMode: z.enum(["video", "images"]),
    heroVideoUrl: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.heroBackgroundMode !== "video") return
    const value = data.heroVideoUrl.trim()
    if (!value) {
      ctx.addIssue({
        code: "custom",
        path: ["heroVideoUrl"],
        message: "Vui lòng nhập link video",
      })
    } else if (!/^https?:\/\//.test(value)) {
      ctx.addIssue({
        code: "custom",
        path: ["heroVideoUrl"],
        message:
          "Link video không hợp lệ (cần bắt đầu bằng http:// hoặc https://)",
      })
    }
  })

export type HeroSettingsFormErrors = Partial<
  Record<keyof z.infer<typeof heroSettingsSchema>, string>
>

export const albumSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tên album"),
  slug: z.string().trim().min(1, "Vui lòng nhập slug"),
  category: z.enum(["pre_wedding", "wedding"]),
  location: z.string().trim().min(1, "Vui lòng nhập địa điểm"),
  eventDate: z.string().trim().min(1, "Vui lòng chọn ngày cưới"),
  highlightVideoUrl: z.string(),
  coverImage: z.string().trim().min(1, "Vui lòng chọn ảnh bìa"),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  photos: z
    .array(z.object({ id: z.string(), url: z.string() }))
    .min(1, "Cần thêm ít nhất 1 ảnh"),
})

export type AlbumFormErrors = Partial<
  Record<keyof z.infer<typeof albumSchema>, string>
>

export const videoSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tên cặp cưới"),
  location: z.string().trim().min(1, "Vui lòng nhập địa điểm"),
  eventDate: z.string().trim().min(1, "Vui lòng chọn ngày quay"),
  youtubeUrl: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập link YouTube")
    .refine((value) => /^https?:\/\//.test(value), {
      message: "Link không hợp lệ (cần bắt đầu bằng http:// hoặc https://)",
    }),
})

export type VideoFormErrors = Partial<
  Record<keyof z.infer<typeof videoSchema>, string>
>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới cần ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })

export type ChangePasswordFormErrors = Partial<
  Record<"currentPassword" | "newPassword" | "confirmPassword", string>
>

export function fieldErrors<T extends string>(
  issues: z.ZodIssue[]
): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {}
  for (const issue of issues) {
    const key = issue.path[0] as T | undefined
    if (key && !errors[key]) errors[key] = issue.message
  }
  return errors
}
