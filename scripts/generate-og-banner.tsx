import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { ImageResponse } from "next/og"

const ROOT = path.resolve(import.meta.dirname, "..")

const FONT_URLS = {
  ebGaramond:
    "https://fonts.gstatic.com/s/ebgaramond/v33/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-2fRUAIV-e62PgQ.woff",
  instrumentSans:
    "https://fonts.gstatic.com/s/instrumentsans/v4/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npSQb_gf2mS0v3vbY.woff",
}

async function fetchFont(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch font ${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const [ebGaramond, instrumentSans, logoPng] = await Promise.all([
    fetchFont(FONT_URLS.ebGaramond),
    fetchFont(FONT_URLS.instrumentSans),
    readFile(path.join(ROOT, "public/web-app-manifest-512x512.png")),
  ])

  const logoDataUrl = `data:image/png;base64,${logoPng.toString("base64")}`

  const image = new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#241812",
        backgroundImage:
          "radial-gradient(circle at 50% 35%, #3A2619 0%, #1B120D 70%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoDataUrl}
        alt=""
        width={104}
        height={104}
        style={{ borderRadius: "26px" }}
      />
      <div
        style={{
          marginTop: "34px",
          fontSize: "122px",
          fontFamily: "EB Garamond",
          color: "#FBFAF8",
          lineHeight: 1,
        }}
      >
        Remy
      </div>
      <div
        style={{
          marginTop: "28px",
          display: "flex",
          alignItems: "center",
          fontFamily: "Instrument Sans",
          fontSize: "26px",
          letterSpacing: "10px",
          color: "#CC8463",
        }}
      >
        PHOTO &amp; FILM STUDIO
      </div>
      <div
        style={{
          marginTop: "40px",
          width: "72px",
          height: "2px",
          backgroundColor: "#5A3B29",
        }}
      />
      <div
        style={{
          marginTop: "24px",
          fontFamily: "Instrument Sans",
          fontSize: "24px",
          letterSpacing: "4px",
          color: "#9C8377",
        }}
      >
        remystudio.vn
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "EB Garamond", data: ebGaramond, weight: 500, style: "normal" },
        {
          name: "Instrument Sans",
          data: instrumentSans,
          weight: 600,
          style: "normal",
        },
      ],
    }
  )

  const buffer = Buffer.from(await image.arrayBuffer())
  const outPath = path.join(ROOT, "public/og-banner.png")
  await writeFile(outPath, buffer)
  console.log("Wrote", outPath, `(${buffer.byteLength} bytes)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
