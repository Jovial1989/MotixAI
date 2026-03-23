'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';

export default function Footer() {
  const t = useT();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link href="/" className="nav-logo">Motixi</Link>
        <p className="footer-copy">{t.common.copyrightNotice}</p>
        <div className="footer-links">
          <Link href="/product" className="footer-link">{t.footer.product}</Link>
          <Link href="/about" className="footer-link">{t.footer.about}</Link>
          <Link href="/contact" className="footer-link">{t.footer.contact}</Link>
          <a href="mailto:petrov.cpay@gmail.com" className="footer-link">{t.footer.email}</a>
        </div>
      </div>
    </footer>
  );
}
