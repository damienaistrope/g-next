import { ShaderPreset } from './types';

export const DEFAULT_PRESETS: ShaderPreset[] = [
  {
    id: 'google-energy',
    title: 'Google Energy Shader',
    description: 'The official glowing multi-state energy wave GLSL pipeline. Sourced from ac3dc997-fbb3-5e10-8d08-fd2b37b4f0b9/energy.glsl.',
    primaryColorHex: '#18A0FB', // Google Blue
    secondaryColorHex: '#0ACF83', // Google Emerald
    suggestedScale: 1.5,
    suggestedSpeed: 1.2,
    author: 'system',
    states: {
      listening: {
        shaderCode: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_color_primary;
uniform vec3 u_color_secondary;
uniform float u_speed;
uniform float u_scale;

// Listening: Deforming energy waves reacting to frequency pulses (ac3dc997-fbb3-5e10-8d08-fd2b37b4f0b9)
void main() {
    float t = u_time * u_speed * 0.45;
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = -1.0 + 2.0 * uv;
    p.x *= u_resolution.x / u_resolution.y;
    p *= u_scale;

    // Organic noise-like wave sum simulating voice audio
    float s1 = sin(p.x * 2.1 + t * 1.5) * 0.4 + cos(p.y * 3.2 - t) * 0.3;
    float s2 = cos(p.x * 1.4 - t * 2.0) * 0.5 + sin(p.y * 4.1 + t * 1.2) * 0.2;
    float energy = (s1 + s2);

    // Glowing core ribbon
    float dist = abs(p.y + energy * 0.6);
    float glow = 0.05 / (dist + 0.08);

    // Fade edges
    glow *= smoothstep(1.8, 0.2, abs(p.x));

    vec3 baseColor = mix(u_color_primary, u_color_secondary, sin(p.x * 0.5 + t) * 0.5 + 0.5);
    vec3 finalColor = baseColor * glow * (sin(u_time * 4.0) * 0.12 + 0.88);
    
    gl_FragColor = vec4(finalColor, 1.0);
}`,
        primaryColorHex: '#18A0FB',
        secondaryColorHex: '#00FFD2',
        scale: 1.6,
        speed: 1.3
      },
      responding: {
        shaderCode: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_color_primary;
uniform vec3 u_color_secondary;
uniform float u_speed;
uniform float u_scale;

// Responding: High-intensity, high-frequency kinetic energy oscillations (ac3dc997-fbb3-5e10-8d08-fd2b37b4f0b9)
void main() {
    float t = u_time * u_speed * 1.6;
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = -1.0 + 2.0 * uv;
    p.x *= u_resolution.x / u_resolution.y;
    p *= u_scale * 0.85;

    // Fast overlapping sin ripples
    float ripple1 = sin(p.x * 6.0 + t) * sin(p.y * 5.0 - t * 1.5);
    float ripple2 = cos(p.y * 7.5 + t * 2.0) * cos(p.x * 4.0 - t);
    float energyFreq = abs(ripple1 + ripple2) * 0.5;

    // Sharp spikes
    float core = abs(p.y - sin(p.x * 5.0 + t * 2.0) * 0.4);
    float glow = 0.035 / (core + 0.05) + energyFreq * 0.3;

    vec3 activeColor = mix(u_color_primary, vec3(1.0, 1.0, 1.0), 0.15);
    vec3 finalColor = mix(activeColor, u_color_secondary, sin(p.x * 1.5 - t * 2.0) * 0.5 + 0.5) * glow;
    
    gl_FragColor = vec4(finalColor * 0.95, 1.0);
}`,
        primaryColorHex: '#FF00AA',
        secondaryColorHex: '#38BDF8',
        scale: 1.1,
        speed: 2.4
      },
      processing: {
        shaderCode: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_color_primary;
uniform vec3 u_color_secondary;
uniform float u_speed;
uniform float u_scale;

// Processing: Unified spinning nexus core (ac3dc997-fbb3-5e10-8d08-fd2b37b4f0b9)
void main() {
    float t = u_time * u_speed * 1.0;
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = -1.0 + 2.0 * uv;
    p.x *= u_resolution.x / u_resolution.y;
    p *= u_scale * 1.2;

    float angle = atan(p.y, p.x);
    float radius = length(p);

    // Double orbital strands
    float spiral1 = sin(angle * 2.0 + radius * 3.0 - t * 4.5);
    float spiral2 = cos(angle * 2.0 - radius * 4.0 + t * 3.0);
    float strands = abs(spiral1 * spiral2);

    float coreGlow = 0.18 / (radius + 0.04);
    float edgeRing = smoothstep(0.9, 0.0, abs(radius - 0.5) + strands * 0.15);

    vec3 baseColor = mix(u_color_primary, u_color_secondary, sin(radius * 1.5 - t) * 0.5 + 0.5);
    vec3 finalColor = baseColor * (coreGlow * 0.35 + edgeRing * 0.8) * (1.2 - radius * 0.4);

    gl_FragColor = vec4(finalColor, 1.0);
}`,
        primaryColorHex: '#D946EF',
        secondaryColorHex: '#06B6D4',
        scale: 0.95,
        speed: 1.15
      },
      anticipating: {
        shaderCode: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_color_primary;
uniform vec3 u_color_secondary;
uniform float u_speed;
uniform float u_scale;

// Anticipating: Healing soft breathing heartbeat expansion glow (ac3dc997-fbb3-5e10-8d08-fd2b37b4f0b9)
void main() {
    float t = u_time * u_speed * 0.3;
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = -1.0 + 2.0 * uv;
    p.x *= u_resolution.x / u_resolution.y;
    p *= u_scale * 1.4;

    float dist = length(p);
    
    // Smooth respiration rhythm
    float breathe = sin(t * 3.0) * 0.12 + 0.5;
    
    float pulse = smoothstep(breathe + 0.18, breathe, dist) - smoothstep(breathe, breathe - 0.18, dist);
    float ambient = 0.05 / (abs(dist - breathe) + 0.07);

    vec3 baseColor = mix(u_color_primary * 0.3, u_color_secondary, pulse);
    vec3 finalColor = baseColor * (pulse * 1.5 + ambient * 0.4);
    
    gl_FragColor = vec4(finalColor, 1.0);
}`,
        primaryColorHex: '#6D28D9',
        secondaryColorHex: '#A78BFA',
        scale: 1.4,
        speed: 0.5
      }
    },
    shaderCode: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_color_primary;
uniform vec3 u_color_secondary;
uniform float u_speed;
uniform float u_scale;

// Google Energy default (ac3dc997-fbb3-5e10-8d08-fd2b37b4f0b9)
void main() {
    float t = u_time * u_speed * 0.45;
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = -1.0 + 2.0 * uv;
    p.x *= u_resolution.x / u_resolution.y;
    p *= u_scale;

    float s1 = sin(p.x * 2.1 + t * 1.5) * 0.4 + cos(p.y * 3.2 - t) * 0.3;
    float s2 = cos(p.x * 1.4 - t * 2.0) * 0.5 + sin(p.y * 4.1 + t * 1.2) * 0.2;
    float energy = (s1 + s2);

    float dist = abs(p.y + energy * 0.6);
    float glow = 0.05 / (dist + 0.08);
    glow *= smoothstep(1.8, 0.2, abs(p.x));

    vec3 baseColor = mix(u_color_primary, u_color_secondary, sin(p.x * 0.5 + t) * 0.5 + 0.5);
    vec3 finalColor = baseColor * glow;
    
    gl_FragColor = vec4(finalColor, 1.0);
}`
  }
];
