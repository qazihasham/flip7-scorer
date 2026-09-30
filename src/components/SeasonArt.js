import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Ellipse,
  Path,
  G,
  Line,
} from 'react-native-svg';

export const SEASONS = {
  frosty: { label: 'Frosty Holidays', emoji: '❄️', months: 'Dec–Jan', sky: ['#22386B', '#8FB3E6'] },
  love: { label: 'Love and Blossoms', emoji: '💘', months: 'Feb–Mar', sky: ['#FFB3C7', '#FFE3EC'] },
  spring: { label: 'Spring Bloom', emoji: '🌸', months: 'Apr–May', sky: ['#BDEBFF', '#E9FBE0'] },
  summer: { label: 'Sunny Streak', emoji: '☀️', months: 'Jun–Jul', sky: ['#4FC3F7', '#FFE29A'] },
  fireworks: { label: 'Firecracker Summer', emoji: '🎆', months: 'Aug–Sep', sky: ['#1B1F4B', '#8A3F7A'] },
  spooky: { label: 'Spooky Harvest', emoji: '🎃', months: 'Oct–Nov', sky: ['#2B1650', '#D9691E'] },
};

const Heart = ({ x, y, s = 1, c = '#E8456F', o = 1 }) => (
  <Path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0,6 C-14,-4 -8,-14 0,-7 C8,-14 14,-4 0,6 Z"
    fill={c}
    opacity={o}
  />
);

const Flower = ({ x, y, r = 7, c = '#FF8FB8' }) => (
  <G>
    {[0, 72, 144, 216, 288].map((a) => (
      <Circle
        key={a}
        cx={x + Math.cos((a * Math.PI) / 180) * r}
        cy={y + Math.sin((a * Math.PI) / 180) * r}
        r={r * 0.75}
        fill={c}
      />
    ))}
    <Circle cx={x} cy={y} r={r * 0.5} fill="#FFD23F" />
  </G>
);

const Leaf = ({ x, y, s = 1, c = '#D9480F', rot = 0 }) => (
  <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <Path
      d="M0,-14 L4,-8 L11,-10 L8,-3 L14,1 L6,3 L7,11 L0,7 L-7,11 L-6,3 L-14,1 L-8,-3 L-11,-10 L-4,-8 Z"
      fill={c}
    />
    <Line x1="0" y1="7" x2="0" y2="15" stroke="#6B2E0A" strokeWidth="2" />
  </G>
);

const Flake = ({ x, y, s = 1 }) => (
  <G transform={`translate(${x} ${y}) scale(${s})`} stroke="#fff" strokeWidth="2" strokeLinecap="round">
    <Line x1="-8" y1="0" x2="8" y2="0" />
    <Line x1="-4" y1="-7" x2="4" y2="7" />
    <Line x1="4" y1="-7" x2="-4" y2="7" />
  </G>
);

