import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
// @ts-ignore
import gifshot from 'gifshot';
import ShaderRenderer from './components/ShaderRenderer';
import { Button as M3Button } from './components/Button/Button';
import { Card as M3Card, CardHeader as M3CardHeader, CardContent as M3CardContent, CardActions as M3CardActions, CardMedia as M3CardMedia } from './components/Card/Card';
import { Chip as M3Chip } from './components/Chips/Chip';
import { FAB as M3FAB } from './components/Button/FAB';
import { Dialog as M3Dialog } from './components/Dialog/Dialog';
import { Badge as M3Badge } from './components/Badge/Badge';
import { BottomSheet as M3BottomSheet, SideSheet as M3SideSheet } from './components/Sheets/Sheet';
import { Avatar as M3Avatar } from './components/Avatar/Avatar';
import { LinearProgress as M3LinearProgress, CircularProgress as M3CircularProgress } from './components/Progress/Progress';
import { Icon as M3Icon } from './components/Icon/Icon';
import { 
  Volume2, 
  Brain, 
  MessageSquare, 
  Sparkles, 
  Play, 
  Pause, 
  Activity, 
  Layers, 
  Download, 
  MousePointer2, 
  Hand, 
  Maximize2, 
  Grid, 
  Sun, 
  Moon, 
  CheckCircle2, 
  SlidersHorizontal, 
  Upload, 
  Image as ImageIcon, 
  Move, 
  RotateCcw,
  Sparkle,
  X,
  Focus,
  Plus,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Share2,
  Link2,
  ExternalLink,
  Save,
  FolderHeart,
  Square,
  Check,
  Pencil
} from 'lucide-react';

interface LinkedFigmaFile {
  id: string;
  name: string;
  url: string;
}

interface SavedCombination {
  id: string;
  name: string;
  figmaFileId: string;
  components: ComponentInstance[];
  activeBackdrop: string;
  liveFrameUrl: string;
  uploadedFrameUrl: string | null;
  uploadedFrameName: string | null;
  backdropOpacity: number;
  backdropScale: number;
  isBackdropVisible: boolean;
  canvasBgMode: 'dark' | 'light';
  globalColorLibrary: string;
  activeState: number;
}

interface M3StateMeta {
  id: number;
  label: string;
  icon: any;
  defaultMid: string;
  defaultEnd: string;
  badgeText: string;
  description: string;
}

const OFFICIAL_STATES: M3StateMeta[] = [
  { 
    id: 0, 
    label: 'Neutral Default', 
    icon: Moon,
    defaultMid: '#121212',
    defaultEnd: '#1A1A1A',
    badgeText: 'Sleeping Mode',
    description: 'Pristine resting energy state'
  },
  { 
    id: 2, 
    label: 'Listening', 
    icon: Volume2,
    defaultMid: '#4285F4',
    defaultEnd: '#24D6FF',
    badgeText: 'Live Audio Stream',
    description: 'Dynamic reactive fluid listening state'
  },
  { 
    id: 3, 
    label: 'Responding', 
    icon: MessageSquare,
    defaultMid: '#FF1F7E',
    defaultEnd: '#4285F4',
    badgeText: 'Modulating Feedback',
    description: 'Vocal production waveforms & synthetic voice loops'
  },
  { 
    id: 4, 
    label: 'Processing', 
    icon: Brain,
    defaultMid: '#9C27B0',
    defaultEnd: '#24D6FF',
    badgeText: 'Thinking Mode',
    description: 'Active core compute thread simulation'
  },
  { 
    id: 5, 
    label: 'Anticipating', 
    icon: Sparkles,
    defaultMid: '#3F51B5',
    defaultEnd: '#FF1F7E',
    badgeText: 'Heuristic Model',
    description: 'Predictive neural model anticipating queries'
  }
];

// Utility to cleanly interpolate hex colors for fluid/energy state transitions
const interpolateHexColors = (colorA: string, colorB: string, fraction: number): string => {
  if (!colorA || !colorB) return colorA || colorB || '#121212';
  try {
    const rA = parseInt(colorA.slice(1, 3), 16);
    const gA = parseInt(colorA.slice(3, 5), 16);
    const bA = parseInt(colorA.slice(5, 7), 16);
    
    const rB = parseInt(colorB.slice(1, 3), 16);
    const gB = parseInt(colorB.slice(3, 5), 16);
    const bB = parseInt(colorB.slice(5, 7), 16);
    
    const r = Math.round(rA + (rB - rA) * fraction);
    const g = Math.round(gA + (gB - gA) * fraction);
    const b = Math.round(bA + (bB - bA) * fraction);
    
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');
    
    return `#${rHex}${gHex}${bHex}`;
  } catch (e) {
    return colorB;
  }
};

interface ComponentInstance {
  id: string;
  name: string;
  type: 'card' | 'button' | 'chip' | 'fab' | 'dialog' | 'badge' | 'sheets' | 'avatar' | 'progress' | 'image';
  width: number;
  height: number;
  borderRadius: number;
  containerType: 'surface' | 'primary' | 'secondary';
  title: string;
  subtitle: string;
  text: string;
  x: number;
  y: number;
  activeIcon: string;
  sizePreset: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
  fontStyleTitle: string;
  fontStyleText: string;
  colorLibrary: string;
  configShowIcon: boolean;
  configShowTitle: boolean;
  configShowSubtitle: boolean;
  configShowDescription: boolean;
  configShowActions: boolean;
  blurredEdges?: boolean;
  variant?: string;
  activeState?: number;
  previousState?: number;
  transitionVal?: number;
  sizeMode?: 'fixed' | 'auto';
  heightMode?: 'fixed' | 'auto';
  iconBgColor?: string;
  iconImage?: string;
  avatarType?: 'icon' | 'initials' | 'image';
  avatarInitials?: string;
  compIntensity?: number;  // per-component intensity override (0.1 - 2.0)
  layout?: 'vertical' | 'horizontal';
}

const M3_COLOR_LIBRARIES: Record<string, {
  name: string;
  colors: Record<'light' | 'dark', Record<'primary' | 'secondary' | 'surface', { bg: string; text: string; subtext: string; label: string }>>
}> = {
  'baseline-blue': {
    name: 'Material Baseline Blue',
    colors: {
      light: {
        primary: { bg: '#0061A4', text: '#FFFFFF', subtext: '#D1E4FF', label: 'Primary blue' },
        secondary: { bg: '#D7E3F7', text: '#101C2B', subtext: '#3B4858', label: 'Secondary container' },
        surface: { bg: '#F8FAFD', text: '#1A1C1E', subtext: '#44474E', label: 'Surface container' }
      },
      dark: {
        primary: { bg: '#A4C9FE', text: '#003258', subtext: '#D1E4FF', label: 'Primary dark blue' },
        secondary: { bg: '#3C4858', text: '#D7E3F7', subtext: '#BCC7DB', label: 'Secondary dark container' },
        surface: { bg: '#111318', text: '#E2E2E9', subtext: '#C4C6CF', label: 'Surface dark container' }
      }
    }
  },
  'default-purple': {
    name: 'Material Baseline Purple',
    colors: {
      light: {
        primary: { bg: '#6750A4', text: '#FFFFFF', subtext: '#EADDFF', label: 'Primary filled purple' },
        secondary: { bg: '#E8DEF8', text: '#1D192B', subtext: '#49454F', label: 'Secondary container' },
        surface: { bg: '#FEF7FF', text: '#1D1B20', subtext: '#49454F', label: 'Surface container' }
      },
      dark: {
        primary: { bg: '#D0BCFF', text: '#381E72', subtext: '#381E72', label: 'Primary dark purple' },
        secondary: { bg: '#332D41', text: '#E8DEF8', subtext: '#CCC2DC', label: 'Secondary dark container' },
        surface: { bg: '#141218', text: '#E6E1E5', subtext: '#938F99', label: 'Surface dark container' }
      }
    }
  },
  'terra-cotta': {
    name: 'Material Terracotta Rose',
    colors: {
      light: {
        primary: { bg: '#9C423B', text: '#FFFFFF', subtext: '#FFDAD6', label: 'Primary Warm Red' },
        secondary: { bg: '#FFDAD6', text: '#410002', subtext: '#5D1110', label: 'Secondary Clay' },
        surface: { bg: '#FFF8F7', text: '#231A19', subtext: '#534341', label: 'Warm Earth Surface' }
      },
      dark: {
        primary: { bg: '#FFB4AB', text: '#5D1110', subtext: '#80100D', label: 'Dark Clay Red' },
        secondary: { bg: '#5D1110', text: '#FFDAD6', subtext: '#FFB4AB', label: 'Dark Clay Container' },
        surface: { bg: '#1D1514', text: '#EDE0DE', subtext: '#A08C8A', label: 'Dark Earth Surface' }
      }
    }
  },
  'forest-jade': {
    name: 'Material Emerald Forest',
    colors: {
      light: {
        primary: { bg: '#386A20', text: '#FFFFFF', subtext: '#DFE8D8', label: 'Primary Jade' },
        secondary: { bg: '#E8F5E9', text: '#0C140E', subtext: '#1B5E20', label: 'Secondary Lime' },
        surface: { bg: '#F1FBF0', text: '#191E19', subtext: '#434943', label: 'Forest Mint Surface' }
      },
      dark: {
        primary: { bg: '#B2D0AC', text: '#1A330E', subtext: '#1A330E', label: 'Dark Basil Green' },
        secondary: { bg: '#334D2E', text: '#E8F5E9', subtext: '#B2D0AC', label: 'Dark Eco Container' },
        surface: { bg: '#0C140E', text: '#E2E3DD', subtext: '#8E928C', label: 'Dark Moss Surface' }
      }
    }
  },
  'ocean-azure': {
    name: 'Material Ocean Azure',
    colors: {
      light: {
        primary: { bg: '#00658B', text: '#FFFFFF', subtext: '#C9E6FF', label: 'Primary Blue' },
        secondary: { bg: '#C9E6FF', text: '#001E2E', subtext: '#004C6A', label: 'Secondary Lagoon' },
        surface: { bg: '#F7FAFC', text: '#191C1E', subtext: '#41484D', label: 'Soft Slate Surface' }
      },
      dark: {
        primary: { bg: '#80CFFF', text: '#00344A', subtext: '#004C6A', label: 'Dark Ocean Blue' },
        secondary: { bg: '#00354C', text: '#C9E6FF', subtext: '#80CFFF', label: 'Dark Lagoon Container' },
        surface: { bg: '#0A1318', text: '#E2E2E5', subtext: '#8B9197', label: 'Dark Abyssal Surface' }
      }
    }
  },
  'golden-amber': {
    name: 'Material Golden Amber',
    colors: {
      light: {
        primary: { bg: '#765B00', text: '#FFFFFF', subtext: '#FFE082', label: 'Primary Golden Yellow' },
        secondary: { bg: '#FFE082', text: '#241A00', subtext: '#523E00', label: 'Secondary Maize' },
        surface: { bg: '#FFFDF6', text: '#1D1B16', subtext: '#4B473E', label: 'Soft Alabaster Surface' }
      },
      dark: {
        primary: { bg: '#E9C400', text: '#3E3000', subtext: '#523E00', label: 'Dark Marigold' },
        secondary: { bg: '#3D2F00', text: '#FFE082', subtext: '#E9C400', label: 'Dark Maize Container' },
        surface: { bg: '#1C1B12', text: '#E6E2D8', subtext: '#969185', label: 'Dark Amber Surface' }
      }
    }
  },
  'electric-neon': {
    name: 'Material Cyber Violet',
    colors: {
      light: {
        primary: { bg: '#A00078', text: '#FFFFFF', subtext: '#FFD8EC', label: 'Primary Cyber Magenta' },
        secondary: { bg: '#FFD8EC', text: '#3B002A', subtext: '#700053', label: 'Secondary Lavender Rose' },
        surface: { bg: '#FFF8F9', text: '#201A1D', subtext: '#4F4349', label: 'Neon Orchid Surface' }
      },
      dark: {
        primary: { bg: '#FFADE3', text: '#5E0045', subtext: '#7A005B', label: 'Dark Laser Pink' },
        secondary: { bg: '#40002F', text: '#FFD8EC', subtext: '#FFADE3', label: 'Dark Orchid Container' },
        surface: { bg: '#181216', text: '#EBE0E4', subtext: '#9B8E93', label: 'Dark Synthwave Surface' }
      }
    }
  },
  'stormy-graphite': {
    name: 'Material Monochrome Slate',
    colors: {
      light: {
        primary: { bg: '#1A1A1A', text: '#FFFFFF', subtext: '#EBEBEB', label: 'Primary Obsidian Jet' },
        secondary: { bg: '#E5E5E5', text: '#111111', subtext: '#555555', label: 'Secondary Platinum' },
        surface: { bg: '#FAFAFA', text: '#222222', subtext: '#666666', label: 'Minimalist Frost White' }
      },
      dark: {
        primary: { bg: '#FFFFFF', text: '#111111', subtext: '#CDCDCD', label: 'Dark Silver Solid' },
        secondary: { bg: '#2D2D2D', text: '#FFFFFF', subtext: '#8E8E8E', label: 'Dark Platinum Container' },
        surface: { bg: '#121212', text: '#E5E5E5', subtext: '#9A9A9A', label: 'Dark Obsidian Surface' }
      }
    }
  }
};

const M3_FONT_STYLES: Record<string, { name: string; class: string }> = {
  displayLarge: { name: 'Display Large (57px)', class: 'text-3xl md:text-[38px] lg:text-[44px] font-normal tracking-[-0.04em] leading-none font-sans' },
  headlineMedium: { name: 'Headline Medium (28px)', class: 'text-xl md:text-[24px] lg:text-[28px] font-semibold tracking-normal leading-tight font-sans' },
  headlineSmall: { name: 'Headline Small (24px)', class: 'text-[24px] font-semibold tracking-normal leading-tight font-sans' },
  titleLarge: { name: 'Title Large (22px)', class: 'text-lg md:text-[20px] font-bold tracking-normal leading-snug font-sans' },
  titleMedium: { name: 'Title Medium (16px)', class: 'text-[16px] font-medium tracking-[0.15px] leading-snug font-sans' },
  titleSmall: { name: 'Title Small (14px)', class: 'text-[14px] font-bold tracking-[0.01em] leading-normal font-sans' },
  bodyLarge: { name: 'Body Large (16px)', class: 'text-[15px] font-normal tracking-[0.02em] leading-relaxed font-sans opacity-95' },
  bodyMedium: { name: 'Body Medium (14px)', class: 'text-[13px] font-normal tracking-[0.01em] leading-relaxed font-sans opacity-85' },
  bodySmall: { name: 'Body Small (12px)', class: 'text-[12px] font-normal tracking-[0.4px] leading-normal font-sans opacity-80' },
  labelLarge: { name: 'Label Large Button (14px)', class: 'text-[13px] font-bold uppercase tracking-wider font-sans' },
  labelMedium: { name: 'Label Medium (12px)', class: 'text-[11.5px] font-medium tracking-[0.02em] font-sans' },
  subtextMicro: { name: 'Subtext Micro (10px)', class: 'text-[9.5px] font-sans tracking-wider opacity-80' },
};

const M3_SIZE_PRESETS = {
  button: {
    xsmall: { width: 90, height: 26, borderRadius: 13 },
    small: { width: 120, height: 32, borderRadius: 16 },
    medium: { width: 160, height: 40, borderRadius: 20 },
    large: { width: 220, height: 56, borderRadius: 28 },
    xlarge: { width: 260, height: 64, borderRadius: 32 }
  },
  // Chips: fixed 32px height per M3 spec — no size variants
  chip: { medium: { width: 120, height: 32, borderRadius: 8 } },
  fab: {
    xsmall: { width: 32, height: 32, borderRadius: 10 },
    small: { width: 40, height: 40, borderRadius: 12 },
    medium: { width: 56, height: 56, borderRadius: 16 },
    large: { width: 96, height: 96, borderRadius: 28 },
    xlarge: { width: 120, height: 120, borderRadius: 36 }
  },
  badge: {
    xsmall: { width: 10, height: 10, borderRadius: 5 },
    small: { width: 16, height: 16, borderRadius: 8 },
    medium: { width: 32, height: 16, borderRadius: 8 },
    large: { width: 56, height: 16, borderRadius: 8 },
    xlarge: { width: 72, height: 22, borderRadius: 11 }
  },
  sheets: {
    xsmall: { width: 180, height: 120, borderRadius: 12 },
    small: { width: 240, height: 180, borderRadius: 16 },
    medium: { width: 300, height: 240, borderRadius: 16 },
    large: { width: 360, height: 300, borderRadius: 20 },
    xlarge: { width: 420, height: 360, borderRadius: 24 }
  },
  avatar: {
    xsmall: { width: 24, height: 24, borderRadius: 12 },
    small: { width: 32, height: 32, borderRadius: 16 },
    medium: { width: 44, height: 44, borderRadius: 22 },
    large: { width: 64, height: 64, borderRadius: 32 },
    xlarge: { width: 96, height: 96, borderRadius: 48 }
  },
  progress: {
    xsmall: { width: 160, height: 40, borderRadius: 4 },
    small:  { width: 220, height: 40, borderRadius: 4 },
    medium: { width: 240, height: 48, borderRadius: 4 },
    large:  { width: 300, height: 48, borderRadius: 4 },
    xlarge: { width: 360, height: 56, borderRadius: 4 }
  },
  image: {
    xsmall: { width: 120, height: 80, borderRadius: 8 },
    small:  { width: 200, height: 140, borderRadius: 12 },
    medium: { width: 300, height: 200, borderRadius: 16 },
    large:  { width: 400, height: 280, borderRadius: 20 },
    xlarge: { width: 560, height: 380, borderRadius: 24 }
  },
  card: {
    xsmall: { width: 180, height: 100, borderRadius: 8 },
    small: { width: 240, height: 140, borderRadius: 12 },
    medium: { width: 300, height: 180, borderRadius: 12 },
    large: { width: 360, height: 220, borderRadius: 12 },
    xlarge: { width: 420, height: 260, borderRadius: 16 }
  },
  dialog: {
    xsmall: { width: 240, height: 120, borderRadius: 20 },
    small: { width: 280, height: 160, borderRadius: 28 },
    medium: { width: 320, height: 200, borderRadius: 28 },
    large: { width: 400, height: 260, borderRadius: 28 },
    xlarge: { width: 480, height: 320, borderRadius: 32 }
  }
};

interface InteractiveClick {
  id: string;
  x: number;
  y: number;
  time: string;
  timestamp?: number;
}

