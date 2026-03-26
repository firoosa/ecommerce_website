import { Link } from 'react-router-dom'
import { FiGlobe, FiAtSign, FiCamera } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="bg-[#f4f4ef] border-t border-[#c2c7cf]/30 mt-auto">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <Link to="/" className="text-2xl font-serif text-[#624000] italic">
              Lumiere Enfance
            </Link>
            <p className="mt-4 text-sm text-[#42474e] leading-relaxed font-light max-w-xs">
              Crafting memories for the modern nursery through intentional design and sustainable
              luxury.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <span className="w-9 h-9 rounded-full border border-[#c2c7cf] flex items-center justify-center text-[#42474e] hover:text-[#624000] hover:border-[#624000] transition-soft">
                <FiGlobe size={16} />
              </span>
              <span className="w-9 h-9 rounded-full border border-[#c2c7cf] flex items-center justify-center text-[#42474e] hover:text-[#624000] hover:border-[#624000] transition-soft">
                <FiAtSign size={16} />
              </span>
              <span className="w-9 h-9 rounded-full border border-[#c2c7cf] flex items-center justify-center text-[#42474e] hover:text-[#624000] hover:border-[#624000] transition-soft">
                <FiCamera size={16} />
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1a1c19] mb-5">
              Collections
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/products?ordering=-created_at" className="text-[#42474e] hover:text-[#624000] transition-soft">New Arrivals</Link></li>
              <li><Link to="/products?search=furniture" className="text-[#42474e] hover:text-[#624000] transition-soft">Furniture</Link></li>
              <li><Link to="/products?search=bedding" className="text-[#42474e] hover:text-[#624000] transition-soft">Bedding & Linens</Link></li>
              <li><Link to="/products?search=journal" className="text-[#42474e] hover:text-[#624000] transition-soft">The Journal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1a1c19] mb-5">
              Service
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/products" className="text-[#42474e] hover:text-[#624000] transition-soft">Bespoke Design</Link></li>
              <li><Link to="/products" className="text-[#42474e] hover:text-[#624000] transition-soft">Sustainability</Link></li>
              <li><Link to="/checkout" className="text-[#42474e] hover:text-[#624000] transition-soft">Shipping & Returns</Link></li>
              <li><Link to="/profile" className="text-[#42474e] hover:text-[#624000] transition-soft">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1a1c19] mb-5">
              Join Our World
            </h4>
            <p className="text-xs text-[#42474e] mb-4">
              Early access to new drops and editorial inspiration.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email address"
                className="bg-white border border-[#c2c7cf]/40 py-3 px-4 text-xs flex-1 rounded-l-lg outline-none focus:ring-1 focus:ring-[#624000]"
              />
              <button className="bg-[#624000] text-white text-[10px] font-bold px-6 rounded-r-lg hover:bg-[#4e3200] transition-colors">
                JOIN
              </button>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-[#c2c7cf]/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] tracking-widest text-[#42474e] uppercase font-bold">
            © {new Date().getFullYear()} Lumiere Enfance. Crafted for the Modern Nursery.
          </p>
          <div className="flex gap-6 text-[10px] tracking-widest text-[#42474e] uppercase font-bold">
            <Link to="/profile" className="hover:text-[#624000] transition-colors">Privacy Policy</Link>
            <Link to="/profile" className="hover:text-[#624000] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
