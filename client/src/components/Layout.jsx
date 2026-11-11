import React, { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ChevronDown,
  Globe,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Mail,
  MapPin,
  Phone,
  ArrowUp,
  Heart,
  ArrowRight,
} from "lucide-react";
import { useSite } from "../App.jsx";
export default function Layout() {
  const { site, theme, setTheme, lang, setLang } = useSite();
  const { settings, menus } = site;
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const loc = useLocation(),
    navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    if (
      loc.pathname !== "/" &&
      loc.pathname !== "/contact" &&
      loc.pathname !== "/search" &&
      loc.pathname !== "/blog"
    )
      document.title =
        "CSSR.IN | " + loc.pathname.split("/").pop().replaceAll("-", " ");
  }, [loc.pathname]);
  useEffect(() => {
    if (loc.pathname === "/") apiVisit();
  }, [loc.pathname]);
  function apiVisit() {
    import("../api.js")
      .then(({ api }) => api("/public/visit", { method: "POST", body: {} }))
      .catch(() => {});
  }
  const submit = (e) => {
    e.preventDefault();
    if (query.trim()) navigate("/search?q=" + encodeURIComponent(query.trim()));
  };
  return (
    <div className="site-shell">
      <div className="topbar">
        <div className="container-xl d-flex justify-content-between align-items-center gap-2">
          <div className="small truncate">
            <span className="me-2">✝</span> Congregation of the Most Holy
            Redeemer (CSSR) <span className="mx-2 opacity-50">|</span>{" "}
            Redemptorists Bangalore Province
          </div>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <Globe size={14} />
            <select
              className="top-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Language"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>
            <button
              className="icon-btn top-icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <form className="top-search" onSubmit={submit}>
              <input
                aria-label="Search site"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
              />
              <button title="Search">
                <Search size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="container-xl d-flex align-items-center justify-content-between">
          <Link className="brand" to="/">
            <img
              src={
                settings.logoUrl || "/assets/images/cssr-official-emblem.png"
              }
              alt="CSSR logo"
            />
            <span>
              <strong>{settings.brandName || "CSSR.IN"}</strong>
              <small>
                {settings.tagline || "Redemptorists Bangalore Province"}
              </small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {menus
              .filter((m) => m.label !== "Contact")
              .map((m) => (
                <div key={m.id} className="nav-dropdown">
                  <NavLink
                    to={m.href}
                    className={({ isActive }) =>
                      "nav-link-main " + (isActive ? "current" : "")
                    }
                  >
                    {m.label}
                    {m.children?.length > 0 && <ChevronDown size={13} />}
                  </NavLink>
                  {m.children?.length > 0 && (
                    <div className="nav-popover">
                      {m.children.map((ch) => (
                        <Link to={ch.href} key={ch.id}>
                          {ch.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </nav>
          <div className="d-flex align-items-center gap-2">
            <Link to="/contact" className="btn btn-teal contact-header">
              Contact <ArrowRight size={15} />
            </Link>
            <button
              className="hamburger"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={25} />
            </button>
          </div>
        </div>
      </header>
      {open && (
        <>
          <button
            className="mobile-overlay"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          ></button>
          <aside className="mobile-drawer">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Menu</h5>
              <button className="icon-btn" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            {menus.map((m) => (
              <details key={m.id}>
                <summary>
                  <Link to={m.href}>{m.label}</Link>
                  {m.children?.length > 0 && <ChevronDown size={16} />}
                </summary>
                {m.children?.map((ch) => (
                  <Link className="mobile-sub" key={ch.id} to={ch.href}>
                    {ch.label}
                  </Link>
                ))}
              </details>
            ))}
          </aside>
        </>
      )}
      <Outlet />
      <footer className="footer-site">
        <div className="container-xl">
          <div className="footer-main row g-4">
            <div className="col-12 col-md-5 col-lg-4">
              <div className="footer-brand">
                <span className="footer-brand-name">
                  {settings.brandName || "CSSR.IN"}
                </span>
                <span>Redemptorists Bangalore Province</span>
              </div>
              <p className="footer-about">
                {settings.footerText ||
                  "A community of faith. A mission of hope."}
              </p>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <h6>Quick links</h6>
              <nav className="footer-link-list" aria-label="Footer quick links">
                <Link to="/about">About</Link>
                <Link to="/parish">Parish</Link>
                <Link to="/communities">Communities</Link>
                <Link to="/join-us">Join Us</Link>
              </nav>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <h6>Resources</h6>
              <nav className="footer-link-list" aria-label="Footer resources">
                <Link to="/prayer">Prayer</Link>
                <Link to="/saints">Saints &amp; Blesseds</Link>
                <Link to="/blog">Blog &amp; News</Link>
                <Link to="/donation">Donation</Link>
              </nav>
            </div>
            <div className="col-12 col-md-12 col-lg-4">
              <h6>Get in touch</h6>
              <div className="footer-contact-info">
                <p>
                  <MapPin size={17} aria-hidden="true" />
                  {settings.address || "Bengaluru, Karnataka, India"}
                </p>
                {settings.email && (
                  <p>
                    <Mail size={17} aria-hidden="true" />
                    <a href={"mailto:" + settings.email}>{settings.email}</a>
                  </p>
                )}
                {settings.phone && (
                  <p>
                    <Phone size={17} aria-hidden="true" />
                    <a href={"tel:" + settings.phone}>{settings.phone}</a>
                  </p>
                )}
              </div>
              <Link
                className="btn btn-outline-light btn-sm footer-contact-btn"
                to="/contact"
              >
                Contact us <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copyright">
              © {new Date().getFullYear()} CSSR.IN. Redemptorists Bangalore
              Province.
            </div>
            <nav
              className="footer-bottom-nav"
              aria-label="Footer secondary links"
            >
              <Link to="/blog">News</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/admin/login">Admin</Link>
              <button
                type="button"
                className="footer-top-btn"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <ArrowUp size={14} /> Back to top
              </button>
            </nav>
            <div className="footer-developer">
              Developed &amp; maintain by{" "}
              <a
                href="https://shestrong.in"
                target="_blank"
                rel="noopener noreferrer"
              >
                SheStrong Technology Services
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


