// ==UserScript==
// @name         Bilibili 视频缩放和拖动
// @namespace    https://github.com/your-username/
// @version      3.9.5
// @description  在B站播放器底部控制栏增加一个图标，悬停后弹出面板，可平移/缩放视频。支持滚轮缩放、双击重置、拖拽时滚轮缩放并显示倍率。
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @match        https://www.bilibili.com/bangumi/play/
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // --- 可配置参数 ---
    const DRAG_SENSITIVITY_X = 1.0;
    const DRAG_SENSITIVITY_Y_UP = 1.0;
    const DRAG_SENSITIVITY_Y_DOWN = 2.0;
    const SCROLL_ZOOM_STEP = 0.1;
    const INDICATOR_TIMEOUT_MS = 800; // 【新增】指示器显示时长（毫秒）

    // --- 全局状态变量 ---
    let scale = 1.0;
    let translateX = 0;
    let translateY = 0;
    let targetElem = null;
    let isPanning = false;
    let lastX, lastY;
    let indicatorTimeout = null; // 【新增】用于管理指示器隐藏的定时器

    // --- 核心功能函数 ---
    function updateZoom(newScale) {
        const slider = document.getElementById('zoom-pan-slider');
        if (!slider) return;

        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        scale = Math.max(min, Math.min(max, newScale));

        const valueDisplay = document.getElementById('zoom-pan-value');
        slider.value = scale;
        slider.title = `缩放: ${scale.toFixed(2)}x`;
        if (valueDisplay) {
            valueDisplay.textContent = `${scale.toFixed(2)}x`;
        }
        applyTransform();
    }

    function applyTransform() {
        if (!targetElem) return;
        targetElem.style.transition = 'transform 0.1s ease-out';
        targetElem.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        targetElem.style.transformOrigin = 'center center';
    }

    function resetTransform() {
        translateX = 0;
        translateY = 0;
        updateZoom(1.0);
    }

    function findTargetElement() {
        const video = document.querySelector('video');
        if (!video) return null;
        let parent = video.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
            if (parent.classList.contains('bpx-player-video-wrap')) return parent;
            parent = parent.parentElement;
        }
        return video;
    }

    // --- UI 和事件处理 ---
    function createControls(playerContainer) {
        if (document.getElementById('zoom-pan-container')) return;
        const controlRight = playerContainer.querySelector('.bpx-player-control-bottom-right');
        if (!controlRight) { console.error('[ZoomPan] 未找到B站播放器右下角控制区域'); return; }
        const container = document.createElement('div');
        container.id = 'zoom-pan-container';
        container.classList.add('bpx-player-ctrl-btn');
        // 【修改】HTML结构中增加指示器元素
        container.innerHTML = `
            <div id="zoom-pan-area" title="按住拖拽平移 | 滚轮缩放 | 双击重置"></div>
            <div id="zoom-pan-indicator"></div>
            <div class="zoom-pan-panel">
                <span id="zoom-pan-value">1.00x</span>
                <input type="range" id="zoom-pan-slider" min="0.1" max="3.0" step="0.05" value="1.0" title="缩放: 1.00x">
                <button id="zoom-pan-reset" title="重置缩放与位置">♻️</button>
            </div>
        `;
        const firstNativeButton = controlRight.firstChild;
        controlRight.insertBefore(container, firstNativeButton);
        setupEventListeners();
    }

    // --- 【新增】显示/隐藏指示器的辅助函数 ---
    function showIndicator() {
        const indicator = document.getElementById('zoom-pan-indicator');
        if (!indicator) return;

        // 更新内容并显示
        indicator.textContent = `${scale.toFixed(2)}x`;
        indicator.classList.add('visible');

        // 重置隐藏计时器
        clearTimeout(indicatorTimeout);
        indicatorTimeout = setTimeout(() => {
            indicator.classList.remove('visible');
        }, INDICATOR_TIMEOUT_MS);
    }

    function hideIndicator() {
        const indicator = document.getElementById('zoom-pan-indicator');
        if (!indicator) return;

        clearTimeout(indicatorTimeout);
        indicator.classList.remove('visible');
    }

    function setupEventListeners() {
        const slider = document.getElementById('zoom-pan-slider');
        const resetButton = document.getElementById('zoom-pan-reset');
        const panArea = document.getElementById('zoom-pan-area');

        slider.addEventListener('input', () => updateZoom(parseFloat(slider.value)));
        resetButton.addEventListener('click', resetTransform);

        panArea.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation(); isPanning = true;
            lastX = e.pageX; lastY = e.pageY;
            panArea.style.cursor = 'grabbing';
            if (targetElem) targetElem.style.transition = 'none';
        });

        panArea.addEventListener('wheel', (e) => {
            e.preventDefault(); e.stopPropagation();
            let newScale = scale + (e.deltaY < 0 ? SCROLL_ZOOM_STEP : -SCROLL_ZOOM_STEP);
            updateZoom(newScale);
        }, { passive: false });

        panArea.addEventListener('dblclick', (e) => {
            e.preventDefault(); e.stopPropagation();
            resetTransform();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            let instantDx = e.pageX - lastX; let instantDy = e.pageY - lastY;
            if (instantDy < 0) { instantDy *= DRAG_SENSITIVITY_Y_UP; } else { instantDy *= DRAG_SENSITIVITY_Y_DOWN; }
            instantDx *= DRAG_SENSITIVITY_X;
            translateX += instantDx / scale; translateY += instantDy / scale;
            lastX = e.pageX; lastY = e.pageY;
            applyTransform();
        });

        window.addEventListener('mouseup', () => {
            if (!isPanning) return;
            isPanning = false;
            panArea.style.cursor = 'grab';
            if (targetElem) targetElem.style.transition = 'transform 0.1s ease-out';
            hideIndicator(); // 【修改】拖拽结束时立即隐藏指示器
        });

        window.addEventListener('wheel', (e) => {
            if (!isPanning) return;
            e.preventDefault(); e.stopPropagation();
            let newScale = scale + (e.deltaY < 0 ? SCROLL_ZOOM_STEP : -SCROLL_ZOOM_STEP);
            updateZoom(newScale);
            showIndicator(); // 【修改】拖拽时滚动，调用显示函数
        }, { passive: false, capture: true });
    }

    // --- 样式注入 ---
    function injectStyles() {
        GM_addStyle(`
            #zoom-pan-container {
                position: relative; padding: 0 !important; margin: 0 4px;
                height: 32px; width: 32px; display: flex; align-items: center; justify-content: center;
            }
            #zoom-pan-area {
                width: 100%; height: 100%; cursor: grab; border-radius: 4px;
                background-color: rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center;
                transition: background-color .2s;
                background-image: url("data:image/svg+xml,%3Csvg version='1.0' xmlns='http://www.w3.org/2000/svg' width='1280.000000pt' height='1280.000000pt' viewBox='0 0 1280 1280' preserveAspectRatio='xMidYMid meet'%3E%3Cg transform='translate%280.000000,1280.000000%29 scale%280.100000,-0.100000%29' fill='%23FFFFFF' stroke='none'%3E%3Cpath d='M1548 11770 c-242 -41 -425 -202 -500 -440 l-23 -75 0 -1465 c0 -1604 -3 -1511 60 -1645 68 -142 201 -264 346 -315 88 -31 259 -39 349 -16 176 44 321 159 399 317 71 144 71 141 71 889 l0 665 1463 -1461 1462 -1462 85 -41 c244 -119 516 -75 705 114 189 189 233 461 114 705 l-41 85 -1461 1462 -1461 1462 694 3 695 3 80 28 c160 57 285 167 355 312 52 109 64 170 57 301 -6 127 -28 202 -89 295 -99 154 -252 252 -435 279 -82 12 -2855 12 -2925 0z'/%3E%3Cpath d='M8335 11773 c-208 -30 -385 -155 -472 -334 -51 -104 -66 -170 -66 -279 0 -262 163 -487 418 -577 l80 -28 695 -3 694 -3 -1460 -1462 c-948 -948 -1470 -1478 -1487 -1508 -14 -25 -38 -82 -53 -125 -34 -100 -39 -253 -10 -349 63 -211 232 -378 437 -431 83 -22 225 -22 308 0 35 9 96 33 135 53 66 34 167 132 1534 1497 l1462 1461 0 -670 c0 -548 3 -683 15 -739 37 -175 165 -337 326 -414 112 -54 173 -66 305 -60 91 4 122 10 189 36 100 40 200 114 260 195 59 77 77 113 106 207 l24 75 0 1470 0 1470 -24 75 c-64 206 -208 351 -416 421 l-70 24 -1450 1 c-797 1 -1463 -1 -1480 -3z'/%3E%3Cpath d='M5433 6139 c-65 -11 -168 -49 -224 -84 -24 -15 -700 -682 -1501 -1483 l-1457 -1456 -3 694 -3 695 -28 78 c-91 257 -312 418 -577 420 -109 0 -175 -15 -279 -66 -152 -74 -270 -218 -318 -387 -17 -62 -18 -139 -18 -1535 l0 -1470 23 -73 c66 -211 212 -357 422 -423 l75 -24 1470 0 1470 0 75 24 c94 29 130 47 207 106 81 60 155 160 195 260 26 67 32 98 36 189 6 132 -6 193 -60 305 -77 161 -239 289 -414 326 -56 12 -191 15 -739 15 l-670 0 1461 1463 1462 1462 41 85 c120 244 76 515 -114 706 -140 140 -340 205 -532 173z'/%3E%3Cpath d='M7161 6139 c-179 -32 -350 -155 -433 -314 -56 -108 -72 -174 -72 -295 1 -122 29 -221 90 -318 24 -39 502 -524 1487 -1509 l1452 -1453 -670 0 c-548 0 -683 -3 -739 -15 -217 -46 -406 -228 -462 -446 -20 -77 -22 -213 -5 -289 48 -203 208 -378 413 -447 l83 -28 1475 0 1475 0 75 24 c209 67 354 212 421 421 l24 75 0 1475 0 1475 -27 81 c-48 141 -127 245 -244 324 -189 126 -424 138 -628 33 -101 -52 -212 -166 -260 -266 -65 -135 -66 -138 -66 -882 l0 -670 -1452 1452 c-986 985 -1471 1463 -1510 1487 -117 74 -294 109 -427 85z'/%3E%3C/g%3E%3C/svg%3E");
                background-repeat: no-repeat; background-position: center; background-size: 20px 20px;
            }
            #zoom-pan-area:hover { background-color: rgba(255, 255, 255, 0.25); }
            #zoom-pan-area:active { cursor: grabbing; background-color: rgba(255, 255, 255, 0.35); }
            .zoom-pan-panel {
                position: absolute; bottom: calc(100% + 5px); left: 50%; transform: translateX(-50%);
                display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 2px;
                background-color: hsla(0, 0%, 8%, .9); backdrop-filter: blur(5px);
                opacity: 0; visibility: hidden; transition: opacity 0.2s ease-out, visibility 0.2s ease-out, transform 0.2s ease-out;
                z-index: 100;
            }
            #zoom-pan-container:hover .zoom-pan-panel {
                opacity: 1; visibility: visible; transform: translateX(-50%) translateY(-3px);
            }
            #zoom-pan-value { color: #eee; font-size: 12px; width: 38px; text-align: center; user-select: none; font-family: Consolas, Monaco, monospace; }
            #zoom-pan-slider { width: 70px; -webkit-appearance: none; appearance: none; height: 4px; background: #555; border-radius: 2px; outline: none; cursor: pointer; }
            #zoom-pan-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; background: #fb7299; border-radius: 50%; cursor: pointer; }
            #zoom-pan-slider::-moz-range-thumb { width: 12px; height: 12px; background: #fb7299; border-radius: 50%; cursor: pointer; }
            #zoom-pan-reset { background: none; border: none; color: white; font-size: 16px; padding: 0; margin: 0; cursor: pointer; opacity: 0.8; user-select: none; transition: opacity .2s, color .2s; display: flex; align-items: center; justify-content: center; }
            #zoom-pan-reset:hover { opacity: 1; color: #fb7299; }

            /* --- 【新增】指示器样式 --- */
            #zoom-pan-indicator {
                position: absolute;
                left: calc(-100% - 15px); /* 定位在主图标右侧，并留有8px间距 */
                top: 50%;
                transform: translateY(-50%);
                padding: 4px 8px;
                background-color: hsla(0, 0%, 8%, .9);
                backdrop-filter: blur(5px);
                color: #eee;
                font-size: 12px;
                font-family: Consolas, Monaco, monospace;
                border-radius: 2px;
                user-select: none;
                pointer-events: none; /* 确保它不会捕获鼠标事件 */
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease-out, visibility 0.2s ease-out;
            }
            #zoom-pan-indicator.visible {
                opacity: 1;
                visibility: visible;
            }
        `);
    }

    // --- 启动入口 ---
    function initialize(playerContainer) {
        console.log('[ZoomPan] B站播放器已找到, 开始初始化...');
        targetElem = findTargetElement();
        if (!targetElem) { console.error('[ZoomPan] 未能确定视频缩放目标元素!'); return; }
        createControls(playerContainer);
        updateZoom(1.0);
    }
    injectStyles();
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const playerContainer = document.querySelector('.bpx-player-container');
                if (playerContainer && !document.getElementById('zoom-pan-container')) {
                    setTimeout(() => initialize(playerContainer), 500);
                    return;
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();