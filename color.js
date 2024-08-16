document.getElementById('upload').addEventListener('change', function(event) {
    const fileInput = event.target;
    fileInput.disabled = true; // 禁用输入

    const file = fileInput.files[0];
    const img = new Image();
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); // 使用willReadFrequently优化

    img.onload = function() {
        // 限制图片最大宽度和高度
        const maxSize = 500;
        if (img.width > maxSize || img.height > maxSize) {
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        }

        // 显示图片容器
        const imageContainer = document.getElementById('image-container');
        imageContainer.style.display = 'block';

        // 显示上传的图片
        const uploadedImage = document.getElementById('uploaded-image');
        uploadedImage.src = img.src;

        const dominantColor = extractDominantColor(ctx, canvas);
        const rgbColor = `rgb(${dominantColor})`;
        const [r, g, b] = dominantColor.split(',').map(Number);
        const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

        updateResultDiv(rgbColor, hexColor);

        // 释放内存
        img.src = '';  // 清空图片的src
        ctx.clearRect(0, 0, canvas.width, canvas.height);  // 清空Canvas

        fileInput.disabled = false; // 重新启用输入
    };

    img.src = URL.createObjectURL(file);
});

function extractDominantColor(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const colorCounts = {};
    let dominantColor = '';
    let maxCount = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = quantizeColor(data[i]);
        const g = quantizeColor(data[i + 1]);
        const b = quantizeColor(data[i + 2]);

        if (data[i + 3] === 255 && isNotTooDarkOrLight(r, g, b)) { // 透明度为255且不是极暗或极亮
            const color = `${r},${g},${b}`;

            colorCounts[color] = (colorCounts[color] || 0) + 1;

            if (colorCounts[color] > maxCount) {
                maxCount = colorCounts[color];
                dominantColor = color;
            }
        }
    }

    // 提取主色调后，降低饱和度
    let [r, g, b] = dominantColor.split(',').map(Number);
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // 降低饱和度，使颜色更接近灰色
    const desaturatedColor = hslToRgb(h, s * 0.3, l); // 乘以 0.3 降低饱和度

    return desaturatedColor.join(',');
}

function quantizeColor(colorValue) {
    return Math.floor(colorValue / 16) * 16; // 量化到16的倍数
}

function isNotTooDarkOrLight(r, g, b) {
    const brightness = (r + g + b) / 3;
    return brightness > 60 && brightness < 200; // 排除极暗和极亮的像素
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function updateResultDiv(rgbColor, hexColor) {
    const resultDiv = document.getElementById('result');
    document.body.style.backgroundColor = rgbColor;
    resultDiv.textContent = `${rgbColor}\n${hexColor}`;
}
