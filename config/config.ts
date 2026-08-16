export const APP_CONFIG = {
  name: "Remy's",
  description:
    "Studio chụp ảnh và quay video pre-wedding, wedding — lưu giữ những khoảnh khắc bằng ánh sáng.",

  // Fallback contact info, used until site_settings is wired up to Supabase.
  contact: {
    email: "hello@remys.vn",
    phone: "090 123 4567",
    address: "Keangnam Hanoi Landmark Tower, Phạm Hùng, Nam Từ Liêm, Hà Nội",
    zaloUrl: "https://zalo.me/",
    facebookUrl: "https://facebook.com/",
    instagramUrl: "https://instagram.com/",
  },
} as const
