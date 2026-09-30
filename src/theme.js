import { useStore } from './store';

export const FONT = {
  display: 'LilitaOne_400Regular',
  body: 'Nunito_600SemiBold',
  bold: 'Nunito_800ExtraBold',
};

// Card-fan rainbow from the box art
export const FAN = ['#E94F37', '#F79B2E', '#FFD23F', '#57B947', '#2F9BE0', '#8E5BC9'];

const common = {
  cream: '#FFF6E3',
  ink: '#1B2B3A',
  inkSoft: '#6B6A63',
  yellow: '#FFD23F',
  good: '#2E9E4F',
  bad: '#D23A2A',
  overlay: 'rgba(10,20,35,0.55)',
};

export const THEMES = {
  classic: {
    ...common,
    name: 'Flip 7',
    bgTop: '#46C3CB',
    bgBottom: '#23909A',
    shade: '#17707A', // dark outline / 3D shadow colour
    accent: '#E94F37',
    accentShade: '#B93A27',
    chip: 'rgba(255,255,255,0.22)',
    statusBar: 'light',
  },
  vengeance: {
    ...common,
    name: 'With a Vengeance',
    bgTop: '#2C55B5',
    bgBottom: '#13296A',
    shade: '#0B1A47',
    accent: '#E0402F',
    accentShade: '#A82C1F',
    chip: 'rgba(255,255,255,0.18)',
    statusBar: 'light',
  },
};

export const useTheme = () => {
  const { state } = useStore();
  return THEMES[state.edition] || THEMES.classic;
};

export const medalColor = (i) => ['#FFD23F', '#C9D2DC', '#E0975A'][i] || null;
