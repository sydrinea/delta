export function toSvg(svg: SVGSVGElement): string {
  return new XMLSerializer().serializeToString(svg);
}

export function toPng(svg: SVGSVGElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const bbox = svg.getBBox();
    const width = svg.width.baseVal.value || bbox.width;
    const height = svg.height.baseVal.value || bbox.height;
    const scale = 2;

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("No canvas context"));

    const xml = toSvg(svg);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#1e1e2e"; // ctp-mantle
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, width * scale, height * scale);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to Blob failed"));
      }, "image/png");

      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}
