// Ambient declaration so global side-effect CSS imports (e.g. `import "./globals.css"`)
// type-check under "moduleResolution": "bundler". CSS Modules (*.module.css) keep
// their own, more-specific declarations provided by Next.
declare module "*.css";