function Scene({ theme }) {
  switch (theme) {
    case 'spring':
      return (
        <G>
          <Circle cx="300" cy="28" r="16" fill="#FFF3A0" />
          <Ellipse cx="80" cy="30" rx="30" ry="10" fill="#fff" opacity="0.8" />
          <Ellipse cx="110" cy="24" rx="20" ry="9" fill="#fff" opacity="0.8" />
          <Path d="M0,100 Q90,62 180,92 T360,84 L360,130 L0,130 Z" fill="#7CCB6B" />
          <Path d="M0,115 Q100,88 200,110 T360,104 L360,130 L0,130 Z" fill="#5DB85A" />
          {/* flowers stand on the front hill: [x, head y, stem length] */}
          {[
            [40, 94, 12, '#FF8FB8', 7],
            [120, 88, 12, '#FFD23F', 6],
            [200, 98, 12, '#B28DFF', 7],
            [290, 107, 12, '#FF8FB8', 7],
            [335, 101, 12, '#FFD23F', 6],
          ].map(([x, y, l, c, r]) => (
            <G key={x}>
              <Line x1={x} y1={y} x2={x} y2={y + l} stroke="#3E8E3A" strokeWidth="2.5" />
              <Flower x={x} y={y} c={c} r={r} />
            </G>
          ))}
          <Path d="M20,10 q6,4 12,0 q-4,8 -12,0 Z" fill="#FFB3CC" />
          <Path d="M240,14 q6,4 12,0 q-4,8 -12,0 Z" fill="#FFB3CC" />
        </G>
      );
    case 'summer':
      return (
        <G>
          <Circle cx="290" cy="34" r="22" fill="#FFD23F" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <Line
              key={a}
              x1={290 + Math.cos((a * Math.PI) / 180) * 28}
              y1={34 + Math.sin((a * Math.PI) / 180) * 28}
              x2={290 + Math.cos((a * Math.PI) / 180) * 38}
              y2={34 + Math.sin((a * Math.PI) / 180) * 38}
              stroke="#FFD23F"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}
          <Path d="M0,88 Q30,78 60,88 T120,88 T180,88 T240,88 T300,88 T360,88 L360,130 L0,130 Z" fill="#1E9BD7" />
          {/* boat sits in the water, between the two wave layers */}
          <G transform="translate(0 26)">
            <Line x1="61" y1="44" x2="61" y2="62" stroke="#6B4A2A" strokeWidth="2" />
            <Path d="M63,46 l0,14 l12,0 Z" fill="#fff" />
            <Path d="M59,48 l0,12 l-9,0 Z" fill="#fff" />
            <Path d="M44,62 h34 l-5,8 h-24 Z" fill="#E94F37" />
          </G>
          <Path d="M0,100 Q30,92 60,100 T120,100 T180,100 T240,100 T300,100 T360,100 L360,130 L0,130 Z" fill="#0D7FB8" />
        </G>
      );
    case 'love':
      return (
        <G>
          <Path d="M0,104 Q90,84 180,100 T360,94 L360,130 L0,130 Z" fill="#F7A8C0" />
          <Path d="M0,118 Q100,102 200,116 T360,110 L360,130 L0,130 Z" fill="#E8789C" />
          <Path d="M300,110 Q290,70 330,40 M312,84 Q335,78 345,60" stroke="#6B3A2A" strokeWidth="5" fill="none" strokeLinecap="round" />
          <Flower x={330} y={40} c="#FF8FB8" r={8} />
          <Flower x={345} y={58} c="#FFC2D6" r={7} />
          <Flower x={312} y={70} c="#FF8FB8" r={7} />
          <Heart x={60} y={40} s={2.2} />
          <Heart x={130} y={64} s={1.4} c="#FF6F91" />
          <Heart x={190} y={30} s={1.8} c="#FF3D6E" />
          <Heart x={240} y={70} s={1.1} c="#FF6F91" o={0.8} />
          <Heart x={30} y={86} s={1.2} c="#FF3D6E" o={0.8} />
          <Heart x={250} y={22} s={0.9} c="#fff" o={0.9} />
        </G>
      );
    case 'fireworks':
      return (
        <G>
          <Path d="M0,108 L30,92 L50,100 L80,86 L110,102 L140,94 L170,108 L360,108 L360,130 L0,130 Z" fill="#1C2452" />
          {[[70, 44, '#FF5A5F'], [180, 30, '#FFD23F'], [285, 52, '#5BC0FF']].map(([cx, cy, c], k) => (
            <G key={k}>
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * 30 * Math.PI) / 180;
                return (
                  <Line
                    key={i}
                    x1={cx + Math.cos(a) * 6}
                    y1={cy + Math.sin(a) * 6}
                    x2={cx + Math.cos(a) * 22}
                    y2={cy + Math.sin(a) * 22}
                    stroke={c}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })}
              <Circle cx={cx} cy={cy} r="4" fill="#fff" />
            </G>
          ))}
          <Circle cx="125" cy="70" r="2.5" fill="#fff" />
          <Circle cx="235" cy="76" r="2" fill="#fff" />
          <Circle cx="330" cy="22" r="2" fill="#fff" />
        </G>
      );
    case 'spooky':
      return (
        <G>
          <Circle cx="290" cy="36" r="22" fill="#FFE9A8" />
          <Path d="M0,106 Q90,90 180,104 T360,98 L360,130 L0,130 Z" fill="#231433" />
          <Path d="M250,112 l0,-38 M250,88 l-14,-12 M250,82 l14,-14" stroke="#120A1C" strokeWidth="5" strokeLinecap="round" />
          <G transform="translate(70 86)">
            <Ellipse cx="0" cy="0" rx="22" ry="17" fill="#F27C1B" />
            <Ellipse cx="-11" cy="0" rx="10" ry="16" fill="#E2650A" opacity="0.6" />
            <Path d="M-2,-17 q2,-8 8,-8" stroke="#3E7D32" strokeWidth="4" fill="none" strokeLinecap="round" />
            <Path d="M-11,-4 l6,-6 l4,8 Z M11,-4 l-6,-6 l-4,8 Z" fill="#2A1433" />
            <Path d="M-10,6 l4,5 l3,-4 l3,5 l3,-5 l4,4 l3,-5" stroke="#2A1433" strokeWidth="3" fill="none" />
          </G>
          {[[130, 30, 1], [200, 50, 0.8], [40, 40, 0.9]].map(([x, y, s], i) => (
            <Path
              key={i}
              transform={`translate(${x} ${y}) scale(${s})`}
              d="M0,0 q-10,-8 -18,0 q6,1 8,6 q4,-3 10,-6 q6,3 10,6 q2,-5 8,-6 q-8,-8 -18,0 Z"
              fill="#1A0F26"
            />
          ))}
        </G>
      );
    default:
      return (
        <G>
          <Path d="M0,100 Q90,78 180,98 T360,90 L360,130 L0,130 Z" fill="#F4F7FF" />
          <Path d="M0,116 Q100,98 200,114 T360,108 L360,130 L0,130 Z" fill="#DCE6F7" />
          <Path d="M70,100 l22,-46 l22,46 Z" fill="#1F7A4D" />
          <Path d="M76,78 l16,-32 l16,32 Z" fill="#2E9E62" />
          <Path d="M92,44 l3,7 l7,1 l-5,5 l1,7 l-6,-3 l-6,3 l1,-7 l-5,-5 l7,-1 Z" fill="#FFD23F" />
          {[[80, 92, '#E94F37'], [100, 80, '#FFD23F'], [90, 66, '#5BC0FF']].map(([x, y, c], i) => (
            <Circle key={i} cx={x} cy={y} r="3" fill={c} />
          ))}
          <Rect x="170" y="96" width="22" height="18" fill="#E94F37" />
          <Rect x="179" y="96" width="4" height="18" fill="#FFD23F" />
          <Path d="M181,96 q-10,-10 -14,-2 q4,6 14,2 q10,4 14,-2 q-4,-8 -14,2 Z" fill="#FFD23F" />
          <Rect x="250" y="98" width="18" height="16" fill="#2F9BE0" />
          <Rect x="257" y="98" width="4" height="16" fill="#fff" />
          {[[30, 20, 1], [110, 40, 0.8], [170, 18, 1.1], [230, 48, 0.8], [340, 50, 0.9], [300, 20, 0.7]].map(
            ([x, y, s], i) => (
              <Flake key={i} x={x} y={y} s={s} />
            )
          )}
        </G>
      );
  }
}

// Memoised: the SVG only re-renders when the season or size changes.
export default React.memo(SeasonArt);

function SeasonArt({ theme = 'spring', height = 120 }) {
  const c = (SEASONS[theme] || SEASONS.spring).sky;
  return (
    <Svg width="100%" height={height} viewBox="0 0 360 130" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={`sky-${theme}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c[0]} />
          <Stop offset="1" stopColor={c[1]} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="360" height="130" fill={`url(#sky-${theme})`} />
      <Scene theme={theme} />
    </Svg>
  );
}

