import React, {useEffect, useRef, useState} from "react";
import ClipperLib from "clipper-lib";
import ExtrudedPolygonExporter from "./ExtrudedPolygonExporter";

const ThumbnailCanvas = ({mainCanvasWidth, mainCanvasHeight, rectangles, POIs}) => {
    const canvasRef = useRef(null);
    const [walkableAreaJSON, setWalkableAreaJSON] = useState(null);
    const [poiJSON, setPoiJSON] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const scale_x = canvas.width / mainCanvasWidth;
        const scale_y = canvas.height / mainCanvasHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const clipper = new ClipperLib.Clipper();

        // convert rectangles to path
        rectangles.forEach((rect, index) => {
            const rectPath = [
                {X: rect.x, Y: rect.y},
                {X: rect.x + rect.width, Y: rect.y},
                {X: rect.x + rect.width, Y: rect.y + rect.height},
                {X: rect.x, Y: rect.y + rect.height}
            ];
            clipper.AddPath(rectPath, ClipperLib.PolyType.ptClip, true);
        });

        const walkableArea = new ClipperLib.Paths();
        clipper.Execute(ClipperLib.ClipType.ctUnion, walkableArea, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

        if (!walkableArea.length > 0) return

        const drawPOIs = () => {
            ctx.fillStyle = 'orange';
            const radius = 5;

            POIs.forEach((circle, index) => {
                ctx.beginPath();
                ctx.arc(circle.x * scale_x, circle.y * scale_y, radius, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });
        };

        const drawWalkableArea = () => {
            for (let i2 = 0; i2 < walkableArea.length; i2++) {
                ctx.beginPath();
                ctx.fillStyle = getRandomColor();

                for (let j = 0; j < walkableArea[i2].length; j++) {
                    let x = walkableArea[i2][j].X * scale_x;
                    let y = walkableArea[i2][j].Y * scale_y;
                    if (!j) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        };

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';

        drawWalkableArea();
        drawPOIs();

        setWalkableAreaJSON(walkableArea);
    }, [mainCanvasWidth, mainCanvasHeight, rectangles, POIs]);

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const exportSolutionAsJSON = () => {
        if (walkableAreaJSON) {
            const json = JSON.stringify(walkableAreaJSON);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'corridor.json';
            link.href = url;
            link.click();
        }
    };

    const exportPOIAsJSON = () => {
        if (POIs) {
            // todo: user need to name the POIs before export
            const json = JSON.stringify(POIs);
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'poi.json';
            link.href = url;
            link.click();
        }
    };

    return (
        <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'self-start',
            margin: '20px'
        }}>
            <canvas ref={canvasRef} width={400} height={300} style={{border: '5px solid black'}}/>
            <button onClick={exportPOIAsJSON}>Export JSON - POIs</button>
            <button onClick={exportSolutionAsJSON}>Export JSON - corridor</button>
            <ExtrudedPolygonExporter jsonData={walkableAreaJSON}/>
        </div>
    )
};

export default ThumbnailCanvas;
