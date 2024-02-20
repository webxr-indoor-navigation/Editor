import React, {useEffect, useRef, useState} from "react";
import ClipperLib from "clipper-lib";
import ExtrudedPolygonExporter from "./ExtrudedPolygonExporter";

const ThumbnailCanvas = ({width, height, rectangles}) => {
    const canvasRef = useRef(null);
    const [solutionJSON, setSolutionJSON] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const clipper = new ClipperLib.Clipper();

        const pathColors = []; // 存储每个路径对应的颜色


        rectangles.forEach((rect, index) => {
            const rectPath = [
                {X: rect.x, Y: rect.y},
                {X: rect.x + rect.width, Y: rect.y},
                {X: rect.x + rect.width, Y: rect.y + rect.height},
                {X: rect.x, Y: rect.y + rect.height}
            ];
            console.log(rectPath);
            clipper.AddPath(rectPath, ClipperLib.PolyType.ptClip, true);
        });

        const unionPolygon = new ClipperLib.Paths();
        clipper.Execute(ClipperLib.ClipType.ctUnion, unionPolygon, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

        if (unionPolygon.length > 0) {
            setSolutionJSON(unionPolygon);
            for (let i2 = 0; i2 < unionPolygon.length; i2++) {
                ctx.beginPath();
                ctx.fillStyle = getRandomColor();
                ctx.strokeStyle = "black";

                for (let j = 0; j < unionPolygon[i2].length; j++) {
                    let x = unionPolygon[i2][j].X * (canvas.width / width);
                    let y = unionPolygon[i2][j].Y * (canvas.height / height);
                    if (!j) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.fill();
                ctx.closePath();
                ctx.stroke();
            }
        }

    }, [width, height, rectangles]);

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const exportSolutionAsJSON = () => {
        if (solutionJSON) {
            const json = JSON.stringify(solutionJSON);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'solution.json';
            link.href = url;
            link.click();
        }
    };

    return (
        <div>
            <canvas ref={canvasRef} width={400} height={300} style={{border: '5px solid black'}}/>
            <button onClick={exportSolutionAsJSON}>Export JSON</button>
            <ExtrudedPolygonExporter jsonData={solutionJSON}/>
        </div>
    )
};

export default ThumbnailCanvas;
