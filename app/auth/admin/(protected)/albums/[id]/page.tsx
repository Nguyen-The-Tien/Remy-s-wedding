import { AlbumDetailScreen } from "@/screens/admin/album-detail"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AlbumDetailScreen key={id} albumId={id} />
}
