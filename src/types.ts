export interface ShaderStateConfig {
  shaderCode: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  scale: number;
  speed: number;
}

export interface InteractionStates {
  listening: ShaderStateConfig;
  responding: ShaderStateConfig;
  processing: ShaderStateConfig;
  anticipating: ShaderStateConfig;
}

export interface ShaderPreset {
  id: string;
  title: string;
  description: string;
  author: 'system' | 'ai' | 'user' | 'api';
  // Standard preset code
  shaderCode: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  suggestedScale: number;
  suggestedSpeed: number;
  // State specific overrides
  states?: InteractionStates;
}

export type ComponentLayerType = 'frame' | 'button' | 'card' | 'badge' | 'text';

export interface FigmaComponent {
  id: string;
  name: string;
  type: ComponentLayerType;
  width: number;
  height: number;
  borderRadius: number;
  padding: number;
  backgroundColor: string;
  textColor: string;
  hasShaderBg: boolean;
  shaderId: string;
  shaderIntensity: number; // opacity of shader background (0 to 1)
  shaderBlendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'difference';
  text: string;
  iconName?: string;
  hasHoverEffect: boolean;
  activeState: 'listening' | 'responding' | 'processing' | 'anticipating';
}

export interface ShaderApiConfig {
  endpointUrl: string;
  useCustomApi: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
}
