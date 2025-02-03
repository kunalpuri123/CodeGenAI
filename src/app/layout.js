// layout.jsx
export default function MainLayout({ children }) {
    return (
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>CodegenAI</title>
        </head>
        <body>
          <header>
          </header>
          <main>{children}</main>
          <footer>
          </footer>
        </body>
      </html>
    );
  }
  