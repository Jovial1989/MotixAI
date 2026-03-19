import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link href="/" className="nav-logo">Motixi</Link>
        <p className="footer-copy">© 2026 Motixi. All rights reserved.</p>
        <div className="footer-links">
          <Link href="/product" className="footer-link">Product</Link>
          <Link href="/about" className="footer-link">About</Link>
          <Link href="/contact" className="footer-link">Contact</Link>
          <a href="mailto:petrov.cpay@gmail.com" className="footer-link">Email</a>
        </div>
      </div>
    </footer>
  );
}
