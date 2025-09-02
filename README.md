# Bilibili-Player-ZoomDrag-Pan-
B站视频缩放和拖动


✨ 功能特性
在 B 站播放器控制栏添加一个图标，用于缩放与拖拽视频。
支持拖拽平移、滚轮缩放、双击重置。
拖拽时滚动滚轮，可实时调整缩放并显示倍率。
悬停图标可使用滑块进行精确缩放。
🛠️ 自定义参数
通过编辑脚本顶部的常量来调整参数：
code
JavaScript
// --- 可配置参数 ---
const DRAG_SENSITIVITY_X = 1.0;      // 水平拖拽灵敏度
const DRAG_SENSITIVITY_Y_UP = 1.0;   // 向上拖拽灵敏度
const DRAG_SENSITIVITY_Y_DOWN = 2.0; // 向下拖拽灵敏度
const SCROLL_ZOOM_STEP = 0.1;        // 每次滚轮缩放的步长
const INDICATOR_TIMEOUT_MS = 800;    // 缩放倍率指示器显示时长 (毫秒)
📄 许可证
本项目基于 MIT 许可证 授权。



✨ Features
Adds a new icon to the Bilibili player control bar for zooming and panning the video.
Supports dragging to pan, mouse wheel to zoom, and double-clicking to reset.
While dragging, use the mouse wheel to adjust zoom in real-time with a magnification indicator.
Hover over the icon to use a slider for precise zooming.
🛠️ Customization
You can adjust parameters by editing the constants at the top of the script:
code
JavaScript
// --- Configurable Parameters ---
const DRAG_SENSITIVITY_X = 1.0;      // Horizontal drag sensitivity
const DRAG_SENSITIVITY_Y_UP = 1.0;   // Upward drag sensitivity
const DRAG_SENSITIVITY_Y_DOWN = 2.0; // Downward drag sensitivity
const SCROLL_ZOOM_STEP = 0.1;        // Zoom step for each mouse wheel scroll
const INDICATOR_TIMEOUT_MS = 800;    // Display duration for the zoom indicator (in ms)
📄 License
This project is licensed under the MIT License.
