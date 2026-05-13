## Sources

### WebGL & Texture Mapping
- Matsuda & Lea, *WebGL Programming Guide* — Chapter 5: Using Colors and Texture Images
  - Pages 137-145: Passing multiple attributes to vertex shaders, interleaved buffers, stride and offset
  - Pages 146-178: Loading textures from the filesystem, `initTextures()` and `loadTexture()` functions
  - Pages 179-181: Passing texture to fragment shader, `texture2D()` lookup, `u_Sampler` uniform

### Camera
- Matsuda & Lea, *WebGL Programming Guide* — Chapter 7: Toward the 3D World
  - Pages 179-181: View and Projection matrices, `setPerspective()`, `setLookAt()`
- WebGL Camera Movement Tutorial: http://learnwebgl.brown37.net/07_cameras/camera_movement.html
- MDN Web Docs — Keyboard Events: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent

### World Generation
- Matsuda & Lea, *WebGL Programming Guide* — Chapter 5
  - Texture color mixing with `u_texColorWeight` uniform (linear interpolation between base color and texture color)
- Assignment 3 instructions — world map 2D array pattern, double loop for wall placement

### Textures
- `wall.png` — Minecraft grass block side texture (grass_block_side.png) from Minecraft texture pack
- `grass.png` — Minecraft grass block top texture (grass_block_top.png) from Minecraft texture pack
- `water.jpg` — Free stock ocean water image from Midjourney/freestockcenter, resized to 512x512

### Cow (from Assignment 2)
- Original blocky cow built for CSE 160 Assignment 2
- Hierarchical joint animation using `Matrix4.setRotate()` and `translate()` from `cuon-matrix-cse160.js`

### Libraries
- `cuon-matrix-cse160.js` — Matrix4, Vector3 math library provided by course
- `cuon-utils.js` — `initShaders()` utility provided
- `webgl-utils.js` — WebGL utility functions provided
- `webgl-debug.js` — WebGL debugging utility provided