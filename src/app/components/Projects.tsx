import { ExternalLink, Play } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';

const categories = ['All', 'Photography', 'Videography', 'Commercial'];

const projects = [
  {
    title: 'The Carter Wedding',
    category: 'Photography',
    type: 'Photography',
    description:
      'A romantic summer wedding captured at the Napa Valley vineyard. Every detail, every tear, every laugh — preserved forever.',
    image:
      'https://images.unsplash.com/photo-1658243862459-145b453dd74e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcGhvdG9ncmFwaHklMjBjb3VwbGUlMjByb21hbnRpY3xlbnwxfHx8fDE3NzMxOTY3NzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['Wedding', 'Portrait', 'Natural Light'],
    link: '#',
    isVideo: false,
  },
  {
    title: 'Apex Brand Film',
    category: 'Commercial',
    type: 'Videography',
    description:
      'A cinematic brand film for Apex Athletics featuring athlete stories, product showcases, and stunning production value.',
    image:
      'https://images.unsplash.com/photo-1768796371769-c87791026c53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwdmlkZW8lMjBwcm9kdWN0aW9uJTIwZmlsbWluZyUyMGNyZXd8ZW58MXx8fHwxNzczMTk2Nzc1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['Commercial', 'Brand Film', 'Color Grade'],
    link: '#',
    isVideo: true,
  },
  {
    title: 'Pacific Coast Aerial',
    category: 'Photography',
    type: 'Photography',
    description:
      'Sweeping aerial photography along the California coastline, showcasing rugged cliffs, turquoise waters, and golden dunes.',
    image:
      'https://images.unsplash.com/photo-1653149874086-3e1b1a7a8d26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZXJpYWwlMjBkcm9uZSUyMGxhbmRzY2FwZSUyMG5hdHVyZSUyMHBob3RvZ3JhcGh5fGVufDF8fHx8MTc3MzE5Njc3NXww&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['Aerial', 'Landscape', 'Drone'],
    link: '#',
    isVideo: false,
  },
  {
    title: 'Elena — Editorial Portrait',
    category: 'Photography',
    type: 'Photography',
    description:
      'A high-fashion editorial portrait series exploring light, shadow, and texture in a minimalist studio environment.',
    image:
      'https://images.unsplash.com/photo-1763551229510-d477a99acc58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBob3RvZ3JhcGh5JTIwc3R1ZGlvJTIwbW9vZHklMjBsaWdodGluZ3xlbnwxfHx8fDE3NzMxOTY3NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['Portrait', 'Editorial', 'Studio'],
    link: '#',
    isVideo: false,
  },
];

export function Projects() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered =
    activeCategory === 'All'
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <section id="projects" className="py-24 px-4 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <p
          className="text-center text-amber-400 tracking-[0.25em] uppercase mb-4"
          style={{ fontSize: '0.75rem' }}
        >
          My Work
        </p>
        <h2 className="mb-4 text-center text-white">Portfolio</h2>
        <p className="text-center text-gray-400 mb-10 max-w-2xl mx-auto">
          A selection of photography and videography projects — each one a unique
          story told through light, composition, and motion.
        </p>

        {/* Filter tabs */}
        <div className="flex gap-3 justify-center flex-wrap mb-14">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full border transition-colors ${
                activeCategory === cat
                  ? 'bg-amber-500 border-amber-500 text-black'
                  : 'border-white/20 text-gray-400 hover:border-amber-500/50 hover:text-amber-400'
              }`}
              style={{ fontSize: '0.85rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {filtered.map((project) => (
            <div
              key={project.title}
              className="group relative overflow-hidden rounded-lg border border-white/10 hover:border-amber-500/40 transition-all"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />
                {/* Video play icon */}
                {project.isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-4 bg-amber-500 rounded-full opacity-90">
                      <Play className="h-6 w-6 text-black fill-black" />
                    </div>
                  </div>
                )}
                {/* Type badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className="px-3 py-1 bg-black/60 text-amber-400 rounded-full backdrop-blur-sm"
                    style={{ fontSize: '0.7rem' }}
                  >
                    {project.type}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-6 bg-zinc-900">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-white">{project.title}</h3>
                  <a
                    href={project.link}
                    className="shrink-0 text-gray-500 hover:text-amber-400 transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
                <p className="text-gray-400 mb-4" style={{ fontSize: '0.875rem' }}>
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white/5 text-gray-400 rounded-full"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
