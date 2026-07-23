import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useMenuContext } from "../context/MenuContext";
import { CustomerPopup } from "./CustomerPopup";

type Slide =
  | { id: number; type: "image"; src: string }
  | { id: number; type: "video"; src: string; poster?: string };

const defaultSlides: Slide[] = [
  {
    id: 1,
    type: "image",
    src: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    id: 2,
    type: "image",
    src: "https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
  {
    id: 3,
    type: "video",
    src: "https://www.pexels.com/download/video/5223104/",
    poster:
      "https://images.pexels.com/photos/958546/pexels-photo-958546.jpeg?auto=compress&cs=tinysrgb&w=1600",
  },
];

export const HeroBanner: React.FC = () => {
  const { t } = useTranslation();
  const { banner } = useMenuContext();

  const slides: Slide[] = useMemo(() => {
    if (banner?.background_image) {
      return [
        {
          id: 1,
          type: "image",
          src: banner.background_image,
        },
      ];
    }
    return defaultSlides;
  }, [banner]);

  const [index, setIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const goNext = useCallback(() => setIndex((prev) => (prev + 1) % slides.length), [slides.length]);
  const goPrev = useCallback(
    () => setIndex((prev) => (prev - 1 + slides.length) % slides.length),
    [slides.length]
  );

  const resetAutoSlide = useCallback(() => {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(goNext, 8000);
  }, [goNext]);

  useEffect(() => {
    resetAutoSlide();
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [resetAutoSlide]);

  return (
    <section className="hero">
      <div className="hero__media">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[index].id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: "absolute", inset: 0 }}
          >
            {slides[index].type === "image" ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `url('${slides[index].src}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <video
                key={slides[index].id}
                src={slides[index].src}
                poster={slides[index].poster}
                autoPlay
                muted
                loop
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </motion.div>
        </AnimatePresence>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.65))",
          }}
        />

        <button
          type="button"
          onClick={() => {
            goPrev();
            resetAutoSlide();
          }}
          aria-label="Previous slide"
          className="hero__arrow hero__arrow--prev"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => {
            goNext();
            resetAutoSlide();
          }}
          aria-label="Next slide"
          className="hero__arrow hero__arrow--next"
          
        >
          ›
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="hero__cta"
        >
          Guest Registration
        </button>
      </div>

      <CustomerPopup open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};
