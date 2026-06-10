import './globals.css'

export const metadata = {
    title: 'Laser Refractometer',
    description: 'A tool to measure fluid density and sugar content using an optical laser.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased">{children}</body>
        </html>
    )
}