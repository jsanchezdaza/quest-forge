export default function WalkingAvatar() {
  return (
    <div className="animate-bounce">
      <svg 
        width="64" 
        height="64" 
        viewBox="0 0 16 16" 
        className="pixelated"
        style={{ imageRendering: 'pixelated' }}
      >
        <g className="animate-pulse">
          {/* Hat */}
          <rect x="6" y="2" width="4" height="1" fill="#4a0e4e" />
          <rect x="5" y="3" width="6" height="1" fill="#4a0e4e" />
          <rect x="4" y="4" width="8" height="1" fill="#4a0e4e" />
          <rect x="7" y="1" width="2" height="1" fill="#8b4513" />
          
          {/* Face */}
          <rect x="6" y="5" width="4" height="3" fill="#fdbcb4" />
          
          {/* Eyes */}
          <rect x="6" y="5" width="1" height="1" fill="#000" />
          <rect x="9" y="5" width="1" height="1" fill="#000" />
          
          {/* Beard */}
          <rect x="5" y="7" width="6" height="2" fill="#d3d3d3" />
          <rect x="6" y="9" width="4" height="1" fill="#d3d3d3" />
          
          {/* Body/Robe */}
          <rect x="5" y="8" width="6" height="6" fill="#191970" />
          <rect x="4" y="9" width="8" height="4" fill="#191970" />
          
          {/* Staff */}
          <rect x="2" y="6" width="1" height="8" fill="#8b4513" />
          <rect x="1" y="6" width="3" height="1" fill="#ffd700" />
          
          {/* Arms */}
          <rect x="3" y="9" width="2" height="3" fill="#fdbcb4" className="animate-ping" />
          <rect x="11" y="10" width="2" height="2" fill="#fdbcb4" />
          
          {/* Legs (walking animation) */}
          <g className="animate-pulse">
            <rect x="6" y="14" width="2" height="2" fill="#8b4513" />
            <rect x="8" y="14" width="2" height="2" fill="#8b4513" />
          </g>
        </g>
        
        {/* Sparkles around mage */}
        <g className="animate-ping">
          <rect x="1" y="3" width="1" height="1" fill="#ffd700" />
          <rect x="14" y="5" width="1" height="1" fill="#ffd700" />
          <rect x="13" y="12" width="1" height="1" fill="#ffd700" />
          <rect x="2" y="13" width="1" height="1" fill="#ffd700" />
        </g>
      </svg>
    </div>
  )
}