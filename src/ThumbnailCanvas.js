import {useEffect, useRef} from "react";
import ClipperLib from "clipper-lib"

const ThumbnailCanvas = ({width, height, rectangles}) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const clipper = new ClipperLib.Clipper();

        rectangles.forEach(rect => {
            const rectPath = [
                {X: rect.x, Y: rect.y},
                {X: rect.x + rect.width, Y: rect.y},
                {X: rect.x + rect.width, Y: rect.y + rect.height},
                {X: rect.x, Y: rect.y + rect.height}
            ];
            clipper.AddPath(rectPath, ClipperLib.PolyType.ptSubject, true);
        });

        const solution = new ClipperLib.Paths();
        clipper.Execute(ClipperLib.ClipType.ctUnion, solution);

        // 随机生成颜色
        const randomColor = () => {
            return '#' + Math.floor(Math.random() * 16777215).toString(16);
        };

        solution.forEach((path, index) => {
            const fillColor = randomColor();
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.moveTo(path[0].X * (canvas.width / width), path[0].Y * (canvas.height / height));
            path.slice(1).forEach(p => {
                ctx.lineTo(p.X * (canvas.width / width), p.Y * (canvas.height / height));
            });
            ctx.closePath();
            ctx.fill();
        });
    }, [width, height, rectangles]);

    return <canvas ref={canvasRef} width={200} height={150} style={{border: '1px solid black'}}/>;
};

export default ThumbnailCanvas;