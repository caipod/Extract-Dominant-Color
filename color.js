document.getElementById('upload').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const fileInput = event.target;
    disableInput(fileInput);  // 禁用输入

    const file = fileInput.files[0];
    const img = new Image();
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });  // 设置 willReadFrequently 选项
    
    img.onload = function() {
        drawImageOnCanvas(img, ctx, canvas);  // 绘制图像到Canvas

        const dominantColor = extractDominantColor(ctx, canvas);  // 提取主色调
        updateResultDiv(dominantColor);  // 更新结果显示

        releaseResources(img, ctx, canvas);  // 释放内存
        enableInput(fileInput);  // 重新启用输入
    };

    img.src = URL.createObjectURL(file);
}

function disableInput(inputElement) {
    inputElement.disabled = true;
}

function enableInput(inputElement) {
    inputElement.disabled = false;
}

function drawImageOnCanvas(img, ctx, canvas) {
    const maxSize = 500;
    let scale = 1;

    if (img.width > maxSize || img.height > maxSize) {
        scale = Math.min(maxSize / img.width, maxSize / img.height);
    }

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

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

    return dominantColor;
}

function quantizeColor(colorValue) {
    return Math.floor(colorValue / 16) * 16; // 量化到16的倍数
}

function isNotTooDarkOrLight(r, g, b) {
    const brightness = (r + g + b) / 3;
    return brightness > 60 && brightness < 200; // 排除极暗和极亮的像素
}

function updateResultDiv(dominantColor) {
    const rgbColor = `rgb(${dominantColor})`;
    const [r, g, b] = dominantColor.split(',').map(Number);
    const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

    const resultDiv = document.getElementById('result');
    resultDiv.style.backgroundColor = rgbColor;
    resultDiv.textContent = `${rgbColor}\n${hexColor}`;
}

function releaseResources(img, ctx, canvas) {
    img.src = '';  // 清空图片的src
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // 清空Canvas
}
