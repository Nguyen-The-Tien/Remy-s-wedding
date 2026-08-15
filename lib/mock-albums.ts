export type AlbumCategory = "pre_wedding" | "wedding" | "video"

export type AlbumCredit = { label: string; value: string }

export type MockAlbum = {
  id: string
  slug: string
  category: AlbumCategory
  title: string
  location: string
  date: string
  coverImage: string
  highlightVideoUrl?: string
  tagline: string
  credits: AlbumCredit[]
  photos: string[]
}

export const CATEGORY_LABEL: Record<AlbumCategory, string> = {
  pre_wedding: "Pre-wedding",
  wedding: "Wedding",
  video: "Video cưới",
}

export const CATEGORY_TITLE: Record<AlbumCategory, string> = {
  pre_wedding: "Yêu, giữa thiên nhiên và ánh sáng",
  wedding: "Một ngày, trọn một đời",
  video: "Cảm xúc, dựng thành chuyển động",
}

function generatePhotos(seed: string, count = 8): string[] {
  return Array.from(
    { length: count },
    (_, i) => `https://picsum.photos/seed/${seed}-p${i + 1}/1200/1500`
  )
}

function defaultCredits(location: string, category: AlbumCategory): AlbumCredit[] {
  return [
    { label: "Địa điểm", value: location },
    { label: "Chụp ảnh", value: "Remy's Studio" },
    { label: "Quay phim", value: category === "video" ? "Remy's Films" : "Remy's Films (highlight)" },
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
    date: "Tháng 3, 2026",
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
    date: "Tháng 1, 2026",
    coverImage: "https://picsum.photos/seed/remy-pw-02/1000/1250",
    tagline: "Đồi thông, sương lạnh đầu năm và một chương mới ở Đà Lạt.",
  },
  {
    id: "3",
    slug: "thao-nam-hoi-an",
    category: "pre_wedding",
    title: "Thảo & Nam",
    location: "Hội An",
    date: "Tháng 11, 2025",
    coverImage: "https://picsum.photos/seed/remy-pw-03/1000/1250",
    tagline: "Phố cổ lên đèn, một chiều Hội An không thể quay lại lần hai.",
  },
  {
    id: "4",
    slug: "an-khoa-ninh-binh",
    category: "wedding",
    title: "An & Khoa",
    location: "Ninh Bình",
    date: "Tháng 4, 2026",
    coverImage: "https://picsum.photos/seed/remy-wd-01/1000/1250",
    tagline: "Lễ gia tiên bên triền núi đá vôi, ngày trọng đại bắt đầu.",
  },
  {
    id: "5",
    slug: "phuong-duc-ha-noi",
    category: "wedding",
    title: "Phương & Đức",
    location: "Hà Nội",
    date: "Tháng 2, 2026",
    coverImage: "https://picsum.photos/seed/remy-wd-02/1000/1250",
    tagline: "Một đám cưới giữa lòng Hà Nội cuối đông, trọn vẹn nghi thức truyền thống.",
  },
  {
    id: "6",
    slug: "y-nhi-quan-bao",
    category: "wedding",
    title: "Ý Nhi & Quân Bảo",
    location: "Sài Gòn",
    date: "Tháng 12, 2025",
    coverImage: "https://picsum.photos/seed/remy-wd-03/1000/1250",
    tagline: "Sài Gòn về đêm, gần 300 khách mời và không một khung hình bị bỏ lỡ.",
  },
  {
    id: "7",
    slug: "trang-hieu-phu-quoc",
    category: "video",
    title: "Trang & Hiếu",
    location: "Phú Quốc",
    date: "Tháng 3, 2026",
    coverImage: "https://picsum.photos/seed/remy-vd-01/1000/1250",
    highlightVideoUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
    tagline: "Từ nắng sớm trên cát đến ánh nến hoàng hôn ở Phú Quốc.",
  },
  {
    id: "8",
    slug: "mai-tuan-sa-pa",
    category: "video",
    title: "Mai & Tuấn",
    location: "Sa Pa",
    date: "Tháng 10, 2025",
    coverImage: "https://picsum.photos/seed/remy-vd-02/1000/1250",
    highlightVideoUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
    tagline: "Mây trắng, gió lạnh và một cái ôm rất dài trên đỉnh Sa Pa.",
  },
  {
    id: "9",
    slug: "huong-long-vung-tau",
    category: "video",
    title: "Hương & Long",
    location: "Vũng Tàu",
    date: "Tháng 8, 2025",
    coverImage: "https://picsum.photos/seed/remy-vd-03/1000/1250",
    highlightVideoUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
    tagline: "Nến thả trôi theo sóng, một buổi tối Vũng Tàu không muốn kết thúc.",
  },
  {
    id: "10",
    slug: "ngoc-bao-moc-chau",
    category: "pre_wedding",
    title: "Ngọc & Bảo",
    location: "Mộc Châu",
    date: "Tháng 9, 2025",
    coverImage: "https://picsum.photos/seed/remy-pw-04/1000/1250",
    tagline: "Mùa hoa cải trắng đồi Mộc Châu, hai ngày không kịch bản.",
  },
  {
    id: "11",
    slug: "ha-kien-hue",
    category: "wedding",
    title: "Hạ & Kiên",
    location: "Huế",
    date: "Tháng 6, 2025",
    coverImage: "https://picsum.photos/seed/remy-wd-04/1000/1250",
    tagline: "Áo dài gấm, nghi thức cung đình Huế và giọng nói nhẹ như gió.",
  },
  {
    id: "12",
    slug: "vy-dat-da-nang",
    category: "video",
    title: "Vy & Đạt",
    location: "Đà Nẵng",
    date: "Tháng 5, 2025",
    coverImage: "https://picsum.photos/seed/remy-vd-04/1000/1250",
    highlightVideoUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
    tagline: "Pháo hoa sông Hàn thắp sáng khung hình cuối, nơi cả hai gặp nhau lần đầu.",
  },
  {
    id: "13",
    slug: "kim-anh-quy-nhon",
    category: "pre_wedding",
    title: "Kim & Anh",
    location: "Quy Nhơn",
    date: "Tháng 7, 2025",
    coverImage: "https://picsum.photos/seed/remy-pw-05/1000/1250",
    tagline: "Biển xanh Quy Nhơn, nắng chiều và một lời hứa chưa nói hết.",
  },
  {
    id: "14",
    slug: "thu-hai-can-tho",
    category: "wedding",
    title: "Thu & Hải",
    location: "Cần Thơ",
    date: "Tháng 3, 2025",
    coverImage: "https://picsum.photos/seed/remy-wd-05/1000/1250",
    tagline: "Rước dâu bằng ghe trên sông Hậu, đám cưới miền Tây đúng chất.",
  },
  {
    id: "15",
    slug: "linh-phong-nha-trang",
    category: "video",
    title: "Linh & Phong",
    location: "Nha Trang",
    date: "Tháng 2, 2025",
    coverImage: "https://picsum.photos/seed/remy-vd-05/1000/1250",
    highlightVideoUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
    tagline: "Bình minh trên vịnh Nha Trang, khoảnh khắc cả hai cùng đón nắng đầu ngày.",
  },
]

export const mockAlbums: MockAlbum[] = rawAlbums.map((album) => ({
  ...album,
  photos: generatePhotos(album.slug),
  credits: defaultCredits(album.location, album.category),
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
    video: mockAlbums.filter((a) => a.category === "video"),
  }

  const order: AlbumCategory[] = ["wedding", "pre_wedding", "video"]
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
