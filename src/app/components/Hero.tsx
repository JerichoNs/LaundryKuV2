import { Instagram, Youtube, Mail, ChevronDown } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1770347253974-a394485178b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBwaG90b2dyYXBoZXIlMjBjYW1lcmElMjBnb2xkZW4lMjBob3VyJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc3MzE5Njc3NHww&ixlib=rb-4.1.0&q=80&w=1080')`,
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <p
          className="text-amber-400 mb-5 tracking-[0.3em] uppercase font-[Aksara_Bali_Galang]"
          style={{ fontSize: '14px' }}
        >
          Photography &amp; Videography
        </p>
        <h1 className="mb-6 text-white leading-tight font-[Alata] text-[32px]">Capturing <span className="text-amber-400">Moments</span>,<br />Telling Stories</h1>
        <p className="text-gray-300 mb-12 max-w-2xl mx-auto font-[Abhaya_Libre] text-[20px]">
          Award-winning photographer and videographer specializing in weddings,
          portraits, commercial productions, and cinematic storytelling.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mb-10">
          <a
            href="#projects"
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded transition-colors"
          >
            View Portfolio
          </a>
          <a
            href="#contact"
            className="px-8 py-3 border border-white/60 hover:border-amber-400 hover:text-amber-400 text-white rounded transition-colors"
          >
            Book a Session
          </a>
        </div>
        <div className="flex gap-6 justify-center">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-amber-400 transition-colors"
          >
            <Instagram className="h-6 w-6" />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-amber-400 transition-colors"
          >
            <Youtube className="h-6 w-6" />
          </a>
          <a
            href="mailto:hello@example.com"
            className="text-gray-300 hover:text-amber-400 transition-colors"
          >
            <Mail className="h-6 w-6" />
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
        <ChevronDown className="h-7 w-7" />
      </div>
    </section>
  );
}