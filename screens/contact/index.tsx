"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react"
import Link from "next/link"

import { buildSocialLinks } from "@/lib/socials"
import type { ContactInfo } from "@/lib/contact"

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const socialContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.25 },
  },
}

const socialItem = {
  hidden: { opacity: 0, y: 12, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function ContactScreen({ contact }: { contact: ContactInfo }) {
  const infoItems = [
    { icon: MapPin, label: "Địa chỉ", value: contact.address },
    { icon: Mail, label: "Email", value: contact.email },
    { icon: Phone, label: "Điện thoại", value: contact.phone },
  ]
  const socialLinks = buildSocialLinks(contact)

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    contact.address
  )}&output=embed`

  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    contact.address
  )}`

  return (
    <main>
      <section className="relative bg-grain pt-10 pb-8 md:pt-12 md:pb-12">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Link
              href="/"
              className="text-[0.72rem] font-medium tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-clay"
            >
              ← Trang chủ
            </Link>

            <p className="mt-8 text-sm font-medium tracking-[0.2em] text-clay uppercase">
              Liên hệ
            </p>

            <motion.span
              aria-hidden
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="mt-4 block font-serif text-6xl text-clay/60 select-none"
            >
              &ldquo;
            </motion.span>

            <h1 className="-mt-3 max-w-2xl font-serif text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.3] text-foreground">
              Ghé thăm studio, gọi điện, hay nhắn tin —{" "}
              <span className="italic">Remy&rsquo;s luôn sẵn sàng lắng nghe</span>.
            </h1>

            <div className="mt-8 h-px w-10 bg-border" />
          </motion.div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="mx-auto grid max-w-[1440px] gap-x-16 gap-y-14 px-6 md:grid-cols-12 md:px-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
            variants={fadeUp}
            className="md:col-span-5"
          >
            <div>
              {infoItems.map(({ icon: Icon, label, value }, i) => (
                <div
                  key={label}
                  className={`flex items-start gap-5 border-border py-6 ${
                    i === 0 ? "pt-0" : ""
                  } ${i < infoItems.length - 1 ? "border-b" : ""}`}
                >
                  <Icon
                    strokeWidth={1.5}
                    className="mt-1 size-4 shrink-0 text-clay"
                  />
                  <div>
                    <p className="text-[0.68rem] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                      {label}
                    </p>
                    <p className="mt-2 font-serif text-xl text-foreground">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <p className="text-[0.68rem] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                Theo dõi
              </p>
              <motion.div
                variants={socialContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-10%" }}
                className="mt-4 flex gap-3"
              >
                {socialLinks.map(({ label, href, icon }) => (
                  <motion.a
                    key={label}
                    variants={socialItem}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 380, damping: 20 }}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 rounded-full border border-border py-2.5 pr-5 pl-3 text-sm text-foreground/80 transition-colors duration-300 hover:border-clay/50 hover:text-clay"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={icon}
                      alt=""
                      className={label === "Instagram" ? "size-4" : "size-5"}
                    />
                    {label}
                  </motion.a>
                ))}
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
            variants={fadeUp}
            transition={{ delay: 0.12 }}
            className="md:col-span-7"
          >
            <div className="relative overflow-hidden border border-border bg-neutral-900">
              <div className="relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9]">
                <iframe
                  src={mapSrc}
                  title="Bản đồ studio Remy's"
                  className="absolute inset-0 h-full w-full [filter:grayscale(0.5)_contrast(1.1)_brightness(0.97)]"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            </div>

            <a
              href={mapLink}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[0.7rem] font-medium tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-clay"
            >
              Xem trên Google Maps
              <ArrowUpRight className="size-3.5" />
            </a>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
