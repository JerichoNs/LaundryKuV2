import { Instagram, Youtube, Mail, Camera } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-white/10 text-white py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-5 w-5 text-amber-400" />
              <span style={{ fontSize: '1.1rem' }}>Alex Rivera</span>
            </div>
            <p className="text-gray-500" style={{ fontSize: '0.875rem' }}>
              Photographer &amp; Videographer based in Los Angeles, CA.
              Available for projects worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-5 text-white">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'About', href: '#about' },
                { label: 'Services', href: '#skills' },
                { label: 'Portfolio', href: '#projects' },
                { label: 'Contact', href: '#contact' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-gray-500 hover:text-amber-400 transition-colors"
                    style={{ fontSize: '0.875rem' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="mb-5 text-white">Connect</h4>
            <div className="flex gap-4 mb-5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 transition-all"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@alexrivera.com"
                className="p-3 bg-white/5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 transition-all"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>
              hello@alexrivera.com
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-600" style={{ fontSize: '0.8rem' }}>
          <p>© 2026 Alex Rivera. All rights reserved.</p>
          <p>Photography &amp; Videography · Los Angeles, CA</p>
        </div>
      </div>
    </footer>
  );
}