export default function App() {
  const [canvasComponents, setCanvasComponents] = useState<ComponentInstance[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dragSelect, setDragSelect] = useState<{startX:number;startY:number;curX:number;curY:number} | null>(null);
  const activeComp = canvasComponents.find(c => c.id === selectedComponentId) as ComponentInstance | undefined;
  const [globalColorLibrary, setGlobalColorLibrary] = useState<string>('baseline-blue');

  // --- FIGMA FILES LINKING & VIEWS ---
  const [linkedFigmaFiles, setLinkedFigmaFiles] = useState<LinkedFigmaFile[]>(() => {
    const stored = localStorage.getItem('m3_linked_figma_files');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 'fig-1', name: 'material_3_fluid_energy_spec.fig', url: 'https://figma.com/file/material_3_fluid_energy_spec' },
      { id: 'fig-2', name: 'm3_cyberpunk_mobile_layouts.fig', url: 'https://figma.com/file/cyberpunk_m3_frames' }
    ];
  });

  const [selectedFigmaFileId, setSelectedFigmaFileId] = useState<string>('none');

  // Load saved configurations
  const [savedCombinations, setSavedCombinations] = useState<SavedCombination[]>(() => {
    const stored = localStorage.getItem('m3_saved_combinations');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    // Starts completely empty, with no unrequested demo files or combinations
    return [];
  });

  const [activeCombinationId, setActiveCombinationId] = useState<string | null>(null);

  // Modal forms management
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sharedImportCombination, setSharedImportCombination] = useState<SavedCombination | null>(null);

  const [isSettingFigmaModalOpen, setIsSettingFigmaModalOpen] = useState(false);
  const [newFigmaName, setNewFigmaName] = useState('');
  const [newFigmaUrl, setNewFigmaUrl] = useState('');

  const [newComboName, setNewComboName] = useState('');
  const [newComboFileId, setNewComboFileId] = useState('fig-1');
  const [isSaveComboModalOpen, setIsSaveComboModalOpen] = useState(false);

  // Figma custom layer link configuration dialog states
  const [activeLinkCombination, setActiveLinkCombination] = useState<SavedCombination | null>(null);
  const [isLayerLinkModalOpen, setIsLayerLinkModalOpen] = useState<boolean>(false);
  const [modalFigmaName, setModalFigmaName] = useState<string>('');
  const [modalFigmaUrl, setModalFigmaUrl] = useState<string>('');

  useEffect(() => {
    if (activeLinkCombination && activeLinkCombination.figmaFileId && activeLinkCombination.figmaFileId !== 'none') {
      const currentFile = linkedFigmaFiles.find(f => f.id === activeLinkCombination.figmaFileId);
      if (currentFile) {
        setModalFigmaName(currentFile.name);
        setModalFigmaUrl(currentFile.url);
      } else {
        setModalFigmaName('');
        setModalFigmaUrl('');
      }
    } else {
      setModalFigmaName('');
      setModalFigmaUrl('');
    }
  }, [activeLinkCombination, linkedFigmaFiles]);

  // Persistence triggers
  useEffect(() => {
    localStorage.setItem('m3_linked_figma_files', JSON.stringify(linkedFigmaFiles));
  }, [linkedFigmaFiles]);

  useEffect(() => {
    localStorage.setItem('m3_saved_combinations', JSON.stringify(savedCombinations));
  }, [savedCombinations]);

  // Listen for delete/backspace key globally to delete selected component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Multi-select delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        const el = document.activeElement as HTMLElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.contentEditable === 'true')) return;
        setCanvasComponents(prev => prev.filter(c => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        return;
      }
      // Avoid deleting when user is typing inside input, select, or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        handleDeleteComponent(selectedComponentId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedComponentId, canvasComponents]);

  // URL Shared spec parser
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importCode = params.get('import');
    if (importCode) {
      try {
        const decoded = decodeURIComponent(escape(atob(importCode)));
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === 'object' && parsed.name && Array.isArray(parsed.components)) {
          setSharedImportCombination(parsed);
          setIsImportModalOpen(true);
        }
      } catch (err) {
        console.error("Failed to parse imported combination layout:", err);
      }
    }
  }, []);

  const handleSaveCurrentCombination = (name: string, figmaFileId: string) => {
    if (!name.trim()) {
      showToast("Please enter a valid configuration name.");
      return;
    }
    const newCombo: SavedCombination = {
      id: `combo-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      figmaFileId,
      components: JSON.parse(JSON.stringify(canvasComponents)),
      activeBackdrop,
      liveFrameUrl,
      uploadedFrameUrl,
      uploadedFrameName,
      backdropOpacity,
      backdropScale,
      isBackdropVisible,
      canvasBgMode,
      globalColorLibrary,
      activeState
    };

    setSavedCombinations(prev => {
      const filtered = prev.filter(c => c.name.toLowerCase() !== name.trim().toLowerCase());
      return [...filtered, newCombo];
    });
    setActiveCombinationId(newCombo.id);
    setSelectedFigmaFileId(figmaFileId);
    setIsSaveComboModalOpen(false);
    showToast(`Saved layout "${name.trim()}" successfully!`);
  };

  const handleDeleteCombination = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedCombinations(prev => prev.filter(c => c.id !== id));
    if (activeCombinationId === id) {
      setActiveCombinationId(null);
    }
    showToast("Layout combination removed.");
  };

  const handleShareCombination = (comb: SavedCombination, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const ser = JSON.stringify(comb);
      const encoded = btoa(unescape(encodeURIComponent(ser)));
      const shareUrl = `${window.location.origin}${window.location.pathname}?import=${encoded}`;
      
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          showToast(`Copied shareable layout URL! Share this link with your team.`);
        })
        .catch(() => {
          const tempInput = document.createElement('textarea');
          tempInput.value = shareUrl;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          showToast(`Copied share link (fallback approach)!`);
        });
    } catch (err) {
      showToast("Share failed: Cannot serialize custom layout specs.");
    }
  };

  const handleLoadCombination = (comb: SavedCombination) => {
    setCanvasComponents(JSON.parse(JSON.stringify(comb.components)));
    setActiveBackdrop(comb.activeBackdrop);
    setLiveFrameUrl(comb.liveFrameUrl || 'https://example.com');
    setUploadedFrameUrl(comb.uploadedFrameUrl || null);
    setUploadedFrameName(comb.uploadedFrameName || null);
    setBackdropOpacity(comb.backdropOpacity ?? 0.65);
    setBackdropScale(comb.backdropScale ?? 100);
    setIsBackdropVisible(comb.isBackdropVisible ?? true);
    setCanvasBgMode(comb.canvasBgMode || 'dark');
    setGlobalColorLibrary(comb.globalColorLibrary || 'baseline-blue');
    setActiveState(comb.activeState || 2);
    setSelectedFigmaFileId(comb.figmaFileId || 'fig-1');
    setActiveCombinationId(comb.id);
    if (comb.components.length > 0) {
      setSelectedComponentId(comb.components[0].id);
    } else {
      setSelectedComponentId('');
    }
    showToast(`Loaded combination blueprint: "${comb.name}"`);
  };

  const handleStartNewViewScratch = () => {
    setNewScratchName('New Custom Project');
    setNewScratchFileId('none');
    setIsNewFromScratchModalOpen(true);
  };

  const handleCreateCustomScratch = () => {
    setCanvasComponents([]);
    setSelectedComponentId('');
    setActiveCombinationId(null);
    setActiveBackdrop('none');
    setUploadedFrameUrl(null);
    setUploadedFrameName(null);
    setLiveFrameUrl('https://example.com');
    if (newScratchFileId && newScratchFileId !== 'none') {
      setSelectedFigmaFileId(newScratchFileId);
      const matched = linkedFigmaFiles.find(f => f.id === newScratchFileId);
      showToast(`Started "${newScratchName}" linked to ${matched ? matched.name : 'external file'}!`);
    } else {
      showToast(`Started a brand new project "${newScratchName}" from scratch!`);
    }
    setIsNewFromScratchModalOpen(false);
  };

  const handleCreateNewCanvas = () => {
    setCanvasComponents([]);
    setSelectedComponentId('');
    setActiveCombinationId(null);
    setActiveBackdrop('none');
    setUploadedFrameUrl(null);
    setUploadedFrameName(null);
    setLiveFrameUrl('https://example.com');
    showToast("Cleared workspace canvas. Ready for new specimens!");
  };

  const handleSelectColorLibrary = (libraryId: string) => {
    setGlobalColorLibrary(libraryId);
    setCanvasComponents(prev => prev.map(c => ({
      ...c,
      colorLibrary: libraryId
    })));
    showToast(`Figma theme updated to: ${(customLibraries[libraryId] || M3_COLOR_LIBRARIES[libraryId])?.name || libraryId}`);
  };

  const handleToggleFooterButtonSize = (compId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCanvasComponents(prev => prev.map(c => {
      if (c.id === compId) {
        // @ts-ignore
        const current = c.footerButtonSize || 'medium';
        const next: 'small' | 'medium' | 'large' = current === 'small' ? 'medium' : current === 'medium' ? 'large' : 'small';
        showToast(`Action buttons resized to ${next.toUpperCase()}`);
        return { ...c, footerButtonSize: next };
      }
      return c;
    }));
  };

  const handleRenameCombination = (id: string, newName: string) => {
    setEditingCombinationId(null);
    if (!newName.trim()) return;
    setSavedCombinations(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, name: newName.trim() };
      }
      return c;
    }));
    showToast("Combination renamed successfully.");
  };

  const handleDownloadFigmaPluginZip = async () => {
    try {
      const zip = new JSZip();
      
      // manifest.json
      zip.file('manifest.json', JSON.stringify({
        name: "M3 Shape Spec Motion Simulator",
        id: "m3-shape-spec-motion",
        api: "1.0.0",
        main: "code.js",
        ui: "ui.html",
        editorType: ["figma"]
      }, null, 2));

      // code.js
      zip.file('code.js', `figma.showUI(__html__, { width: 980, height: 750 });
figma.ui.onmessage = (msg) => {
  if (msg.type === "close") {
    figma.closePlugin();
  }
};`);

      // ui.html
      zip.file('ui.html', `<!DOCTYPE html>
<html>
<head>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #1E1E1E; }
    iframe { width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <iframe src="${window.location.origin}"></iframe>
</body>
</html>`);

      const blob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'm3-motion-tracker-plugin.zip';
      link.click();
      URL.revokeObjectURL(blobUrl);
      
      showToast("Downloaded installable Figma package list ZIP successfully!");
    } catch (err: any) {
      showToast(`Package packing failed: ${err.message}`);
    }
  };

  const handleAddFigmaFile = (name: string, url: string) => {
    if (!name.trim()) return;
    const newFile: LinkedFigmaFile = {
      id: `fig-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      url: url.trim() || 'https://figma.com/file/unnamed'
    };
    setLinkedFigmaFiles(prev => [...prev, newFile]);
    setSelectedFigmaFileId(newFile.id);
    setNewFigmaName('');
    setNewFigmaUrl('');
    setIsSettingFigmaModalOpen(false);
    showToast(`Linked Figma file: "${name}"`);
  };

  const handleDeleteFigmaFile = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (id === 'fig-1') {
      showToast("Cannot remove default M3 guidelines specification.");
      return;
    }
    setLinkedFigmaFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFigmaFileId === id) {
      setSelectedFigmaFileId('fig-1');
    }
    showToast("Linked Figma design referential frame removed.");
  };

  // Dynamic component lifecycle helpers
  const handleAddNewComponent = (type: ComponentInstance['type']) => {
    const id = `comp-${Math.random().toString(36).substring(2, 9)}`;
    // Assign sensible defaults by component type
    let name = `❖ Custom ${type.toUpperCase()}`;
    let width = 240;
    let height = 100;
    let borderRadius = 16;
    let text = "Custom specimen";
    let title = "Custom Title";
    let containerType: 'primary' | 'secondary' | 'surface' = 'surface';
    let icon = 'volume_up';

    if (type === 'button') {
      name = `🏆 Button ${Math.floor(Math.random() * 90) + 10}`;
      width = 160;
      height = 40;
      borderRadius = 9999;
      text = "Action";
      containerType = 'surface';
      icon = 'touch_app';
    } else if (type === 'card') {
      name = `❖ Card ${Math.floor(Math.random() * 90) + 10}`;
      width = 300;
      height = 360;
      borderRadius = 16;
      text = "Continuous wave rendering is active.";
      title = "Card Title";
      containerType = 'surface';
      icon = 'layers';
    } else if (type === 'chip') {
      name = `🏷️ Chip ${Math.floor(Math.random() * 90) + 10}`;
      width = 120;
      height = 32;
      borderRadius = 8;
      text = "Interactive";
      containerType = 'surface';
      icon = 'tag';
    } else if (type === 'fab') {
      name = `✨ FAB ${Math.floor(Math.random() * 90) + 10}`;
      width = 56;
      height = 56;
      borderRadius = 16;
      text = "";
      containerType = 'surface';
      icon = 'add';
    } else if (type === 'dialog') {
      name = `💬 Dialog ${Math.floor(Math.random() * 90) + 10}`;
      width = 320;
      height = 200;
      borderRadius = 28;
      text = "Apply these changes to the canvas layout?";
      title = "Dialog Title";
      containerType = 'surface';
      icon = 'warning';
    } else if (type === 'badge') {
      name = `📟 Badge ${Math.floor(Math.random() * 90) + 10}`;
      width = 48;
      height = 20;
      borderRadius = 10;
      text = "Live";
      containerType = 'surface';
      icon = 'campaign';
    } else if (type === 'sheets') {
      name = `📄 Page Sheet ${Math.floor(Math.random() * 90) + 10}`;
      width = 300;
      height = 240;
      borderRadius = 16;
      title = "Sheet Layout Info";
      text = "This sheets component offers additional details, dynamic context, or quick-access settings.";
      containerType = 'surface';
      icon = 'info';
    } else if (type === 'avatar') {
      name = `👤 Avatar ${Math.floor(Math.random() * 90) + 10}`;
      width = 44;
      height = 44;
      borderRadius = 22;
      text = "JD";
      containerType = 'surface';
      icon = 'person';
    } else if (type === 'progress') {
      name = `⏳ Progress ${Math.floor(Math.random() * 90) + 10}`;
      width = 180;
      height = 56;
      borderRadius = 4;
      text = "";
      containerType = 'primary';
      icon = 'bolt';
    } else if (type === 'image') {
      name = `🖼 Image ${Math.floor(Math.random() * 90) + 10}`;
      width = 240;
      height = 180;
      borderRadius = 12;
      containerType = 'surface';
      icon = 'image';

    }
    const newComp: ComponentInstance = {
      id,
      name,
      type,
      width,
      height,
      borderRadius,
      containerType,
      title,
      subtitle: 'Subtitle',
      text,
      x: Math.floor(Math.random() * 120) - 60,
      y: Math.floor(Math.random() * 100) - 50,
      activeIcon: icon,
      sizePreset: 'medium',
      fontStyleTitle: 'titleLarge',
      fontStyleText: 'bodyMedium',
      colorLibrary: globalColorLibrary,
      configShowIcon: true,
      configShowTitle: true,
      configShowSubtitle: true,
      configShowDescription: true,
      configShowActions: true,
      blurredEdges: false,
      avatarType: 'icon',
      variant: type === 'button' ? 'filled' : type === 'card' ? 'elevated' : type === 'chip' ? 'assist' : type === 'fab' ? 'primary' : type === 'dialog' ? 'standard' : 'standard',
      sizeMode: ['image','avatar','fab'].includes(type) ? 'fixed' : 'auto',
      heightMode: ['image','avatar','fab'].includes(type) ? 'fixed' : 'auto',
      activeState: 0,
      previousState: 0,
      transitionVal: 1.0,
      compIntensity: ['card','dialog','sheets','image'].includes(type) ? 0.75 : 0.5,
    };

    setCanvasComponents(prev => [...prev, newComp]);
    setSelectedComponentId(id);
    showToast(`Added new ${type} "${name}" to canvas!`);
  };

  const handleDeleteComponent = (id: string) => {
    setCanvasComponents(prev => {
      const remaining = prev.filter(c => c.id !== id);
      if (selectedComponentId === id) {
        if (remaining.length > 0) {
          setSelectedComponentId(remaining[remaining.length - 1].id);
        } else {
          setSelectedComponentId('');
        }
      }
      return remaining;
    });
    showToast("Component deleted successfully.");
  };

  const handleDuplicateComponent = (id: string) => {
    const orig = canvasComponents.find(c => c.id === id);
    if (!orig) return;
    const copiedId = `comp-${Math.random().toString(36).substring(2, 9)}`;
    const copy: ComponentInstance = {
      ...orig,
      id: copiedId,
      name: `${orig.name} (Copy)`,
      x: orig.x + 30, // offset
      y: orig.y + 30
    };
    setCanvasComponents(prev => [...prev, copy]);
    setSelectedComponentId(copiedId);
    showToast(`Duplicated component metadata.`);
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const index = canvasComponents.findIndex(c => c.id === id);
    if (index === -1) return;
    const newIdx = direction === 'up' ? index + 1 : index - 1;
    if (newIdx < 0 || newIdx >= canvasComponents.length) return;

    setCanvasComponents(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(index, 1);
      arr.splice(newIdx, 0, moved);
      return arr;
    });
  };

  const handleApplyPresetScene = (sceneType: 'assistant' | 'dialog' | 'dashboard') => {
    if (sceneType === 'assistant') {
      const cardId = 'scene-card-assistant';
      const buttonId = 'scene-btn-assistant';
      const chipId = 'scene-chip-assistant';
      const newComponents: ComponentInstance[] = [
        {
          id: cardId,
          name: '❖ Assistant Terminal',
          type: 'card',
          width: 320,
          height: 190,
          borderRadius: 24,
          containerType: 'primary',
          title: 'Smart AI Companion',
          subtitle: 'KINETIC STATE ACTIVE',
          text: 'Wave motion fluid energy rendering continuous interactive vectors.',
          x: -120,
          y: -40,
          activeIcon: 'chat',
          sizePreset: 'medium',
          fontStyleTitle: 'titleLarge',
          fontStyleText: 'bodyMedium',
          colorLibrary: globalColorLibrary,
          configShowIcon: true,
          configShowTitle: true,
          configShowSubtitle: true,
          configShowDescription: true,
          configShowActions: true
        },
        {
          id: buttonId,
          name: '🏆 Send Command Button',
          type: 'button',
          width: 180,
          height: 50,
          borderRadius: 25,
          containerType: 'primary',
          title: '',
          subtitle: '',
          text: 'SEND SPECIES COMMAND',
          x: 150,
          y: 60,
          activeIcon: 'near_me',
          sizePreset: 'medium',
          fontStyleTitle: 'labelMedium',
          fontStyleText: 'labelMedium',
          colorLibrary: globalColorLibrary,
          configShowIcon: true,
          configShowTitle: false,
          configShowSubtitle: false,
          configShowDescription: true,
          configShowActions: false
        },
        {
          id: chipId,
          name: '🏷️ AI Sensor Chip',
          type: 'chip',
          width: 140,
          height: 36,
          borderRadius: 8,
          containerType: 'secondary',
          title: '',
          subtitle: '',
          text: 'Sensor Active',
          x: 150,
          y: -10,
          activeIcon: 'radar',
          sizePreset: 'medium',
          fontStyleTitle: 'labelSmall',
          fontStyleText: 'labelSmall',
          colorLibrary: globalColorLibrary,
          configShowIcon: true,
          configShowTitle: false,
          configShowSubtitle: false,
          configShowDescription: true,
          configShowActions: false
        }
      ];
      setCanvasComponents(newComponents);
      setSelectedComponentId(cardId);
      showToast("Applied M3 Voice Assistant Preset Scene!");
    } else if (sceneType === 'dialog') {
      const dId = 'scene-dialog-prompt';
      const bId = 'scene-badge-p';
      const newComponents: ComponentInstance[] = [
        {
          id: dId,
          name: '💬 Core Prompt Dialog',
          type: 'dialog',
          width: 320,
          height: 200,
          borderRadius: 28,
          containerType: 'surface',
          title: 'Save dynamic parameters?',
          subtitle: 'SYSTEM CHECK',
          text: 'Commit these interactive shader motion specifications directly to the Figma workspace draft?',
          x: -40,
          y: 20,
          activeIcon: 'warning',
          sizePreset: 'medium',
          fontStyleTitle: 'titleLarge',
          fontStyleText: 'bodyMedium',
          colorLibrary: globalColorLibrary,
          configShowIcon: true,
          configShowTitle: true,
          configShowSubtitle: false,
          configShowDescription: true,
          configShowActions: true
        },
        {
          id: bId,
          name: '⏳ Progress Indicator',
          type: 'progress',
          width: 200,
          height: 8,
          borderRadius: 4,
          containerType: 'secondary',
          title: '',
          subtitle: '',
          text: 'Loading Sync...',
          x: -40,
          y: -120,
          activeIcon: 'bolt',
          sizePreset: 'medium',
          fontStyleTitle: 'labelSmall',
          fontStyleText: 'labelSmall',
          colorLibrary: globalColorLibrary,
          configShowIcon: false,
          configShowTitle: false,
          configShowSubtitle: false,
          configShowDescription: true,
          configShowActions: false
        }
      ];
      setCanvasComponents(newComponents);
      setSelectedComponentId(dId);
      showToast("Applied Dialog Prompt Preset Scene!");
    } else if (sceneType === 'dashboard') {
      const chip1Id = 'scene-dash-c1';
      const chip2Id = 'scene-dash-c2';
      const btnId = 'scene-dash-btn';
      const fabId = 'scene-dash-fab';
      const newComponents: ComponentInstance[] = [
        {
          id: chip1Id,
          name: '🏷️ Activity Chip',
          type: 'chip',
          width: 140,
          height: 36,
          borderRadius: 8,
          containerType: 'primary',
          title: '',
          subtitle: '',
          text: 'Activity: 94%',
          x: -160,
          y: -60,
          activeIcon: 'trending_up',
          sizePreset: 'medium',
          fontStyleTitle: 'labelSmall',
          fontStyleText: 'labelSmall',
          colorLibrary: globalColorLibrary,
          configShowIcon: true,
          configShowTitle: false,
          configShowSubtitle: false,
          configShowDescription: true,
          configShowActions: false
        },
        {
          id: chip2Id,
          name: '🏷️ Thermal Chip',
          type: 'chip',
          width: 140,
          height: 36,
          borderRadius: 8,
          containerType: 'secondary',
          title: '',
          subtitle: '',
          text: 'Temp: stable',
          x: -160,
          y: -10,
          activeIcon: 'thermostat',
          sizePreset: 'medium',
          fontStyleTitle: 'labelSmall',
          fontStyleText: 'labelSmall',
          colorLibrary: globalColorLibrary,
          configShowIcon: true,
          configShowTitle: false,
          configShowSubtitle: false,
          configShowDescription: true,
          configShowActions: false
        },
        {
          id: btnId,
          name: '🏆 Core Run Button',
          type: 'button',
          width: 200,
          height: 52,
          borderRadius: 26,
          containerType: 'surface',
          title: '',
          subtitle: '',
          text: 'LAUNCH WAVE SEQUENCE',
          x: 80,
          y: -30,
          activeIcon: 'rocket_launch',
          sizePreset: 'medium',
          fontStyleTitle: 'labelMedium',
          fontStyleText: 'labelMedium',
          colorLibrary: globalColorLibrary,
          configShowIcon: true,
          configShowTitle: false,
          configShowSubtitle: false,
          configShowDescription: true,
          configShowActions: false
        },
        {
          id: fabId,
          name: '✨ Kinetic Action FAB',
          type: 'fab',
          width: 64,
          height: 64,
          borderRadius: 16,
          containerType: 'primary',
          title: '',
          subtitle: '',
          text: '',
          x: 80,
          y: 50,
          activeIcon: 'add',
          sizePreset: 'medium',
          fontStyleTitle: 'bodyMedium',
          fontStyleText: 'bodyMedium',
          colorLibrary: globalColorLibrary,
          configShowIcon: true,
          configShowTitle: false,
          configShowSubtitle: false,
          configShowDescription: false,
          configShowActions: false
        }
      ];
      setCanvasComponents(newComponents);
      setSelectedComponentId(btnId);
      showToast("Applied M3 Cyber dashboard Scene Preset!");
    }
  };

  const [activeState, setActiveState] = useState<number>(2);
  const [previousState, setPreviousState] = useState<number>(2);
  const [transitionVal, setTransitionVal] = useState<number>(1.0);

  // Real-time gesture interaction logging
  const [recordedClicks, setRecordedClicks] = useState<InteractiveClick[]>([]);

  // Core configurable variables
  const [intensity, setIntensity] = useState<number>(0.85);
  const [isAnimationActive, setIsAnimationActive] = useState<boolean>(true);
  const [canvasBgMode, setCanvasBgMode] = useState<'dark' | 'light'>('light');
  const [gridVisible, setGridVisible] = useState<boolean>(true);
  const [isPluginModalOpen, setIsPluginModalOpen] = useState<boolean>(false);

  // Design backdrop features (Placing actual mockup layouts behind component)
  const [isBackdropVisible, setIsBackdropVisible] = useState<boolean>(true);
  const [activeBackdrop, setActiveBackdrop] = useState<string>('solid');
  const [uploadedFrameUrl, setUploadedFrameUrl] = useState<string | null>(null);
  const [uploadedFrameName, setUploadedFrameName] = useState<string | null>(null);
  const [liveFrameUrl, setLiveFrameUrl] = useState<string>('https://example.com');
  const [backdropOpacity, setBackdropOpacity] = useState<number>(0.65);
  const [backdropScale, setBackdropScale] = useState<number>(100);
  const [backdropSolidColor, setBackdropSolidColor] = useState<string>('#FEF7FF');
  const [hasCustomColorDefined, setHasCustomColorDefined] = useState<boolean>(false);

  // Custom User Color Libraries
  const [customLibraries, setCustomLibraries] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('m3_custom_color_libraries');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  
  // Persistent API reference link
  const [apiUrl, setApiUrl] = useState<string>(() => {
    return localStorage.getItem('m3_api_url') || 'https://serve-dot-zipline.googleplex.com/asset/ac3dc997-fbb3-5e10-8d08-fd2b37b4f0b9/energy.glsl';
  });
  const [isEditingApiUrl, setIsEditingApiUrl] = useState<boolean>(false);

  const [showAddLibraryForm, setShowAddLibraryForm] = useState<boolean>(false);
  const [newLibName, setNewLibName] = useState<string>('');
  
  // Custom Library Quick color pickers
  const [newLibPrimaryLight, setNewLibPrimaryLight] = useState<string>('#6750A4');
  const [newLibSecondaryLight, setNewLibSecondaryLight] = useState<string>('#E8DEF8');
  const [newLibSurfaceLight, setNewLibSurfaceLight] = useState<string>('#FEF7FF');

  const [newLibPrimaryDark, setNewLibPrimaryDark] = useState<string>('#D0BCFF');
  const [newLibSecondaryDark, setNewLibSecondaryDark] = useState<string>('#332D41');
  const [newLibSurfaceDark, setNewLibSurfaceDark] = useState<string>('#141218');
  
  const [pastedJson, setPastedJson] = useState<string>('');

  const getContrastColor = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length < 6) return '#FFFFFF';
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#1E1E1E' : '#FFFFFF';
  };

  const handleAddCustomLibrary = () => {
    if (!newLibName.trim()) {
      showToast("Please provide a name for your custom library.");
      return;
    }

    try {
      let colorsObj;
      if (pastedJson.trim()) {
        const parsed = JSON.parse(pastedJson);
        if (!parsed.colors || !parsed.colors.light || !parsed.colors.dark) {
          throw new Error("Invalid format. Must contain colors.light and colors.dark object definitions.");
        }
        colorsObj = parsed.colors;
      } else {
        colorsObj = {
          light: {
            primary: { bg: newLibPrimaryLight, text: getContrastColor(newLibPrimaryLight), subtext: newLibPrimaryLight + '30', label: 'Primary' },
            secondary: { bg: newLibSecondaryLight, text: getContrastColor(newLibSecondaryLight), subtext: newLibSecondaryLight + '30', label: 'Secondary' },
            surface: { bg: newLibSurfaceLight, text: getContrastColor(newLibSurfaceLight), subtext: newLibSurfaceLight + '30', label: 'Surface' }
          },
          dark: {
            primary: { bg: newLibPrimaryDark, text: getContrastColor(newLibPrimaryDark), subtext: newLibPrimaryDark + '30', label: 'Primary Dark' },
            secondary: { bg: newLibSecondaryDark, text: getContrastColor(newLibSecondaryDark), subtext: newLibSecondaryDark + '30', label: 'Secondary Dark' },
            surface: { bg: newLibSurfaceDark, text: getContrastColor(newLibSurfaceDark), subtext: newLibSurfaceDark + '30', label: 'Surface Dark' }
          }
        };
      }

      const libraryId = `custom-${Date.now()}`;
      const updated = {
        ...customLibraries,
        [libraryId]: {
          name: newLibName.trim(),
          colors: colorsObj
        }
      };

      setCustomLibraries(updated);
      localStorage.setItem('m3_custom_color_libraries', JSON.stringify(updated));

      // Auto update active theme or component
      if (activeComp) {
        updateActiveComponentField('colorLibrary', libraryId);
      } else {
        setGlobalColorLibrary(libraryId);
        setCanvasComponents(prev => prev.map(c => ({ ...c, colorLibrary: libraryId })));
      }

      setNewLibName('');
      setPastedJson('');
      setShowAddLibraryForm(false);
      showToast(`Custom colors "${newLibName.trim()}" successfully attached!`);
    } catch (err: any) {
      showToast(`Attach error: ${err.message}`);
    }
  };

  // Dragging and Resizing interaction variables
  const startDragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; startWidth: number; startHeight: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggingComponentId, setDraggingComponentId] = useState<string | null>(null);
  
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'se' | 's' | 'e'
  const [resizingComponentId, setResizingComponentId] = useState<string | null>(null);

  // Interactive capture states
  const [exportFormat, setExportFormat] = useState<'png' | 'mp4' | 'gif'>('mp4');
  const [exportDuration, setExportDuration] = useState<number>(3);
  const [perfectLoop, setPerfectLoop] = useState<boolean>(true);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingCount, setRecordingCount] = useState<number>(0);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState<number>(0);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<any>(null);
  const [isRecordOptionsDialogOpen, setIsRecordOptionsDialogOpen] = useState<boolean>(false);
  const [compiledFile, setCompiledFile] = useState<{ url: string; filename: string; extension: string } | null>(null);

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Crop & Recording Area Custom Configs
  const [isCropActive, setIsCropActive] = useState<boolean>(false);
  const [isAreaSelectionMode, setIsAreaSelectionMode] = useState<boolean>(false);
  const [recordingCountdown, setRecordingCountdown] = useState<number | null>(null);
  const [isRecordingPaused, setIsRecordingPaused] = useState<boolean>(false);

  // Recording workflow refs for external early termination, pausing, and snapshot storage
  const isRecordingPausedRef = useRef<boolean>(false);
  const activeMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordIntervalRef = useRef<any>(null);
  const stopRecordingCallbackRef = useRef<(() => void) | null>(null);
  const liveResizeRef = useRef<{ id: string; width: number; height: number } | null>(null);

  useEffect(() => {
    isRecordingPausedRef.current = isRecordingPaused;
  }, [isRecordingPaused]);

  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, []);

  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 300, height: 200 });
  const [isResizingCrop, setIsResizingCrop] = useState<string | null>(null); // 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'se' | 'sw' | 'move' | 'marquee'
  const startCropDragRef = useRef<{ startX: number; startY: number; startXOffset: number; startYOffset: number; startWidth: number; startHeight: number } | null>(null);

  // Exporter Quality & Performance Controls
  const [recordFPS, setRecordFPS] = useState<number>(30); // 15 | 30 | 60
  const [recordResolutionMultiplier, setRecordResolutionMultiplier] = useState<number>(2.0); // Default to 2.0 (High quality Retina)
  const [recordBps, setRecordBps] = useState<number>(8000000); // 8 Mbps default bitrate for extreme clarity

  // Recording Option Flags
  const [recordShowClicks, setRecordShowClicks] = useState<boolean>(true);
  const [recordShowCursor, setRecordShowCursor] = useState<boolean>(true);
  const [recordInteractionsOnly, setRecordInteractionsOnly] = useState<boolean>(true);

  // Live cursor offset on active specimen for recording overlay
  const [recMousePos, setRecMousePos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });

  // Inline/layer editing states
  const [editingCombinationId, setEditingCombinationId] = useState<string | null>(null);
  const [editingCombinationName, setEditingCombinationName] = useState<string>('');

  // From Scratch option dialog
  const [isNewFromScratchModalOpen, setIsNewFromScratchModalOpen] = useState<boolean>(false);
  const [newScratchName, setNewScratchName] = useState<string>('New Custom Specimen');
  const [newScratchFileId, setNewScratchFileId] = useState<string>('none');

  // Automatically clamp crop outline to chosen activeComp properties
  useEffect(() => {
    if (activeComp) {
      const canvasEl = document.getElementById('figma-editor-canvas');
      const w = canvasEl?.getBoundingClientRect().width || 1200;
      const h = canvasEl?.getBoundingClientRect().height || 800;
      const centerX = w / 2;
      const centerY = h / 2;
      const compLeft = centerX + activeComp.x - activeComp.width / 2;
      const compTop = centerY + activeComp.y - activeComp.height / 2;
      
      // Add a safe bleed padding around the component to prevent glows, glows, blooms, and active kinetic energy structures from being cropped
      const bleed = 85;
      setCropRect({
        x: Math.round(compLeft - bleed),
        y: Math.round(compTop - bleed),
        width: activeComp.width + (bleed * 2),
        height: activeComp.height + (bleed * 2)
      });
    } else {
      setCropRect({
        x: 100,
        y: 100,
        width: 600,
        height: 400
      });
    }
  }, [selectedComponentId, activeComp?.id, activeComp?.width, activeComp?.height]);

  // Support deleting the active selected component on preview using 'Delete' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting when user is focused inside text input or select
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        handleDeleteComponent(selectedComponentId);
      }
      if (e.key === 'Escape') {
        setSelectedComponentId('');
        setActiveState(0);
        showToast("Cleared selection and deactivated M3 kinetic state (Esc)");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedComponentId, canvasComponents]);

  // Transition controller between shader categories
  const handleStateClick = (stateId: number) => {
    if (selectedComponentId) {
      setCanvasComponents(prev => prev.map(c => {
        if (c.id === selectedComponentId) {
          const currentActive = c.activeState !== undefined ? c.activeState : 0;
          if (currentActive === stateId) {
            showToast("Returned selected specimen to state: Neutral Default");
            return {
              ...c,
              previousState: currentActive,
              activeState: 0,
              transitionVal: 0.0
            };
          } else {
            const stateObj = OFFICIAL_STATES.find(s => s.id === stateId);
            showToast(`Activated state: ${stateObj?.label || 'Custom'} on selected specimen`);
            return {
              ...c,
              previousState: currentActive,
              activeState: stateId,
              transitionVal: 0.0
            };
          }
        }
        return c;
      }));
    } else {
      // No component selected — apply to ALL canvas components
      const newState = stateId === activeState ? 0 : stateId;
      setPreviousState(activeState);
      setActiveState(newState);
      setTransitionVal(0.0);
      setCanvasComponents(prev => prev.map(c => ({
        ...c,
        previousState: c.activeState ?? 0,
        activeState: newState,
        transitionVal: 0.0,
      })));
      showToast(newState === 0 ? "Reset all to Neutral" : `Energy: ${OFFICIAL_STATES.find(s => s.id === newState)?.label || newState}`);
    }
  };

  useEffect(() => {
    if (transitionVal < 1.0) {
      let animFrameId: number;
      const startTime = performance.now();
      const duration = 650;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / duration);
        const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);
        setTransitionVal(ease);

        if (progress < 1.0) {
          animFrameId = requestAnimationFrame(tick);
        } else {
          setTransitionVal(1.0);
        }
      };

      animFrameId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animFrameId);
    }
  }, [activeState]);

  // Component-specific transition animator
  useEffect(() => {
    let animFrameId: number;
    let lastTime = performance.now();

    const checkAndAnimateComponents = () => {
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      setCanvasComponents(prev => {
        const hasTransitioning = prev.some(c => c.transitionVal !== undefined && c.transitionVal < 1.0);
        if (!hasTransitioning) return prev;

        return prev.map(c => {
          if (c.transitionVal !== undefined && c.transitionVal < 1.0) {
            const nextProgress = Math.min(1.0, c.transitionVal + dt / 650);
            return {
              ...c,
              transitionVal: nextProgress
            };
          }
          return c;
        });
      });

      animFrameId = requestAnimationFrame(checkAndAnimateComponents);
    };

    animFrameId = requestAnimationFrame(checkAndAnimateComponents);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  // Global Drag/Resize tracking effect
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // 1. Standard specimen dragging and resizing
      const dragData = startDragRef.current;
      if (dragData) {
        const deltaX = e.clientX - dragData.startX;
        const deltaY = e.clientY - dragData.startY;
        const startPosX = dragData.startPosX;
        const startPosY = dragData.startPosY;
        const startWidth = dragData.startWidth;
        const startHeight = dragData.startHeight;

        if (isDragging && draggingComponentId) {
          setCanvasComponents(prev => prev.map(c => {
            if (c.id === draggingComponentId) {
              return {
                ...c,
                x: startPosX + deltaX,
                y: startPosY + deltaY
              };
            }
            return c;
          }));
        } else if (isResizing && resizingComponentId) {
          // Apply resize directly to DOM to avoid re-render flicker
          const comp = canvasComponents.find(c => c.id === resizingComponentId);
          if (comp) {
            const minW = ['card','dialog','sheets','image'].includes(comp.type) ? 180 : ['button','chip'].includes(comp.type) ? 72 : 48;
            const minH = ['card','dialog','sheets','image'].includes(comp.type) ? 120 : ['button'].includes(comp.type) ? 36 : 28;
            const newW = isResizing.includes('e') ? Math.max(minW, Math.min(900, startWidth + deltaX)) : comp.width;
            const newH = isResizing.includes('s') ? Math.max(minH, Math.min(800, startHeight + deltaY)) : comp.height;
            liveResizeRef.current = { id: resizingComponentId, width: newW, height: newH };
            const el = document.getElementById(`specimen-wrapper-${resizingComponentId}`);
            if (el) {
              if (isResizing.includes('e')) el.style.width = `${newW}px`;
              if (isResizing.includes('s')) el.style.height = `${newH}px`;
            }
          }
        }
      }

      // 2. Custom crop box dragging and resizing
      if (startCropDragRef.current && isResizingCrop) {
        const deltaX = e.clientX - startCropDragRef.current.startX;
        const deltaY = e.clientY - startCropDragRef.current.startY;

        const startX = startCropDragRef.current.startXOffset;
        const startY = startCropDragRef.current.startYOffset;
        const startW = startCropDragRef.current.startWidth;
        const startH = startCropDragRef.current.startHeight;

        let nextX = startX;
        let nextY = startY;
        let nextW = startW;
        let nextH = startH;

        const canvasEl = document.getElementById('figma-editor-canvas');
        const maxW = canvasEl?.getBoundingClientRect().width || 1200;
        const maxH = canvasEl?.getBoundingClientRect().height || 800;

        if (isResizingCrop === 'move') {
          nextX = Math.max(0, Math.min(maxW - startW, startX + deltaX));
          nextY = Math.max(0, Math.min(maxH - startH, startY + deltaY));
        } else if (isResizingCrop === 'marquee') {
          let nextW_marquee = Math.abs(deltaX);
          let nextH_marquee = Math.abs(deltaY);

          if (deltaX < 0) {
            nextX = Math.max(0, startX + deltaX);
          }
          if (deltaY < 0) {
            nextY = Math.max(0, startY + deltaY);
          }
          nextW = Math.min(maxW - nextX, nextW_marquee);
          nextH = Math.min(maxH - nextY, nextH_marquee);
        } else {
          // Edges & Corners sizing blocks
          if (isResizingCrop.includes('e')) {
            nextW = Math.max(10, Math.min(maxW - startX, startW + deltaX));
          }
          if (isResizingCrop.includes('s')) {
            nextH = Math.max(10, Math.min(maxH - startY, startH + deltaY));
          }
          if (isResizingCrop.includes('w')) {
            const shiftX = Math.min(deltaX, startW - 10);
            nextX = Math.max(0, Math.min(maxW - 10, startX + shiftX));
            nextW = startW - (nextX - startX);
          }
          if (isResizingCrop.includes('n')) {
            const shiftY = Math.min(deltaY, startH - 10);
            nextY = Math.max(0, Math.min(maxH - 10, startY + shiftY));
            nextH = startH - (nextY - startY);
          }
        }

        setCropRect({
          x: Math.round(nextX),
          y: Math.round(nextY),
          width: Math.round(nextW),
          height: Math.round(nextH)
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      // Commit live DOM resize to state
      if (liveResizeRef.current) {
        const { id, width, height } = liveResizeRef.current;
        setCanvasComponents(prev => prev.map(c => c.id === id ? { ...c, width, height, sizeMode: 'fixed', heightMode: 'fixed' } : c));
        liveResizeRef.current = null;
      }
      setIsResizing(null);
      setDraggingComponentId(null);
      setResizingComponentId(null);
      startDragRef.current = null;

      setIsResizingCrop(null);
      startCropDragRef.current = null;
    };

    if (isDragging || isResizing || isResizingCrop) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, draggingComponentId, resizingComponentId, isResizingCrop, activeComp]);

  const handleCropResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();

    setIsResizingCrop(direction);
    startCropDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startXOffset: cropRect.x,
      startYOffset: cropRect.y,
      startWidth: cropRect.width,
      startHeight: cropRect.height
    };
  };

  const handleMarqueeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const startX = Math.round(e.clientX - rect.left);
    const startY = Math.round(e.clientY - rect.top);

    setCropRect({
      x: startX,
      y: startY,
      width: 10,
      height: 10
    });

    setIsResizingCrop('marquee');
    startCropDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startXOffset: startX,
      startYOffset: startY,
      startWidth: 10,
      startHeight: 10
    };
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const drawSpecimenToCanvas = (
    ctx: CanvasRenderingContext2D,
    comp: ComponentInstance,
    themeMode: 'dark' | 'light',
    webglCanvas: HTMLCanvasElement,
    cropX: number,
    cropY: number,
    recordedClicksBatch: any[],
    mousePos: { x: number, y: number },
    showCursorFlag: boolean,
    showClicksFlag: boolean
  ) => {
    const colors = getM3SpecificStyles(comp, themeMode);

    const isStateBlurred = activeState === 2 || activeState === 3 || activeState === 4 || activeState === 5 || activeState === 6 || activeState === 7;

    // Draw dynamic backdrop blur on 2D canvas context if state is blurred!
    if (isStateBlurred) {
      ctx.save();
      if ("filter" in ctx) {
        (ctx as any).filter = `blur(${intensity * 32 + 18}px) saturate(1.8) opacity(0.8)`;
      }
      // Draw background WebGL canvas offset by -100px so it bleeds outwards nicely in the exported image!
      ctx.drawImage(webglCanvas, -cropX - 100, -cropY - 100, comp.width + 200, comp.height + 200);
      ctx.restore();
    }

    // Draw card background color and clip to rounded corners
    ctx.save();
    if (!isStateBlurred) {
      if (comp.borderRadius > 0) {
        ctx.beginPath();
        const rx = -cropX;
        const ry = -cropY;
        const rw = comp.width;
        const rh = comp.height;
        const r = Math.min(comp.borderRadius, Math.min(rw / 2, rh / 2));
        ctx.moveTo(rx + r, ry);
        ctx.lineTo(rx + rw - r, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
        ctx.lineTo(rx + rw, ry + rh - r);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
        ctx.lineTo(rx + r, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
        ctx.lineTo(rx, ry + r);
        ctx.quadraticCurveTo(rx, ry, rx + r, ry);
        ctx.closePath();
        
        ctx.fillStyle = colors.bg;
        ctx.fill();

        if (colors.borderColor && colors.borderColor !== 'transparent') {
          ctx.strokeStyle = colors.borderColor;
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        ctx.clip();
      } else {
        ctx.fillStyle = colors.bg;
        ctx.fillRect(-cropX, -cropY, comp.width, comp.height);
      }
    }

    // Draw source WebGL canvas offset
    if (isStateBlurred) {
      ctx.drawImage(webglCanvas, -cropX - 80, -cropY - 80, comp.width + 160, comp.height + 160);
    } else {
      ctx.drawImage(webglCanvas, -cropX, -cropY, comp.width, comp.height);
    }
    ctx.restore();
    const textColor = colors.text;
    const subtextColor = colors.subtext;

    const localIcon = comp.activeIcon || 'volume_up';
    const resolvedLocalIcon = (localIcon === 'sparkles' || localIcon === 'sparkle' || localIcon === 'auto_awesome') ? 'auto_awesome' : localIcon;
    const iconCharMap: Record<string, string> = {
      sparkles: '✦',
      sparkle: '✦',
      auto_awesome: '✦',
      favorite: '♥',
      settings: '⚙',
      info: 'i',
      shopping_cart: '⛃',
      search: '⌕',
      person: '⚇',
      home: '⌂',
      notifications: '⭘',
      star: '★',
      share: '⤯',
      play_arrow: '▶',
      volume_up: 'v',
      mic: 'm',
      fingerprint: 'f',
      lightbulb: 'l',
      extension: 'e',
      bolt: 'b',
      warning: '⚠'
    };
    const iconStr = iconCharMap[resolvedLocalIcon] || '✦';

    ctx.save();
    // Translate out of crop
    ctx.translate(-cropX, -cropY);

    if (comp.type === 'button') {
      ctx.fillStyle = textColor;
      ctx.font = '600 12px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (comp.configShowIcon) {
        ctx.fillText(iconStr, comp.width / 2 - 25, comp.height / 2);
        ctx.fillText(comp.text, comp.width / 2 + 10, comp.height / 2);
      } else {
        ctx.fillText(comp.text, comp.width / 2, comp.height / 2);
      }
    } 
    else if (comp.type === 'card') {
      let currentY = 24;
      let startX = 20;

      if (comp.configShowIcon || comp.configShowTitle || comp.configShowSubtitle) {
        if (comp.configShowIcon) {
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.beginPath();
          ctx.arc(startX + 18, currentY + 18, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '14px "Inter"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(iconStr, startX + 18, currentY + 18);
          startX += 48;
        }

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        if (comp.configShowTitle) {
          ctx.fillStyle = textColor;
          ctx.font = 'bold 13.5px "Inter", sans-serif';
          ctx.fillText(comp.title, startX, currentY);
          currentY += 18;
        }

        if (comp.configShowSubtitle) {
          ctx.fillStyle = subtextColor;
          ctx.font = 'bold 8.5px "Inter", sans-serif';
          ctx.fillText(comp.subtitle.toUpperCase(), startX, currentY);
          currentY += 14;
        }
      }

      if (comp.configShowDescription) {
        ctx.fillStyle = textColor;
        ctx.font = '11px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const words = comp.text.split(' ');
        let line = '';
        let textY = Math.max(currentY + 10, 70);
        const maxWidth = comp.width - 40;
        const lineHeight = 16;

        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          let metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, 20, textY);
            line = words[n] + ' ';
            textY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 20, textY);
      }

      if (comp.configShowActions) {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12, comp.height - 40);
        ctx.lineTo(comp.width - 12, comp.height - 40);
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 9.5px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('Action', comp.width - 24, comp.height - 20);

        ctx.globalAlpha = 0.6;
        ctx.fillText('Dismiss', comp.width - 80, comp.height - 20);
        ctx.globalAlpha = 1.0;
      }
    } 
    else if (comp.type === 'chip') {
      ctx.fillStyle = textColor;
      ctx.font = '500 12.5px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (comp.configShowIcon) {
        ctx.fillText(iconStr, comp.width / 2 - 22, comp.height / 2);
        ctx.fillText(comp.text, comp.width / 2 + 12, comp.height / 2);
      } else {
        ctx.fillText(comp.text, comp.width / 2, comp.height / 2);
      }
    } 
    else if (comp.type === 'fab') {
      ctx.fillStyle = textColor;
      ctx.font = '18px "Inter"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconStr, comp.width / 2, comp.height / 2);
    } 
    else if (comp.type === 'dialog') {
      let currentY = 24;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      if (comp.configShowIcon) {
        ctx.fillStyle = '#A259FF';
        ctx.font = '20px "Inter"';
        ctx.fillText(iconStr, 20, currentY);
        currentY += 28;
      }

      if (comp.configShowTitle) {
        ctx.fillStyle = textColor;
        ctx.font = 'bold 15px "Inter", sans-serif';
        ctx.fillText(comp.title, 20, currentY);
        currentY += 22;
      }

      if (comp.configShowDescription) {
        ctx.fillStyle = textColor;
        ctx.font = '11.5px "Inter", sans-serif';
        const words = comp.text.split(' ');
        let line = '';
        let textY = currentY + 4;
        const maxWidth = comp.width - 40;
        const lineHeight = 15;

        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          let metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, 20, textY);
            line = words[n] + ' ';
            textY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 20, textY);
      }

      if (comp.configShowActions) {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12, comp.height - 40);
        ctx.lineTo(comp.width - 12, comp.height - 40);
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = 'bold 10px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('Confirm', comp.width - 24, comp.height - 20);

        ctx.globalAlpha = 0.6;
        ctx.fillText('Cancel', comp.width - 85, comp.height - 20);
        ctx.globalAlpha = 1.0;
      }
    } 
    else if (comp.type === 'badge') {
      ctx.fillStyle = textColor;
      ctx.font = 'bold 10px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (comp.configShowIcon) {
        ctx.fillText(iconStr, comp.width / 2 - 15, comp.height / 2);
        ctx.fillText(comp.text, comp.width / 2 + 10, comp.height / 2);
      } else {
        ctx.fillText(comp.text, comp.width / 2, comp.height / 2);
      }
    }
    else if (comp.type === 'sheets') {
      ctx.fillStyle = textColor;
      ctx.font = 'bold 12px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(comp.title || 'Sheet Header', 16, 16);
      ctx.font = '500 10.5px "Inter", sans-serif';
      ctx.fillStyle = subtextColor || 'rgba(255,255,255,0.7)';
      ctx.fillText(comp.text || 'Context Body', 16, 38);
    }
    else if (comp.type === 'avatar') {
      ctx.fillStyle = colors.bg;
      ctx.beginPath();
      ctx.arc(comp.width / 2, comp.height / 2, Math.min(comp.width, comp.height) / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(comp.text || 'JD', comp.width / 2, comp.height / 2);
    }
    else if (comp.type === 'progress') {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(12, comp.height / 2 - 3, comp.width - 24, 6);
      ctx.fillStyle = '#18A0FB';
      ctx.fillRect(12, comp.height / 2 - 3, (comp.width - 24) * 0.7, 6);
    }

    // Draw recorded clicks custom visual tracking indicator
    if (showClicksFlag) {
      const now = Date.now();
      for (const cl of recordedClicksBatch) {
        const elapsed = now - (cl.timestamp || now); // resolve timing accurately
        if (elapsed < 1200) {
          const ratio = elapsed / 1200;
          const alpha = Math.max(0, 1 - ratio);
          
          // Outer ripple ring
          ctx.strokeStyle = `rgba(24, 160, 251, ${alpha * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cl.x, cl.y, ratio * 22 + 4, 0, Math.PI * 2);
          ctx.stroke();

          // Soft inner filled background
          ctx.fillStyle = `rgba(24, 160, 251, ${alpha * 0.08})`;
          ctx.beginPath();
          ctx.arc(cl.x, cl.y, ratio * 22 + 4, 0, Math.PI * 2);
          ctx.fill();

          // Elegant solid inner dot that also fades nicely
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
          ctx.strokeStyle = `rgba(24, 160, 251, ${alpha * 0.8})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cl.x, cl.y, 4 * (1 - ratio * 0.3), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    // Draw custom visual tracking arrow cursor
    if (showCursorFlag && mousePos && mousePos.x >= 0 && mousePos.x <= comp.width && mousePos.y >= 0 && mousePos.y <= comp.height) {
      const cx = mousePos.x;
      const cy = mousePos.y;
      
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 12, cy + 12);
      ctx.lineTo(cx + 5, cy + 13);
      ctx.lineTo(cx + 8, cy + 20);
      ctx.lineTo(cx + 5, cy + 21);
      ctx.lineTo(cx + 2, cy + 14);
      ctx.lineTo(cx, cy + 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  };

  // Dimensional and field updates
  const updateComponentField = (id: string, field: keyof ComponentInstance, value: any) => {
    setCanvasComponents(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          [field]: value
        };
      }
      return c;
    }));
  };

  // Resolve colors dynamically by component or defaults
  const getComponentColors = (c: ComponentInstance, mode: 'light' | 'dark') => {
    const libKey = c.colorLibrary || globalColorLibrary || 'baseline-blue';
    const lib = (customLibraries[libKey] || M3_COLOR_LIBRARIES[libKey]) || M3_COLOR_LIBRARIES['baseline-blue'];
    return lib.colors[mode][c.containerType];
  };

  const getM3SpecificStyles = (comp: ComponentInstance, mode: 'light' | 'dark') => {
    const libKey = comp.colorLibrary || globalColorLibrary || 'baseline-blue';
    const lib = (customLibraries[libKey] || M3_COLOR_LIBRARIES[libKey]) || M3_COLOR_LIBRARIES['baseline-blue'];
    const libColors = lib.colors[mode];
    
    let bg = libColors[comp.containerType]?.bg || '#ffffff';
    let text = libColors[comp.containerType]?.text || '#121212';
    let subtext = libColors[comp.containerType]?.subtext || '#666666';
    let borderColor = 'transparent';
    let shadow = 'none';
    let hasBaseShaderBg = true;
    
    const variant = comp.variant || 'filled';
    
    if (comp.type === 'button') {
      if (variant === 'filled') {
        bg = libColors.primary.bg;
        text = libColors.primary.text;
        borderColor = 'transparent';
        shadow = 'none';
        hasBaseShaderBg = true;
      } else if (variant === 'tonal') {
        bg = libColors.secondary.bg;
        text = libColors.secondary.text;
        borderColor = 'transparent';
        shadow = 'none';
        hasBaseShaderBg = true;
      } else if (variant === 'elevated') {
        bg = mode === 'dark' ? '#211F26' : '#F7F2FA';
        text = libColors.primary.bg;
        borderColor = 'transparent';
        shadow = '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)';
        hasBaseShaderBg = true;
      } else if (variant === 'outlined') {
        bg = 'transparent';
        text = libColors.primary.bg;
        borderColor = mode === 'dark' ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.24)';
        shadow = 'none';
        hasBaseShaderBg = false;
      } else if (variant === 'text') {
        bg = 'transparent';
        text = libColors.primary.bg;
        borderColor = 'transparent';
        shadow = 'none';
        hasBaseShaderBg = false;
      }
    }
    else if (comp.type === 'card') {
      if (variant === 'elevated') {
        bg = libColors.surface.bg;
        text = libColors.surface.text;
        subtext = libColors.surface.subtext;
        borderColor = 'transparent';
        shadow = '0px 1px 5px rgba(0, 0, 0, 0.15)';
        hasBaseShaderBg = true;
      } else if (variant === 'filled') {
        bg = libColors.secondary.bg;
        text = libColors.secondary.text;
        subtext = libColors.secondary.subtext;
        borderColor = 'transparent';
        shadow = 'none';
        hasBaseShaderBg = true;
      } else if (variant === 'outlined') {
        bg = libColors.surface.bg;
        text = libColors.surface.text;
        subtext = libColors.surface.subtext;
        borderColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.24)';
        shadow = 'none';
        hasBaseShaderBg = false;
      }
    }
    else if (comp.type === 'chip') {
      if (variant === 'assist') {
        bg = 'transparent';
        text = libColors.primary.bg;
        borderColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.24)';
        shadow = 'none';
        hasBaseShaderBg = false;
      } else if (variant === 'filled') {
        bg = libColors.secondary.bg;
        text = libColors.secondary.text;
        borderColor = 'transparent';
        shadow = 'none';
        hasBaseShaderBg = true;
      } else if (variant === 'elevated') {
        bg = libColors.surface.bg;
        text = libColors.surface.text;
        borderColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
        shadow = '0px 1px 2px rgba(0,0,0,0.1)';
        hasBaseShaderBg = true;
      }
    }
    else if (comp.type === 'fab') {
      if (variant === 'primary') {
        bg = libColors.primary.bg;
        text = libColors.primary.text;
        shadow = '0px 3px 6px rgba(0, 0, 0, 0.15)';
        hasBaseShaderBg = true;
      } else if (variant === 'secondary') {
        bg = libColors.secondary.bg;
        text = libColors.secondary.text;
        shadow = '0px 3px 6px rgba(0, 0, 0, 0.15)';
        hasBaseShaderBg = true;
      } else if (variant === 'surface') {
        bg = canvasBgMode === 'dark' ? '#2B2930' : '#ECE6F0';  // surface FAB tonal
        text = libColors.primary.bg;
        shadow = '0px 3px 6px rgba(0, 0, 0, 0.15)';
        hasBaseShaderBg = true;
      }
    }
    else if (comp.type === 'dialog') {
      bg = canvasBgMode === 'dark' ? '#2B2930' : '#ECE6F0';  // surface FAB tonal
      text = libColors.surface.text;
      subtext = libColors.surface.subtext;
      shadow = '0px 24px 38px rgba(0,0,0,0.3)';
      borderColor = variant === 'alert' 
        ? (mode === 'dark' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.5)')
        : 'transparent';
      hasBaseShaderBg = true;
    }
    else if (comp.type === 'badge') {
      if (variant === 'dot') {
        bg = mode === 'dark' ? '#F44336' : '#D11D12';
        text = '#FFFFFF';
        borderColor = 'transparent';
        shadow = 'none';
        hasBaseShaderBg = false;
      } else {
        bg = libColors.secondary.bg;
        text = libColors.secondary.text;
        borderColor = 'transparent';
        shadow = 'none';
        hasBaseShaderBg = true;
      }
    }
    else if (comp.type === 'sheets') {
      bg = canvasBgMode === 'dark' ? '#2B2930' : '#ECE6F0';  // surface FAB tonal
      text = libColors.surface.text;
      subtext = libColors.surface.subtext;
      shadow = '0px 16px 24px rgba(0,0,0,0.2)';
      borderColor = 'transparent';
      hasBaseShaderBg = true;
    }
    else if (comp.type === 'avatar') {
      bg = libColors.primary.bg;
      text = libColors.primary.text;
      borderColor = 'transparent';
      shadow = '0px 2px 6px rgba(0,0,0,0.15)';
      hasBaseShaderBg = true;
    }
    else if (comp.type === 'progress') {
      hasBaseShaderBg = false;  // No energy shader on container
      bg = 'transparent';
      text = libColors.primary.bg;
      borderColor = 'transparent';
      shadow = 'none';
    }

    return { bg, text, subtext, borderColor, shadow, hasBaseShaderBg };
  };

  const updateActiveComponentField = (field: keyof ComponentInstance, value: any) => {
    updateComponentField(selectedComponentId, field, value);
  };

  const compBgColor = activeComp ? getM3SpecificStyles(activeComp, canvasBgMode).bg : '#121212';
  
  const stateMeta = OFFICIAL_STATES.find(s => s.id === activeState) || OFFICIAL_STATES[0];
  const midColor = stateMeta.defaultMid;
  const endColor = stateMeta.defaultEnd;

  // Image upload triggers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setUploadedFrameUrl(url);
      setUploadedFrameName(file.name);
      setActiveBackdrop('uploaded');
      showToast(`Loaded layout frame: ${file.name}`);
    }
  };

  // Frame reset to viewport center
  const handleResetAlignment = () => {
    setCanvasComponents(prev => prev.map(c => {
      if (c.id === selectedComponentId) {
        return { ...c, x: 0, y: 0 };
      }
      return c;
    }));
    showToast(`Centered chosen element "${activeComp?.name}".`);
  };

  const handleSpecimenClick = (e: React.MouseEvent<HTMLDivElement>, componentId: string) => {
    const canvasEl = document.getElementById('figma-editor-canvas');
    const canvasRect = canvasEl?.getBoundingClientRect();
    if (canvasRect) {
      const x = Math.round(e.clientX - canvasRect.left);
      const y = Math.round(e.clientY - canvasRect.top);
      
      const clickId = Math.random().toString(36).substring(2, 9);
      const newClick: InteractiveClick = {
        id: clickId,
        x,
        y,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      
      setRecordedClicks(prev => [...prev.slice(-9), newClick]); // Keep last 10 interactions
      
      // Automatically expire
      setTimeout(() => {
        setRecordedClicks(prev => prev.filter(c => c.id !== clickId));
      }, 1200);
    }
  };

  const handleMoveStart = (e: React.MouseEvent, componentId: string) => {
    e.stopPropagation();
    if (isRecording || recordingCountdown !== null) return; // Prevent selection/dragging during active capturing
    const comp = canvasComponents.find(c => c.id === componentId);
    if (!comp) return;
    setSelectedComponentId(componentId);
    setIsDragging(true);
    setDraggingComponentId(componentId);
    startDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: comp.x,
      startPosY: comp.y,
      startWidth: comp.width,
      startHeight: comp.height
    };
  };

  const handleResizeStart = (e: React.MouseEvent, componentId: string, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    const comp = canvasComponents.find(c => c.id === componentId);
    if (!comp) return;
    setSelectedComponentId(componentId);
    setIsResizing(handle);
    setResizingComponentId(componentId);
    startDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: comp.x,
      startPosY: comp.y,
      startWidth: comp.width,
      startHeight: comp.height
    };
  };

  // Interactive Recording & Early Stop Session Control Handlers
  const handlePauseVideoRecording = () => {
    if (exportFormat === 'mp4' && activeMediaRecorderRef.current) {
      if (activeMediaRecorderRef.current.state === 'recording') {
        activeMediaRecorderRef.current.pause();
        setIsRecordingPaused(true);
        showToast("Recording paused.");
      }
    } else if (exportFormat === 'gif') {
      setIsRecordingPaused(true);
      showToast("Snapshot capture paused.");
    }
  };

  const handleResumeVideoRecording = () => {
    if (exportFormat === 'mp4' && activeMediaRecorderRef.current) {
      if (activeMediaRecorderRef.current.state === 'paused') {
        activeMediaRecorderRef.current.resume();
        setIsRecordingPaused(false);
        showToast("Recording resumed.");
      }
    } else if (exportFormat === 'gif') {
      setIsRecordingPaused(false);
      showToast("Snapshot capture resumed.");
    }
  };

  const handleStopVideoRecordingEarly = () => {
    if (stopRecordingCallbackRef.current) {
      stopRecordingCallbackRef.current();
    }
  };

  const startRecordingAfterCountdown = () => {
    setRecordingCountdown(3);
    showToast("Starting capture countdown...");
    
    let currentCount = 3;
    const countInterval = setInterval(() => {
      currentCount--;
      if (currentCount <= 0) {
        clearInterval(countInterval);
        setRecordingCountdown(null);
        actuallyStartRecording();
      } else {
        setRecordingCountdown(currentCount);
      }
    }, 1000);
  };

  const actuallyStartRecording = async () => {
    // Reset snap arrays & chunks
    setIsRecordingPaused(false);

    // Try finding canvas using exact Specimen ID, and fallback to type-based ID if activeComp is present
    let canvas: HTMLCanvasElement | null = null;
    if (activeComp) {
      let canvasId = `canvas-for-${activeComp.id}`;
      canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) {
        canvasId = `canvas-for-${activeComp.type}`;
        canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      }
    }

    // Capture geometry bounds
    const baseW = isCropActive ? cropRect.width : (activeComp ? activeComp.width : 600);
    const baseH = isCropActive ? cropRect.height : (activeComp ? activeComp.height : 400);

    let cropX = 0;
    let cropY = 0;
    if (isCropActive) {
      if (activeComp) {
        const canvasEl = document.getElementById('figma-editor-canvas');
        if (canvasEl) {
          const sRect = canvasEl.getBoundingClientRect();
          const centerX = sRect.width / 2;
          const centerY = sRect.height / 2;
          const compLeft = centerX + activeComp.x - activeComp.width / 2;
          const compTop = centerY + activeComp.y - activeComp.height / 2;
          cropX = cropRect.x - compLeft;
          cropY = cropRect.y - compTop;
        } else {
          cropX = cropRect.x;
          cropY = cropRect.y;
        }
      } else {
        cropX = cropRect.x;
        cropY = cropRect.y;
      }
    }

    // Apply high-fidelity resolution multipliers
    const finalW = Math.round(baseW * recordResolutionMultiplier);
    const finalH = Math.round(baseH * recordResolutionMultiplier);

    // Initialise Composite drawing canvas
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = finalW;
    compositeCanvas.height = finalH;
    const ctx = compositeCanvas.getContext('2d')!;

    const finalType = activeComp ? activeComp.type : 'canvas';

    // Perform drawing routine on composite canvas
    // ── HTML2CANVAS CAPTURE APPROACH ──
    // Loads html2canvas from CDN on first use, then captures the actual DOM component
    const getHtml2Canvas = async (): Promise<any> => {
      if ((window as any)._h2c) return (window as any)._h2c;
      return new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = () => { (window as any)._h2c = (window as any).html2canvas; resolve((window as any).html2canvas); };
        document.head.appendChild(s);
      });
    };

    const renderCompFrame = async () => {
      ctx.clearRect(0, 0, finalW, finalH);

      // 1. Background fill
      let bgFill = canvasBgMode === 'dark' ? '#1E1E1E' : '#EAEAEA';
      if (isBackdropVisible && activeBackdrop === 'solid') bgFill = backdropSolidColor;
      ctx.fillStyle = bgFill;
      ctx.fillRect(0, 0, finalW, finalH);

      // 2. Backdrop image/iframe
      if (isBackdropVisible && (activeBackdrop === 'uploaded' || activeBackdrop === 'live' || activeBackdrop === 'figma')) {
        const imgEl = document.querySelector('.backdrop-image-source') as HTMLImageElement;
        if (imgEl && imgEl.complete) {
          ctx.save();
          ctx.globalAlpha = backdropOpacity;
          ctx.drawImage(imgEl, 0, 0, finalW, finalH);
          ctx.restore();
        }
      }

      ctx.save();
      ctx.scale(recordResolutionMultiplier, recordResolutionMultiplier);

      if (activeComp) {
        const canvasEl = document.getElementById('figma-editor-canvas');
        const sRect = canvasEl?.getBoundingClientRect();
        if (!sRect) { ctx.restore(); return; }

        const compLeft = sRect.width / 2 + activeComp.x - activeComp.width / 2;
        const compTop = sRect.height / 2 + activeComp.y - activeComp.height / 2;
        const drawX = compLeft - cropX;
        const drawY = compTop - cropY;
        const drawW = activeComp.width;
        const drawH = activeComp.height;
        const br = Math.min(activeComp.borderRadius, drawW / 2, drawH / 2);

        // Clip to component rounded rect
        ctx.save();
        if (br > 0) {
          ctx.beginPath();
          ctx.moveTo(drawX + br, drawY);
          ctx.lineTo(drawX + drawW - br, drawY);
          ctx.quadraticCurveTo(drawX + drawW, drawY, drawX + drawW, drawY + br);
          ctx.lineTo(drawX + drawW, drawY + drawH - br);
          ctx.quadraticCurveTo(drawX + drawW, drawY + drawH, drawX + drawW - br, drawY + drawH);
          ctx.lineTo(drawX + br, drawY + drawH);
          ctx.quadraticCurveTo(drawX, drawY + drawH, drawX, drawY + drawH - br);
          ctx.lineTo(drawX, drawY + br);
          ctx.quadraticCurveTo(drawX, drawY, drawX + br, drawY);
          ctx.closePath();
          ctx.clip();
        }

        // Draw WebGL shader background (energy)
        if (canvas) {
          ctx.drawImage(canvas, drawX - cropX, drawY - cropY, drawW, drawH);
        }

        // Capture actual DOM component
        try {
          const h2c = await getHtml2Canvas();
          const wrapperEl = document.getElementById(`specimen-wrapper-${activeComp.id}`);
          if (wrapperEl && h2c) {
            const captured = await h2c(wrapperEl, {
              useCORS: true,
              allowTaint: true,
              backgroundColor: null,
              scale: recordResolutionMultiplier,
              logging: false,
              width: drawW,
              height: drawH,
            });
            ctx.drawImage(captured, drawX, drawY, drawW, drawH);
          }
        } catch (_) {
          // Fallback: draw bg color
          ctx.fillStyle = canvasBgMode === 'dark' ? '#1E1E1E' : '#F4F4F4';
          ctx.fillRect(drawX, drawY, drawW, drawH);
        }

        ctx.restore();

        // Draw click ripples on top
        if (recordShowClicks) {
          const now = Date.now();
          recordedClicks.forEach(click => {
            const elapsed = now - click.timestamp;
            if (elapsed < 1200) {
              const ratio = elapsed / 1200;
              const radius = ratio * 28 + 4;
              const alpha = Math.max(0, 1 - ratio);
              const cx = drawX + (click.x - compLeft - cropX);
              const cy = drawY + (click.y - compTop - cropY);
              ctx.save();
              ctx.globalAlpha = alpha * 0.5;
              ctx.beginPath();
              ctx.arc(cx, cy, radius, 0, Math.PI * 2);
              ctx.strokeStyle = '#18A0FB';
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.globalAlpha = alpha * 0.9;
              ctx.beginPath();
              ctx.arc(cx, cy, 4, 0, Math.PI * 2);
              ctx.fillStyle = 'white';
              ctx.fill();
              ctx.strokeStyle = 'rgba(24,160,251,0.8)';
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.restore();
            }
          });
        }
        // Draw cursor
        if (recordShowCursor && recMousePos.x >= 0) {
          const mx = recMousePos.x - compLeft - cropX;
          const my = recMousePos.y - compTop - cropY;
          ctx.save();
          // Cursor shadow
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(drawX + mx, drawY + my, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();
    };

    if (exportFormat === 'png') {
      try {
        setExportStatus('Rendering custom frame...');
        await renderCompFrame();

        const dataUrl = compositeCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `m3-specimen-${finalType}-${finalW}x${finalH}-${(Date.now() % 1000)}.png`;
        link.click();
        
        setExportStatus(null);
        setIsCropActive(false);
        setIsAreaSelectionMode(false);
        showToast(`Successfully exported crisp custom PNG (${finalW}x${finalH})!`);
      } catch (err: any) {
        setExportStatus(null);
        showToast(`Capture error: ${err.message}`);
      }
    } 
    else if (exportFormat === 'mp4') {
      try {
        setExportStatus('Arming video recording stream...');
        setIsRecording(true);
        setRecordingCount(0);
        setRecordingElapsedMs(0);
        recordingStartTimeRef.current = Date.now();
        recordingTimerRef.current = setInterval(() => {
          setRecordingElapsedMs(Date.now() - recordingStartTimeRef.current);
        }, 100);

        // Render first frame
        await renderCompFrame();

        const canvasStream = (compositeCanvas as any).captureStream
          ? (compositeCanvas as any).captureStream(recordFPS)
          : (compositeCanvas as any).mozCaptureStream ? (compositeCanvas as any).mozCaptureStream(recordFPS) : null;

        if (!canvasStream) {
          throw new Error('Canvas recording streams are not supported in this browser environment.');
        }

        const options = { mimeType: 'video/webm' };
        const recordTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
        for (const type of recordTypes) {
          if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
            options.mimeType = type;
            break;
          }
        }

        const dataChunks: BlobPart[] = [];
        const recorder = new MediaRecorder(canvasStream, {
          mimeType: options.mimeType,
          videoBitsPerSecond: recordBps
        });
        activeMediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            dataChunks.push(event.data);
          }
        };

        const handleStopExport = () => {
          const extension = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
          const fileBlob = new Blob(dataChunks, { type: options.mimeType });
          const urlBlob = URL.createObjectURL(fileBlob);
          
          setExportStatus(null);
          setIsRecording(false);
        if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
        setRecordingElapsedMs(0);
          setIsRecordingPaused(false);
          activeMediaRecorderRef.current = null;
          
          // Clear active area selection overlay masks
          setIsCropActive(false);
          setIsAreaSelectionMode(false);
          
          setCompiledFile({
            url: urlBlob,
            filename: `specimen-${finalType}-interaction-${finalW}x${finalH}.${extension}`,
            extension: extension.toUpperCase()
          });
          showToast(`Recording compiled successfully!`);
        };

        recorder.onstop = handleStopExport;
        stopRecordingCallbackRef.current = () => {
          if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        };

        recorder.start();

        const intervalDelay = 1000 / recordFPS;
        const totalFramesCount = recordFPS * exportDuration;
        let elapsedFrames = 0;

        if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = setInterval(async () => {
          if (isRecordingPausedRef.current) {
            return; // skip ticks if paused
          }
          await renderCompFrame();
          elapsedFrames++;
          
          setRecordingCount(elapsedFrames / recordFPS);
          setExportStatus(`Capturing GPU frames... Interact on component now! ${Math.round((elapsedFrames / totalFramesCount) * 100)}%`);
          
          if (elapsedFrames >= totalFramesCount) {
            if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
            if (recorder.state !== 'inactive') {
              recorder.stop();
            }
          }
        }, intervalDelay);

      } catch (err: any) {
        setExportStatus(null);
        showToast(`Recording failure: ${err.message}`);
        setIsRecording(false);
        setIsRecordingPaused(false);
      }
    } 
    else if (exportFormat === 'gif') {
      try {
        setExportStatus('Recording snapshots...');
        setIsRecording(true);
        setRecordingCount(0);
        setRecordingElapsedMs(0);
        recordingStartTimeRef.current = Date.now();
        recordingTimerRef.current = setInterval(() => {
          setRecordingElapsedMs(Date.now() - recordingStartTimeRef.current);
        }, 100);

        const snapshots: string[] = [];
        const totalFramesCount = Math.round(recordFPS * exportDuration);
        const intervalDelay = 1000 / recordFPS;
        let elapsedFrames = 0;

        const handleStopExportGif = () => {
          if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
          setIsCropActive(false);
          setIsAreaSelectionMode(false);
          if (snapshots.length === 0) {
            setExportStatus(null);
            setIsRecording(false);
            showToast('No frames recorded to compile GIF.');
            return;
          }
          setExportStatus('Compiling animated GIF loop...');

          gifshot.createGIF({
            images: snapshots,
            gifWidth: finalW,
            gifHeight: finalH, 
            interval: 1 / recordFPS,
            numFrames: snapshots.length,
            sampleInterval: 2
          }, (obj: any) => {
            if (obj.error) {
              setExportStatus(null);
              showToast(`GIF Compilation Error: ${obj.errorMessage}`);
              setIsRecording(false);
              setIsRecordingPaused(false);
            } else {
              setExportStatus(null);
              setIsRecording(false);
              setIsRecordingPaused(false);
              setCompiledFile({
                url: obj.image,
                filename: `m3-specimen-interaction-${finalType}-${finalW}x${finalH}.gif`,
                extension: 'GIF'
              });
              showToast(`GIF compiled successfully!`);
            }
          });
        };

        stopRecordingCallbackRef.current = handleStopExportGif;

        if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
        recordIntervalRef.current = setInterval(async () => {
          if (isRecordingPausedRef.current) {
            return; // skip ticks if paused
          }
          await renderCompFrame();

          const dataUrl = compositeCanvas.toDataURL('image/png');
          snapshots.push(dataUrl);

          elapsedFrames++;
          setRecordingCount(elapsedFrames / recordFPS);
          setExportStatus(`Snap ${elapsedFrames}/${totalFramesCount} - Move cursor to record! (${Math.round((elapsedFrames / totalFramesCount) * 100)}%)`);

          if (elapsedFrames >= totalFramesCount) {
            handleStopExportGif();
          }
        }, intervalDelay);

      } catch (err: any) {
        setExportStatus(null);
        showToast(`GIF error: ${err.message}`);
        setIsRecording(false);
        setIsRecordingPaused(false);
      }
    }
  };

  // Direct Exporter logic
  const handleDirectExport = async () => {
    if (!isRecording && !isAreaSelectionMode) {
      if (!activeComp) {
        // Position HD-aspect ratio crop box in the middle of standard viewport bounds
        setCropRect({
          x: 300,
          y: 200,
          width: 600,
          height: 400
        });
      }
      setIsAreaSelectionMode(true);
      setIsCropActive(true);
      showToast(activeComp ? 'Define capture area of specimen, then click Confirm!' : 'Define canvas recording area, then click Confirm!');
    }
  };

  const handleButtonClick = () => {
    showToast('Button interaction fired!');
  };
  const cycleComponentSize = (compId: string) => {
    const comp = canvasComponents.find(c => c.id === compId);
    if (!comp) return;
    const sizes: Array<'xsmall'|'small'|'medium'|'large'|'xlarge'> = ['xsmall','small','medium','large','xlarge'];
    const cur = sizes.indexOf(comp.sizePreset as any);
    const next = sizes[(cur + 1) % sizes.length];
    const presets = M3_SIZE_PRESETS[comp.type as keyof typeof M3_SIZE_PRESETS];
    if (presets && presets[next]) {
      const { width, height, borderRadius } = presets[next];
      updateComponentField(compId, 'sizePreset', next);
      updateComponentField(compId, 'width', width);
      updateComponentField(compId, 'height', height);
      updateComponentField(compId, 'borderRadius', borderRadius);
    }
  };

  return (
    <div className="h-screen w-full bg-[#1E1E1E] text-[#E6E6E6] font-sans flex flex-col overflow-hidden relative select-none" id="figma-desktop-shell">
      
      {/* ================= MAIN INTERACTIVE WORKSPACE ================= */}
      <div className="flex-1 flex overflow-hidden w-full relative" id="figma-workspace-core">

        {/* ================= FIGMA LAYERS & WORKSPACE TOOLKIT (LEFT SIDEBAR) ================= */}
        <aside className="w-64 bg-[#2C2C2C] border-r border-[#1C1C1C] flex flex-col h-full select-none text-[#E6E6E6] shrink-0 z-30 overflow-y-auto" id="figma-left-control-sidebar">
          
          {/* Section 0: Connected Figma File Context & Saved Specs & Shared Views */}
          <div className="p-4 border-b border-[#1C1C1C] flex flex-col gap-3 shrink-0" id="figma-saved-viewport-module">
            
            {/* Action buttons list placed UNDER file title */}
            <div className="flex gap-1.5 pt-0.5">
              <button
                onClick={handleCreateNewCanvas}
                className="flex-1 text-[10px] text-neutral-300 hover:text-white bg-[#1E1E1E] hover:bg-neutral-800 p-1.5 rounded flex items-center justify-center gap-1 transition-all cursor-pointer font-bold border border-neutral-800/80 outline-none"
                title="Start a new blank spec view"
              >
                <Plus className="w-3 h-3 text-[#18A0FB]" />
                <span>New</span>
              </button>
              <button
                onClick={() => setIsSaveComboModalOpen(true)}
                className="flex-1 text-[10px] text-neutral-300 hover:text-white bg-[#1E1E1E] hover:bg-[#1E1E1E]/80 hover:bg-neutral-800 p-1.5 rounded flex items-center justify-center gap-1 transition-all cursor-pointer font-bold border border-neutral-800/80 outline-none"
                title="Save current layout block as combination"
              >
                <Save className="w-3 h-3 text-[#18A0FB]" />
                <span>Save</span>
              </button>
            </div>

            {/* Saved Layout Combinations scrollable inline list */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-sans text-neutral-450 font-bold uppercase tracking-wider block">Saved</span>
              {savedCombinations.length === 0 ? (
                <div className="text-[10.5px] p-2 bg-[#1E1E1E]/50 border border-neutral-800 rounded text-neutral-500 text-[#18A0FB]/40 text-center italic">
                  No saved setups found yet.
                </div>
              ) : (
                <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-1">
                  {savedCombinations.map((comb) => {
                    const isActive = activeCombinationId === comb.id;
                    const fileObj = linkedFigmaFiles.find(f => f.id === comb.figmaFileId);
                    const isNameEditing = editingCombinationId === comb.id;

                    return (
                      <div 
                        key={comb.id}
                        onClick={() => {
                          if (!isNameEditing) handleLoadCombination(comb);
                        }}
                        className={`group/combo flex items-center justify-between h-8 px-2 rounded text-xs transition-colors cursor-pointer border ${
                          isActive 
                            ? 'bg-[#18A0FB]/10 border-[#18A0FB]/40 text-white font-semibold' 
                            : 'bg-[#1E1E1E] hover:bg-neutral-800 border-neutral-800/40 text-neutral-300'
                        }`}
                      >
                        <div className="truncate flex-1 pr-1.5 flex items-center gap-1.5">
                          {isNameEditing ? (
                            <input
                              type="text"
                              value={editingCombinationName}
                              onChange={(e) => setEditingCombinationName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleRenameCombination(comb.id, editingCombinationName);
                                  setEditingCombinationId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingCombinationId(null);
                                }
                              }}
                              onBlur={() => {
                                handleRenameCombination(comb.id, editingCombinationName);
                                setEditingCombinationId(null);
                              }}
                              autoFocus
                              className="bg-[#2C2C2C] text-white border border-[#18A0FB] rounded px-1 text-[10.5px] w-full focus:outline-none py-0.5 font-sans"
                            />
                          ) : (
                            <>
                              {/* Open link manager modal on clicking the link icon */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveLinkCombination(comb);
                                  setIsLayerLinkModalOpen(true);
                                }}
                                className={`p-1 rounded hover:bg-neutral-800 transition-all flex items-center justify-center shrink-0 cursor-pointer border-none bg-transparent ${
                                  fileObj 
                                    ? 'text-[#18A0FB]' 
                                    : 'text-neutral-500 hover:text-neutral-400'
                                }`}
                                title={fileObj ? `Specs: ${fileObj.name} (Click to edit link)` : "No specs file linked. Click to link a Figma file"}
                              >
                                <Link2 className="w-3.5 h-3.5" />
                              </button>
                              <span 
                                className="truncate text-[11px] font-medium grow"
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCombinationId(comb.id);
                                  setEditingCombinationName(comb.name);
                                }}
                                title="Double-click to rename"
                              >
                                {comb.name}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Quick Rename / Delete button bar */}
                        <div className="flex items-center gap-1 opacity-0 group-hover/combo:opacity-100 transition-opacity shrink-0">
                          {!isNameEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCombinationId(comb.id);
                                setEditingCombinationName(comb.name);
                              }}
                              className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 cursor-pointer border-none flex items-center justify-center"
                              title="Rename combination"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareCombination(comb, e);
                            }}
                            className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 cursor-pointer border-none flex items-center justify-center"
                            title="Copy Share Web View URL"
                          >
                            <Share2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCombination(comb.id, e);
                            }}
                            className="p-1 rounded bg-neutral-800 text-rose-450 hover:text-rose-350 hover:bg-neutral-700 cursor-pointer border-none flex items-center justify-center"
                            title="Delete combination"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 1: Specimen Kit */}
          <div className="p-4 border-b border-[#1C1C1C] flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-sans uppercase text-neutral-450 font-bold tracking-wider">
              <span>M3 Components</span>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={() => handleAddNewComponent('card')}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#1E1E1E] hover:bg-[#18A0FB] hover:text-white text-[11px] font-semibold tracking-wide text-neutral-300 transition-colors shadow-sm outline-none border-none cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#18A0FB] group-hover:text-white" />
                <span>Card</span>
              </button>
              <button 
                onClick={() => handleAddNewComponent('button')}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#1E1E1E] hover:bg-[#18A0FB] hover:text-white text-[11px] font-semibold tracking-wide text-neutral-300 transition-colors shadow-sm outline-none border-none cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#18A0FB] group-hover:text-white" />
                <span>Button</span>
              </button>
              <button 
                onClick={() => handleAddNewComponent('chip')}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#1E1E1E] hover:bg-[#18A0FB] hover:text-white text-[11px] font-semibold tracking-wide text-neutral-300 transition-colors shadow-sm outline-none border-none cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#18A0FB] group-hover:text-white" />
                <span>Chip</span>
              </button>
              <button 
                onClick={() => handleAddNewComponent('fab')}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#1E1E1E] hover:bg-[#18A0FB] hover:text-white text-[11px] font-semibold tracking-wide text-neutral-300 transition-colors shadow-sm outline-none border-none cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#18A0FB] group-hover:text-white" />
                <span>FAB</span>
              </button>
              <button 
                onClick={() => handleAddNewComponent('dialog')}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#1E1E1E] hover:bg-[#18A0FB] hover:text-white text-[11px] font-semibold tracking-wide text-neutral-300 transition-colors shadow-sm outline-none border-none cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#18A0FB] group-hover:text-white" />
                <span>Dialog</span>
              </button>
              <button 
                onClick={() => handleAddNewComponent('sheets')}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#1E1E1E] hover:bg-[#18A0FB] hover:text-white text-[11px] font-semibold tracking-wide text-neutral-300 transition-colors shadow-sm outline-none border-none cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#18A0FB] group-hover:text-white" />
                <span>Page Sheets</span>
              </button>
              <button 
                onClick={() => handleAddNewComponent('avatar')}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#1E1E1E] hover:bg-[#18A0FB] hover:text-white text-[11px] font-semibold tracking-wide text-neutral-300 transition-colors shadow-sm outline-none border-none cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#18A0FB] group-hover:text-white" />
                <span>Avatar</span>
              </button>
              <button
                onClick={() => handleAddNewComponent('image')}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#1E1E1E] hover:bg-[#18A0FB] hover:text-white text-[11px] font-semibold tracking-wide text-neutral-300 transition-colors shadow-sm outline-none border-none cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#18A0FB] group-hover:text-white" />
                <span>Image</span>
              </button>
              <button 
                onClick={() => handleAddNewComponent('progress')}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#1E1E1E] hover:bg-[#18A0FB] hover:text-white text-[11px] font-semibold tracking-wide text-neutral-300 transition-colors shadow-sm outline-none border-none cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#18A0FB] group-hover:text-white" />
                <span>Progress</span>
              </button>
            </div>
          </div>

          {/* Section 2: Active Canvas Layers */}
          <div className="p-4 border-b border-[#1C1C1C] flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-sans uppercase text-neutral-450 font-bold tracking-wider">
              <span>Layers</span>
            </div>
            
            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
              {canvasComponents.length === 0 ? (
                <div className="text-[10px] text-neutral-500 italic p-1.5 text-center">No layers active</div>
              ) : (
                canvasComponents.map((c, idx) => {
                  const isSelected = selectedComponentId === c.id;
                  return (
                    <div 
                      key={c.id}
                      onClick={() => setSelectedComponentId(c.id)}
                      className={`group/layer flex items-center justify-between p-1.5 px-2 rounded text-xs transition-colors cursor-pointer select-none border ${
                        isSelected 
                          ? 'bg-[#18A0FB]/10 border-[#18A0FB]/40 text-white font-semibold' 
                          : 'bg-[#1E1E1E] hover:bg-neutral-800 border-neutral-800/40 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate flex-1">
                        <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="font-semibold truncate text-[11px] text-[#E6E6E6]">{c.name}</span>
                      </div>
                      
                      {/* Layer management speed bar */}
                      <div className="opacity-0 pointer-events-none group-hover/layer:opacity-100 group-hover/layer:pointer-events-auto flex items-center gap-1 transition-opacity shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLayer(c.id, 'down');
                          }}
                          disabled={idx === 0}
                          className={`p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 border-none outline-none cursor-pointer flex items-center justify-center ${
                            idx === 0 ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title="Move backward"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLayer(c.id, 'up');
                          }}
                          disabled={idx === canvasComponents.length - 1}
                          className={`p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 border-none outline-none cursor-pointer flex items-center justify-center ${
                            idx === canvasComponents.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title="Bring forward"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateComponent(c.id);
                          }}
                          className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 border-none outline-none cursor-pointer flex items-center justify-center"
                          title="Duplicate layer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComponent(c.id);
                          }}
                          className="p-1 rounded bg-neutral-800 text-rose-450 hover:text-rose-350 hover:bg-neutral-700 border-none outline-none cursor-pointer flex items-center justify-center"
                          title="Delete layer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3b: Global Theme (Color Library) */}
          <div className="px-4 py-3 border-b border-[#1C1C1C] flex flex-col gap-2 shrink-0">
            <span className="text-[10px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Theme</span>
            <div className="relative">
              <select
                value={globalColorLibrary}
                onChange={(e) => {
                  const newTheme = e.target.value;
                  setGlobalColorLibrary(newTheme);
                  setCanvasComponents(prev => prev.map(c => ({ ...c, colorLibrary: newTheme })));
                  showToast(`Theme: ${(M3_COLOR_LIBRARIES[newTheme] as any)?.name || newTheme}`);
                }}
                className="w-full bg-[#1E1E1E] text-neutral-200 border border-neutral-700/30 rounded px-2.5 py-1.5 text-xs focus:border-[#18A0FB] focus:outline-none appearance-none cursor-pointer font-sans h-8"
              >
                {Object.entries({ ...M3_COLOR_LIBRARIES }).map(([key, lib]) => (
                  <option key={key} value={key}>{(lib as any).name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center px-1.5 text-neutral-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Section 4: Canvas Mode & Frame Backdrop preferences */}
          <div className="p-4 flex flex-col gap-3 shrink-0" id="figma-viewer-frame-preferences">
            <div className="flex flex-col gap-1.5 text-[10px] font-sans uppercase text-neutral-350 font-bold tracking-wider">
              <span>Canvas</span>
              <div className="flex bg-[#1E1E1E] p-0.5 rounded border border-neutral-700/30 items-center justify-center h-8 self-start">
                <button
                  onClick={() => {
                    setCanvasBgMode('dark');
                    showToast("Canvas Dark Mode Active.");
                  }}
                  className={`px-3 h-full rounded text-[9.5px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer border-none outline-none ${
                    canvasBgMode === 'dark' ? 'bg-[#18A0FB] text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Dark view mode spec"
                >
                  <Moon className="w-3 h-3" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => {
                    setCanvasBgMode('light');
                    showToast("Canvas Light Mode Active.");
                  }}
                  className={`px-3 h-full rounded text-[9.5px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer border-none outline-none ${
                    canvasBgMode === 'light' ? 'bg-[#18A0FB] text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Light view mode spec"
                >
                  <Sun className="w-3 h-3" />
                  <span>Light</span>
                </button>
              </div>
            </div>

            {/* Design Backdrop Controls Integration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-sans uppercase text-neutral-450 font-bold tracking-wider leading-none">
                <span>Backdrop</span>
              </div>

              {/* Backdrop type selectors with h-8 height matching the format ones */}
              <div className="h-8 grid grid-cols-4 gap-0.5 bg-[#1E1E1E] p-0.5 rounded-md border border-neutral-800 text-center items-center">
                {[
                  { mode: 'solid', label: 'Solid' },
                  { mode: 'uploaded', label: 'PNG' },
                  { mode: 'live', label: 'Live' },
                  { mode: 'figma', label: 'Figma' }
                ].map((btn) => {
                  const isSelected = activeBackdrop === btn.mode;
                  return (
                    <button
                      key={btn.mode}
                      onClick={() => {
                        setActiveBackdrop(btn.mode);
                        setIsBackdropVisible(true);
                        showToast(`Backdrop state swapped: ${btn.label}`);
                      }}
                      className={`text-[9.5px] h-full flex items-center justify-center font-bold rounded-sm transition-all cursor-pointer border-none ${
                        isSelected 
                          ? 'bg-[#18A0FB] text-white shadow' 
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>

              {/* Solid color backdrop panel with swatch list and custom color picker */}
              {activeBackdrop === 'solid' && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1 bg-[#1E1E1E] p-2 rounded border border-neutral-800/80">
                    <span className="text-[9.5px] font-sans font-bold text-neutral-450 uppercase tracking-wider block mb-1.5">Colors</span>
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* All theme token colors — update when theme changes */}
                        {(() => {
                          const libKey = activeComp ? (activeComp.colorLibrary || globalColorLibrary) : globalColorLibrary;
                          const lib = (customLibraries[libKey] || M3_COLOR_LIBRARIES[libKey]) || M3_COLOR_LIBRARIES['baseline-blue'];
                          const lc = lib.colors.light;
                          const dc = lib.colors.dark;
                          const swatches = [
                            { hex: lc.primary.bg,   label: `Primary · Light · ${lc.primary.bg}` },
                            { hex: dc.primary.bg,   label: `Primary · Dark · ${dc.primary.bg}` },
                            { hex: lc.secondary.bg, label: `Secondary · Light · ${lc.secondary.bg}` },
                            { hex: dc.secondary.bg, label: `Secondary · Dark · ${dc.secondary.bg}` },
                            { hex: lc.surface.bg,   label: `Surface · Light · ${lc.surface.bg}` },
                            { hex: dc.surface.bg,   label: `Surface · Dark · ${dc.surface.bg}` },
                            { hex: lc.primary.text, label: `On-Primary · Light · ${lc.primary.text}` },
                            { hex: dc.primary.text, label: `On-Primary · Dark · ${dc.primary.text}` },
                          ];
                          const seen = new Set<string>();
                          const unique = swatches.filter(s => { const k = s.hex.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
                          return unique.map((swatch) => (
                            <button
                              key={swatch.label}
                              onClick={() => { setBackdropSolidColor(swatch.hex); showToast(`Backdrop → ${swatch.label}`); }}
                              className={`w-5 h-5 rounded-full border cursor-pointer relative transition-transform ${
                                backdropSolidColor.toLowerCase() === swatch.hex.toLowerCase()
                                  ? 'border-[#18A0FB] scale-110 shadow shadow-[#18A0FB]/20'
                                  : 'border-neutral-700 hover:border-neutral-500 hover:scale-105'
                              }`}
                              style={{ backgroundColor: swatch.hex }}
                              title={swatch.label}
                            >
                              {backdropSolidColor.toLowerCase() === swatch.hex.toLowerCase() && (
                                <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]">✓</span>
                              )}
                            </button>
                          ));
                        })()}
                          {/* Custom color — inline with theme swatches */}
                          {(() => {
                            const libKey2 = activeComp ? (activeComp.colorLibrary || globalColorLibrary) : globalColorLibrary;
                            const lib2 = (customLibraries[libKey2] || M3_COLOR_LIBRARIES[libKey2]) || M3_COLOR_LIBRARIES['baseline-blue'];
                            const presetHexes = [lib2.colors.light.primary.bg,lib2.colors.dark.primary.bg,lib2.colors.light.secondary.bg,lib2.colors.dark.secondary.bg,lib2.colors.light.surface.bg,lib2.colors.dark.surface.bg,lib2.colors.light.primary.text,lib2.colors.dark.primary.text].map(h=>h.toLowerCase());
                            const isCustomActive = !presetHexes.includes(backdropSolidColor.toLowerCase());
                            return (
                              <div
                                className={`relative w-5 h-5 rounded-full overflow-hidden border flex items-center justify-center cursor-pointer transition-all shrink-0 ${isCustomActive?'border-[#18A0FB] scale-110':'border-neutral-700 hover:border-neutral-500'}`}
                                style={isCustomActive?{backgroundColor:backdropSolidColor}:{backgroundImage:'linear-gradient(135deg,#ff0055,#ffdd00,#00ffaa,#00a2ff,#bb00ff)'}}
                                title="Custom color">
                                <input type="color" value={isCustomActive?backdropSolidColor:'#333333'}
                                  onChange={(e)=>{setBackdropSolidColor(e.target.value);}}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"/>
                              </div>
                            );
                          })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload input for PNG backdrop nested nicely here */}
              {activeBackdrop === 'uploaded' && (
                <div className="space-y-1 leading-normal pt-1">
                  <label className="flex items-center justify-center gap-1.5 h-8 p-1 px-3 rounded border border-dashed border-neutral-800 hover:border-[#18A0FB] bg-[#1E1E1E]/40 cursor-pointer text-center hover:bg-neutral-800 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#18A0FB] shrink-0" />
                    <span className="text-[9.5px] font-sans font-bold uppercase tracking-wider text-neutral-300 truncate">
                      {uploadedFrameName ? uploadedFrameName : 'Choose PNG Spec'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileSelect} 
                      className="hidden" 
                    />
                  </label>
                </div>
              )}

              {/* Live URL address input nested nicely here */}
              {activeBackdrop === 'live' && (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="url"
                    value={liveFrameUrl}
                    onChange={(e) => setLiveFrameUrl(e.target.value)}
                    className="w-full bg-[#2C2C2C] text-neutral-200 border border-neutral-700/30 rounded px-2.5 py-1 text-xs focus:border-[#18A0FB] focus:outline-none font-sans"
                    placeholder="https://preview-url.com"
                  />
                </div>
              )}

            </div>
          </div>

          {/* Section 4: Aurora API Reference & Sizing Specs */}
          <div className="p-4 border-t border-[#1C1C1C] flex flex-col gap-2.5 shrink-0 bg-[#242424]/40 text-[#E6E6E6]" id="m3-api-link-module">
            <div className="flex items-center justify-between text-[10px] font-sans uppercase text-neutral-450 font-bold tracking-wider">
              <span>Figma API Link</span>
            </div>

            <div className="bg-[#1E1E1E] p-2.5 rounded-lg border border-neutral-800 space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-sans">
                  <span className="text-neutral-500 font-bold uppercase tracking-wider">Endpoint API URL</span>
                  <button 
                    onClick={() => setIsEditingApiUrl(!isEditingApiUrl)}
                    className="text-[#18A0FB] hover:text-[#18A0FB]/80 transition-colors cursor-pointer flex items-center gap-0.5 font-bold border-none bg-transparent outline-none p-0"
                    title={isEditingApiUrl ? 'Cancel edit' : 'Edit API URL'}
                  >
                    {isEditingApiUrl ? <X className="w-3 h-3 text-red-100" /> : <Pencil className="w-2.5 h-2.5" />}
                  </button>
                </div>

                {isEditingApiUrl ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      value={apiUrl}
                      onChange={(e) => {
                        setApiUrl(e.target.value);
                      }}
                      className="flex-1 bg-[#2C2C2C] text-neutral-200 border border-neutral-700/40 rounded px-2 py-1 text-[10.5px] focus:border-[#18A0FB] focus:outline-none font-mono tracking-wide"
                      placeholder="Enter API URL"
                    />
                    <button
                      onClick={() => {
                        localStorage.setItem('m3_api_url', apiUrl);
                        setIsEditingApiUrl(false);
                        showToast("Saved customized Aurora API Link!");
                      }}
                      className="p-1 rounded bg-[#18A0FB] hover:bg-[#18A0FB]/80 text-white flex items-center justify-center border-none cursor-pointer shadow-sm transition-all"
                      title="Save custom API link"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-[#2C2C2C] border border-neutral-800 rounded px-2 py-1 gap-1.5 text-[10.5px] group/apilink overflow-hidden">
                    <a
                      href={apiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#18A0FB] hover:underline font-mono truncate text-[10px] select-all flex-1"
                    >
                      {apiUrl}
                    </a>
                    <ExternalLink className="w-3 h-3 text-neutral-500 shrink-0 group-hover/apilink:text-[#18A0FB] transition-colors" />
                  </div>
                )}
              </div>
            </div>
          </div>

        </aside>

         {/* CENTER CAMERA VIEWPORT: FIGMA EDITOR CANVAS */}
        <main 
          className={`flex-1 flex flex-col items-center justify-center relative p-8 transition-colors duration-300 ${
            canvasBgMode === 'dark' ? 'bg-[#1E1E1E]' : 'bg-[#F4F4F6]'
          }`} 
          id="figma-editor-canvas"
          onMouseMove={(e) => {
            if (!dragSelect) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setDragSelect(d => d ? { ...d, curX: e.clientX - rect.left, curY: e.clientY - rect.top } : null);
          }}
          onMouseUp={(e) => {
            if (!dragSelect) { return; }
            const rect = e.currentTarget.getBoundingClientRect();
            const sx = Math.min(dragSelect.startX, dragSelect.curX);
            const sy = Math.min(dragSelect.startY, dragSelect.curY);
            const ex = Math.max(dragSelect.startX, dragSelect.curX);
            const ey = Math.max(dragSelect.startY, dragSelect.curY);
            if (ex - sx > 8 || ey - sy > 8) {
              const cw = rect.width; const ch = rect.height;
              const newIds = new Set<string>();
              canvasComponents.forEach(comp => {
                const cx = cw/2 + comp.x; const cy = ch/2 + comp.y;
                const cl = cx - comp.width/2; const ct = cy - comp.height/2;
                const cr = cx + comp.width/2; const cb = cy + comp.height/2;
                if (cr > sx && cl < ex && cb > sy && ct < ey) newIds.add(comp.id);
              });
              setSelectedIds(newIds);
            }
            setDragSelect(null);
          }}
          data-theme={canvasBgMode}
          style={{
            ...(isBackdropVisible && activeBackdrop === 'solid' ? { backgroundColor: backdropSolidColor } : {}),
            // Inject theme tokens so all md- components pick up the active color library
            '--md-sys-color-primary': (() => { const k = globalColorLibrary||'baseline-blue'; const lib=(customLibraries[k]||M3_COLOR_LIBRARIES[k]||M3_COLOR_LIBRARIES['baseline-blue']); return lib.colors[canvasBgMode].primary.bg; })(),
            '--md-sys-color-on-primary': (() => { const k = globalColorLibrary||'baseline-blue'; const lib=(customLibraries[k]||M3_COLOR_LIBRARIES[k]||M3_COLOR_LIBRARIES['baseline-blue']); return lib.colors[canvasBgMode].primary.text; })(),
            '--md-sys-color-primary-container': (() => { const k = globalColorLibrary||'baseline-blue'; const lib=(customLibraries[k]||M3_COLOR_LIBRARIES[k]||M3_COLOR_LIBRARIES['baseline-blue']); return lib.colors[canvasBgMode].secondary.bg; })(),
            '--md-sys-color-on-primary-container': (() => { const k = globalColorLibrary||'baseline-blue'; const lib=(customLibraries[k]||M3_COLOR_LIBRARIES[k]||M3_COLOR_LIBRARIES['baseline-blue']); return lib.colors[canvasBgMode].secondary.text; })(),
            '--md-sys-color-secondary-container': (() => { const k = globalColorLibrary||'baseline-blue'; const lib=(customLibraries[k]||M3_COLOR_LIBRARIES[k]||M3_COLOR_LIBRARIES['baseline-blue']); return lib.colors[canvasBgMode].secondary.bg; })(),
            '--md-sys-color-on-secondary-container': (() => { const k = globalColorLibrary||'baseline-blue'; const lib=(customLibraries[k]||M3_COLOR_LIBRARIES[k]||M3_COLOR_LIBRARIES['baseline-blue']); return lib.colors[canvasBgMode].secondary.text; })(),
            '--md-sys-color-surface': (() => { const k = globalColorLibrary||'baseline-blue'; const lib=(customLibraries[k]||M3_COLOR_LIBRARIES[k]||M3_COLOR_LIBRARIES['baseline-blue']); return lib.colors[canvasBgMode].surface.bg; })(),
            '--md-sys-color-surface-container-low': (() => { const k = globalColorLibrary||'baseline-blue'; const lib=(customLibraries[k]||M3_COLOR_LIBRARIES[k]||M3_COLOR_LIBRARIES['baseline-blue']); return lib.colors[canvasBgMode].surface.bg; })(),
            '--md-sys-color-on-surface': (() => { const k = globalColorLibrary||'baseline-blue'; const lib=(customLibraries[k]||M3_COLOR_LIBRARIES[k]||M3_COLOR_LIBRARIES['baseline-blue']); return lib.colors[canvasBgMode].surface.text; })(),
            '--md-sys-color-on-surface-variant': (() => { const k = globalColorLibrary||'baseline-blue'; const lib=(customLibraries[k]||M3_COLOR_LIBRARIES[k]||M3_COLOR_LIBRARIES['baseline-blue']); return lib.colors[canvasBgMode].surface.subtext; })(),
          } as React.CSSProperties}
          onMouseDown={(e) => {
            window.focus();
            if (e.target === e.currentTarget) {
              if (!e.shiftKey) {
                setSelectedComponentId('');
                setSelectedIds(new Set());
              }
              // Start drag-select
              const rect = e.currentTarget.getBoundingClientRect();
              setDragSelect({ startX: e.clientX - rect.left, startY: e.clientY - rect.top, curX: e.clientX - rect.left, curY: e.clientY - rect.top });
            }
            // Capturing click anywhere on/off components on the canvas
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.round(e.clientX - rect.left);
            const y = Math.round(e.clientY - rect.top);
            const clickId = Math.random().toString(36).substring(2, 9);
            const newClick: InteractiveClick = {
              id: clickId,
              x,
              y,
              timestamp: Date.now(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
            setRecordedClicks(prev => [...prev.slice(-9), newClick]);
            setTimeout(() => {
              setRecordedClicks(prev => prev.filter(c => c.id !== clickId));
            }, 1200);
          }}
        >
          
          {/* Subpixel Dotted Grid Background */}
          {gridVisible && (
            <div 
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: canvasBgMode === 'dark'
                  ? 'radial-gradient(rgba(255, 255, 255, 0.05) 0.75px, transparent 0.75px)'
                  : 'radial-gradient(rgba(0, 0, 0, 0.075) 0.75px, transparent 0.75px)',
                backgroundSize: '16px 16px',
                zIndex: 0
              }}
            />
          )}

          {/* =========================================================================================
              DESIGN CONTEXT BACKDROP SYSTEM
              ============================================================================*/}
          {isBackdropVisible && (
            <div className="absolute inset-0 z-1 pointer-events-none flex items-center justify-center overflow-hidden animate-fade-in">
              {/* PNG Uploaded Frame Backdrop */}
              {activeBackdrop === 'uploaded' && uploadedFrameUrl && (
                <div 
                  className="absolute transition-all duration-300"
                  style={{
                    backgroundImage: `url(${uploadedFrameUrl})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    width: '90%',
                    height: '90%',
                    opacity: backdropOpacity,
                    transform: `scale(${backdropScale / 100})`
                  }}
                />
              )}

              {/* Live / Figma Frame Backdrop */}
              {(activeBackdrop === 'live' || activeBackdrop === 'figma') && liveFrameUrl && (
                <div
                  className="absolute inset-0 z-0 overflow-hidden bg-white"
                  style={{ opacity: 1 }}
                >
                  <iframe
                    src={liveFrameUrl}
                    title={activeBackdrop === 'figma' ? 'Figma Frame' : 'Live Preview'}
                    scrolling="no"
                    allow="fullscreen"
                    referrerPolicy="no-referrer"
                    style={{ overflow: 'hidden', border: 'none', width: '100%', height: '100%', pointerEvents: 'none', userSelect: 'none', display: 'block' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* =========================================================================================
              SELECTABLE, MOVABLE & RESIZABLE MATERIAL 3 SPECIMEN
              ========================================================================================= */}
          {/* =========================================================================================
              SELECTABLE, MOVABLE & RESIZABLE MULTIPLE MATERIAL 3 SPECIMENS
              ========================================================================================= */}
          <div className="absolute inset-0 pb-20 z-10 pointer-events-none flex items-center justify-center">
            {canvasComponents.length === 0 ? (
              <div 
                className="pointer-events-auto text-center font-sans max-w-xs p-8 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.80)',
                  backdropFilter: 'blur(20px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: canvasBgMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)' }}
                >
                  <span 
                    className={`material-symbols-outlined text-[20px] select-none ${
                      'text-neutral-900'
                    }`}
                  >
                    space_dashboard
                  </span>
                </div>
                <span 
                  className={`text-[11.5px] select-none block font-bold uppercase tracking-wider ${
                    'text-neutral-900'
                  }`}
                >
                  Canvas is empty
                </span>
                <span 
                  className={`text-[9.5px] select-none leading-relaxed mt-0.5 ${
                    'text-neutral-700'
                  }`}
                >
                  Click on any specimen from the specimen kit sidebar to add it.
                </span>
              </div>
            ) : (
              <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Multi-select drag box */}
          {dragSelect && (
            <div style={{
              position: 'absolute',
              left: Math.min(dragSelect.startX, dragSelect.curX),
              top: Math.min(dragSelect.startY, dragSelect.curY),
              width: Math.abs(dragSelect.curX - dragSelect.startX),
              height: Math.abs(dragSelect.curY - dragSelect.startY),
              border: '1.5px solid #18A0FB',
              backgroundColor: 'rgba(24,160,251,0.08)',
              pointerEvents: 'none',
              zIndex: 999,
              borderRadius: 2,
            }} />
          )}

          {canvasComponents.map((comp) => {
                  const isSelected = selectedComponentId === comp.id;
                  // Resolve spec colors
                  const themeColors = getM3SpecificStyles(comp, canvasBgMode);
                  const compBgColor = themeColors.bg;
                  const compTextColor = themeColors.text;
                  const compSubtextColor = themeColors.subtext;
                  const compBorderColor = themeColors.borderColor;
                  const compShadow = themeColors.shadow;
                  const hasBaseShaderBg = themeColors.hasBaseShaderBg;

                  const libKey = comp.colorLibrary || globalColorLibrary || 'baseline-blue';
                  const lib = (customLibraries[libKey] || M3_COLOR_LIBRARIES[libKey]) || M3_COLOR_LIBRARIES['baseline-blue'];
                  const libColors = lib.colors[canvasBgMode];

                  const compState = comp.activeState !== undefined ? comp.activeState : 0;
                  const compPreviousState = comp.previousState !== undefined ? comp.previousState : 0;
                  const compTransitionVal = comp.transitionVal !== undefined ? comp.transitionVal : 1.0;

                  // Resolve dynamic, pristine fluid/energy colors directly from official Material 3 Energy API state tokens
                  const getEnergyColorsForState = (stateId: number) => {
                    const stateObj = OFFICIAL_STATES.find(s => s.id === stateId);
                    if (stateObj) {
                      return {
                        mid: stateObj.defaultMid,
                        end: stateObj.defaultEnd
                      };
                    }
                    return {
                      mid: compBgColor,
                      end: compBgColor
                    };
                  };

                  const prevStateColors = getEnergyColorsForState(compPreviousState);
                  const currStateColors = getEnergyColorsForState(compState);

                  const compMidColor = interpolateHexColors(prevStateColors.mid, currStateColors.mid, compTransitionVal);
                  const compEndColor = interpolateHexColors(prevStateColors.end, currStateColors.end, compTransitionVal);

                  // Define whether active state has blurred/bloomed boundaries defined by the M3 fluid / energy API
                  // "I believe when the variant is named outline, no blurring takes place outside of the component container"
                  // Anticipating (5) = contained energy — no edge blur
                  const isStateBlurred = (compState === 2 || compState === 3 || compState === 4) &&
                                         comp.variant !== 'outlined' &&
                                         comp.variant !== 'outline' &&
                                         comp.variant !== 'text' &&
                                         comp.variant !== 'assist';
                  const isAnticipating = compState === 5;

                  // Boundary warping/deforming only happens in states 2, 3, and 4 (excluding 5)
                  const isBoundaryWarped = (compState === 2 || compState === 3 || compState === 4) &&
                                           comp.variant !== 'outlined' &&
                                           comp.variant !== 'outline' &&
                                           comp.variant !== 'text' &&
                                           comp.variant !== 'assist';

                  // Convert hex to rgb for fallback border bloom
                  const hexToRgbStr = (hex: string, alpha: number) => {
                    try {
                      const r = parseInt(hex.slice(1, 3), 16);
                      const g = parseInt(hex.slice(3, 5), 16);
                      const b = parseInt(hex.slice(5, 7), 16);
                      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    } catch (e) {
                      return `rgba(66, 133, 244, ${alpha})`;
                    }
                  };

                  // Get active state color for border bloom directly from dynamic primary/secondary colors
                  const statusGlowColor = hexToRgbStr(currStateColors.mid, 0.55);

                  // Compute dynamic layered glow shadow following the speed/intensity
                  const dynamicGlow = comp.type === 'progress' || isStateBlurred 
                    ? 'none'
                    : (canvasBgMode === 'dark' ? '0 16px 40px rgba(0,0,0,0.5)' : '0 10px 24px rgba(0,0,0,0.08)');

                  // Compute physical card container blur (melts edges as per the API)
                  const containerFilter = 'none';

                  // Per-component intensity: use comp override or global
                  const compIntensity = comp.compIntensity ?? intensity;
                  const isContainerSpecimen = ['card', 'dialog', 'sheets'].includes(comp.type);
                  const effectiveIntensity = isContainerSpecimen ? compIntensity : compIntensity * 0.5;
                  const innerCanvasFilter = isStateBlurred
                    ? isContainerSpecimen
                      ? `blur(${compIntensity * 3}px) saturate(1.25) brightness(1.05)`
                      : `blur(${compIntensity * 0.8}px) saturate(1.1)`
                    : 'none';
                  // Material symbol icons
                  const rawIcon = comp.activeIcon || 'volume_up';
                  const localIcon = (rawIcon === 'sparkles' || rawIcon === 'sparkle' || rawIcon === 'auto_awesome') ? 'auto_awesome' : rawIcon;

                  // Sizing classes/styles
                  const sizeMetrics = M3_SIZE_PRESETS[comp.type]?.[comp.sizePreset] || { width: comp.width, height: comp.height, borderRadius: comp.borderRadius };

                  // Font styles
                  const titleFont = M3_FONT_STYLES[comp.fontStyleTitle] || (comp.type === 'card' ? M3_FONT_STYLES.titleMedium : M3_FONT_STYLES.titleLarge);
                  const descFont = M3_FONT_STYLES[comp.fontStyleText] || M3_FONT_STYLES.bodyMedium;
                  const isElementSpecimen = ['button', 'chip', 'fab', 'badge', 'avatar', 'progress', 'image'].includes(comp.type);

                  return (
                    <div 
                      key={comp.id}
                      id={`specimen-wrapper-${comp.id}`}
                      className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing group/comp transition-[filter,box-shadow] duration-300 ${
                        (isSelected && !isRecording && recordingCountdown === null) ? 'ring-2 ring-[#18A0FB] ring-offset-2 ring-offset-[#1E1E1E] z-30' : (selectedIds.has(comp.id) && !isRecording) ? 'ring-2 ring-[#18A0FB] ring-offset-1 ring-offset-[#1E1E1E]/50 z-25' : (isRecording || recordingCountdown !== null ? 'z-20' : 'hover:ring-1 hover:ring-[#18A0FB]/50 z-20')
                      }`}
                      style={{
                        left: `calc(50% + ${comp.x}px)`,
                        top: `calc(50% + ${comp.y}px)`,
                        transform: 'translate(-50%, -50%)',
                        width: comp.type === 'avatar' ? `${comp.width}px` : comp.sizeMode === 'auto' ? 'auto' : `${comp.width}px`,
                        height: comp.type === 'avatar' ? `${comp.width}px` : comp.heightMode === 'auto' ? 'auto' : `${comp.height}px`,
                        minWidth: isElementSpecimen ? 'auto' : '120px',
                        minHeight: isElementSpecimen ? 'auto' : '60px',
                        borderRadius: comp.type === 'avatar' ? '50%' : `${comp.borderRadius}px`,
                        boxShadow: isElementSpecimen ? 'none' : dynamicGlow,
                        background: 'transparent',
                        filter: containerFilter
                      }}
                      onMouseDown={(e) => {
                        // Don't intercept clicks on editable text — let them focus
                        if ((e.target as HTMLElement).isContentEditable) return;
                        if (e.shiftKey) {
                          e.stopPropagation();
                          setSelectedIds(prev => {
                            const next = new Set(prev);
                            if (next.has(comp.id)) next.delete(comp.id);
                            else next.add(comp.id);
                            return next;
                          });
                          return;
                        }
                        if (!selectedIds.has(comp.id)) setSelectedIds(new Set());
                        handleMoveStart(e, comp.id);
                      }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.round(e.clientX - rect.left);
                        const y = Math.round(e.clientY - rect.top);
                        setRecMousePos({ x, y });
                      }}
                      onMouseLeave={() => {
                        setRecMousePos({ x: -100, y: -100 });
                      }}
                    >
                  {/* Select badge overlay hidden during recording so it does not clutter */}
                  {isSelected && !isRecording && recordingCountdown === null && (
                    <div className="absolute -top-7 left-0 whitespace-nowrap flex-nowrap min-w-max w-max bg-[#18A0FB] text-white text-[10px] font-sans font-bold uppercase tracking-wide px-2 py-0.5 rounded shadow flex items-center gap-1.5 select-none z-40">
                      <span>{comp.type}</span>
                      <span className="opacity-60">|</span>
                      <span>{comp.width} X {comp.height} px</span>
                    </div>
                  )}

                  {/* Energy applied directly to component container */}
                  {/* DYNAMIC SHADER SURFACE CONTAINER - 100% PRISTINE */}
                  <div
                    className={`relative overflow-visible flex flex-col justify-between w-full ${comp.heightMode === 'auto' ? '' : 'h-full'}`}
                    style={{
                      borderRadius: comp.type === 'avatar' ? '50%' : `${comp.borderRadius}px`,
                      isolation: 'isolate',
                    }}
                  >
                    {/* Morphing background layer representing the active kinetic/liquid Container */}
                    <div
                      className={`absolute inset-0 z-0 transition-[border-color,background-color] duration-300 ${
                        isBoundaryWarped && isAnimationActive 
                          ? (compState === 2 ? 'energy-edge-listening' :
                             compState === 3 ? 'energy-edge-responding' :
                             compState === 4 ? 'energy-edge-processing' : 'energy-edge-listening')
                          : ''
                      }`}
                      style={{
                        borderRadius: (isBoundaryWarped && isAnimationActive) ? undefined : (comp.type === 'avatar' ? '50%' : `${comp.borderRadius}px`),
                        ['--edge-br' as any]: `${comp.borderRadius}px`,
                        ['--intensity' as any]: intensity,
                        ['--intensity-multiplier' as any]: intensity,
                        backgroundColor: (isElementSpecimen || compState !== 0) ? 'transparent' : compBgColor,
                        filter: (isBoundaryWarped && isAnimationActive) ? 'url(#m3-energy-warp-filter)' : 'none',
                        boxShadow: isElementSpecimen
                          ? 'none'
                          : (isStateBlurred || isAnticipating) && isAnimationActive
                          ? isAnticipating
                            ? `inset 0 0 ${effectiveIntensity * 18}px ${statusGlowColor}80, 0 0 ${effectiveIntensity * 2}px ${statusGlowColor}20`
                            : `0 0 ${intensity * 12 + 6}px ${statusGlowColor}, inset 0 0 ${intensity * 6 + 2}px ${statusGlowColor}`
                          : compShadow,
                        border: isElementSpecimen
                          ? 'none'
                          : (compState !== 0 && isContainerSpecimen)
                          ? 'none'
                          : compBorderColor !== 'transparent'
                          ? `1.5px solid ${compBorderColor}`
                          : 'none',
                        overflow: isBoundaryWarped ? 'visible' : 'hidden'
                      }}
                    >
                      {/* GLSL dynamic webgl fluid wave rendering canvas wrapper with dynamic bleed and blur inside the active background container */}
                      {hasBaseShaderBg && compState !== 0 && (
                        <div 
                          className="absolute pointer-events-none transition-all duration-300"
                          style={{
                            left: isBoundaryWarped ? '-80px' : '0px',
                            top: isBoundaryWarped ? '-80px' : '0px',
                            width: isBoundaryWarped ? 'calc(100% + 160px)' : '100%',
                            height: isBoundaryWarped ? 'calc(100% + 160px)' : '100%',
                            maxWidth: 'none',
                            filter: innerCanvasFilter,
                            zIndex: 0,
                            opacity: 1.0,
                          }}
                        >
                          <ShaderRenderer
                            canvasId={`canvas-for-${comp.id}`}
                            state={compState}
                            previousState={compPreviousState}
                            transition={compTransitionVal}
                            width={comp.width}
                            height={comp.height}
                            borderRadius={comp.borderRadius}
                            baseColorHex={compBgColor}
                            midColorHex={compMidColor}
                            endColorHex={compEndColor}
                            hoverActive={isHovered && isSelected}
                            renderMode={0}
                            intensity={effectiveIntensity}
                            isActive={isAnimationActive}
                          />
                        </div>
                      )}
                    </div>

                    {/* Inline custom css style block for high-accuracy hardware click ripple rendering */}
                     <style>{`
                       @keyframes clickRippleAnimation {
                         0% { transform: scale(0.4); opacity: 1; }
                         100% { transform: scale(2.4); opacity: 0; }
                       }
                       .click-ripple-animate {
                         animation: clickRippleAnimation 0.9s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
                       }
                       ${compState !== 0 ? `
                         #specimen-wrapper-${comp.id} .md-card,
                         #specimen-wrapper-${comp.id} .md-card--elevated,
                         #specimen-wrapper-${comp.id} .md-card--filled,
                         #specimen-wrapper-${comp.id} .md-card--outlined,
                         #specimen-wrapper-${comp.id} .md-dialog,
                         #specimen-wrapper-${comp.id} .md-bottom-sheet,
                         #specimen-wrapper-${comp.id} .md-side-sheet {
                           background-color: transparent !important;
                           background: transparent !important;
                           box-shadow: none !important;
                         }
                       ` : ''}
                       ${(compState !== 0 && isElementSpecimen && comp.type !== 'fab') ? `
                         #specimen-wrapper-${comp.id} .md-button,
                         #specimen-wrapper-${comp.id} .md-chip,
                         #specimen-wrapper-${comp.id} .md-avatar {
                           background-color: transparent !important;
                           background: transparent !important;
                           box-shadow: none !important;
                         }
                         #avatar-circle-${comp.id} {
                           background-color: transparent !important;
                         }
                       ` : ''}
                     `}</style>


                    {/* =========================================================
                        PRECISE CLEAN MATERIAL 3 COMPONENT SPECIMEN
                        ========================================================= */}
                    <div 
                      className="relative w-full h-full z-10 flex flex-col pointer-events-auto shrink-0 grow justify-center"
                      onMouseDown={(e) => {
                        // Don't intercept clicks on editable text
                        if ((e.target as HTMLElement).isContentEditable) return;
                        handleSpecimenClick(e, comp.id);
                      }}
                    >
                      {/* SPECIMEN: BUTTON */}
                      {/* SPECIMEN: BUTTON */}
                      {comp.type === 'button' && (() => {
                        const btnSize = comp.sizePreset === 'xsmall' ? 'xs' : comp.sizePreset === 'small' ? 's' : comp.sizePreset === 'large' ? 'l' : comp.sizePreset === 'xlarge' ? 'xl' : 'm';
                        const hasText = !!(comp.text && comp.text.trim().length > 0);
                        const iconOnly = comp.configShowIcon && !hasText;
                        const iconOnlySize = btnSize === 'xs' ? 28 : btnSize === 's' ? 32 : btnSize === 'l' ? 48 : btnSize === 'xl' ? 56 : 40;
                        return (
                          <M3Button
                            variant={(comp.variant as any) || 'filled'}
                            size={btnSize}
                            onClick={handleButtonClick}
                            icon={comp.configShowIcon ? localIcon : undefined}
                            className="pointer-events-auto"
                            style={iconOnly ? { paddingLeft: 0, paddingRight: 0, width: iconOnlySize, minWidth: 0, justifyContent: 'center' } as React.CSSProperties : undefined}
                          >
                            {hasText ? (
                              <span contentEditable suppressContentEditableWarning
                                onMouseDown={(e) => e.stopPropagation()}
                                onBlur={(e) => updateComponentField(comp.id, 'text', e.currentTarget.innerText)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); } }}
                                className="cursor-text outline-none inline-block"
                              >{comp.text}</span>
                            ) : undefined}
                          </M3Button>
                        );
                      })()}

                      {/* SPECIMEN: CARD */}
                      {comp.type === 'card' && (
                        <M3Card
                          variant={(comp.variant as any) || 'elevated'}
                          layout={comp.layout || 'vertical'}
                          className="w-full h-full"
                          style={{ borderRadius: `${comp.borderRadius}px` } as React.CSSProperties}
                        >
                          {(comp.layout || 'vertical') === 'vertical' ? (
                            <>
                              {(comp.configShowIcon || comp.configShowTitle || comp.configShowSubtitle) && (
                                <M3CardHeader
                                  avatar={comp.configShowIcon ? (
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{localIcon}</span>
                                  ) : undefined}
                                  header={comp.configShowTitle ? (
                                    <span contentEditable suppressContentEditableWarning
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onBlur={(e) => updateComponentField(comp.id, 'title', e.currentTarget.innerText)}
                                      onKeyDown={(e) => { if(e.key==='Enter'){e.preventDefault();(e.target as HTMLElement).blur();} }}
                                      style={{ outline:'none', cursor:'text', display:'block' }}>{comp.title}</span>
                                  ) : undefined}
                                  subhead={comp.configShowSubtitle ? (
                                    <span contentEditable suppressContentEditableWarning
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onBlur={(e) => updateComponentField(comp.id, 'subtitle', e.currentTarget.innerText)}
                                      onKeyDown={(e) => { if(e.key==='Enter'){e.preventDefault();(e.target as HTMLElement).blur();} }}
                                      style={{ outline:'none', cursor:'text', display:'block' }}>{comp.subtitle}</span>
                                  ) : undefined}
                                  action={<span className="material-symbols-outlined" style={{ fontSize:'18px', color:'var(--md-sys-color-on-surface-variant)', cursor:'pointer' }}>more_vert</span>}
                                />
                              )}
                              <M3CardMedia aspectRatio="16/9"
                                src={comp.iconImage || undefined}
                                style={comp.iconImage ? { backgroundSize:'cover', backgroundPosition:'center' } as React.CSSProperties : undefined}>
                                {!comp.iconImage && (
                                  <span className="material-symbols-outlined" style={{ fontSize:'32px', color:'var(--md-sys-color-outline)', opacity:0.4 }}>image</span>
                                )}
                              </M3CardMedia>
                              {comp.configShowDescription && (
                                <M3CardContent
                                  title={`${comp.variant ? comp.variant.charAt(0).toUpperCase()+comp.variant.slice(1) : 'Elevated'} Card`}
                                  subtitle="Material 3 • Today">
                                  <span contentEditable suppressContentEditableWarning
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onBlur={(e) => updateComponentField(comp.id, 'text', e.currentTarget.innerText)}
                                    onKeyDown={(e) => { if(e.key==='Enter'){e.preventDefault();(e.target as HTMLElement).blur();} }}
                                    style={{ outline:'none', cursor:'text' }}>{comp.text}</span>
                                </M3CardContent>
                              )}
                              {comp.configShowActions && (
                                <M3CardActions>
                                  <M3Button variant={((comp as any).configSecondaryBtnVariant || 'outlined') as any} size={((comp as any).configSecondaryBtnSize || 's') as any} onClick={() => cycleComponentSize(comp.id)}>{(comp as any).configSecondaryBtnText || 'Secondary'}</M3Button>
                                  <M3Button variant={((comp as any).configActionBtnVariant || 'filled') as any} size={((comp as any).configActionBtnSize || 's') as any} onClick={() => cycleComponentSize(comp.id)}>{(comp as any).configActionBtnText || 'Action'}</M3Button>
                                </M3CardActions>
                              )}
                            </>
                          ) : (
                            /* Horizontal: avatar + header/subhead on left, image on right */
                            <>
                              <M3CardHeader
                                avatar={comp.configShowIcon ? (
                                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{localIcon}</span>
                                ) : undefined}
                                header={comp.configShowTitle ? (
                                  <span contentEditable suppressContentEditableWarning
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onBlur={(e) => updateComponentField(comp.id, 'title', e.currentTarget.innerText)}
                                    onKeyDown={(e) => { if(e.key==='Enter'){e.preventDefault();(e.target as HTMLElement).blur();} }}
                                    style={{ outline:'none', cursor:'text', display:'block' }}>{comp.title}</span>
                                ) : undefined}
                                subhead={comp.configShowSubtitle ? (
                                  <span contentEditable suppressContentEditableWarning
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onBlur={(e) => updateComponentField(comp.id, 'subtitle', e.currentTarget.innerText)}
                                    onKeyDown={(e) => { if(e.key==='Enter'){e.preventDefault();(e.target as HTMLElement).blur();} }}
                                    style={{ outline:'none', cursor:'text', display:'block' }}>{comp.subtitle}</span>
                                ) : undefined}
                              />
                              <M3CardMedia aspectRatio="custom"
                                src={comp.iconImage || undefined}
                                style={{ width:'120px', flexShrink:0 } as React.CSSProperties}>
                                {!comp.iconImage && (
                                  <span className="material-symbols-outlined" style={{ fontSize:'24px', color:'var(--md-sys-color-outline)', opacity:0.4 }}>image</span>
                                )}
                              </M3CardMedia>
                            </>
                          )}
                        </M3Card>
                      )}

                      {/* SPECIMEN: CHIP */}
                      {comp.type === 'chip' && (
                        <M3Chip
                          label={comp.text || 'Interactive'}
                          variant={(['assist','filter','input','suggestion'].includes(comp.variant || '') ? comp.variant as any : 'assist')}
                          icon={comp.configShowIcon ? localIcon : undefined}
                          selected={comp.selectedState || compState === 2}
                          onRemove={comp.variant === 'input' ? (() => {}) : undefined}
                          onClick={handleButtonClick}
                          className="pointer-events-auto"
                        />
                      )}

                      {/* SPECIMEN: FAB  */}
                      {comp.type === 'fab' && (() => {
                        const isExtended = comp.variant === 'extended';
                        // Override FAB CSS size with inline style so resize handles work
                        const fabW = comp.width || 56;
                        const fabH = comp.height || 56;
                        const fabBR = comp.borderRadius || 16;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', position: 'relative' }}>
                            {/* FAB energy sits inside the fab shape */}
                            {compState !== 0 && (
                              <div style={{ position: 'absolute', width: fabW, height: fabH, borderRadius: fabBR, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, filter: isStateBlurred ? `blur(${effectiveIntensity * 2}px) saturate(1.3)` : 'none' }}>
                                <ShaderRenderer
                                  canvasId={`canvas-fab-${comp.id}`}
                                  state={compState} previousState={compPreviousState} transition={compTransitionVal}
                                  width={fabW} height={fabH} borderRadius={fabBR}
                                  baseColorHex={compBgColor} midColorHex={compMidColor} endColorHex={compEndColor}
                                  hoverActive={false} renderMode={0} intensity={effectiveIntensity} isActive={isAnimationActive}
                                />
                              </div>
                            )}
                            <M3FAB
                              icon={comp.configShowIcon !== false ? localIcon : undefined}
                              label={isExtended ? (comp.text || 'Action') : undefined}
                              variant={(comp.variant === 'extended' ? 'primary' : comp.variant as any) || 'primary'}
                              size={isExtended ? 'extended' : 'medium'}
                              onClick={handleButtonClick}
                              className="pointer-events-auto"
                              style={{ width: isExtended ? 'auto' : fabW, height: fabH, borderRadius: fabBR, minWidth: isExtended ? 'auto' : fabW, position: 'relative', zIndex: 1, ...(compState !== 0 ? { backgroundColor: 'transparent', boxShadow: 'none' } : {}) } as React.CSSProperties}
                            />
                          </div>
                        );
                      })()}

                      {/* SPECIMEN: DIALOG */}
                      {comp.type === 'dialog' && (
                        <M3Dialog 
                          isOpen={true} 
                          onClose={() => {}} 
                          static={true}
                          className="w-full h-full"
                          style={{
                            width: '100%',
                            height: '100%',
                            maxWidth: 'none',
                            maxHeight: 'none',
                            borderRadius: 'inherit',
                            margin: 0
                          }}
                          icon={comp.variant === 'icon' ? (
                            <div className="flex items-center justify-center mx-auto mb-1">
                              <span className="material-symbols-outlined text-[32px]" style={{ color: libColors.primary.bg }}>
                                {localIcon || 'notifications'}
                              </span>
                            </div>
                          ) : (comp.configShowIcon && comp.variant !== 'scrollable') ? (
                            <div className="flex items-center justify-center mx-auto mb-1">
                              {((comp.avatarType || (comp.iconImage ? 'image' : 'icon')) === 'image' && comp.iconImage) ? (
                                <div className="rounded-full w-[40px] h-[40px] border border-white/10 shadow-sm relative overflow-hidden">
                                  <img referrerPolicy="no-referrer" src={comp.iconImage} className="w-full h-full object-cover" alt="Avatar" />
                                </div>
                              ) : (comp.avatarType || 'icon') === 'initials' ? (
                                <div className="rounded-full w-[40px] h-[40px] border border-white/10 shadow-sm flex items-center justify-center text-[12px] font-sans font-bold uppercase select-none leading-none tracking-wide text-white" style={{ backgroundColor: comp.iconBgColor || 'rgba(147, 51, 234, 0.2)' }}>
                                  {comp.avatarInitials || (comp.title ? comp.title.slice(0, 2).toUpperCase() : 'AV')}
                                </div>
                              ) : (
                                <M3Icon 
                                  name={localIcon} 
                                  size={24} 
                                  className="leading-none text-center" 
                                  style={{ color: compTextColor }}
                                />
                              )}
                            </div>
                          ) : undefined}
                          title={comp.configShowTitle ? (
                            <span 
                              contentEditable
                              suppressContentEditableWarning
                              onMouseDown={(e) => e.stopPropagation()}
                              onBlur={(e) => updateComponentField(comp.id, 'title', e.currentTarget.innerText)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                              className={`${titleFont.class} block truncate hover:bg-white/5 cursor-text px-1 rounded outline-none transition-colors font-sans tracking-tight`} 
                              style={{ 
                                color: compTextColor,
                                textAlign: (comp.variant === 'icon' || comp.variant === 'standard') ? 'center' : 'left'
                              }}
                            >
                              {comp.title}
                            </span>
                          ) : undefined}
                          actions={comp.configShowActions ? (
                            <div className="flex items-center justify-end gap-2 w-full">
                              <M3Button variant="text">Cancel</M3Button>
                              <M3Button variant="text">{comp.variant === 'scrollable' ? 'Ok' : 'Action'}</M3Button>
                            </div>
                          ) : undefined}
                        >
                          {comp.variant === 'alert' ? (
                            <p style={{ fontFamily: 'var(--md-sys-typescale-body-medium-font)', fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 'var(--md-sys-typescale-body-medium-line-height)' }}>
                              {comp.text || 'This action cannot be undone. Are you sure you want to continue?'}
                            </p>
                          ) : comp.variant === 'scrollable' ? (
                            <div className="flex flex-col py-2 max-h-[200px] overflow-y-auto w-full">
                              {(['A','B','C'] as string[]).map((letter, idx) => (
                                <div key={letter} className="flex items-center gap-4 px-4 py-3 cursor-pointer w-full">
                                  <div className="rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', fontSize: 14, fontWeight: 500, fontFamily: 'var(--md-sys-typescale-label-large-font)' }}>
                                    {letter}
                                  </div>
                                  <span style={{ fontFamily: 'var(--md-sys-typescale-body-large-font)', fontSize: 'var(--md-sys-typescale-body-large-size)', color: 'var(--md-sys-color-on-surface)' }}>
                                    List item {idx + 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : comp.configShowDescription ? (
                            <p contentEditable suppressContentEditableWarning
                              onMouseDown={(e) => e.stopPropagation()}
                              onBlur={(e) => updateComponentField(comp.id, 'text', e.currentTarget.innerText)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); } }}
                              style={{ fontFamily: 'var(--md-sys-typescale-body-medium-font)', fontSize: 'var(--md-sys-typescale-body-medium-size)', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 'var(--md-sys-typescale-body-medium-line-height)', outline: 'none', cursor: 'text' }}>
                              {comp.text}
                            </p>
                          ) : null}
                        </M3Dialog>
                      )}

                      {/* SPECIMEN: BADGE */}
                      {comp.type === 'badge' && (
                        <div className="w-full h-full flex items-center justify-center" style={{ borderRadius: 'inherit' }}>
                          <M3Badge 
                            variant={comp.variant === 'dot' ? 'small' : 'large'} 
                            label={comp.variant === 'dot' ? undefined : (
                              <span 
                                contentEditable
                                suppressContentEditableWarning
                                onMouseDown={(e) => e.stopPropagation()}
                                onBlur={(e) => updateComponentField(comp.id, 'text', e.currentTarget.innerText)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                                className="text-[9.5px] leading-none tracking-wide font-extrabold uppercase hover:bg-white/5 cursor-text px-1 rounded outline-none transition-colors inline-block select-text"
                                style={{ maxWidth: '100%', wordBreak: 'break-all', color: compTextColor }}
                              >
                                {comp.text}
                              </span>
                            )}
                          />
                        </div>
                      )}

                      {/* SPECIMEN: SHEETS */}
                      {comp.type === 'sheets' && (
                        <div className="w-full h-full relative overflow-hidden flex flex-col justify-between select-text" style={{ color: compTextColor }}>
                          {comp.variant === 'side' ? (
                            <M3SideSheet 
                              isOpen={true}
                              onClose={() => {}}
                              title={(
                                <span 
                                  contentEditable
                                  suppressContentEditableWarning
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onBlur={(e) => updateComponentField(comp.id, 'title', e.currentTarget.innerText)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                                  className={`${titleFont.class} block truncate hover:bg-slate-300/10 dark:hover:bg-white/5 cursor-text px-1 rounded outline-none transition-colors font-sans tracking-tight font-medium text-left`} 
                                  style={{ color: compTextColor }}
                                >
                                  {comp.title || 'Side Sheet'}
                                </span>
                              )}
                              static={true}
                              position="right"
                              className="w-full h-full"
                              style={{
                                width: '100%',
                                height: '100%',
                                maxWidth: 'none',
                                maxHeight: 'none',
                                backgroundColor: 'transparent',
                                border: 'none',
                                boxShadow: 'none',
                                borderRadius: 'inherit'
                              }}
                            >
                              <p 
                                contentEditable
                                suppressContentEditableWarning
                                onMouseDown={(e) => e.stopPropagation()}
                                onBlur={(e) => updateComponentField(comp.id, 'text', e.currentTarget.innerText)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                                className={`${descFont.class} hover:bg-slate-300/10 dark:hover:bg-white/5 cursor-text outline-none select-text leading-relaxed w-full min-h-[30px] block`}
                                style={{ color: compTextColor }}
                              >
                                {comp.text}
                              </p>
                            </M3SideSheet>
                          ) : (
                            <M3BottomSheet 
                              isOpen={true}
                              onClose={() => {}}
                              title={(
                                <span 
                                  contentEditable
                                  suppressContentEditableWarning
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onBlur={(e) => updateComponentField(comp.id, 'title', e.currentTarget.innerText)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                                  className={`${titleFont.class} block truncate hover:bg-slate-300/10 dark:hover:bg-white/5 cursor-text px-1 rounded outline-none transition-colors font-sans tracking-tight font-medium text-left`} 
                                  style={{ color: compTextColor }}
                                >
                                  {comp.title || 'Bottom Sheet'}
                                </span>
                              )}
                              static={true}
                              className="w-full h-full"
                              style={{
                                width: '100%',
                                height: '100%',
                                maxWidth: 'none',
                                maxHeight: 'none',
                                backgroundColor: 'transparent',
                                border: 'none',
                                boxShadow: 'none',
                                borderRadius: 'inherit'
                              }}
                            >
                              <p 
                                contentEditable
                                suppressContentEditableWarning
                                onMouseDown={(e) => e.stopPropagation()}
                                onBlur={(e) => updateComponentField(comp.id, 'text', e.currentTarget.innerText)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
                                className={`${descFont.class} hover:bg-slate-300/10 dark:hover:bg-white/5 cursor-text outline-none select-text leading-relaxed w-full min-h-[30px] block`}
                                style={{ color: compTextColor }}
                              >
                                {comp.text}
                              </p>
                            </M3BottomSheet>
                          )}
                        </div>
                      )}

                      {/* SPECIMEN: AVATAR */}
                      {comp.type === 'avatar' && (() => {
                        // Use comp.variant for type (icon/initials/image), resize with comp.width
                        const avatarType = comp.variant || comp.avatarType || (comp.iconImage ? 'image' : 'icon');
                        const sz = comp.width || 40;
                        const iconPx = Math.round(sz * 0.5);
                        const avatarStyle: React.CSSProperties = {
                          width: sz, height: sz,
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                          position: 'relative',
                        };
                        if (avatarType === 'image' && comp.iconImage) {
                          return (
                            <div style={{ ...avatarStyle, backgroundColor: 'var(--md-sys-color-primary-container)' }}>
                              <img src={comp.iconImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                            </div>
                          );
                        } else if (avatarType === 'initials') {
                          return (
                            <div id={`avatar-circle-${comp.id}`} style={{ ...avatarStyle, backgroundColor: compState !== 0 ? 'transparent' : (comp.iconBgColor || 'var(--md-sys-color-primary-container)'), color: 'var(--md-sys-color-on-primary-container)', fontSize: Math.round(sz * 0.35), fontWeight: 500 }}>
                              {comp.avatarInitials || comp.title?.slice(0,2)?.toUpperCase() || 'AV'}
                            </div>
                          );
                        } else {
                          return (
                            <div id={`avatar-circle-${comp.id}`} style={{ ...avatarStyle, backgroundColor: compState !== 0 ? 'transparent' : (comp.iconBgColor || 'var(--md-sys-color-primary-container)'), color: 'var(--md-sys-color-on-primary-container)', position: 'relative', overflow: 'hidden' }}>
                              {compState !== 0 && (
                                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, filter: isStateBlurred ? `blur(${effectiveIntensity * 1.5}px) saturate(1.2)` : 'none' }}>
                                  <ShaderRenderer
                                    canvasId={`canvas-avatar-${comp.id}`}
                                    state={compState} previousState={compPreviousState} transition={compTransitionVal}
                                    width={sz} height={sz} borderRadius={sz / 2}
                                    baseColorHex={compBgColor} midColorHex={compMidColor} endColorHex={compEndColor}
                                    hoverActive={false} renderMode={0} intensity={effectiveIntensity} isActive={isAnimationActive}
                                  />
                                </div>
                              )}
                              <span className="material-symbols-outlined" style={{ fontSize: iconPx, position: 'relative', zIndex: 1 }}>{localIcon}</span>
                            </div>
                          );
                        }
                      })()}

                      {/* SPECIMEN: IMAGE — full bleed, energy on top via mix-blend-mode */}
                      {comp.type === 'image' && (
                        <div style={{
                          width: '100%', height: '100%',
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: `${comp.borderRadius}px`,
                          backgroundColor: 'var(--md-sys-color-surface-variant)',
                        }}>
                          {comp.iconImage ? (
                            <img src={comp.iconImage} alt="component"
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--md-sys-color-outline)', opacity: 0.4 }}>image</span>
                            </div>
                          )}
                          {/* Energy overlay — blurs and bends with the image like containers */}
                          {compState !== 0 && (
                            <div style={{
                              position: 'absolute',
                              inset: isStateBlurred ? `-${compIntensity * 8}px` : 0,
                              mixBlendMode: 'screen',
                              opacity: 0.9,
                              pointerEvents: 'none',
                              zIndex: 2,
                              filter: isStateBlurred
                                ? `blur(${compIntensity * 4}px) saturate(1.4) brightness(1.05)`
                                : `blur(${compIntensity * 1.5}px) saturate(1.2)`,
                              borderRadius: `${comp.borderRadius}px`,
                            }}>
                              <ShaderRenderer
                                canvasId={`canvas-for-energy-${comp.id}`}
                                state={compState}
                                previousState={compPreviousState}
                                transition={compTransitionVal}
                                width={comp.width + (isStateBlurred ? compIntensity * 16 : 0)}
                                height={comp.height + (isStateBlurred ? compIntensity * 16 : 0)}
                                borderRadius={comp.borderRadius}
                                baseColorHex={compBgColor}
                                midColorHex={compMidColor}
                                endColorHex={compEndColor}
                                hoverActive={isHovered && isSelected}
                                renderMode={0}
                                intensity={compIntensity}
                                isActive={isAnimationActive}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* SPECIMEN: PROGRESS — transparent container, grey track, energy only on bar primary color */}
                      {comp.type === 'progress' && (
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', backgroundColor: 'transparent',
                          ...(compState !== 0 ? {
                            '--md-sys-color-primary': compMidColor,
                            '--md-sys-color-secondary-container': 'transparent',
                          } as React.CSSProperties : {
                            '--md-sys-color-primary': libColors.primary.bg,
                          })
                        }}>
                          {comp.variant === 'circular' ? (
                            <M3CircularProgress
                              indeterminate={true}
                              variant={comp.sizePreset === 'large' || comp.sizePreset === 'xlarge' ? 'thick' : 'standard'}
                            />
                          ) : (
                            <M3LinearProgress
                              indeterminate={true}
                              variant={comp.sizePreset === 'large' || comp.sizePreset === 'xlarge' ? 'thick' : 'standard'}
                            />
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* RESIZE HANDLES — primary selected OR in multi-select group */}
                  {(isSelected || selectedIds.has(comp.id)) && (
                    <>
                      {/* Eastern resize edge */}
                      <div 
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-neutral-900 border border-[#18A0FB] rounded-full cursor-e-resize shadow-md hover:bg-[#18A0FB] hover:scale-110 z-50 transition-all"
                        onMouseDown={(e) => handleResizeStart(e, comp.id, 'e')}
                      />
                      {/* Southern resize edge */}
                      <div 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-2 bg-neutral-900 border border-[#18A0FB] rounded-full cursor-s-resize shadow-md hover:bg-[#18A0FB] hover:scale-110 z-50 transition-all"
                        onMouseDown={(e) => handleResizeStart(e, comp.id, 's')}
                      />
                      {/* South-East resize corner */}
                      <div 
                        className="absolute bottom-1 right-1 w-3 h-3 bg-neutral-900 border-2 border-[#18A0FB] rounded-sm cursor-se-resize shadow-lg hover:bg-[#18A0FB] hover:scale-125 z-50 transition-all"
                        onMouseDown={(e) => handleResizeStart(e, comp.id, 'se')}
                      />
                    </>
                  )}
                </div>
              );
            })}
              </div>
            )}
          </div>

          {/* GLOBAL CROP/MARQUEE OVERLAY */}
          {((isCropActive && isAreaSelectionMode) || recordingCountdown !== null || isRecording) && (
            <div 
              className={`absolute inset-0 z-40 overflow-hidden select-none ${
                (isRecording || recordingCountdown !== null) ? 'pointer-events-none' : 'bg-black/40 cursor-crosshair pointer-events-auto'
              }`}
              onMouseDown={(isRecording || recordingCountdown !== null) ? undefined : handleMarqueeStart}
              id="global-crop-marquee-sensor"
            >
              {/* Drag area crop display - border-none for seamless flow to edge */}
              <div 
                className="absolute border-none bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] cursor-move"
                style={{
                  left: `${cropRect.x}px`,
                  top: `${cropRect.y}px`,
                  width: `${cropRect.width}px`,
                  height: `${cropRect.height}px`,
                }}
                onMouseDown={(isRecording || recordingCountdown !== null) ? undefined : (e) => handleCropResizeStart(e, 'move')}
              >
                {/* Only render HUD bounds and adjustment handles when NOT counting down or active recording */}
                {recordingCountdown === null && !isRecording && (
                  <>
                    {/* HUD pixels overlay */}
                    <div className="absolute -top-6 left-0 bg-[#18A0FB] text-white text-[10px] font-sans uppercase font-bold tracking-wide px-1.5 py-0.5 rounded shadow flex items-center gap-1 whitespace-nowrap flex-nowrap min-w-max">
                      <span>REC AREA:</span>
                      <strong>{cropRect.width} X {cropRect.height}</strong>
                      <span className="opacity-70 text-[8.5px] pl-0.5">Drag corners to resize</span>
                    </div>

                    {/* Drag resize elements */}
                    {/* nw corner */}
                    <div 
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-[#18A0FB] rounded-sm cursor-nwse-resize hover:bg-[#18A0FB] z-50 animate-pulse"
                      onMouseDown={(e) => handleCropResizeStart(e, 'nw')}
                    />
                    {/* ne corner */}
                    <div 
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-[#18A0FB] rounded-sm cursor-nesw-resize hover:bg-[#18A0FB] z-50 animate-pulse"
                      onMouseDown={(e) => handleCropResizeStart(e, 'ne')}
                    />
                    {/* se corner */}
                    <div 
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-[#18A0FB] rounded-sm cursor-nwse-resize hover:bg-[#18A0FB] z-50 animate-pulse"
                      onMouseDown={(e) => handleCropResizeStart(e, 'se')}
                    />
                    {/* sw corner */}
                    <div 
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-[#18A0FB] rounded-sm cursor-nesw-resize hover:bg-[#18A0FB] z-50 animate-pulse"
                      onMouseDown={(e) => handleCropResizeStart(e, 'sw')}
                    />
                    
                    {/* Edges */}
                    {/* north edge */}
                    <div 
                      className="absolute top-0 left-2 right-2 h-1 cursor-ns-resize z-50 hover:bg-[#18A0FB]/30 transition-all"
                      onMouseDown={(e) => handleCropResizeStart(e, 'n')}
                    />
                    {/* south edge */}
                    <div 
                      className="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize z-50 hover:bg-[#18A0FB]/30 transition-all"
                      onMouseDown={(e) => handleCropResizeStart(e, 's')}
                    />
                    {/* east edge */}
                    <div 
                      className="absolute right-0 top-2 bottom-2 w-1 cursor-ew-resize z-50 hover:bg-[#18A0FB]/30 transition-all"
                      onMouseDown={(e) => handleCropResizeStart(e, 'e')}
                    />
                    {/* west edge */}
                    <div 
                      className="absolute left-0 top-2 bottom-2 w-1 cursor-ew-resize z-50 hover:bg-[#18A0FB]/30 transition-all"
                      onMouseDown={(e) => handleCropResizeStart(e, 'w')}
                    />
                  </>
                )}
              </div>
            </div>
          )}

            <div className="absolute bottom-0 left-0 right-0 h-20 z-40 bg-[#222222] border-t border-[#1C1C1C] px-8 flex items-center justify-between w-full text-neutral-100 select-none pointer-events-auto shadow-2xl">
              <div className="flex items-end justify-between w-full max-w-[1400px] mx-auto gap-2 overflow-x-auto">

                {/* 1. Motion — Pause/Play */}
                <div className="flex flex-col justify-between h-12 items-start shrink-0">
                  <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider leading-none">Motion</span>
                  <button
                    onClick={() => { setIsAnimationActive(!isAnimationActive); showToast(isAnimationActive ? "Motion paused." : "Motion resumed."); }}
                    className={`h-8 px-3 rounded-md text-[9.5px] font-sans font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border select-none transition-all whitespace-nowrap ${isAnimationActive ? 'bg-rose-500/15 text-rose-400 border-rose-500/20 hover:bg-rose-500/25' : 'bg-[#18A0FB]/15 text-[#18A0FB] border-[#18A0FB]/20 hover:bg-[#18A0FB]/25'}`}
                  >
                    {isAnimationActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isAnimationActive ? 'Pause' : 'Play'}</span>
                  </button>
                </div>

                {/* 2. Speed slider */}
                <div className="flex flex-col justify-between h-12 items-start min-w-[60px] max-w-[200px] flex-1 @container">
                  <div className="flex items-center w-full gap-1 @[80px]:justify-between justify-center">
                    <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider leading-none @[80px]:block hidden">Speed</span>
                    <span className="font-mono text-[9.5px] font-bold text-[#18A0FB] leading-none">{intensity.toFixed(2)}×</span>
                  </div>
                  <div className="h-8 flex bg-[#1E1E1E] px-2 rounded-md border border-neutral-800 items-center w-full gap-2 select-none">
                    <input type="range" min="0.10" max="1.50" step="0.05" value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="flex-1 h-1 bg-neutral-800 rounded cursor-pointer accent-[#18A0FB] min-w-0 w-full" />
                  </div>
                </div>

                {/* 3. Loop */}
                <div className={`flex flex-col justify-between h-12 items-start shrink-0 transition-all duration-300 ${exportFormat === 'png' ? 'opacity-0 pointer-events-none' : ''}`}>
                  <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider leading-none select-none">Loop</span>
                  <div className="h-8 flex items-center">
                    <button onClick={() => { setPerfectLoop(!perfectLoop); }}
                      className="h-8 w-11 bg-[#1E1E1E] rounded-md flex items-center justify-center cursor-pointer select-none border border-neutral-800">
                      <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${perfectLoop ? 'bg-[#18A0FB]' : 'bg-neutral-700'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${perfectLoop ? 'translate-x-3' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>
                </div>

                {/* 4. Pointer */}
                <div className={`flex flex-col justify-between h-12 items-start shrink-0 transition-all duration-300 ${exportFormat === 'png' ? 'opacity-0 pointer-events-none' : ''}`}>
                  <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider leading-none">Pointer</span>
                  <div className="h-8 flex bg-[#1E1E1E] p-0.5 rounded-md border border-neutral-800 items-center gap-[2px]">
                    <button onClick={() => setRecordShowCursor(!recordShowCursor)}
                      className={`text-[9.5px] font-sans px-3 h-full flex items-center justify-center font-bold rounded-sm transition-all cursor-pointer border-none whitespace-nowrap ${recordShowCursor ? 'bg-[#18A0FB] text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}>
                      Cursor
                    </button>
                    <button onClick={() => setRecordShowClicks(!recordShowClicks)}
                      className={`text-[9.5px] font-sans px-3 h-full flex items-center justify-center font-bold rounded-sm transition-all cursor-pointer border-none whitespace-nowrap ${recordShowClicks ? 'bg-[#18A0FB] text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}>
                      Clicks
                    </button>
                  </div>
                </div>

                {/* 5. Format */}
                <div className="flex flex-col justify-between h-12 items-start shrink-0">
                  <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider leading-none">Format</span>
                  <div className="h-8 flex bg-[#1E1E1E] p-0.5 rounded-md border border-neutral-800 items-center">
                    {(['mp4', 'png', 'gif'] as const).map((fmt) => (
                      <button key={fmt} onClick={() => { if (!isRecording) setExportFormat(fmt); }}
                        className={`text-[9.5px] font-sans px-3 h-full flex items-center justify-center font-bold rounded-sm transition-all cursor-pointer whitespace-nowrap ${exportFormat === fmt ? 'bg-[#18A0FB] text-white shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
                        disabled={isRecording}>
                        {fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Duration slider */}
                <div className={`flex flex-col justify-between h-12 items-start min-w-[60px] max-w-[200px] flex-1 @container transition-all duration-300 ${exportFormat === 'png' ? 'opacity-0 pointer-events-none' : ''}`}>
                  <div className="flex items-center w-full gap-1 @[80px]:justify-between justify-center">
                    <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider leading-none @[80px]:block hidden">Duration</span>
                    <span className="font-mono text-[9.5px] font-bold text-[#18A0FB] leading-none">{exportDuration}s</span>
                  </div>
                  <div className="h-8 flex bg-[#1E1E1E] px-2 rounded-md border border-neutral-800 items-center w-full gap-2 select-none">
                    <input type="range" min="1" max="20" step="1" value={exportDuration}
                      onChange={(e) => setExportDuration(Number(e.target.value))}
                      className="flex-1 h-1 bg-neutral-800 rounded cursor-pointer accent-[#18A0FB] min-w-0 w-full"
                      disabled={isRecording} />
                  </div>
                </div>

                {/* 7. Action bundle: Capture Spec & Recording active sub-controllers */}
                <div className="flex flex-col justify-between h-12 items-start shrink-0" style={{ minWidth: 28 }}>
                  <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider leading-none select-none">
                    {isRecording ? (
                      <span className="font-mono text-[#ef4444]">
                        ⏺ {Math.floor(recordingElapsedMs/60000).toString().padStart(2,'0')}:{Math.floor((recordingElapsedMs%60000)/1000).toString().padStart(2,'0')}.{Math.floor((recordingElapsedMs%1000)/100)}
                      </span>
                    ) : <span className="hidden sm:inline">Record</span>}
                  </span>
                  {isRecording ? (
                    <div className="h-[28px] flex items-center gap-1.5">
                      <button
                        onClick={isRecordingPaused ? handleResumeVideoRecording : handlePauseVideoRecording}
                        className={`h-[28px] px-2 rounded-md text-[9.5px] font-sans uppercase font-bold flex items-center gap-1.5 transition-all select-none cursor-pointer border ${isRecordingPaused ? 'bg-[#0ACF83]/15 text-[#0ACF83] border-[#0ACF83]/20' : 'bg-rose-500/15 text-rose-500 border-rose-500/20'}`}
                        title={isRecordingPaused ? "Resume" : "Pause"}
                      >
                        {isRecordingPaused ? <Play className="w-3 h-3 shrink-0" /> : <Pause className="w-3 h-3 shrink-0" />}
                        <span className="hidden sm:inline">{isRecordingPaused ? 'Resume' : 'Pause'}</span>
                      </button>
                      <button onClick={handleStopVideoRecordingEarly}
                        className="h-[28px] px-2 rounded-md text-[9.5px] font-sans uppercase font-bold flex items-center gap-1.5 select-none cursor-pointer bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 border border-neutral-700/50"
                        title="Stop">
                        <Square className="w-3 h-3 shrink-0 text-neutral-450" />
                        <span className="hidden sm:inline">Stop</span>
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleDirectExport}
                      className={`h-[28px] px-2 rounded-md font-sans text-[9.5px] font-bold flex items-center justify-center gap-1.5 select-none transition-all cursor-pointer border ${isAreaSelectionMode ? 'bg-[#18A0FB]/15 border-[#18A0FB]/35 text-[#18A0FB] animate-pulse' : 'bg-[#0ACF83]/15 hover:bg-[#0ACF83]/25 text-[#0ACF83] border-[#0ACF83]/20'}`}
                      title={isAreaSelectionMode ? 'Selecting' : 'Capture'}>
                      <span className="w-3 h-3 rounded-full border-2 border-current shrink-0 block" />
                      <span className="hidden sm:inline">{isAreaSelectionMode ? 'Selecting' : 'Capture'}</span>
                    </button>
                  )}
              </div>
            </div>
            </div>
          {/* STEP 1: Area Selection Mode Panel */}
          {isAreaSelectionMode && recordingCountdown === null && !isRecording && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[90]">
              <button
                onClick={() => { setIsCropActive(false); setIsAreaSelectionMode(false); }}
                className="h-8 px-4 rounded bg-[#3C3C3C] hover:bg-[#4A4A4A] text-white text-[11px] font-sans font-medium transition select-none cursor-pointer border border-[#555] shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={startRecordingAfterCountdown}
                className="h-8 px-4 rounded bg-[#18A0FB] hover:bg-[#0D8DE3] text-white text-[11px] font-sans font-medium transition select-none cursor-pointer border-none shadow-md"
              >
                Confirm
              </button>
            </div>
          )}

          {/* STEP 2: Countdown toast — compact, non-intrusive */}
          {recordingCountdown !== null && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[90] pointer-events-none">
              <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full shadow-2xl animate-pulse ${
                recordingCountdown === 3 ? 'bg-red-500 text-white' :
                recordingCountdown === 2 ? 'bg-orange-500 text-white' :
                'bg-green-500 text-white'
              }`}>
                <span className="font-black text-[10px] leading-none font-sans uppercase tracking-widest">
                  {recordingCountdown === 1 ? 'Go!' : recordingCountdown === 2 ? 'Get ready...' : 'Starting...'}
                </span>
              </div>
            </div>
          )}

          {/* Multi-select indicator */}
          {selectedIds.size > 1 && !isRecording && recordingCountdown === null && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#18A0FB] text-white text-[10px] font-sans font-bold uppercase tracking-wide px-3 py-1 rounded-full shadow-lg flex items-center gap-2 z-50 pointer-events-none select-none">
              <span>{selectedIds.size} selected</span>
              <span className="opacity-60">·</span>
              <span>Delete to remove</span>
            </div>
          )}

          {/* Active Toast notifications */}
          {toastMessage && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#222222] text-white border-none px-4 py-2.5 rounded-lg text-xs font-sans shadow-2xl flex items-center gap-2 animate-fade-in z-[100] whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4 text-[#18A0FB] shrink-0" />
              <span className="font-medium tracking-wide">{toastMessage}</span>
            </div>
          )}

          {/* COMPILED FILE SAVE & DOWNLOAD OR TRY AGAIN MODAL */}
          {compiledFile && (
            <div className="absolute inset-0 z-[100] bg-black/60 flex items-center justify-center pointer-events-auto">
              <div className="bg-white border border-neutral-200/90 shadow-2xl p-7 rounded-xl flex flex-col max-w-sm w-full animate-fade-in text-neutral-800 font-sans text-center gap-5">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold tracking-tight text-neutral-900 mt-1">Specimen Capture Complete!</span>
                  <p className="text-[10px] text-neutral-500 mt-1 font-sans leading-relaxed">
                    Your capture is ready in <strong>{compiledFile.extension}</strong> format.
                  </p>
                </div>
                
                {/* Embedded preview card */}
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-3 h-36 flex flex-col items-center justify-center relative overflow-hidden">
                  {compiledFile.extension === 'GIF' ? (
                    <img referrerPolicy="no-referrer" src={compiledFile.url} className="max-h-full max-w-full rounded h-auto object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Play className="w-8 h-8 text-[#18A0FB] animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Visual filename label strictly placed under the preview card container */}
                <div className="text-[10px] text-neutral-450 font-mono truncate max-w-[280px] mx-auto opacity-75" title={compiledFile.filename}>
                  {compiledFile.filename}
                </div>

                <div className="flex gap-2.5 w-full mt-1">
                  <button
                    onClick={() => {
                      if (compiledFile.url.startsWith('blob:')) {
                        URL.revokeObjectURL(compiledFile.url);
                      }
                      setCompiledFile(null);
                      showToast("Capture discarded. Ready to record again!");
                    }}
                    className="flex-1 h-[32px] rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-[9.5px] uppercase cursor-pointer select-none transition-all border-none font-sans"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = compiledFile.url;
                      link.download = compiledFile.filename;
                      link.click();
                      setCompiledFile(null);
                      showToast("Download started!");
                    }}
                    className="flex-1 h-[32px] rounded-lg bg-[#18A0FB] hover:bg-[#158CDD] text-white font-bold text-[9.5px] uppercase cursor-pointer select-none transition-all border-none shadow-md shadow-[#18A0FB]/10 font-sans"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Global Interaction Clicks Layer */}
          {recordShowClicks && (
            <div className="absolute inset-0 z-[35] pointer-events-none overflow-hidden select-none">
              {recordedClicks.map((click) => {
                const clickAge = Date.now() - click.timestamp;
                if (clickAge >= 1200) return null;
                return (
                  <div 
                    key={click.id}
                    className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 select-none"
                    style={{
                      left: `${click.x}px`,
                      top: `${click.y}px`
                    }}
                  >
                    <div className="w-8 h-8 rounded-full border border-[#18A0FB]/40 bg-[#18A0FB]/5 click-ripple-animate flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-md ring-1 ring-[#18A0FB]/35" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>

        {/* RIGHT PANEL: FIGMA UNIFIED PROPERTY INSPECTOR (Pure Figma Properties & Plugin controls) */}
        <aside className="w-[340px] bg-[#2C2C2C] border-l border-[#1A1A1A] flex flex-col h-full shrink-0 z-40 justify-between select-none font-sans" id="figma-right-inspector">

          {/* Scrollable inspector body */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto" id="inspector-body-content" style={{ maxHeight: 'calc(100vh - 40px)' }}>
            
            {!activeComp ? null : (
              <div className="flex flex-col gap-4">

                {/* ENERGY STATES */}
                <div className="space-y-1.5 pb-3 border-b border-[#333]">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Energy State</span>
                    {(activeComp.activeState ?? 0) !== 0 && (
                      <button onClick={() => {
                        updateActiveComponentField('activeState', 0);
                        updateActiveComponentField('previousState', activeComp.activeState ?? 0);
                        updateActiveComponentField('transitionVal', 0.0);
                      }} className="text-[8px] text-neutral-500 hover:text-neutral-300 font-bold uppercase cursor-pointer bg-transparent border-none">Reset</button>
                    )}
                  </div>
                  <div className="flex flex-wrap bg-[#1E1E1E] p-0.5 rounded-md border border-neutral-800 gap-0.5" style={{ minHeight: 32 }}>
                    {OFFICIAL_STATES.map(state => {
                      const isActive = (activeComp.activeState ?? 0) === state.id;
                      return (
                        <button key={state.id}
                          onClick={() => {
                            const cur = activeComp.activeState ?? 0;
                            if (cur === state.id) {
                              updateActiveComponentField('previousState', cur);
                              updateActiveComponentField('activeState', 0);
                            } else {
                              updateActiveComponentField('previousState', cur);
                              updateActiveComponentField('activeState', state.id);
                            }
                            updateActiveComponentField('transitionVal', 0.0);
                          }}
                          className={`text-[9.5px] font-sans px-2 h-7 flex items-center justify-center font-bold rounded-sm transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                            isActive ? 'bg-[#18A0FB] text-white shadow' : 'text-neutral-400 hover:text-neutral-200'
                          }`}>
                          {state.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ENERGY INTENSITY */}
                <div className="space-y-1.5 pb-3 border-b border-[#333]">
                  <div className="flex justify-between items-center text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">
                    <span>Energy Intensity</span>
                    <span className="font-mono text-[10px] font-bold text-[#18A0FB]">{((activeComp.compIntensity ?? intensity) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-8 bg-[#1E1E1E] px-2.5 rounded-md flex items-center border border-neutral-800/80">
                    <input type="range" min="0.1" max="2.0" step="0.05"
                      value={activeComp.compIntensity ?? intensity}
                      onChange={(e) => updateActiveComponentField('compIntensity', Number(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded cursor-pointer accent-[#18A0FB]" />
                  </div>
                  <div className="flex justify-between text-[8px] text-neutral-600 font-mono px-0.5">
                    <span>Subtle</span>
                    <span className="text-neutral-500">{['card','dialog','sheets'].includes(activeComp.type) ? 'Large scale' : 'Small scale'}</span>
                    <span>Max</span>
                  </div>
                </div>

                {/* VARIANT / TYPE */}
                <div className="space-y-1.5 pb-3 border-b border-[#333]">
                  <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Type</span>
                  <div className="relative">
                    <select
                      value={activeComp.variant || ''}
                      onChange={(e) => {
                      updateActiveComponentField('variant', e.target.value);
                      // For avatar, sync avatarType with variant
                      if (activeComp.type === 'avatar') {
                        updateActiveComponentField('avatarType', e.target.value as any);
                      }
                    }}
                      className="w-full bg-[#1E1E1E] text-neutral-200 border border-neutral-700/30 rounded px-2.5 py-1.5 text-xs focus:border-[#18A0FB] focus:outline-none appearance-none cursor-pointer font-sans h-8"
                    >
                      {activeComp.type === 'button' && (<>
                        <option value="filled">Filled</option>
                        <option value="tonal">Tonal</option>
                        <option value="elevated">Elevated</option>
                        <option value="outlined">Outlined</option>
                        <option value="text">Text</option>
                      </>)}
                      {activeComp.type === 'chip' && (<>
                        <option value="assist">Assist</option>
                        <option value="filter">Filter</option>
                        <option value="input">Input</option>
                        <option value="suggestion">Suggestion</option>
                        <option value="elevated">Elevated</option>
                        <option value="filled">Filled</option>
                      </>)}
                      {activeComp.type === 'fab' && (<>
                        <option value="primary">Primary FAB</option>
                        <option value="secondary">Secondary FAB</option>
                        <option value="surface">Surface FAB</option>
                        <option value="tertiary">Tertiary FAB</option>
                        <option value="extended">Extended FAB (with label)</option>
                      </>)}
                      {activeComp.type === 'card' && (<>
                        <option value="elevated">Elevated</option>
                        <option value="filled">Filled</option>
                        <option value="outlined">Outlined</option>
                      </>)}
                      {activeComp.type === 'dialog' && (<>
                        <option value="standard">Standard Dialog</option>
                        <option value="icon">Icon Dialog</option>
                        <option value="scrollable">Scrollable Dialog</option>
                        <option value="alert">Alert Dialog</option>
                      </>)}
                      {activeComp.type === 'badge' && (<>
                        <option value="standard">Standard Pill</option>
                        <option value="dot">Dot</option>
                      </>)}
                      {activeComp.type === 'sheets' && (<>
                        <option value="side">Side Sheet</option>
                        <option value="bottom">Bottom Sheet</option>
                      </>)}
                      {activeComp.type === 'avatar' && (<>
                        <option value="icon">Icon</option>
                        <option value="initials">Initials</option>
                        <option value="image">Image</option>
                      </>)}
                      {activeComp.type === 'progress' && (<>
                        <option value="linear">Linear</option>
                        <option value="circular">Circular</option>
                      </>)}
                      {activeComp.type === 'card' && (<>
                        <option value="vertical">Vertical</option>
                        <option value="horizontal">Horizontal</option>
                      </>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center px-1.5 text-neutral-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Avatar type-specific fields */}
                  {activeComp.type === 'avatar' && (
                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-3 gap-1 bg-[#1A1A1A] p-0.5 rounded border border-neutral-800/40">
                        {(['icon','initials','image'] as const).map(t => (
                          <button key={t}
                            onClick={() => { updateActiveComponentField('variant', t); updateActiveComponentField('avatarType', t); }}
                            className={`py-1 text-[8px] font-bold rounded cursor-pointer uppercase transition-all ${(activeComp.variant || 'icon') === t ? 'bg-[#18A0FB]/15 text-[#18A0FB]' : 'text-neutral-400 hover:text-neutral-200 bg-transparent'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                      {(activeComp.variant === 'icon' || !activeComp.variant) && (
                        <div className="text-[9px] text-neutral-500 font-sans">Pick icon below ↓</div>
                      )}
                      {activeComp.variant === 'initials' && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-neutral-450 font-sans block">Initials (max 3)</span>
                          <input type="text" maxLength={3}
                            value={activeComp.avatarInitials !== undefined ? activeComp.avatarInitials : ''}
                            placeholder={activeComp.title ? activeComp.title.slice(0, 2).toUpperCase() : 'AV'}
                            onChange={(e) => updateActiveComponentField('avatarInitials', e.target.value.toUpperCase())}
                            className="w-full bg-[#1A1A1A] border border-neutral-800 rounded px-2 py-1 text-[9.5px] font-mono text-neutral-100 placeholder-neutral-600 focus:border-[#18A0FB] outline-none" />
                        </div>
                      )}
                      {activeComp.variant === 'image' && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-neutral-450 font-sans block">Avatar Image</span>
                          <div className="flex gap-1.5">
                            <label htmlFor="avatar-image-upload" className="flex-1 py-1.5 px-2 bg-[#2C2C2C] hover:bg-[#333] text-neutral-300 rounded text-[9px] font-bold uppercase cursor-pointer text-center border border-neutral-700/50 transition-colors">
                              {activeComp.iconImage ? 'Replace' : 'Upload'}
                            </label>
                            <input type="file" accept="image/*" id="avatar-image-upload" className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    updateActiveComponentField('iconImage', ev.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} />
                            {activeComp.iconImage && (
                              <button onClick={() => updateActiveComponentField('iconImage', undefined)}
                                className="py-1.5 px-2 bg-red-950/25 hover:bg-red-900/30 text-red-400 rounded text-[9px] font-bold uppercase cursor-pointer border-none">
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SIZE PRESET — only show for types that have presets */}
                {(M3_SIZE_PRESETS[activeComp.type as keyof typeof M3_SIZE_PRESETS] && !['card','dialog','sheets'].includes(activeComp.type)) && (
                <div className="space-y-1.5 pb-3 border-b border-[#333]">
                  <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Size</span>
                  <div className="grid grid-cols-5 gap-1">
                    {(['xsmall','small','medium','large','xlarge'] as const).map(s => (
                      <button key={s}
                        onClick={() => {
                          const presets = M3_SIZE_PRESETS[activeComp.type as keyof typeof M3_SIZE_PRESETS];
                          if (presets?.[s]) {
                            const { width, height, borderRadius } = presets[s];
                            updateActiveComponentField('sizePreset', s);
                            updateActiveComponentField('width', width);
                            updateActiveComponentField('height', height);
                            updateActiveComponentField('borderRadius', borderRadius);
                          }
                        }}
                        className={`py-1 text-[8px] font-bold rounded cursor-pointer uppercase transition-all ${
                          activeComp.sizePreset === s ? 'bg-[#18A0FB]/15 text-[#18A0FB]' : 'text-neutral-400 hover:text-neutral-200 bg-[#1E1E1E]'
                        }`}>
                        {s[0].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* DIMENSIONS */}
                <div className="space-y-2 pb-3 border-b border-[#333]">
                  <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Dimensions</span>
                  {/* Width */}
                  {(['width','height'] as const).map(field => (
                    <div key={field} className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-sans text-neutral-450">
                        <span className="uppercase font-bold tracking-wider">{field === 'width' ? 'W' : 'H'}</span>
                        <span className="font-mono font-bold text-[#18A0FB]">{(activeComp as any)[field]}px</span>
                      </div>
                      <div className="h-8 bg-[#1E1E1E] px-2.5 rounded-md flex items-center border border-neutral-800/80">
                        <input type="range" min={field === 'height' ? 20 : 40} max={800} step={4}
                          value={(activeComp as any)[field]}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateActiveComponentField(field, val);
                            if (field === 'width') updateActiveComponentField('sizeMode', 'fixed');
                            if (field === 'height') updateActiveComponentField('heightMode', 'fixed');
                          }}
                          className="w-full h-1 bg-neutral-800 rounded cursor-pointer accent-[#18A0FB]" />
                      </div>
                    </div>
                  ))}
                  {/* Radius — M3 shape scale slider with snap stops */}
                  {(() => {
                    const M3_RADII = [0, 4, 8, 12, 16, 20, 28, 32, 48, 999];
                    const M3_LABELS: Record<number, string> = {0:'None',4:'XS',8:'S',12:'M',16:'L',20:'L+',28:'XL',32:'XL+',48:'XXL',999:'Full'};
                    const curR = activeComp.borderRadius >= 999 ? 999 : activeComp.borderRadius;
                    // Map slider position (0-9) to M3 value
                    const sliderIdx = M3_RADII.reduce((best, v, i) => Math.abs(v - curR) < Math.abs(M3_RADII[best] - curR) ? i : best, 0);
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-sans text-neutral-450">
                          <span className="uppercase font-bold tracking-wider">Radius</span>
                          <span className="font-mono font-bold text-[#18A0FB]">{curR >= 999 ? '∞ Full' : `${curR}px`} <span className="text-neutral-600">· {M3_LABELS[M3_RADII[sliderIdx]]}</span></span>
                        </div>
                        <div className="h-8 bg-[#1E1E1E] px-2.5 rounded-md flex items-center border border-neutral-800/80">
                          <input type="range" min="0" max="9" step="1"
                            value={sliderIdx}
                            onChange={(e) => {
                              const v = M3_RADII[Number(e.target.value)];
                              updateActiveComponentField('borderRadius', v >= 999 ? 9999 : v);
                            }}
                            className="w-full h-1 bg-neutral-800 rounded cursor-pointer accent-[#18A0FB]"
                            list="m3-radius-stops" />
                          <datalist id="m3-radius-stops">
                            {M3_RADII.map((_,i) => <option key={i} value={i} />)}
                          </datalist>
                        </div>
                        <div className="flex justify-between text-[7px] text-neutral-700 font-mono px-0.5">
                          {M3_RADII.map((v,i) => <span key={i}>{v >= 999 ? '∞' : v}</span>)}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* SHOW / HIDE TOGGLES — type-aware */}
                {(() => {
                  const t = activeComp.type;
                  // Define which toggles each type supports
                  const toggleMap: Record<string, [string,string][]> = {
                    card:     [['configShowIcon','Icon'],['configShowTitle','Title'],['configShowSubtitle','Subtitle'],['configShowDescription','Body'],['configShowActions','Actions']],
                    button:   [['configShowIcon','Icon']],
                    chip:     [['configShowIcon','Icon']],
                    dialog:   [['configShowIcon','Icon'],['configShowTitle','Title'],['configShowDescription','Body'],['configShowActions','Actions']],
                    sheets:   [['configShowTitle','Title'],['configShowDescription','Body']],
                    badge:    [],
                    fab:      [],
                    avatar:   [],
                    progress: [],
                    image:    [],
                  };
                  const toggles = toggleMap[t] || [];
                  if (!toggles.length) return null;
                  return (
                    <div className="space-y-2 pb-3 border-b border-[#333]">
                      <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Show</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {toggles.map(([field, label]) => (
                          <button key={field}
                            onClick={() => updateActiveComponentField(field as any, !(activeComp as any)[field])}
                            className={`py-1 px-2 text-[8.5px] font-bold rounded uppercase transition-all flex items-center gap-1 justify-center ${
                              (activeComp as any)[field] ? 'bg-[#18A0FB]/15 text-[#18A0FB]' : 'text-neutral-500 bg-[#1E1E1E] hover:text-neutral-300'
                            }`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* FAB LABEL */}
                {activeComp.type === 'fab' && (
                  <div className="space-y-1.5 pb-3 border-b border-[#333]">
                    <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">FAB Label</span>
                    <input type="text"
                      value={activeComp.text || ''}
                      onChange={(e) => updateActiveComponentField('text', e.target.value)}
                      placeholder="Action"
                      className="w-full bg-[#1A1A1A] border border-neutral-800 rounded px-2 py-1 text-[10px] text-neutral-100 focus:border-[#18A0FB] outline-none font-sans" />
                    <span className="text-[8px] text-neutral-600">Shown when variant is Extended</span>
                  </div>
                )}

                {/* TEXT FIELDS */}
                {!['fab','image','progress','avatar'].includes(activeComp.type) && (activeComp.configShowTitle || activeComp.configShowSubtitle || activeComp.configShowDescription) && (
                  <div className="space-y-2 pb-3 border-b border-[#333]">
                    <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Text</span>
                    {activeComp.configShowTitle && (
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-neutral-500 uppercase font-bold">Title</span>
                        <input type="text" value={activeComp.title || ''}
                          onChange={(e) => updateActiveComponentField('title', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-neutral-800 rounded px-2 py-1 text-[10px] text-neutral-100 focus:border-[#18A0FB] outline-none font-sans" />
                      </div>
                    )}
                    {activeComp.configShowSubtitle && (
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-neutral-500 uppercase font-bold">Subtitle</span>
                        <input type="text" value={activeComp.subtitle || ''}
                          onChange={(e) => updateActiveComponentField('subtitle', e.target.value)}
                          className="w-full bg-[#1A1A1A] border border-neutral-800 rounded px-2 py-1 text-[10px] text-neutral-100 focus:border-[#18A0FB] outline-none font-sans" />
                      </div>
                    )}
                    {activeComp.configShowDescription && (
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-neutral-500 uppercase font-bold">Body</span>
                        <textarea value={activeComp.text || ''}
                          onChange={(e) => updateActiveComponentField('text', e.target.value)}
                          rows={2}
                          className="w-full bg-[#1A1A1A] border border-neutral-800 rounded px-2 py-1 text-[10px] text-neutral-100 focus:border-[#18A0FB] outline-none font-sans resize-none" />
                      </div>
                    )}
                  </div>
                )}

                {/* ICON PICKER */}
                {!['image','progress'].includes(activeComp.type) && (activeComp.configShowIcon || (activeComp.type === 'fab') || (activeComp.type === 'avatar' && (activeComp.variant === 'icon' || !activeComp.variant))) && (
                  <div className="space-y-1.5 pb-3 border-b border-[#333]">
                    <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Icon</span>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Search icons..."
                        className="w-full bg-[#1A1A1A] border border-neutral-800 rounded px-2 py-1 text-[9.5px] text-neutral-100 focus:border-[#18A0FB] outline-none"
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/ /g,'_');
                          const row = document.getElementById('icon-row-container');
                          if (row) row.setAttribute('data-filter', val);
                        }}
                      />
                      <div id="icon-row-container" className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent', paddingBottom: 2 }}>
                        {['auto_awesome','volume_up','mic','play_arrow','favorite','bookmark','share','star','home','person','search','settings','notifications','mail','phone','camera','edit','delete','add','check','close','arrow_forward','arrow_back','expand_more','expand_less','refresh','download','upload','send','done','warning','error','info','help','lock','visibility','visibility_off','language','location_on','calendar_today','schedule','attach_file','link','image','video_file','music_note','palette','brush','flash_on','bolt','wb_sunny','dark_mode','cloud','wifi','bluetooth','battery_full','keyboard','mouse','smartphone','laptop','monitor','headphones','speaker','radio','tv','gamepad','toys','pets','nature','park','emoji_emotions','thumb_up','thumb_down','grade','workspace_premium','verified','security','admin_panel_settings','manage_accounts','group','groups','family_restroom','child_care','accessible','directions_run','fitness_center','sports','restaurant','local_cafe','shopping_cart','storefront','payments','credit_card','receipt','inventory','local_shipping','flight','hotel','map','explore','navigation','commute','electric_car','psychology','science','biotech','medical_services','monitor_heart'].map(icon => (
                          <button key={icon}
                            onClick={() => { updateActiveComponentField('activeIcon', icon); }}
                            className={`h-8 flex items-center justify-center rounded cursor-pointer transition-all border ${
                              (activeComp.activeIcon || 'volume_up') === icon
                                ? 'bg-[#18A0FB]/20 border-[#18A0FB]/50 text-[#18A0FB]'
                                : 'bg-[#1E1E1E] border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                            }`}
                            title={icon}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* IMAGE UPLOAD (for image type) */}
                {activeComp.type === 'image' && (
                  <div className="space-y-2 pb-3 border-b border-[#333]">
                    <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Image</span>
                    {activeComp.iconImage ? (
                      <div className="space-y-1.5">
                        {/* Preview at natural ratio, 80px tall */}
                        <div className="flex justify-center bg-[#1A1A1A] rounded-lg overflow-hidden" style={{ height: 80 }}>
                          <img src={activeComp.iconImage} alt="preview"
                            style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block' }} />
                        </div>
                        <div className="flex gap-1.5">
                          <label htmlFor="image-comp-upload"
                            className="flex-1 h-7 flex items-center justify-center gap-1 bg-[#2C2C2C] hover:bg-[#383838] text-neutral-300 hover:text-white rounded text-[9.5px] font-semibold cursor-pointer border border-neutral-700/40 transition-all">
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>upload</span>
                            Replace
                          </label>
                          <button onClick={() => updateActiveComponentField('iconImage', undefined)}
                            className="flex-1 h-7 flex items-center justify-center gap-1 bg-red-950/20 hover:bg-red-900/35 text-red-400 hover:text-red-300 rounded text-[9.5px] font-semibold cursor-pointer border border-red-900/30 transition-all">
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>delete</span>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="image-comp-upload"
                        className="flex flex-col items-center justify-center gap-2 h-20 bg-[#1A1A1A] hover:bg-[#222] border border-dashed border-neutral-700 hover:border-[#18A0FB]/50 rounded-lg cursor-pointer transition-all">
                        <span className="material-symbols-outlined text-neutral-600" style={{ fontSize: 24 }}>add_photo_alternate</span>
                        <span className="text-[9px] text-neutral-500 font-semibold uppercase">Upload Image</span>
                      </label>
                    )}
                    <input type="file" accept="image/*" id="image-comp-upload" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => updateActiveComponentField('iconImage', ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                  </div>
                )}

                {/* CARD MEDIA IMAGE */}
                {activeComp.type === 'card' && (
                  <div className="space-y-1.5 pb-3 border-b border-[#333]">
                    <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Card Image</span>
                    <div className="flex gap-1.5">
                      <label htmlFor="card-media-upload" className="flex-1 py-1.5 px-2 bg-[#2C2C2C] hover:bg-[#333] text-neutral-300 rounded text-[9px] font-bold uppercase cursor-pointer text-center border border-neutral-700/50 transition-colors">
                        {activeComp.iconImage ? 'Replace' : 'Upload Image'}
                      </label>
                      <input type="file" accept="image/*" id="card-media-upload" className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => updateActiveComponentField('iconImage', ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                      {activeComp.iconImage && (
                        <button onClick={() => updateActiveComponentField('iconImage', undefined)}
                          className="py-1.5 px-2 bg-red-950/25 hover:bg-red-900/30 text-red-400 rounded text-[9px] font-bold uppercase cursor-pointer border-none">
                          Remove
                        </button>
                      )}
                    </div>
                    {activeComp.iconImage && (
                      <div className="rounded overflow-hidden h-16 bg-[#1E1E1E]">
                        <img src={activeComp.iconImage} className="w-full h-full object-cover" alt="card media" />
                      </div>
                    )}
                    {/* Card layout toggle */}
                    <div className="flex gap-1 mt-1">
                      {(['vertical','horizontal'] as const).map(layout => (
                        <button key={layout}
                          onClick={() => {
                          updateActiveComponentField('layout' as any, layout);
                          if (layout === 'horizontal') {
                            updateActiveComponentField('configShowDescription', false);
                            updateActiveComponentField('configShowActions', false);
                          }
                        }}
                          className={`flex-1 py-1 text-[8.5px] font-bold uppercase rounded cursor-pointer transition-all ${(activeComp.layout||'vertical')===layout?'bg-[#18A0FB]/15 text-[#18A0FB]':'text-neutral-500 bg-[#1E1E1E] hover:text-neutral-300'}`}>
                          {layout}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CARD ACTION BUTTONS CONFIG */}
                {activeComp.type === 'card' && activeComp.configShowActions && (
                  <div className="space-y-1.5 pb-3 border-b border-[#333]">
                    <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Action Buttons</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Secondary','Action'] as const).map((which) => {
                        const isSecondary = which === 'Secondary';
                        const textField = isSecondary ? 'configSecondaryBtnText' : 'configActionBtnText';
                        const variantField = isSecondary ? 'configSecondaryBtnVariant' : 'configActionBtnVariant';
                        const defaultText = isSecondary ? 'Secondary' : 'Action';
                        const defaultVariant = isSecondary ? 'outlined' : 'filled';
                        return (
                          <div key={which} className="space-y-1">
                            <span className="text-[8px] text-neutral-500 uppercase font-bold">{which}</span>
                            <input type="text"
                              value={(activeComp as any)[textField] || defaultText}
                              onChange={(e) => updateActiveComponentField(textField as any, e.target.value)}
                              className="w-full bg-[#1A1A1A] border border-neutral-800 rounded px-2 py-1 text-[9px] text-neutral-100 focus:border-[#18A0FB] outline-none" />
                            <div className="relative">
                              <select
                                value={(activeComp as any)[variantField] || defaultVariant}
                                onChange={(e) => updateActiveComponentField(variantField as any, e.target.value)}
                                className="w-full bg-[#1A1A1A] text-neutral-200 border border-neutral-800 rounded px-1.5 pr-5 py-1 text-[9px] focus:border-[#18A0FB] outline-none appearance-none cursor-pointer">
                                <option value="filled">Filled</option>
                                <option value="outlined">Outlined</option>
                                <option value="tonal">Tonal</option>
                                <option value="text">Text</option>
                                <option value="elevated">Elevated</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center"><ChevronDown className="w-3 h-3 text-neutral-500" /></div>
                            </div>
                            <div className="relative">
                              <select
                                value={(activeComp as any)[(isSecondary ? 'configSecondaryBtnSize' : 'configActionBtnSize')] || 's'}
                                onChange={(e) => updateActiveComponentField((isSecondary ? 'configSecondaryBtnSize' : 'configActionBtnSize') as any, e.target.value)}
                                className="w-full bg-[#1A1A1A] text-neutral-200 border border-neutral-800 rounded px-1.5 pr-5 py-1 text-[9px] focus:border-[#18A0FB] outline-none appearance-none cursor-pointer">
                                <option value="xs">XS</option>
                                <option value="s">S</option>
                                <option value="m">M</option>
                                <option value="l">L</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center"><ChevronDown className="w-3 h-3 text-neutral-500" /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ICON / AVATAR BG COLOR */}
                {activeComp.type === 'avatar' && activeComp.variant !== 'image' && (
                  <div className="space-y-1.5 pb-3 border-b border-[#333]">
                    <span className="text-[9.5px] font-sans uppercase text-neutral-450 font-bold tracking-wider">Avatar BG</span>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {['#6750A4','#0061A4','#006A60','#C00100','#386A20','#7D5260'].map(hex => (
                        <button key={hex}
                          onClick={() => updateActiveComponentField('iconBgColor', hex)}
                          className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${(activeComp.iconBgColor || '#6750A4').toLowerCase() === hex.toLowerCase() ? 'border-[#18A0FB] scale-110 shadow shadow-[#18A0FB]/20' : 'border-neutral-700 hover:border-neutral-500 hover:scale-105'}`}
                          style={{ backgroundColor: hex }}
                          title={hex}>
                          {(activeComp.iconBgColor || '#6750A4').toLowerCase() === hex.toLowerCase() && <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">✓</span>}
                        </button>
                      ))}
                      <div className="relative w-5 h-5 rounded-full overflow-hidden border flex items-center justify-center cursor-pointer transition-all"
                        style={{ backgroundImage: 'linear-gradient(135deg,#ff0055,#ffdd00,#00ffaa,#00a2ff,#bb00ff)', borderColor: !['#6750A4','#0061A4','#006A60','#C00100','#386A20','#7D5260'].includes(activeComp.iconBgColor || '') ? '#18A0FB' : '#404040' }}
                        title="Custom color">
                        <input type="color" value={activeComp.iconBgColor || '#6750A4'}
                          onChange={(e) => updateActiveComponentField('iconBgColor', e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}



          </div>



        </aside>

      </div>

      {/* FIGMA NATIVE PLUGIN PACKAGING INSTALLER GUIDE */}
      {isPluginModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#2C2C2C] w-full max-w-2xl border border-neutral-700/80 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden select-text text-neutral-100 font-sans">
            
            {/* Header */}
            <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#222]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#A259FF] text-2xl">extension</span>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">Figma Plugin Integrator</h3>
                  <p className="text-[10px] text-neutral-400">Step-by-step developer manifest config</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPluginModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer border-none outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs leading-relaxed max-h-[70vh]">
              
              <div className="bg-[#18A0FB]/10 border border-[#18A0FB]/30 p-3 rounded text-[11px] text-[#18A0FB] flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong>How local Figma components connect:</strong> Figma plugins are written using standard HTML frame wraps that embed web interfaces. You can load this exact reactive waveform spec manager into Figma with simple files!
                </div>
              </div>

              {/* Step 1 */}
              <div className="space-y-1.5 pb-2 border-b border-white/5">
                <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#18A0FB] text-white text-[9px] font-mono flex items-center justify-center font-bold">1</span>
                  <span>Create the manifest.json file</span>
                </div>
                <p className="text-neutral-400 text-[10.5px]">
                  Create a new folder on your computer named <code className="bg-[#1E1E1E] text-neutral-300 px-1 py-0.5 rounded font-mono text-[9.5px]">m3-motion-tracker</code>, create a new file named <code className="bg-[#1E1E1E] text-neutral-300 px-1 py-0.5 rounded font-mono text-[9.5px]">manifest.json</code> inside, and paste this manifest descriptor:
                </p>
                <pre className="bg-[#1E1E1E] p-3 rounded font-mono text-[10px] text-emerald-400 overflow-x-auto border border-neutral-800">
{`{
  "name": "M3 Shape Spec Motion Simulator",
  "id": "m3-shape-spec-motion",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"]
}`}
                </pre>
              </div>

              {/* Step 2 */}
              <div className="space-y-1.5 pb-2 border-b border-white/5">
                <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#18A0FB] text-white text-[9px] font-mono flex items-center justify-center font-bold">2</span>
                  <span>Write background proxy code.js</span>
                </div>
                <p className="text-neutral-400 text-[10.5px]">
                  Create a file named <code className="bg-[#1E1E1E] text-neutral-300 px-1 py-0.5 rounded font-mono text-[9.5px]">code.js</code> in the folder to spawn the frame setup when launched:
                </p>
                <pre className="bg-[#1E1E1E] p-3 rounded font-mono text-[10px] text-amber-400 overflow-x-auto border border-neutral-800">
{`figma.showUI(__html__, { width: 980, height: 750 });

figma.ui.onmessage = (msg) => {
  if (msg.type === "close") {
    figma.closePlugin();
  }
};`}
                </pre>
              </div>

              {/* Step 3 */}
              <div className="space-y-1.5 pb-2 border-b border-white/5">
                <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#18A0FB] text-white text-[9px] font-mono flex items-center justify-center font-bold">3</span>
                  <span>Create ui.html pointing to this app</span>
                </div>
                <p className="text-neutral-400 text-[10.5px]">
                  Lastly, create a file named <code className="bg-[#1E1E1E] text-neutral-300 px-1 py-0.5 rounded font-mono text-[9.5px]">ui.html</code> that links directly to this workspace viewport dynamically:
                </p>
                <pre className="bg-[#1E1E1E] p-3 rounded font-mono text-[10px] text-cyan-400 overflow-x-auto border border-neutral-800">
{`<iframe 
  src="${window.location.origin}" 
  style="width: 100%; height: 100%; border: 0; outline: none; margin: 0; padding: 0; position: absolute; inset: 0;"
></iframe>`}
                </pre>
              </div>

              {/* Step 4 */}
              <div className="space-y-1.5">
                <div className="font-bold text-neutral-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#18A0FB] text-white text-[9px] font-mono flex items-center justify-center font-bold">4</span>
                  <span>Load Manifest in Figma Desktop</span>
                </div>
                <p className="text-neutral-400 text-[10.5px]">
                  Open <strong>Figma Desktop app</strong>, click menu icon, go to <span className="text-neutral-200 font-bold">Plugins → Development → Import plugin from manifest...</span>, then choose your <code className="bg-[#1E1E1E] px-1 text-white font-mono">manifest.json</code>. Launch whenever you need to adjust interactive M3 dimensions or record motion waveforms directly as clean assets!
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-[#1A1A1A] border-t border-[#333] flex justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  showToast("Figma files packaging structure cloned to clipboard!");
                }}
                className="px-3.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] uppercase font-bold text-neutral-200 transition-colors cursor-pointer border-none outline-none"
              >
                Copy manifest details
              </button>
              <button
                onClick={() => setIsPluginModalOpen(false)}
                className="px-3.5 py-1.5 rounded bg-[#18A0FB] hover:bg-[#18A0FB]/90 text-[10.5px] uppercase font-bold text-white transition-colors cursor-pointer border-none_outline-none"
              >
                Done / Got it
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 1: SAVE WORKSPACE COMBINATION VIEW --- */}
      {isSaveComboModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-[99] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#2C2C2C] border border-neutral-700/60 rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden text-[#E6E6E6]">
            
            <div className="p-4 bg-[#222222] border-b border-[#1A1A1A] flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-neutral-200">Save Combination Spec</span>
              <button 
                onClick={() => setIsSaveComboModalOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-450 block">Name of Combination view/layout</label>
                <input 
                  type="text"
                  value={newComboName}
                  onChange={(e) => setNewComboName(e.target.value)}
                  placeholder="e.g. ❖ Electric Neon HUD Grid"
                  className="w-full bg-[#1A1A1A] text-white border border-neutral-700 rounded-md p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#18A0FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-450 block">Link to Figma File</label>
                <div className="relative">
                  <select
                    value={newComboFileId}
                    onChange={(e) => setNewComboFileId(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-neutral-700 rounded px-3 pr-8 py-2 text-[10px] font-sans focus:border-[#18A0FB] focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">— None —</option>
                    {linkedFigmaFiles.map(file => (
                      <option key={file.id} value={file.id}>{file.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  </div>
                </div>
                <input type="text" placeholder="Or paste a new Figma file URL and press ↵"
                  className="w-full bg-[#1A1A1A] text-white border border-neutral-700 rounded px-2.5 py-1.5 text-[10px] font-sans focus:border-[#18A0FB] focus:outline-none placeholder-neutral-600 mt-1.5"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const url = (e.target as HTMLInputElement).value.trim();
                      if (url) {
                        const id = `fig-${Date.now()}`;
                        const name = url.includes('figma.com') ? url.split('/').filter(Boolean).pop()?.split('?')[0] || 'Figma File' : url;
                        setLinkedFigmaFiles((prev: any[]) => [...prev, { id, name, url }]);
                        setNewComboFileId(id);
                        (e.target as HTMLInputElement).value = '';
                        showToast(`Linked: ${name}`);
                      }
                    }
                  }}
                />
                <span className="text-[9px] text-neutral-600 block pt-1">Captures: components, energy states, colors, and backdrops.</span>
              </div>
            </div>

            <div className="p-3 bg-[#1E1E1E] border-t border-neutral-800 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsSaveComboModalOpen(false)}
                className="px-3.5 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 font-bold transition-all cursor-pointer border-none text-[#E6E6E6]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSaveCurrentCombination(newComboName, newComboFileId);
                  setNewComboName('');
                }}
                className="px-4 py-2 rounded-md bg-[#18A0FB] hover:bg-[#158CDD] text-white font-bold transition-all cursor-pointer border-none"
              >
                Save layout combo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 4: START A NEW VIEW FROM SCRATCH WITH LINKED FILE CHOICE --- */}
      {isNewFromScratchModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-[99] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#2C2C2C] border border-neutral-700/60 rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden text-[#E6E6E6]">
            
            <div className="p-4 bg-[#222222] border-b border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-200">Start Project From Scratch</span>
              </div>
              <button 
                onClick={() => setIsNewFromScratchModalOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-450 block">Project Name</label>
                <input 
                  type="text"
                  value={newScratchName}
                  onChange={(e) => setNewScratchName(e.target.value)}
                  placeholder="e.g. My Workspace Spec"
                  className="w-full bg-[#1A1A1A] text-white border border-neutral-700 rounded-md p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#18A0FB]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-450 block">Optionally Link a Figma Design File</label>
                <select
                  value={newScratchFileId}
                  onChange={(e) => setNewScratchFileId(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white border border-neutral-700 rounded-md p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#18A0FB] cursor-pointer"
                >
                  <option value="none">-- Don't link a file (Independent Blank Specimen) --</option>
                  {linkedFigmaFiles.map(file => (
                    <option key={file.id} value={file.id}>{file.name}</option>
                  ))}
                </select>
                <span className="text-[9.5px] text-neutral-500 block leading-normal pt-1">
                  Linking a design file establishes the context for exporting and importing layout properties in the Figma plugin ecosystem. You can still link or change files later.
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#1E1E1E] border-t border-neutral-800 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsNewFromScratchModalOpen(false)}
                className="px-3.5 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 font-bold transition-all cursor-pointer border-none text-[#E6E6E6]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomScratch}
                className="px-5 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all cursor-pointer border-none"
              >
                Create Project
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 5: CUSTOM LAYER-SPECIFIC FIGMA LINK CONFIGURATION DIALOG --- */}
      {isLayerLinkModalOpen && activeLinkCombination && (
        <div className="fixed inset-0 bg-black/75 z-[99] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#2C2C2C] border border-neutral-700/60 rounded-xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden text-[#E6E6E6]">
            
            <div className="p-4 bg-[#222222] border-b border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-sans">
                <Link2 className="w-4 h-4 text-[#18A0FB]" />
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-200">Figma Link Configuration</span>
              </div>
              <button 
                onClick={() => {
                  setIsLayerLinkModalOpen(false);
                  setActiveLinkCombination(null);
                }}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400 block">Active Layer Preset</span>
                <span className="text-xs font-bold text-white mt-1 block">
                  {activeLinkCombination.name}
                </span>
              </div>

              {/* Linked File Status */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400 block">Currently Linked File</label>
                {activeLinkCombination.figmaFileId && activeLinkCombination.figmaFileId !== 'none' && linkedFigmaFiles.some(f => f.id === activeLinkCombination.figmaFileId) ? (
                  (() => {
                    const matchedFile = linkedFigmaFiles.find(f => f.id === activeLinkCombination.figmaFileId)!;
                    return (
                      <div className="p-3 rounded-lg bg-[#1A1A1A] border border-neutral-800/85 space-y-2">
                        <div className="flex items-center gap-2">
                          <FolderHeart className="w-4 h-4 text-[#18A0FB]" />
                          <span className="text-xs font-bold text-white truncate">{matchedFile.name}</span>
                        </div>
                        <a 
                          href={matchedFile.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-[#18A0FB] hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>Open design file specs</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-[11px] text-neutral-500 italic">
                    No Figma file currently linked to this layer.
                  </div>
                )}
              </div>

              {/* Link an Existing Figma File Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400 block">Change Link / Select Figma File</label>
                <select
                  value={activeLinkCombination.figmaFileId || 'none'}
                  onChange={(e) => {
                    const newFigmaId = e.target.value;
                    // Update copy
                    setActiveLinkCombination(prev => prev ? { ...prev, figmaFileId: newFigmaId } : null);
                    // Commit to save state
                    setSavedCombinations(prev => prev.map(c => {
                      if (c.id === activeLinkCombination.id) {
                        return { ...c, figmaFileId: newFigmaId };
                      }
                      return c;
                    }));
                    // Also update active file ID context
                    setSelectedFigmaFileId(newFigmaId);
                    showToast(`Linked combination to: ${newFigmaId === 'none' ? 'Independent Spec space' : (linkedFigmaFiles.find(f => f.id === newFigmaId)?.name || 'Specs File')}`);
                  }}
                  className="w-full bg-[#1A1A1A] text-white border border-neutral-700/80 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#18A0FB] cursor-pointer"
                >
                  <option value="none">-- Unlink / No Figma File --</option>
                  {linkedFigmaFiles.map(file => (
                    <option key={file.id} value={file.id}>{file.name}</option>
                  ))}
                </select>
              </div>

              {/* Edit Selected Linked File Metadata Inline or Create a New Connection */}
              <div className="space-y-2 pt-3 border-t border-neutral-800">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400 block">
                  {activeLinkCombination.figmaFileId !== 'none' ? 'Edit Selected File Metadata' : 'Or Create & Link New Figma File'}
                </span>

                <div className="space-y-1">
                  <label className="text-[9px] font-sans font-semibold text-neutral-400">File Name</label>
                  <input
                    type="text"
                    placeholder="e.g. material_3_fluid_energy_spec.fig"
                    value={modalFigmaName}
                    onChange={(e) => setModalFigmaName(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-neutral-700 p-2 text-xs rounded focus:outline-none focus:ring-1 focus:ring-[#18A0FB]"
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[9px] font-sans font-semibold text-neutral-400">Figma URL</label>
                  <input
                    type="text"
                    placeholder="e.g. https://figma.com/file/..."
                    value={modalFigmaUrl}
                    onChange={(e) => setModalFigmaUrl(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-neutral-700 p-2 text-xs rounded focus:outline-none focus:ring-1 focus:ring-[#18A0FB]"
                  />
                </div>

                <div className="flex gap-2 pt-1.5">
                  {activeLinkCombination.figmaFileId && activeLinkCombination.figmaFileId !== 'none' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!modalFigmaName.trim()) {
                          showToast("Please enter a valid file name.");
                          return;
                        }
                        const targetId = activeLinkCombination.figmaFileId;
                        setLinkedFigmaFiles(prev => prev.map(f => {
                          if (f.id === targetId) {
                            return { ...f, name: modalFigmaName.trim(), url: modalFigmaUrl.trim() };
                          }
                          return f;
                        }));
                        showToast(`Updated details for linked file!`);
                      }}
                      className="flex-1 h-8 rounded bg-[#18A0FB] hover:bg-[#158CDD] text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none"
                    >
                      Save File Details
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!modalFigmaName.trim()) {
                          showToast("Please enter a file name first.");
                          return;
                        }
                        const newId = `fig-${Math.random().toString(36).substring(2, 9)}`;
                        const newFile = {
                          id: newId,
                          name: modalFigmaName.trim(),
                          url: modalFigmaUrl.trim() || 'https://figma.com'
                        };
                        setLinkedFigmaFiles(prev => [...prev, newFile]);
                        // Set this combo to the newly created file context
                        setActiveLinkCombination(prev => prev ? { ...prev, figmaFileId: newId } : null);
                        setSavedCombinations(prev => prev.map(c => {
                          if (c.id === activeLinkCombination.id) {
                            return { ...c, figmaFileId: newId };
                          }
                          return c;
                        }));
                        setModalFigmaName('');
                        setModalFigmaUrl('');
                        showToast(`Connected & linked new file: ${newFile.name}`);
                      }}
                      className="flex-1 h-8 rounded bg-[#18A0FB] hover:bg-[#158CDD] text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none"
                    >
                      Create & Link File
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1E1E1E] border-t border-neutral-800 flex justify-end text-xs">
              <button
                onClick={() => {
                  setIsLayerLinkModalOpen(false);
                  setActiveLinkCombination(null);
                }}
                className="px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 font-bold transition-all cursor-pointer border-none text-white text-xs"
              >
                Close / Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 2: LINKED FIGMA DESIGN FILES MANAGER --- */}
      {isSettingFigmaModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-[99] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#2C2C2C] border border-neutral-700/60 rounded-xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden text-[#E6E6E6]">
            
            <div className="p-4 bg-[#222222] border-b border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#18A0FB]" />
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-200">Linked Figma Specs Manager</span>
              </div>
              <button 
                onClick={() => setIsSettingFigmaModalOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col md:flex-row gap-5">
              
              {/* Left Column: Link files list */}
              <div className="flex-1 space-y-3">
                <span className="text-[10px] uppercase font-sans tracking-wider font-bold text-neutral-450 block">Linked System Assets</span>
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {linkedFigmaFiles.map(file => {
                    const isSelected = selectedFigmaFileId === file.id;
                    return (
                      <div 
                        key={file.id} 
                        onClick={() => {
                          setSelectedFigmaFileId(file.id);
                          showToast(`Switched Frame context: ${file.name}`);
                        }}
                        className={`p-2.5 rounded-lg border flex items-center justify-between group transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#18A0FB]/10 border-[#18A0FB]/40 shadow-sm' 
                            : 'bg-[#1A1A1A] border-neutral-800 hover:border-neutral-700/50 hover:bg-[#1E1E1E]'
                        }`}
                      >
                        <div className="truncate flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#18A0FB]" />}
                            <span className={`text-xs font-bold block truncate ${isSelected ? 'text-[#18A0FB]' : 'text-neutral-200'}`}>{file.name}</span>
                          </div>
                          <a 
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[9px] font-sans font-bold text-neutral-500 hover:text-[#18A0FB] flex items-center gap-0.5 truncate uppercase tracking-wider mt-1"
                          >
                            <span>Open File Web View</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        {file.id !== 'fig-1' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFigmaFile(file.id, e);
                            }}
                            className="p-1 rounded bg-neutral-800 text-rose-450 hover:bg-neutral-700 cursor-pointer border-none transition-colors"
                            title="Unlink and remote figma reference"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Add new Figma file context form */}
              <div className="flex-1 space-y-3 border-t md:border-t-0 md:border-l border-neutral-700/60 pt-3 md:pt-0 md:pl-4">
                <span className="text-[10px] uppercase font-sans tracking-wider font-bold text-[#18A0FB] block">Link another file context</span>
                
                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-bold text-neutral-450 font-sans tracking-wide uppercase">Name of Spec File</label>
                  <input 
                    type="text"
                    value={newFigmaName}
                    onChange={(e) => setNewFigmaName(e.target.value)}
                    placeholder="e.g. material_components_custom.fig"
                    className="w-full bg-[#1A1A1A] text-white border border-neutral-700 p-2 text-xs rounded focus:outline-none focus:ring-1 focus:ring-[#18A0FB]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-bold text-neutral-450 font-sans tracking-wide uppercase">Figma File Access URL</label>
                  <input 
                    type="text"
                    value={newFigmaUrl}
                    onChange={(e) => setNewFigmaUrl(e.target.value)}
                    placeholder="e.g. https://figma.com/file/..."
                    className="w-full bg-[#1A1A1A] text-white border border-neutral-700 p-2 text-xs rounded focus:outline-none focus:ring-1 focus:ring-[#18A0FB]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!newFigmaName.trim()) {
                      showToast("Please provide a name for the Figma file spec.");
                      return;
                    }
                    handleAddFigmaFile(newFigmaName, newFigmaUrl);
                  }}
                  className="w-full h-8 rounded bg-[#18A0FB] hover:bg-[#158CDD] text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connect design system file</span>
                </button>
              </div>

            </div>

            <div className="p-3 bg-[#1E1E1E] border-t border-neutral-800 flex justify-end text-xs">
              <button
                onClick={() => setIsSettingFigmaModalOpen(false)}
                className="h-8 px-4 rounded bg-[#18A0FB] hover:bg-[#158CDD] text-white font-sans text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer border-none flex items-center"
              >
                Close and return to workspace
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 3: SHARED VIEW COMBINATION IMPORT NOTIFICATION --- */}
      {isImportModalOpen && sharedImportCombination && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-[#2C2C2C] border-2 border-[#18A0FB]/40 rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden text-[#E6E6E6]">
            
            <div className="p-4 bg-[#1E1E1E] border-b border-[#2C2C2C] flex items-center gap-2">
              <Sparkle className="w-5 h-5 text-[#18A0FB] animate-spin-slow" />
              <span className="font-bold text-xs uppercase tracking-wider text-white">Import Shared Layout Blueprint</span>
            </div>

            <div className="p-5 space-y-3.5">
              <p className="text-xs text-neutral-300 leading-relaxed">
                You have been shared a custom design preview combination layout! Importing this blueprint will update your active canvas components and settings options:
              </p>
              
              <div className="bg-[#1A1A1A] border border-neutral-800/80 rounded-lg p-3 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Layout Name:</span>
                  <strong className="text-white">{sharedImportCombination.name}</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-sans">Material Specimens Count:</span>
                  <strong className="text-[#18A0FB] font-mono">{sharedImportCombination.components?.length || 0} items</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Assigned Theme:</span>
                  <strong className="text-neutral-300 capitalize">{sharedImportCombination.canvasBgMode || 'dark'} Theme</strong>
                </div>
              </div>

              <div className="text-[10px] text-neutral-450 bg-rose-950/15 p-2 rounded text-rose-350 border border-rose-950/30">
                Warning: Importing will overwrite any unsaved changes on your active designer workspace board.
              </div>
            </div>

            <div className="p-3 bg-[#1A1A1A] border-t border-neutral-800 flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setSharedImportCombination(null);
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="px-3.5 py-2 rounded bg-neutral-800 hover:bg-neutral-700 font-bold transition-all cursor-pointer border-none"
              >
                Reject & Discard
              </button>
              <button
                onClick={() => {
                  handleLoadCombination(sharedImportCombination);
                  setIsImportModalOpen(false);
                  setSharedImportCombination(null);
                  // Clean URL query param beautiful state transition
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="px-4 py-2 rounded bg-green-650 hover:bg-green-600 text-white font-bold transition-all cursor-pointer border-none shadow-md shadow-green-950/20"
              >
                Accept and load layout
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Dynamic SVG Organic Warp Displacement Filter */}
      <svg className="absolute pointer-events-none" style={{ width: 0, height: 0, position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <filter id="m3-energy-warp-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.005 0.004"
              numOctaves="1"
              result="noise"
              seed="5"
            >
              <animate
                attributeName="baseFrequency"
                dur="18s"
                values="0.005 0.004;0.009 0.008;0.005 0.004"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={isAnimationActive ? intensity * 7 + 1.5 : 0}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

    </div>
  );
}

function WaveLoopVisualizer({ intensity, isPlaying }: { intensity: number; isPlaying: boolean }) {
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    const tick = () => {
      setPhase((prev) => (prev + 0.04 * intensity) % (Math.PI * 2));
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, intensity]);

  const width = 180;
  const height = 30;
  
  const points1 = [];
  for (let x = 0; x <= width; x += 5) {
    const y = height / 2 + Math.sin(x * 0.04 + phase) * 6 * Math.min(1.5, intensity);
    points1.push(`${x},${y}`);
  }
  const d1 = `M ${points1.join(' L ')}`;

  const points2 = [];
  for (let x = 0; x <= width; x += 5) {
    const y = height / 2 + Math.sin(x * 0.06 - phase * 1.2) * 4 * Math.min(1.5, intensity);
    points2.push(`${x},${y}`);
  }
  const d2 = `M ${points2.join(' L ')}`;

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path
        d={d1}
        fill="none"
        stroke="url(#energyGradient1)"
        strokeWidth="1.5"
        className="opacity-80"
      />
      <path
        d={d2}
        fill="none"
        stroke="url(#energyGradient2)"
        strokeWidth="1"
        className="opacity-55"
      />
      <defs>
        <linearGradient id="energyGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#18A0FB" />
          <stop offset="100%" stopColor="#0ACF83" />
        </linearGradient>
        <linearGradient id="energyGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0ACF83" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#18A0FB" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
