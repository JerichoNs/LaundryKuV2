import { ImageWithFallback } from './figma/ImageWithFallback';
import { Award, Camera, Film } from 'lucide-react';

const stats = [
  { value: '8+', label: 'Years Experience' },
  { value: '500+', label: 'Projects Completed' },
  { value: '120+', label: 'Happy Clients' },
  { value: '15+', label: 'Awards Won' },
];

export function About() {
  return (
    <section id="about" className="py-24 px-4 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-lg">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1684598273403-ff8b167b8aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwaG90b2dyYXBoZXIlMjBwb3J0cmFpdCUyMHNob290aW5nJTIwc3R1ZGlvfGVufDF8fHx8MTc3MzE5Njc3NHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Photographer at work"
                className="w-full h-[520px] object-cover"
              />
              {/* Accent border */}
              <div className="absolute inset-0 ring-1 ring-amber-500/30 rounded-lg pointer-events-none" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-5 -right-5 bg-amber-500 text-black rounded-lg px-5 py-4 shadow-2xl">
              <p className="tracking-wider uppercase" style={{ fontSize: '0.65rem' }}>Available for</p>
              <p style={{ fontSize: '0.9rem' }} className="mt-0.5">Freelance Work</p>
            </div>
          </div>

          {/* Content */}
          <div className="text-white">
            <p className="text-amber-400 tracking-[0.25em] uppercase mb-4" style={{ fontSize: '0.75rem' }}>
              About Me
            </p>
            <h2 className="mb-6 text-white">
              Turning Vision Into Cinematic Reality
            </h2>
            <p className="text-gray-400 mb-5">
              I'm Alex Rivera — a passionate photographer and videographer based in Los Angeles.
              With over 8 years behind the lens, I've built a reputation for capturing raw,
              authentic moments that resonate and endure.
            </p>
            <p className="text-gray-400 mb-8">
              From intimate wedding ceremonies to large-scale commercial productions, I bring
              the same dedication to every project: meticulous preparation, creative vision,
              and a relentless pursuit of the perfect shot or frame.
            </p>

            {/* Gear highlights */}
            <div className="flex gap-6 mb-10">
              <div className="flex items-center gap-2 text-gray-300">
                <Camera className="h-5 w-5 text-amber-400 shrink-0" />
                <span style={{ fontSize: '0.875rem' }}>Sony A7R V · Canon R5</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Film className="h-5 w-5 text-amber-400 shrink-0" />
                <span style={{ fontSize: '0.875rem' }}>DJI Ronin · Premiere Pro</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 pt-8 border-t border-white/10">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-amber-400 mb-1" style={{ fontSize: '1.5rem' }}>{stat.value}</p>
                  <p className="text-gray-500" style={{ fontSize: '0.7rem' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
