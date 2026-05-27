import React, { useEffect, useRef, useState } from 'react';

interface ShaderRendererProps {
  state: number;
  previousState: number;
  transition: number; // 0.0 to 1.0 transition factor
  width: number;       // element width in CSS px
  height: number;      // element height in CSS px
  borderRadius: number; // element corner radius in px
  baseColorHex: string;
  midColorHex: string;
  endColorHex: string;
  hoverActive: boolean;
  renderMode: number;
  intensity: number;
  isActive?: boolean;
  canvasId?: string;
}

// Convert Hex to Normalized vec4 [r, g, b, a]
function hexToVec4(hex: string, alpha: number = 1.0): [number, number, number, number] {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return [0.1, 0.1, 0.1, alpha];
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
    alpha
  ];
}

const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 position;
out vec2 v_texCoord;
void main() {
  v_texCoord = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Official Google Material 3 Energy deforming Shader Source
const ENERGY_FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;
layout(location = 0) out vec4 fragColor;
uniform int uState;
uniform int uPreviousState;
uniform mediump float uTransition;
uniform vec2 uDimensions;
uniform vec2 uShapeDimensions;
uniform vec2 uDimensionsScale;
uniform mediump float uDevicePixelRatio;
uniform float uTime;
uniform mediump vec4 uBorderRadius;
uniform mediump vec4 uBaseColor;
uniform mediump vec4 uMidColor;
uniform mediump vec4 uEndColor;
uniform mediump vec4 uHoverColor;
uniform mediump float uHover;
uniform int uRenderMode;
uniform mediump float uIntensity;
uniform mediump float uDynamicIntensity;
uniform float uInteraction[6];

struct Coordinates {
  vec2 p;
  vec2 dimensions;
  vec2 shapeDimensions;
  mediump vec4 borderRadius;
};

Coordinates scaleCoordinates(Coordinates coords, float scale) {
  return Coordinates(coords.p * scale, coords.dimensions * scale,
                     coords.shapeDimensions * scale,
                     coords.borderRadius * scale);
}

struct EnergyParams {
  mediump float egMaskWidth;
  mediump float egMinBorderRadius;
  mediump float egInnerDisplacement;
  mediump float egOffsetY;
  mediump float egInner;
  mediump float egOuter;
  mediump float noiseDisplacement;
};

struct MaskParams {
  mediump float lgContrast;
  mediump float lgBrightness;
  mediump float lgSpeed;
  mediump float lgScale;
  mediump float lgOscillateRange;
  mediump float lgAngle;
  mediump float lgOffsetY;
  mediump float swSpeed;
  mediump float swContrast;
  mediump float swBrightness;
  mediump float swScale;
};

struct EffectParams {
  int state;
  int isDynamic;
  EnergyParams params;
  MaskParams mask;
};

EnergyParams mixEnergyParams(EnergyParams p1, EnergyParams p2, mediump float value) {
  return EnergyParams(
      mix(p1.egMaskWidth, p2.egMaskWidth, value),
      mix(p1.egMinBorderRadius, p2.egMinBorderRadius, value),
      mix(p1.egInnerDisplacement, p2.egInnerDisplacement, value),
      mix(p1.egOffsetY, p2.egOffsetY, value),
      mix(p1.egInner, p2.egInner, value), mix(p1.egOuter, p2.egOuter, value),
      mix(p1.noiseDisplacement, p2.noiseDisplacement, value));
}

vec4 clampBorderRadius(vec4 borderRadius, vec2 dimensions) {
  float smallerSide = min(dimensions.x, dimensions.y);
  return min(borderRadius, smallerSide);
}

float getPixelWidth(vec2 dimension) {
  return 2.0 / min(dimension.x, dimension.y);
}

float extractBorderRadius(vec2 p, vec4 r) {
  vec2 corner = (p.x > 0.0) ? r.xy : r.zw;
  return (p.y > 0.0) ? corner.x : corner.y;
}

EffectParams getEffectParams(int state, float intensity, float fx) {
  EffectParams effect;
  if (state == 2) {
    effect.isDynamic = 1; effect.params.egMaskWidth = 1.0; effect.params.egMinBorderRadius = mix(0.5, 0.5, intensity); effect.params.egInnerDisplacement = 0.5; effect.params.egOffsetY = mix(0.0, 0.05, intensity); effect.params.egInner = mix(0.15, 0.5, intensity); effect.params.egOuter = mix(0.4, 2.5, intensity); effect.params.noiseDisplacement = mix(0.1, 0.3, intensity); effect.mask.lgContrast = 1.0; effect.mask.lgBrightness = 0.2; effect.mask.lgSpeed = 1.2; effect.mask.lgScale = mix(0.3, 0.3, intensity); effect.mask.lgOscillateRange = 0.005; effect.mask.lgAngle = 1.0; effect.mask.lgOffsetY = mix(0.0, 0.1, intensity); effect.mask.swSpeed = 1.0; effect.mask.swContrast = 4.0; effect.mask.swBrightness = 0.2; effect.mask.swScale = 0.2;;
  } else if (state == 3) {
    effect.isDynamic = 1; effect.params.egMaskWidth = 1.0; effect.params.egMinBorderRadius = mix(0.5, 0.5, intensity); effect.params.egInnerDisplacement = 1.0; effect.params.egOffsetY = mix(0.0, 0.1, intensity); effect.params.egInner = mix(0.2, 1.0, intensity); effect.params.egOuter = mix(0.5, 4.0, intensity); effect.params.noiseDisplacement = mix(0.1, 0.3, intensity); effect.mask.lgContrast = 1.0; effect.mask.lgBrightness = 0.0; effect.mask.lgSpeed = 0.05; effect.mask.lgScale = mix(0.5, 0.5, intensity); effect.mask.lgOscillateRange = 0.001; effect.mask.lgAngle = -1.5; effect.mask.lgOffsetY = mix(-0.25, -0.25, intensity); effect.mask.swSpeed = 0.0; effect.mask.swContrast = 0.0; effect.mask.swBrightness = 1.0; effect.mask.swScale = 0.0;;
  } else if (state == 4) {
    effect.isDynamic = 1; effect.params.egMaskWidth = 1.05; effect.params.egMinBorderRadius = mix(0.5, 0.5, intensity); effect.params.egInnerDisplacement = 0.6; effect.params.egOffsetY = mix(0.0, 0.05, intensity); effect.params.egInner = mix(0.15, 0.6, intensity); effect.params.egOuter = mix(0.8, 3.5, intensity); effect.params.noiseDisplacement = mix(0.1, 0.4, intensity); effect.mask.lgContrast = 1.0; effect.mask.lgBrightness = 0.1; effect.mask.lgSpeed = 1.8; effect.mask.lgScale = mix(1.2, 1.2, intensity); effect.mask.lgOscillateRange = 0.01; effect.mask.lgAngle = 0.5; effect.mask.lgOffsetY = mix(0.0, 0.2, intensity); effect.mask.swSpeed = 1.2; effect.mask.swContrast = 1.5; effect.mask.swBrightness = 0.5; effect.mask.swScale = 0.15;;
  } else if (state == 5) {
    effect.isDynamic = 1; effect.params.egMaskWidth = 1.05; effect.params.egMinBorderRadius = mix(0.5, 1.2, intensity); effect.params.egInnerDisplacement = 0.3; effect.params.egOffsetY = mix(0.01, 0.03, intensity); effect.params.egInner = mix(0.15, 0.5, intensity); effect.params.egOuter = mix(0.5, 2.8, intensity); effect.params.noiseDisplacement = mix(0.15, 0.3, intensity); effect.mask.lgContrast = 1.0; effect.mask.lgBrightness = 0.0; effect.mask.lgSpeed = 1.0; effect.mask.lgScale = mix(0.5, 0.5, intensity); effect.mask.lgOscillateRange = 0.0; effect.mask.lgAngle = 1.5; effect.mask.lgOffsetY = mix(0.0, 0.3, intensity); effect.mask.swSpeed = 1.5; effect.mask.swContrast = 0.8; effect.mask.swBrightness = 0.2; effect.mask.swScale = 0.3;;
  } else if (state == 6) {
    effect.isDynamic = 1; effect.params.egMaskWidth = 1.1; effect.params.egMinBorderRadius = mix(0.5, 1.5, intensity); effect.params.egInnerDisplacement = 0.0; effect.params.egOffsetY = mix(0.02, 0.05, intensity); effect.params.egInner = mix(0.15, 0.5, intensity); effect.params.egOuter = mix(0.0, 0.3, intensity); effect.params.noiseDisplacement = mix(0.3, 0.5, intensity); effect.mask.lgContrast = 1.0; effect.mask.lgBrightness = 0.0; effect.mask.lgSpeed = 1.0; effect.mask.lgScale = mix(0.5, 0.5, intensity); effect.mask.lgOscillateRange = 0.001; effect.mask.lgAngle = 1.5; effect.mask.lgOffsetY = mix(0.0, 0.3, intensity); effect.mask.swSpeed = 1.5; effect.mask.swContrast = 0.1; effect.mask.swBrightness = 0.3; effect.mask.swScale = 0.3;;
  } else if (state == 7) {
    effect.isDynamic = 0; effect.params.egMaskWidth = 1.1; effect.params.egMinBorderRadius = mix(0.6, 1.5, intensity); effect.params.egInnerDisplacement = 0.0; effect.params.egOffsetY = mix(0.02, 0.05, intensity); effect.params.egInner = mix(0.15, 0.5, intensity); effect.params.egOuter = mix(0.0, 0.3, intensity); effect.params.noiseDisplacement = mix(0.3, 0.3, intensity); effect.mask.lgContrast = 1.0; effect.mask.lgBrightness = 0.0; effect.mask.lgSpeed = 1.0; effect.mask.lgScale = mix(0.5, 0.5, intensity); effect.mask.lgOscillateRange = 0.001; effect.mask.lgAngle = 1.5; effect.mask.lgOffsetY = mix(0.0, 0.6, intensity); effect.mask.swSpeed = 6.0; effect.mask.swContrast = 1.0; effect.mask.swBrightness = 0.1; effect.mask.swScale = 0.5;;
  } else if (state == 8) {
    effect.isDynamic = 1; effect.params.egMaskWidth = 1.1; effect.params.egMinBorderRadius = mix(0.5, 1.5, intensity); effect.params.egInnerDisplacement = 0.0; effect.params.egOffsetY = mix(0.02, 0.05, intensity); effect.params.egInner = mix(0.15, 0.5, intensity); effect.params.egOuter = mix(0.0, 0.3, intensity); effect.params.noiseDisplacement = mix(0.3, 0.5, intensity); effect.mask.lgContrast = 1.0; effect.mask.lgBrightness = 0.0; effect.mask.lgSpeed = 1.0; effect.mask.lgScale = mix(0.5, 0.5, intensity); effect.mask.lgOscillateRange = 0.001; effect.mask.lgAngle = 1.5; effect.mask.lgOffsetY = mix(0.0, 0.3, intensity); effect.mask.swSpeed = 1.5; effect.mask.swContrast = 0.1; effect.mask.swBrightness = 0.3; effect.mask.swScale = 0.3;;
  } else {
    effect.isDynamic = 0; effect.params.egMaskWidth = 1.0; effect.params.egMinBorderRadius = mix(0.0, 0.0, intensity); effect.params.egInnerDisplacement = 0.0; effect.params.egOffsetY = mix(0.0, 0.0, intensity); effect.params.egInner = mix(0.0, 0.0, intensity); effect.params.egOuter = mix(0.0, 0.0, intensity); effect.params.noiseDisplacement = mix(0.0, 0.0, intensity); effect.mask.lgContrast = 1.0; effect.mask.lgBrightness = -1.0; effect.mask.lgSpeed = 1.0; effect.mask.lgScale = mix(0.2, 0.2, intensity); effect.mask.lgOscillateRange = 0.0; effect.mask.lgAngle = 0.0; effect.mask.lgOffsetY = mix(0.0, 0.0, intensity); effect.mask.swSpeed = 1.0; effect.mask.swContrast = 1.0; effect.mask.swBrightness = 0.0; effect.mask.swScale = 0.05;;
  }
  effect.state = state;
  if (effect.isDynamic == 1) {
    float fxScale = fx * 0.5 + 0.5;
    effect.mask.lgOffsetY *= fxScale;
    effect.params.egOffsetY += fx * 0.15 * effect.params.egOffsetY;
    effect.params.egInner *= fxScale;
    effect.params.egOuter *= fxScale;
    effect.params.noiseDisplacement *= fxScale;
  }
  return effect;
}

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float smax(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return max(a, b) + h * h * h * k * (1.0 / 6.0);
}

float roundedBoxSquircle(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return smax(q.x, q.y, r) - r;
}

float roundedBoxMeld(vec2 p, vec2 b, float r, float squishFactor,
                     float mixFactor) {
  vec2 q = abs(p) - b + r;
  float k = max(0.001, r * squishFactor);
  float dExact = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  float dSquircle = smax(q.x, q.y, k) - r;
  return mix(dSquircle, dExact, mixFactor);
}

mediump float linearGradient(mediump vec2 uv, mediump float angle, mediump float offset, mediump float fade) {
  mediump vec2 v;
  v.x = cos(angle);
  v.y = sin(angle);
  mediump float projected = dot(uv, v);
  return smoothstep(-offset - fade, -offset + fade, projected);
}

mediump float sineWaves(mediump vec2 p, mediump float scale, mediump float angle) {
  mediump vec2 point;
  point.x = p.y;
  point.y = -p.x;
  mediump float x = point.x * scale + angle;
  mediump float y = point.y * scale - angle;
  return (sin(x) + sin(y)) * 0.25 + 0.5;
}

mediump float hash3(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

mediump float fastNoise(vec3 p) {
  vec3 u;
  vec3 i_m;
  {
    vec3 i = floor(p);
    vec3 f = fract(p);
    u.x = f.x;
    u.y = f.y;
    u.z = f.z;
    u = u * u * (3.0 - 2.0 * u);
    i_m.x = i.x;
    i_m.y = i.y;
    i_m.z = i.z;
  }
  vec3 x;
  x.x = 0.0;
  x.y = 0.0;
  x.z = 0.0;
  mediump float h0 = hash3(i_m + x);
  x.x = 1.0;
  mediump float h1 = hash3(i_m + x);
  x.x = 0.0;
  x.y = 1.0;
  mediump float h2 = hash3(i_m + x);
  x.x = 1.0;
  mediump float h3 = hash3(i_m + x);
  x.x = 0.0;
  x.y = 0.0;
  x.z = 1.0;
  mediump float h4 = hash3(i_m + x);
  x.x = 1.0;
  mediump float h5 = hash3(i_m + x);
  x.x = 0.0;
  x.y = 1.0;
  mediump float h6 = hash3(i_m + x);
  x.x = 1.0;
  mediump float h7 = hash3(i_m + x);
  return mix(mix(mix(h0, h1, u.x), mix(h2, h3, u.x), u.y),
             mix(mix(h4, h5, u.x), mix(h6, h7, u.x), u.y), u.z);
}

mediump float renderInteraction(vec2 p, float scale, vec2 halfDims) {
  int state = int(uInteraction[2]);
  if (state == 0) return 0.0;
  vec2 iP;
  iP.x = uInteraction[0];
  iP.y = uInteraction[1];
  mediump float t1 = uInteraction[4];
  mediump float t2 = uInteraction[5];
  mediump float tPress, tRelease1, tRelease2;
  if (state == 1) {
    tPress = t1;
    tRelease1 = 0.0;
    tRelease2 = 0.0;
  } else {
    tPress = 1.0;
    tRelease1 = t1;
    tRelease2 = t2;
  }
  mediump vec2 centeredP = (iP - halfDims) * scale;
  mediump float releaseSize = 1.6 + length(centeredP);
  mediump float dist = length(p - centeredP);
  mediump float energyMaskSize = mix(0.0, 0.3, tPress);
  energyMaskSize = mix(energyMaskSize, releaseSize, tRelease1);
  mediump float negativeMaskSize = mix(0.0, releaseSize, tRelease2);
  mediump float energyMask = 1.0 - clamp(dist / energyMaskSize, 0.0, 1.0);
  mediump float negativeMask = 1.0 - clamp(dist / negativeMaskSize, 0.0, 1.0);
  return smoothstep(0.0, 1.0, energyMask - negativeMask);
}

mediump vec4 getInteractionModifiedBorderRadius(mediump vec4 borderRadius) {
  int state = int(uInteraction[2]);
  if (state == 0) return borderRadius;
  mediump float tBR = uInteraction[3];
  if (state == 2) {
    tBR = 1.0 - tBR;
  }
  return mix(borderRadius, borderRadius * 0.5,
             tBR);
}

mediump float getLargeSizeAttenuation(mediump float height, mediump float dpr) {
  return dpr == 0.0
             ? 1.0
             : 1.0 - smoothstep(525.0,
                                600.0, height / dpr);
}

mediump float getLinearGradientMask(mediump vec2 p, float time, mediump float speed, mediump float contrast,
                           mediump float brightness, mediump float oscillateRange,
                           mediump float startAngle, mediump float offsetY, mediump float scale) {
  mediump vec2 point = p;
  point.y += offsetY;
  mediump float t = mod(time * -speed, 6.28318531);
  mediump float evo = oscillateRange == 0.0 ? t : sin(t) * oscillateRange * 3.14159265359;
  mediump float rotation = 3.14159265359 * startAngle + evo;
  mediump float noise = linearGradient(point, rotation, 0.0, scale);
  noise = clamp(((noise - 0.5) * contrast + 0.5), 0.0, 1.0);
  return clamp((noise + brightness), 0.0, 1.0);
}

mediump float getSineWavesMask(mediump vec2 p, float time, mediump float speed, mediump float contrast,
                      mediump float brightness, mediump float scale) {
  mediump float angle = mod(time * speed * 0.5, 6.28318531);
  mediump float noise = sineWaves(p, scale * 5.0, angle);
  return clamp((((noise - 0.5) * contrast + 0.5) + brightness), 0.0, 1.0);
}

mediump float getEnergyBaseMask(MaskParams params, mediump vec2 p, float time, float vScale) {
  mediump float lgMask = getLinearGradientMask(
      p, time, params.lgSpeed, params.lgContrast, params.lgBrightness,
      params.lgOscillateRange, params.lgAngle, params.lgOffsetY * 0.5 * vScale,
      params.lgScale * vScale);
  mediump float swMask = getSineWavesMask(p, time, params.swSpeed, params.swContrast,
                                 params.swBrightness, params.swScale);
  return smoothstep(0.0, 1.0, lgMask * swMask);
}

mediump float getSdfOutline(mediump float innerEdge, mediump float innerFade, mediump float outerEdge,
                   mediump float outerFade, mediump float dist) {
  mediump float fadeIn = smoothstep(innerEdge - innerFade, innerEdge, dist);
  mediump float fadeOut = 1.0 - smoothstep(outerEdge, outerEdge + outerFade, dist);
  return fadeIn * fadeOut;
}

mediump vec3 getEnergyColor(mediump vec3 midColor, mediump vec3 endColor, mediump float egInner, mediump float sd) {
  const mediump float start = 0.0;
  mediump float stop = min(-0.1, egInner * -0.5);
  mediump float x = smoothstep(stop, start, sd);
  return mix(midColor, endColor, x);
}

mediump float getShapeEdge(mediump float sd, mediump float pixelWidth, mediump float innerDisplacement) {
  mediump float att = 4.0 - (3.0 * innerDisplacement);
  return 1.0 - smoothstep(-pixelWidth / att, pixelWidth, sd);
}

mediump vec4 renderEnergy(Coordinates pixelSpace, mediump float dpr, EffectParams meta,
                   EffectParams prevMeta, mediump float transition, int mode, float time,
                   mediump vec3 baseColor, mediump vec3 midColor, mediump vec3 endColor) {
  float pixelToObject =
      1.0 / min(pixelSpace.shapeDimensions.x, pixelSpace.shapeDimensions.y);
  Coordinates objectSpace = scaleCoordinates(pixelSpace, pixelToObject);
  vec2 shapeHalfSize = objectSpace.shapeDimensions * 0.5;
  float vScale =
      objectSpace.shapeDimensions.x < objectSpace.shapeDimensions.y
          ? objectSpace.shapeDimensions.y / objectSpace.shapeDimensions.x
          : 1.0;
  mediump vec4 borderRadius4 =
      getInteractionModifiedBorderRadius(objectSpace.borderRadius);
  mediump float interactionResult = renderInteraction(objectSpace.p, pixelToObject,
                                             pixelSpace.dimensions * 0.5);
  mediump float borderRadius = extractBorderRadius(objectSpace.p, borderRadius4);
  EnergyParams params = meta.params;
  if (prevMeta.state != 0) {
    params = mixEnergyParams(prevMeta.params, params, transition);
  }
  
  // Precise clean coordinate space morphing for container boundaries matching energy states
  mediump vec2 morphedP = objectSpace.p;
  if (meta.state == 2) { // Listening - Organic Breathing Swell
    float swell = sin(time * 2.5) * 0.012 * uIntensity;
    morphedP *= (1.0 - swell);
  } else if (meta.state == 3) { // Responding - Organic Dip matching internal wave
    float dip = (0.045 + sin(time * 3.0) * 0.015) * uIntensity;
    float profile = smoothstep(shapeHalfSize.x, 0.0, abs(morphedP.x));
    morphedP.y += dip * profile * (morphedP.y > 0.0 ? 1.0 : 0.0);
  } else if (meta.state == 4) { // Processing - Organic Corner adjustments
    float wave = sin(time * 4.0 + morphedP.x * 5.0) * 0.008 * uIntensity;
    morphedP.y += wave;
  }

  mediump vec2 distortionP = morphedP;
  mediump float noise = 0.0;
  {
    mediump float distortion = params.noiseDisplacement * 0.08;
    vec3 noiseArgs;
    noiseArgs.x = distortionP.x;
    noiseArgs.y = distortionP.y;
    float modTime = mod(time * 0.4, 120.0);
    mediump float loopMask = smoothstep(1.0, 2.0, modTime) * (1.0 - smoothstep(120.0 -2.0, 120.0, modTime));
    noiseArgs.z = modTime;
    noiseArgs.xy *= 0.8;
    noise = fastNoise(noiseArgs) * loopMask;
    mediump float angle = (noise * 2.0 - 1.0) * 3.14159265359;
    distortionP.x += cos(angle) * distortion;
    distortionP.y += sin(angle) * distortion;
  }
  mediump float baseMask = getEnergyBaseMask(meta.mask, distortionP, time, vScale);
  if (prevMeta.state != 0) {
    mediump float prevBaseMask =
        getEnergyBaseMask(prevMeta.mask, distortionP, time, vScale);
    baseMask = mix(prevBaseMask, baseMask, transition);
  }
  mediump float energyMask;
  mediump float energySd;
  {
    mediump float radiusMax = min(shapeHalfSize.x, shapeHalfSize.y);
    mediump float radiusMin = max(0.001, radiusMax * min(params.egMinBorderRadius, 1.0));
    mediump float energyRadius = min(max(borderRadius, radiusMin), radiusMax);
    mediump vec2 energyP = distortionP;
    energyP.y += params.egOffsetY * 0.5 * vScale;
    mediump vec2 energyHalfSize = shapeHalfSize;
    energyHalfSize.x *= params.egMaskWidth;
    mediump float innerDepth = params.egInner - (params.egInner * noise * 0.7);
    mediump float mixFactor = smoothstep(radiusMax * 0.6, radiusMax * 0.9, energyRadius);
    energySd =
        roundedBoxMeld(energyP, energyHalfSize, energyRadius, 1.0, mixFactor);
    energyMask = getSdfOutline(0.0, innerDepth, 0.0, 10.0, energySd);
  }
  // Energy gradient concentration at the top (fading towards bottom) - disabled for state 5 (Anticipating)
  float energyFade = 1.0;
  if (meta.state != 5) {
    float yNorm = (objectSpace.p.y / shapeHalfSize.y) * 0.5 + 0.5;
    energyFade = smoothstep(0.0, 0.65, yNorm);
  }
  mediump float energyMaskComp = clamp(baseMask * energyMask, 0.0, 1.0) * energyFade;
  mediump float shapeMaskDist;
  mediump float sd = roundedBox(morphedP, shapeHalfSize, borderRadius);
  {
    mediump float largeSizeAtt =
        getLargeSizeAttenuation(pixelSpace.shapeDimensions.y, dpr);
    mediump float noiseAtt = noise * 0.5 + 0.5;
    mediump float outerDisp =
        params.egOuter * energyMaskComp * 0.28 * noiseAtt * largeSizeAtt;
    mediump float innerDisp =
        clamp(2.0 * params.egInnerDisplacement * noiseAtt * largeSizeAtt, 0.0, 1.0);
    mediump float w = getPixelWidth(pixelSpace.dimensions);
    mediump float distW = max(w, outerDisp);
    shapeMaskDist = getShapeEdge(sd, distW, innerDisp);
  }
  mediump vec3 rgb = mix(baseColor, uHoverColor.rgb, uHover * uHoverColor.a);
  rgb = mix(rgb, endColor, clamp(interactionResult, 0.0, 1.0));
  mediump vec4 energyColor;
  energyColor.rgb =
      getEnergyColor(midColor, endColor, params.egInner, energySd);
  energyColor.a = energyMaskComp * shapeMaskDist;
  mediump vec4 outColor;
  outColor.rgb = mix(rgb, energyColor.rgb, energyMaskComp);
  outColor.a = mode == 0 ? shapeMaskDist : 1.0;
  
  if (mode == 1) outColor = energyColor;
  if (mode == 2) outColor.rgb = vec3(baseMask);
  if (mode == 3) outColor.rgb = vec3(energyMask);
  if (mode == 4) outColor.rgb = energyColor.rgb;
  if (mode == 5) outColor.rgb = rgb;
  if (mode == 6) outColor.rgb = vec3(shapeMaskDist);
  if (mode == 7) outColor.rgb = vec3(noise);
  return outColor;
}

vec2 getDimensions() {
  return uDimensionsScale.x == 0.0 ? uDimensions
                                   : (uShapeDimensions * uDimensionsScale);
}

mediump vec4 _main(vec2 fragCoord, vec2 dimensions) {
  vec2 p = fragCoord - (dimensions * 0.5);
  mediump float smallerSide = min(uShapeDimensions.x, uShapeDimensions.y);
  mediump vec4 borderRadius = min(uBorderRadius, smallerSide * 0.5);
  Coordinates pixelSpace =
      Coordinates(p, dimensions, uShapeDimensions, borderRadius);
  mediump float tx = uTransition;
  EffectParams effect = getEffectParams(uState, uIntensity, uDynamicIntensity);
  EffectParams prevEffect =
      getEffectParams(uPreviousState, uIntensity, uDynamicIntensity);
  return renderEnergy(pixelSpace, uDevicePixelRatio, effect, prevEffect, tx,
                      uRenderMode, uTime, uBaseColor.rgb, uMidColor.rgb,
                      uEndColor.rgb);
}

void main() { fragColor = _main(gl_FragCoord.xy, getDimensions()); }
`;

export default function ShaderRenderer({
  state,
  previousState,
  transition,
  width,
  height,
  borderRadius,
  baseColorHex,
  midColorHex,
  endColorHex,
  hoverActive,
  renderMode,
  intensity,
  isActive = true,
  canvasId
}: ShaderRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hoverValueRef = useRef<number>(0);
  const timeRef = useRef<number>(Math.random() * 50);
  const lastTimeRef = useRef<number | null>(null);

  // Uniform refs — updated every render cycle without restarting the loop
  const stateRef = useRef(state);
  const previousStateRef = useRef(previousState);
  const transitionRef = useRef(transition);
  const widthRef = useRef(width);
  const heightRef = useRef(height);
  const borderRadiusRef = useRef(borderRadius);
  const baseColorRef = useRef(baseColorHex);
  const midColorRef = useRef(midColorHex);
  const endColorRef = useRef(endColorHex);
  const hoverActiveRef = useRef(hoverActive);
  const renderModeRef = useRef(renderMode);
  const intensityRef = useRef(intensity);
  const isActiveRef = useRef(isActive);
  const [internalError, setInternalError] = useState<string | null>(null);

  // Sync mouse state mapping to support uInteraction values
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseDownRef = useRef<boolean>(false);
  const interactionStartTimeRef = useRef<number>(0);

  const measuredWidthRef = useRef<number>(width);
  const measuredHeightRef = useRef<number>(height);

  useEffect(() => {
    measuredWidthRef.current = width;
    measuredHeightRef.current = height;
  }, [width, height]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = rect.height - (e.clientY - rect.top); // WebGL Y goes upwards
    mousePosRef.current = { x, y };
  };

  const handleMouseDown = () => {
    isMouseDownRef.current = true;
    interactionStartTimeRef.current = timeRef.current;
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use WebGL 2.0 context
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, alpha: true, antialias: true });

    if (!gl) {
      const errMsg = "This device does not support WebGL 2.0.";
      setInternalError(errMsg);
      return;
    }

    glRef.current = gl;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      // Read clean unpadded specimen size from 3 layers up in the DOM tree (the true specimen card frame)
      const shaderRendererDom = canvas.parentElement;
      const canvasWrapperDom = shaderRendererDom?.parentElement;
      const morphingBgDom = canvasWrapperDom?.parentElement;
      if (morphingBgDom) {
        const rect = morphingBgDom.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          measuredWidthRef.current = rect.width;
          measuredHeightRef.current = rect.height;
        }
      } else if (canvasWrapperDom) {
        const rect = canvasWrapperDom.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          measuredWidthRef.current = rect.width;
          measuredHeightRef.current = rect.height;
        }
      }
    };
    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Sync props → refs every render (no loop restart needed)
  useEffect(() => {
    stateRef.current = state;
    previousStateRef.current = previousState;
    transitionRef.current = transition;
    widthRef.current = width;
    heightRef.current = height;
    borderRadiusRef.current = borderRadius;
    baseColorRef.current = baseColorHex;
    midColorRef.current = midColorHex;
    endColorRef.current = endColorHex;
    hoverActiveRef.current = hoverActive;
    renderModeRef.current = renderMode;
    intensityRef.current = intensity;
    isActiveRef.current = isActive;
  });

  // Compile Shaders
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const loadShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(info || "Shader compilation failed.");
      }
      return shader;
    };

    let newProgram: WebGLProgram | null = null;
    try {
      const vertexShader = loadShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
      if (!vertexShader) throw new Error("Vertex shader compilation failed.");

      const fragmentShader = loadShader(gl.FRAGMENT_SHADER, ENERGY_FRAGMENT_SHADER_SOURCE);
      if (!fragmentShader) throw new Error("Fragment shader compilation failed.");

      newProgram = gl.createProgram();
      if (!newProgram) throw new Error("Unable to create GLSL program.");

      gl.attachShader(newProgram, vertexShader);
      gl.attachShader(newProgram, fragmentShader);
      gl.linkProgram(newProgram);

      if (!gl.getProgramParameter(newProgram, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(newProgram);
        throw new Error(info || "Program link failed.");
      }

      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);

      programRef.current = newProgram;
      setInternalError(null);
    } catch (err: any) {
      console.warn("WebGL 2 compile error:", err.message);
      setInternalError(err.message);
      if (newProgram) gl.deleteProgram(newProgram);
    }
  }, []);

  // Animation cycle
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const render = (timestamp: number) => {
      if (!gl) return;

      const program = programRef.current;
      if (!program) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);

      // position mapping
      const posAttrLocation = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posAttrLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(posAttrLocation, 2, gl.FLOAT, false, 0, 0);

      const dpr = window.devicePixelRatio || 1;

      // Draw Uniforms
      gl.uniform1i(gl.getUniformLocation(program, 'uState'), stateRef.current);
      gl.uniform1i(gl.getUniformLocation(program, 'uPreviousState'), previousStateRef.current);
      gl.uniform1f(gl.getUniformLocation(program, 'uTransition'), transitionRef.current);
      gl.uniform2f(gl.getUniformLocation(program, 'uDimensions'), gl.canvas.width, gl.canvas.height);
      gl.uniform2f(gl.getUniformLocation(program, 'uShapeDimensions'), measuredWidthRef.current * dpr, measuredHeightRef.current * dpr);
      gl.uniform2f(gl.getUniformLocation(program, 'uDimensionsScale'), 0.0, 0.0);
      gl.uniform1f(gl.getUniformLocation(program, 'uDevicePixelRatio'), dpr);

      // Animate clock ticks
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000.0;
      lastTimeRef.current = timestamp;

      if (isActiveRef.current) {
        timeRef.current += delta;
      }

      gl.uniform1f(gl.getUniformLocation(program, 'uTime'), timeRef.current);

      // uBorderRadius: vec4 mapping
      gl.uniform4f(gl.getUniformLocation(program, 'uBorderRadius'), borderRadiusRef.current * dpr, borderRadiusRef.current * dpr, borderRadiusRef.current * dpr, borderRadiusRef.current * dpr);

      // Normalize colors
      const [br, bg, bb, ba] = hexToVec4(baseColorRef.current, 1.0);
      const [mr, mg, mb, ma] = hexToVec4(midColorRef.current, 1.0);
      const [er, eg, eb, ea] = hexToVec4(endColorRef.current, 1.0);
      const [hr, hg, hb, ha] = hexToVec4('#ffffff', 0.12);

      gl.uniform4f(gl.getUniformLocation(program, 'uBaseColor'), br, bg, bb, ba);
      gl.uniform4f(gl.getUniformLocation(program, 'uMidColor'), mr, mg, mb, ma);
      gl.uniform4f(gl.getUniformLocation(program, 'uEndColor'), er, eg, eb, ea);
      gl.uniform4f(gl.getUniformLocation(program, 'uHoverColor'), hr, hg, hb, ha);

      // Animate uHover transitions smoothly
      const targetHover = hoverActiveRef.current ? 1.0 : 0.0;
      hoverValueRef.current += (targetHover - hoverValueRef.current) * 0.15;
      gl.uniform1f(gl.getUniformLocation(program, 'uHover'), hoverValueRef.current);

      gl.uniform1i(gl.getUniformLocation(program, 'uRenderMode'), renderModeRef.current);
      gl.uniform1f(gl.getUniformLocation(program, 'uIntensity'), intensityRef.current);
      gl.uniform1f(gl.getUniformLocation(program, 'uDynamicIntensity'), Math.sin(timeRef.current * 1.5) * 0.3 + 0.7);

      // Populate Interaction Array: [x, y, state, tBR, tPress, tRelease]
      // state: 0 = idle, 1 = pressed, 2 = released
      const interactionState = isMouseDownRef.current ? 1.0 : (timeRef.current - interactionStartTimeRef.current < 0.5 ? 2.0 : 0.0);
      const tPress = isMouseDownRef.current ? Math.min(1.0, (timeRef.current - interactionStartTimeRef.current) * 2.0) : 0.0;
      const tRelease = !isMouseDownRef.current ? Math.min(1.0, (timeRef.current - interactionStartTimeRef.current - 0.1) * 2.0) : 0.0;

      const interactionArray = new Float32Array([
        mousePosRef.current.x,
        mousePosRef.current.y,
        interactionState,
        hoverValueRef.current, // tBR (uses hover tracking to soften corners)
        tPress,
        tRelease
      ]);

      const uInteractionLocation = gl.getUniformLocation(program, 'uInteraction');
      if (uInteractionLocation !== null) {
        gl.uniform1fv(uInteractionLocation, interactionArray);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      lastTimeRef.current = null;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
    };
  }, []); // render loop runs once — props flow through refs

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas
        id={canvasId}
        ref={canvasRef}
        className="w-full h-full block rounded-[inherit] outline-none"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      {internalError && (
        <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center p-4 text-center text-red-400 z-50">
          <div className="text-xs font-bold mb-1">WebGL 2 Core Error</div>
          <p className="text-[10px] text-neutral-400 select-all">{internalError}</p>
        </div>
      )}
    </div>
  );
}
