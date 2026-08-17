"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, LocateFixed } from "lucide-react"
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet"

import "leaflet/dist/leaflet.css"

const HANOI_CENTER: [number, number] = [21.0285, 105.8048]

const PIN_ICON_HTML = `
  <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill="#b45f3f"/>
    <circle cx="15" cy="15" r="6" fill="#fdfaf5"/>
  </svg>
`

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=0&countrycodes=vn`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.display_name ?? null
  } catch {
    return null
  }
}

async function forwardGeocode(
  query: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=vn`
    )
    if (!res.ok) return null
    const data = await res.json()
    const first = data[0]
    if (!first) return null
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) }
  } catch {
    return null
  }
}

export function AddressMapField({
  address,
  onAddressChange,
}: {
  address: string
  onAddressChange: (address: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const lastPickedAddress = useRef<string | null>(null)
  const [locating, setLocating] = useState(false)

  // Init the map once.
  useEffect(() => {
    let cancelled = false

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, {
        center: HANOI_CENTER,
        zoom: 15,
      })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      const icon = L.divIcon({
        html: PIN_ICON_HTML,
        className: "",
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      })
      const marker = L.marker(HANOI_CENTER, { icon, draggable: true }).addTo(
        map
      )

      async function pick(lat: number, lng: number) {
        marker.setLatLng([lat, lng])
        const result = await reverseGeocode(lat, lng)
        if (result) {
          lastPickedAddress.current = result
          onAddressChange(result)
        }
      }

      map.on("click", (e) => pick(e.latlng.lat, e.latlng.lng))
      marker.on("dragend", () => {
        const pos = marker.getLatLng()
        pick(pos.lat, pos.lng)
      })

      mapRef.current = map
      markerRef.current = marker

      forwardGeocode(address).then((pos) => {
        if (cancelled || !pos) return
        map.setView([pos.lat, pos.lng], 16)
        marker.setLatLng([pos.lat, pos.lng])
      })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-geocode when the address text changes from typing (not from a map pick).
  useEffect(() => {
    if (address.trim() === "" || address === lastPickedAddress.current) return

    const timer = setTimeout(async () => {
      const map = mapRef.current
      const marker = markerRef.current
      if (!map || !marker) return
      const pos = await forwardGeocode(address)
      if (!pos) return
      map.setView([pos.lat, pos.lng], 16)
      marker.setLatLng([pos.lat, pos.lng])
    }, 700)

    return () => clearTimeout(timer)
  }, [address])

  function handleUseMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        mapRef.current?.setView([latitude, longitude], 16)
        markerRef.current?.setLatLng([latitude, longitude])
        const result = await reverseGeocode(latitude, longitude)
        if (result) {
          lastPickedAddress.current = result
          onAddressChange(result)
        }
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="aspect-video w-full overflow-hidden rounded-lg border border-border"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Bấm hoặc kéo ghim trên bản đồ để chọn đúng vị trí — địa chỉ ở trên
          sẽ tự cập nhật theo.
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground disabled:opacity-50"
          >
            <LocateFixed className="size-3" />
            Vị trí của tôi
          </button>
          <a
            href={mapLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground"
          >
            Xem trên Google Maps
            <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
