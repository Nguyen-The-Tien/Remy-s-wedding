"use client"

import { motion } from "framer-motion"

import { APP_CONFIG } from "@/config/config"
import { SOCIAL_LINKS } from "@/lib/socials"

const socialContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
}

const socialItem = {
  hidden: { opacity: 0, y: 14, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-20 bg-neutral-950 text-[var(--on-image)]"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6 }}
          className="text-[0.75rem] font-medium tracking-[0.25em] text-clay uppercase"
        >
          Bắt đầu
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="mt-5 font-serif text-[clamp(2rem,5vw,3.2rem)] leading-[1.15] italic"
        >
          Câu chuyện của bạn bắt đầu từ đây.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10 inline-flex h-11 items-center rounded-full bg-[var(--on-image)] px-8 text-sm font-medium tracking-wide text-neutral-950 transition-transform hover:-translate-y-0.5"
        >
          Liên hệ Remy&rsquo;s
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-sm text-[var(--on-image)]/60"
        >
          {APP_CONFIG.contact.email}
        </motion.p>

        <motion.div
          variants={socialContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-12 flex flex-wrap justify-center gap-3"
        >
          {SOCIAL_LINKS.map(({ label, href, icon }) => (
            <motion.a
              key={label}
              variants={socialItem}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2.5 rounded-full border border-[var(--on-image)]/20 px-5 py-2.5 text-sm text-[var(--on-image)]/80 transition-colors duration-300 hover:border-[var(--on-image)]/45 hover:text-[var(--on-image)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon} alt="" className="size-4" />
              {label}
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
