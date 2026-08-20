import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wisdom House | Academic Management Portal",
  description: "A premium academic management system for students, teachers, and administrators at Wisdom House Education.",
  keywords: "school management, student portal, teacher dashboard, education system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (typeof window === 'undefined') return;
                  var props = ['fetch', 'Headers', 'Request', 'Response', 'localStorage', 'sessionStorage'];
                  
                  function patchProp(obj, prop) {
                    var proto = obj;
                    while (proto) {
                      try {
                        var desc = Object.getOwnPropertyDescriptor(proto, prop);
                        if (desc && desc.get && !desc.set) {
                          (function(p, d, propertyName) {
                            var originalGetter = d.get;
                            Object.defineProperty(p, propertyName, {
                              get: function() {
                                if (this && this['__' + propertyName] !== undefined) {
                                  return this['__' + propertyName];
                                }
                                try {
                                  return originalGetter.call(this);
                                } catch (e) {
                                  return this ? this['__' + propertyName] : undefined;
                                }
                              },
                              set: function(val) {
                                if (this) {
                                  try {
                                    Object.defineProperty(this, propertyName, {
                                      value: val,
                                      writable: true,
                                      configurable: true,
                                      enumerable: true
                                    });
                                  } catch (err) {
                                    this['__' + propertyName] = val;
                                  }
                                }
                              },
                              configurable: true,
                              enumerable: true
                            });
                          })(proto, desc, prop);
                        }
                      } catch (err) {}
                      try {
                        proto = Object.getPrototypeOf(proto);
                      } catch (err) {
                        break;
                      }
                    }
                  }

                  var roots = [
                    window,
                    typeof globalThis !== 'undefined' ? globalThis : null,
                    typeof self !== 'undefined' ? self : null,
                    typeof Window !== 'undefined' ? Window.prototype : null
                  ];

                  for (var r = 0; r < roots.length; r++) {
                    if (!roots[r]) continue;
                    for (var i = 0; i < props.length; i++) {
                      patchProp(roots[r], props[i]);
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
