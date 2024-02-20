import React, {useEffect, useRef, useState} from "react";
import ClipperLib from "clipper-lib";

const ThumbnailCanvas = ({width, height, rectangles}) => {
    const canvasRef = useRef(null);

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
            pathColors.push(getRandomColor()); // 为每个路径生成一个随机颜色
        });


        const solution = new ClipperLib.Paths();
        clipper.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

        // console.log(rectangles);
        // console.log(solution);
        ctx.fillStyle = "red";
        ctx.strokeStyle = "black";
        ctx.beginPath();
        for (let i2 = 0; i2 < solution.length; i2++) {
            for (let j = 0; j < solution[i2].length; j++) {
                let x = solution[i2][j].X * (canvas.width / width);
                let y = solution[i2][j].Y * (canvas.height / height);
                if (!j) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
        }
        ctx.fill();
        ctx.stroke();

        // solution.forEach((path, index) => {
        //     ctx.beginPath();
        //     ctx.moveTo(path[0].X * (canvas.width / width), path[0].Y * (canvas.height / height));
        //     path.slice(1).forEach(p => {
        //         ctx.lineTo(p.X * (canvas.width / width), p.Y * (canvas.height / height));
        //     });
        //     ctx.closePath();
        //     ctx.fillStyle = pathColors[index]; // 为每个路径设置不同的颜色
        //     ctx.fill();
        //     ctx.stroke();
        // });


    }, [width, height, rectangles]);

    const getRandomColor = () => {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    return <canvas ref={canvasRef} width={400} height={300} style={{border: '5px solid black'}}/>;
};

export default ThumbnailCanvas;
