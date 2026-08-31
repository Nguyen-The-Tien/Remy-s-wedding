"use client"

import { motion } from "framer-motion"

export function PhilosophyStrip() {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-4 text-center md:py-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase"
        >
          Triết lý
        </motion.p>

        <motion.span
          aria-hidden
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="mt-6 block font-serif text-6xl text-clay/70 select-none md:text-7xl"
        >
          &ldquo;
        </motion.span>

        <motion.blockquote
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="-mt-4"
        >
          <p className="font-serif text-[clamp(1.8rem,4vw,3.2rem)] leading-[1.25] text-foreground">
            Chúng tôi không dựng lại cảm xúc — chỉ lặng lẽ chờ nó xảy đến.
            <br />
            <span className="italic">
              Một ánh nhìn, một nụ cười, một cái chạm rất khẽ.
            </span>
            <br />
            Và khi khoảnh khắc ấy xuất hiện, chúng tôi giữ nó lại bằng ánh sáng
            và những khung hình chân thật nhất.
          </p>
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mx-auto mt-8 h-px w-10 bg-border"
        />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-8 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground"
        >
          Hơn 12 năm kể chuyện bằng hình ảnh, chúng tôi đã gặp rất nhiều tình
          yêu, mỗi tình yêu một nhịp điệu, một cảm xúc riêng. Với chúng tôi, mỗi
          bộ ảnh, mỗi thước phim không phải là một công thức có sẵn — mà là một
          câu chuyện được kể theo cách riêng của hai người.
        </motion.p>
      </div>
    </section>
  )
}
