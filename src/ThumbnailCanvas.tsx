import React, {useEffect, useRef, useState} from "react";
import ClipperLib from "clipper-lib";
import ExtrudedPolygonExporter from "./ExtrudedPolygonExporter";
import {POI, Point, Rect, Scale} from "./types";


interface ThumbnailCanvasProps {
    mainCanvasWidth: number;
    mainCanvasHeight: number;
    rectangles: Rect[] | undefined;
    POIs: POI[] | undefined;
    scale: Scale | undefined;
}


const ThumbnailCanvas = (props: ThumbnailCanvasProps) => {
    const canvasRef = useRef<any>(null);
    const [walkableArea, setWalkableArea] = useState<[[{ X: number, Y: number }]] | undefined>();
    const [ratio, setRatio] = useState<number>(1);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const scale_x = canvas.width / props.mainCanvasWidth;
        const scale_y = canvas.height / props.mainCanvasHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const clipper = new ClipperLib.Clipper();

        // convert rectangles to path
        if (!props.rectangles) return;
        props.rectangles.forEach((rect: Rect) => {
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

        if (!walkableArea) return

        const drawPOIs = () => {
            ctx.fillStyle = 'orange';
            const radius = 5;

            if (!props.POIs) return;

            props.POIs.forEach((POI: Point) => {
                ctx.beginPath();
                ctx.arc(POI.x * scale_x, POI.y * scale_y, radius, 0, 2 * Math.PI);
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
            function calculateDistance(pointA: Point, pointB: Point) {
                const dx = pointB.x - pointA.x;
                const dy = pointB.y - pointA.y;
                return Math.sqrt(dx * dx + dy * dy);
            }

            ctx.fillStyle = 'black';
            ctx.font = '13px Arial';
            if (props.scale) {
                // ratio of a distance on the canvas (pixel) to the corresponding distance on the ground (meter).
                const pixel = calculateDistance(props.scale.startPoint, props.scale.endPoint);
                const cm = props.scale.distanceInRealWorld;
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
    }, [props.mainCanvasWidth, props.mainCanvasHeight, props.rectangles, props.POIs, props.scale]);

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    function deepCopy<T>(obj: T): T {
        if (typeof obj !== 'object' || obj === null) {
            // 如果是基本数据类型或 null，则直接返回
            return obj;
        }

        let newObj: any = Array.isArray(obj) ? [] : {}; // 根据原始类型创建新对象或数组

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
            copy.forEach((sublist: { X: number; Y: number; }[]) => {
                sublist.forEach((point: { X: number; Y: number; }) => {
                    point.X *= ratio;
                    point.Y *= ratio;
                });
            });

            // 使用 map 方法对每个子数组进行操作
            const renamedObj = copy.map(innerArray =>
                innerArray.map(innerObj => {
                    // 使用类型断言和对象解构重命名键名
                    const {X: x, Y: y} = innerObj;
                    return {x, y};
                })
            );

            const json = JSON.stringify(renamedObj)
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

        if (props.POIs) {
            const copy = deepCopy(props.POIs)
            copy.forEach((item: POI) => {
                item.x *= ratio;
                item.y *= ratio;
                item.facing.x *= ratio;
                item.facing.y *= ratio;
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
        canvas.toBlob((blob: Blob | MediaSource) => {
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
