import { Camera, Heart, Film, Sliders, Wind, Monitor } from 'lucide-react';

const services = [
  {
    icon: Heart,
    title: 'Wedding & Events',
    description:
      'Timeless wedding photography and videography that captures every emotion, from the first look to the last dance.',
  },
  {
    icon: Camera,
    title: 'Portrait Sessions',
    description:
      'Headshots, editorial, and personal branding portraits with expert lighting to bring out your authentic self.',
  },
  {
    icon: Film,
    title: 'Commercial Production',
    description:
      'High-end brand films, product videos, and corporate content that drive engagement and elevate your brand.',
  },
  {
    icon: Wind,
    title: 'Aerial & Drone',
    description:
      'Breathtaking aerial footage and photography using FAA-certified drone equipment for stunning perspectives.',
  },
  {
    icon: Sliders,
    title: 'Color Grading',
    description:
      'Professional color grading and post-production to give your photos and videos a cohesive cinematic look.',
  },
  {
    icon: Monitor,
    title: 'Video Editing',
    description:
      'Full post-production services including editing, sound design, motion graphics, and final delivery.',
  },
];

export function Skills() {
  return (
    <section id="skills" className="py-24 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-amber-400 tracking-[0.25em] uppercase mb-4" style={{ fontSize: '0.75rem' }}>
          What I Offer
        </p>
        <h2 className="mb-4 text-center text-white">Services</h2>
        <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
          From a single portrait session to a full-scale cinematic production —
          I offer end-to-end creative services tailored to your vision.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className="p-7 border border-white/10 rounded-lg hover:border-amber-500/50 hover:bg-white/5 transition-all group"
              >
                <div className="p-3 bg-amber-500/10 rounded-lg w-fit mb-5 group-hover:bg-amber-500/20 transition-colors">
                  <Icon className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="mb-3 text-white">{service.title}</h3>
                <p className="text-gray-500" style={{ fontSize: '0.9rem' }}>{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
