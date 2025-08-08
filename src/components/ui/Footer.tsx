export default function Footer() {
  return (
    <footer className="border-t border-medieval-gold/20 bg-background-card/30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="text-center space-y-2">
          <p className="text-gray-400 font-pixel-body text-xs uppercase tracking-wide">
            © 2025 Quest Forge. All rights reserved.
          </p>
          <p className="text-gray-500 font-pixel-body text-xs uppercase tracking-wide">
            Author: <a href="https://www.javisan.dev" target="_blank" rel="noopener noreferrer" className="text-medieval-gold hover:text-medieval-darkgold transition-colors">www.javisan.dev</a>
          </p>
        </div>
      </div>
    </footer>
  )
}