import React, { useRef, useEffect } from "react";

/**
 * @param {string} url - tiff图片url
 * @param {number} brightness - 亮度
 * @param {number} contrast - 对比度
 */
const TiffCanvas = ({ url, brightness = 0, contrast = 1 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!url || !window.UTIF) return;

    let isUnmounted = false; // 卸载保护

    const fetchAndDraw = async () => {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const ifds = window.UTIF.decode(buf);
        window.UTIF.decodeImage(buf, ifds[0]);
        let rgba = window.UTIF.toRGBA8(ifds[0]); // Uint8ClampedArray, RGBA
        const width = ifds[0].width;
        const height = ifds[0].height;

        // 亮度对比度处理
        for (let i = 0; i < rgba.length; i += 4) {
          for (let c = 0; c < 3; c++) {
            let val = rgba[i + c];
            val = ((val - 128) * contrast) + 128; // 对比度
            val = val + brightness; // 亮度
            rgba[i + c] = Math.max(0, Math.min(255, val));
          }
        }

        // 判空，避免组件卸载或还没挂载时报错
        const canvas = canvasRef.current;
        if (!canvas || isUnmounted) return;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        let imgData = ctx.createImageData(width, height);
        imgData.data.set(rgba);
        ctx.putImageData(imgData, 0, 0);
      } catch (err) {
        console.error("TIFF加载失败:", err);
      }
    };
    fetchAndDraw();

    // 清理函数，防止内存泄漏与异步操作未完成导致的报错
    return () => { isUnmounted = true; };
  }, [url, brightness, contrast]);

  return <canvas ref={canvasRef} style={{ maxWidth: "100%", maxHeight: "100%" }} />;
};

export default TiffCanvas;
