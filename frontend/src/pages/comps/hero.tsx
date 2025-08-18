/* eslint-disable */
import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"

export default function HeroSection() {
  const [showScrollArrow, setShowScrollArrow] = useState(true)

  useEffect(() => {
    const handleScroll = () => setShowScrollArrow(window.scrollY < 100)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="relative bg-[#3A3A3A] text-white py-24 overflow-hidden">
      {/* Éléments décoratifs en arrière-plan */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-[#F1C40F] rounded-full" />
        <div className="absolute top-32 right-20 w-24 h-24 bg-[#F1C40F] rounded-full" />
        <div className="absolute bottom-20 left-1/4 w-16 h-16 border-4 border-[#F1C40F] rounded-full" />
        <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#F1C40F] rounded-full opacity-50" />
        <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-[#F1C40F] rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Logo */}
          <div className="flex-shrink-0 relative group">
            <div className="absolute inset-0 bg-[#F1C40F] rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
            <img
              src="./logo-removebg.jpg"
              alt="Logo CTT Frameries"
              className="relative h-48 md:h-72 w-auto drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="text-center lg:text-left relative">
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#F1C40F]/20 to-transparent rounded-2xl blur-sm" />

            {/* Main content container with improved styling */}
            <div className="relative bg-gradient-to-br from-black/40 via-black/30 to-transparent backdrop-blur-md rounded-2xl p-8 border border-[#F1C40F]/30 shadow-2xl hover:border-[#F1C40F]/50 transition-all duration-300">
              <div className="inline-block">
                <h1 className="text-5xl md:text-6xl font-bold mb-2 leading-tight">
                  <span className="text-white">CTT</span>{" "}
                  <span className="text-[#F1C40F] drop-shadow-lg">Frameries</span>
                </h1>
                <div className="h-1 w-24 bg-gradient-to-r from-[#F1C40F] to-[#F1C40F]/50 mx-auto lg:mx-0 mb-6 rounded-full"></div>
              </div>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto lg:mx-0 leading-relaxed text-gray-200 mb-4 font-medium">
                Club de Tennis de Table de Frameries
              </p>
              <p className="text-lg text-gray-300 font-light tracking-wide">Passion • Sport • Convivialité</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

