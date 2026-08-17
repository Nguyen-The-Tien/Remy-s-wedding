export type AlbumCategory = "pre_wedding" | "wedding"

export type AlbumCredit = { label: string; value: string }

export type MockAlbum = {
  id: string
  slug: string
  category: AlbumCategory
  title: string
  location: string
  /** ISO date (yyyy-MM-dd) */
  date: string
  coverImage: string
  highlightVideoUrl?: string
  tagline: string
  credits: AlbumCredit[]
  photos: string[]
}

const VI_MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
]

export function formatMonthYearVi(dateIso: string) {
  const [year, month] = dateIso.split("-")
  return `${VI_MONTHS[Number(month) - 1]}, ${year}`
}

export const CATEGORY_LABEL: Record<AlbumCategory, string> = {
  pre_wedding: "Pre-wedding",
  wedding: "Wedding",
}

export const CATEGORY_TITLE: Record<AlbumCategory, string> = {
  pre_wedding: "Yêu, giữa thiên nhiên và ánh sáng",
  wedding: "Một ngày, trọn một đời",
}

function generatePhotos(seed: string, count = 8): string[] {
  return Array.from(
    { length: count },
    (_, i) => `https://picsum.photos/seed/${seed}-p${i + 1}/1200/1500`
  )
}

function defaultCredits(location: string): AlbumCredit[] {
  return [
    { label: "Địa điểm", value: location },
    { label: "Chụp ảnh", value: "Remy's Studio" },
    { label: "Quay phim", value: "Remy's Films (highlight)" },
    { label: "Trang phục", value: "Lộng Lẫy Bridal" },
    { label: "Trang điểm", value: "Mai Anh Makeup" },
  ]
}

type RawAlbum = Omit<MockAlbum, "photos" | "credits">

const rawAlbums: RawAlbum[] = [
  {
    id: "1",
    slug: "linh-minh-tam-dao",
    category: "pre_wedding",
    title: "Linh & Minh",
    location: "Tam Đảo",
    date: "2026-03-15",
    coverImage: "https://picsum.photos/seed/remy-pw-01/1000/1250",
    highlightVideoUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
    tagline: "Một sáng sương mù ở Tam Đảo, chỉ có gió và hai người.",
  },
  {
    id: "2",
    slug: "chi-hoang-da-lat",
    category: "pre_wedding",
    title: "Chi & Hoàng",
    location: "Đà Lạt",
    date: "2026-01-15",
    coverImage: "https://picsum.photos/seed/remy-pw-02/1000/1250",
    tagline: "Đồi thông, sương lạnh đầu năm và một chương mới ở Đà Lạt.",
  },
  {
    id: "3",
    slug: "thao-nam-hoi-an",
    category: "pre_wedding",
    title: "Thảo & Nam",
    location: "Hội An",
    date: "2025-11-15",
    coverImage: "https://picsum.photos/seed/remy-pw-03/1000/1250",
    tagline: "Phố cổ lên đèn, một chiều Hội An không thể quay lại lần hai.",
  },
  {
    id: "4",
    slug: "an-khoa-ninh-binh",
    category: "wedding",
    title: "An & Khoa",
    location: "Ninh Bình",
    date: "2026-04-15",
    coverImage: "https://picsum.photos/seed/remy-wd-01/1000/1250",
    tagline: "Lễ gia tiên bên triền núi đá vôi, ngày trọng đại bắt đầu.",
  },
  {
    id: "5",
    slug: "phuong-duc-ha-noi",
    category: "wedding",
    title: "Phương & Đức",
    location: "Hà Nội",
    date: "2026-02-15",
    coverImage: "https://picsum.photos/seed/remy-wd-02/1000/1250",
    tagline: "Một đám cưới giữa lòng Hà Nội cuối đông, trọn vẹn nghi thức truyền thống.",
  },
  {
    id: "6",
    slug: "y-nhi-quan-bao",
    category: "wedding",
    title: "Ý Nhi & Quân Bảo",
    location: "Sài Gòn",
    date: "2025-12-15",
    coverImage: "https://picsum.photos/seed/remy-wd-03/1000/1250",
    tagline: "Sài Gòn về đêm, gần 300 khách mời và không một khung hình bị bỏ lỡ.",
  },
  {
    id: "10",
    slug: "ngoc-bao-moc-chau",
    category: "pre_wedding",
    title: "Ngọc & Bảo",
    location: "Mộc Châu",
    date: "2025-09-15",
    coverImage: "https://picsum.photos/seed/remy-pw-04/1000/1250",
    tagline: "Mùa hoa cải trắng đồi Mộc Châu, hai ngày không kịch bản.",
  },
  {
    id: "11",
    slug: "ha-kien-hue",
    category: "wedding",
    title: "Hạ & Kiên",
    location: "Huế",
    date: "2025-06-15",
    coverImage: "https://picsum.photos/seed/remy-wd-04/1000/1250",
    tagline: "Áo dài gấm, nghi thức cung đình Huế và giọng nói nhẹ như gió.",
  },
  {
    id: "13",
    slug: "kim-anh-quy-nhon",
    category: "pre_wedding",
    title: "Kim & Anh",
    location: "Quy Nhơn",
    date: "2025-07-15",
    coverImage: "https://picsum.photos/seed/remy-pw-05/1000/1250",
    tagline: "Biển xanh Quy Nhơn, nắng chiều và một lời hứa chưa nói hết.",
  },
  {
    id: "14",
    slug: "thu-hai-can-tho",
    category: "wedding",
    title: "Thu & Hải",
    location: "Cần Thơ",
    date: "2025-03-15",
    coverImage: "https://picsum.photos/seed/remy-wd-05/1000/1250",
    tagline: "Rước dâu bằng ghe trên sông Hậu, đám cưới miền Tây đúng chất.",
  },
]

export const mockAlbums: MockAlbum[] = rawAlbums.map((album) => ({
  ...album,
  photos: generatePhotos(album.slug),
  credits: defaultCredits(album.location),
}))

export function albumsByCategory(category: AlbumCategory, limit?: number) {
  const albums = mockAlbums.filter((album) => album.category === category)
  return limit ? albums.slice(0, limit) : albums
}

export function getAlbumBySlug(slug: string) {
  return mockAlbums.find((album) => album.slug === slug)
}

export function albumHref(album: Pick<MockAlbum, "category" | "slug">) {
  return album.category === "pre_wedding"
    ? `/pre-wedding/${album.slug}`
    : `/wedding/${album.slug}`
}

export function relatedAlbums(current: MockAlbum, limit = 4) {
  return mockAlbums
    .filter((album) => album.category === current.category && album.id !== current.id)
    .slice(0, limit)
}

export function recentAlbums(limit = 8) {
  const byCategory: Record<AlbumCategory, MockAlbum[]> = {
    pre_wedding: mockAlbums.filter((a) => a.category === "pre_wedding"),
    wedding: mockAlbums.filter((a) => a.category === "wedding"),
  }

  const order: AlbumCategory[] = ["wedding", "pre_wedding"]
  const interleaved: MockAlbum[] = []
  let i = 0
  while (interleaved.length < limit) {
    const cat = order[i % order.length]
    const pick = byCategory[cat][Math.floor(i / order.length)]
    if (!pick) {
      if (order.every((c) => byCategory[c].length <= Math.floor(i / order.length))) break
    } else {
      interleaved.push(pick)
    }
    i++
  }
  return interleaved.slice(0, limit)
}
