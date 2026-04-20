import {
  Mail,
  MapPin,
  Phone,
  Instagram,
  Youtube,
} from "lucide-react";
import { useState } from "react";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section id="contact" className="py-24 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        <p
          className="text-center text-amber-400 tracking-[0.25em] uppercase mb-4"
          style={{ fontSize: "0.75rem" }}
        >
          Let's Work Together
        </p>
        <h2 className="mb-4 text-center text-white">
          Book a Session
        </h2>
        <p className="text-center text-gray-400 mb-16 max-w-2xl mx-auto">
          Whether you're planning a wedding, need a brand film,
          or want stunning portraits — I'd love to hear about
          your project.
        </p>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Info */}
          <div>
            <h3 className="mb-8 text-white">Get in Touch</h3>
            <div className="space-y-6 mb-10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg shrink-0">
                  <Mail className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p
                    className="text-white mb-1"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Email
                  </p>
                  <p className="text-gray-400">
                    hello@alexrivera.com
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg shrink-0">
                  <Phone className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p
                    className="text-white mb-1"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Phone
                  </p>
                  <p className="text-gray-400">
                    +1 (424) 555-0192
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 rounded-lg shrink-0">
                  <MapPin className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p
                    className="text-white mb-1"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Location
                  </p>
                  <p className="text-gray-400">
                    Los Angeles, CA — Available Worldwide
                  </p>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <p
                className="text-white mb-4"
                style={{ fontSize: "0.875rem" }}
              >
                Follow My Work
              </p>
              <div className="flex gap-4">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
                  style={{ fontSize: "0.85rem" }}
                >
                  <Youtube className="h-4 w-4" />
                  YouTube
                </a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="p-4 bg-amber-500/10 rounded-full mb-5">
                  <Mail className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-white mb-3">
                  Message Sent!
                </h3>
                <p className="text-gray-400">
                  Thank you for reaching out. I'll get back to
                  you within 24 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-gray-300 mb-2"
                      style={{ fontSize: "0.85rem" }}
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      required
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors"
                      style={{ fontSize: "0.9rem" }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-gray-300 mb-2"
                      style={{ fontSize: "0.85rem" }}
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors"
                      style={{ fontSize: "0.9rem" }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="service"
                    className="block text-gray-300 mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Service
                  </label>
                  <select
                    id="service"
                    required
                    defaultValue=""
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-amber-500 focus:outline-none transition-colors"
                    style={{ fontSize: "0.9rem" }}
                  >
                    <option value="" disabled>
                      Select a service...
                    </option>
                    <option value="wedding">
                      Wedding &amp; Events
                    </option>
                    <option value="portrait">
                      Portrait Session
                    </option>
                    <option value="commercial">
                      Commercial Production
                    </option>
                    <option value="aerial">
                      Aerial &amp; Drone
                    </option>
                    <option value="editing">
                      Video Editing / Color Grade
                    </option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-gray-300 mb-2"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Tell me about your project
                  </label>
                  <textarea
                    id="message"
                    placeholder="Describe your vision, timeline, and any details..."
                    rows={5}
                    required
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-amber-500 focus:outline-none transition-colors resize-none"
                    style={{ fontSize: "0.9rem" }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}