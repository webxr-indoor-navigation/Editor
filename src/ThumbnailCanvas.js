import React, {useEffect, useRef, useState} from "react";
import ClipperLib from "clipper-lib";
import ExtrudedPolygonExporter from "./ExtrudedPolygonExporter";

const ThumbnailCanvas = ({mainCanvasWidth, mainCanvasHeight, rectangles, POIs, scale}) => {
    const canvasRef = useRef(null);
    const [walkableArea, setWalkableArea] = useState(null);
    const [ratio, setRatio] = useState(null);

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

            POIs.forEach((POI, index) => {
                ctx.beginPath();
                ctx.arc(POI.X * scale_x, POI.Y * scale_y, radius, 0, 2 * Math.PI);
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

        const drawScale = () => {
            function calculateDistance(pointA, pointB) {
                const dx = pointB.x - pointA.x;
                const dy = pointB.y - pointA.y;
                return Math.sqrt(dx * dx + dy * dy);
            }

            ctx.fillStyle = 'black';
            ctx.font = '13px Arial';
            if (scale) {
                // ratio of a distance on the canvas (pixel) to the corresponding distance on the ground (meter).
                const pixel = calculateDistance(scale.startPoint, scale.endPoint);
                const cm = scale.distanceInRealWorld;
                const ratio = cm / pixel;
                setRatio(ratio);
                ctx.fillText('Scale (in meter/pixel): ' + ratio.toFixed(3), 5, 20);
            } else {
                ctx.fillText('Add a scale through "User Operation"!!!', 3, 13);
            }
        }


        // Global setting
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';

        drawWalkableArea();
        drawPOIs();
        drawScale();

        setWalkableArea(walkableArea);
    }, [mainCanvasWidth, mainCanvasHeight, rectangles, POIs, scale]);

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    function deepCopy(obj) {
        if (typeof obj !== 'object' || obj === null) {
            // 如果是基本数据类型或 null，则直接返回
            return obj;
        }

        let newObj = Array.isArray(obj) ? [] : {}; // 根据原始类型创建新对象或数组

        // 递归地深拷贝每个属性值
        for (let key in obj) {
            newObj[key] = deepCopy(obj[key]);
        }

        return newObj;
    }


    const exportSolutionAsJSON = () => {
        if (!ratio) {
            window.alert("no scale")
            return;
        }

        if (walkableArea) {
            const copy = deepCopy(walkableArea);
            copy.forEach(sublist => {
                sublist.forEach(point => {
                    point.X *= ratio;
                    point.Y *= ratio;
                });
            });
            const json = JSON.stringify(copy)
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'corridor.json';
            link.href = url;
            link.click();
            // console.log(json);
        }
    };

    const exportPOIAsJSON = () => {
        if (!ratio) {
            window.alert("no scale")
            return
        }

        if (POIs) {
            const copy = deepCopy(POIs)
            copy.forEach(item => {
                item.X *= ratio;
                item.Y *= ratio;
            });
            const json = JSON.stringify(copy)
            const blob = new Blob([json], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'poi.json';
            link.href = url;
            link.click();
            // console.log(json);

        }
    };

    const exportSolutionAsPNG = () => {
        const canvas = canvasRef.current;
        const link = document.createElement('a');
        canvas.toBlob((blob) => {
            link.download = 'whole-view.png';
            link.href = URL.createObjectURL(blob);
            link.click();
        });
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
            <ExtrudedPolygonExporter jsonData={walkableArea}/>
            <button onClick={exportSolutionAsPNG}>Export PNG - whole</button>
        </div>
    )
};

export default ThumbnailCanvas;
