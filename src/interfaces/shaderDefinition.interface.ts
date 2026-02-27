export interface ShaderDefinition {
  // Any on purpose, because its just the information we give into all shaders.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uniforms?: Record<string, any>;
  transparent?: boolean;
  vertexShader: string;
  fragmentShader: string;
}
