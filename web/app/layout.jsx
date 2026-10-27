import './globals.css';

export const metadata = {
  title: '改命 · 创业墓地 — 你能救活一家死掉的公司吗'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0
};

export default function RootLayout({ children }){
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
