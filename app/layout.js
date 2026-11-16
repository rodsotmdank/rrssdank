import './globals.css';

export const metadata = { title: 'Calendario Campaña DANK' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
