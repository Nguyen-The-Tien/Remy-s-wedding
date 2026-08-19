"use client"

import { motion } from "framer-motion"

import { buildSocialLinks, type SocialUrls } from "@/lib/socials"

export function FloatingSocial({ contact }: { contact: SocialUrls }) {
  const socialLinks = buildSocialLinks(contact)

  return (
    <div className="fixed right-6 bottom-8 z-40 flex flex-col gap-3 sm:right-10 sm:bottom-16">
      {socialLinks.map(({ label, href, icon }, index) => (
        <motion.a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          animate={{ rotate: [0, -10, 10, -8, 8, -4, 4, 0] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            repeatDelay: 2.6,
            delay: index * 0.25,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="flex size-11 items-center justify-center rounded-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt=""
            className={label === "Instagram" ? "size-9" : "size-11"}
          />
        </motion.a>
      ))}
    </div>
  )
}
