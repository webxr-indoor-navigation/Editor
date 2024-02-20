import React, {useState, useRef, useEffect} from 'react';
import ClipperLib from 'clipper-lib';

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

const Online2DDrawer = () => {
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [rectangles, setRectangles] = useState([]);
    const [drawing, setDrawing] = useState(false); // 是否正在绘制矩形
    const [startPoint, setStartPoint] = useState({x: 0, y: 0}); // 起点坐标
    const [endPoint, setEndPoint] = useState({x: 0, y: 0}); // 对角点坐标
    const [canvasWidth, setCanvasWidth] = useState(800); // 画布宽度
    const [canvasHeight, setCanvasHeight] = useState(600); // 画布高度
    const [selectedRectangleIndex, setSelectedRectangleIndex] = useState(-1); // 被选中的矩形的索引
    const [contextMenuVisible, setContextMenuVisible] = useState(false); // 右键菜单是否可见
    const [contextMenuPosition, setContextMenuPosition] = useState({x: 0, y: 0}); // 右键菜单位置

    const canvasRef = useRef(null);
    const contextMenuRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const drawCanvas = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 绘制背景图片
            if (backgroundImage) {
                const image = new Image();
                image.onload = () => {
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    // 绘制矩形
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;
                    rectangles.forEach((rect, index) => {
                        if (index !== selectedRectangleIndex) {
                            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
                        }
                    });

                    // 绘制临时矩形（起点到当前鼠标位置）
                    if (drawing) {
                        ctx.strokeRect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
                    }
                };
                image.src = backgroundImage;
            } else {
                // 如果没有背景图片，仅绘制矩形
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                rectangles.forEach((rect, index) => {
                    if (index !== selectedRectangleIndex) {
                        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
                    }
                });

                // 绘制临时矩形（起点到当前鼠标位置）
                if (drawing) {
                    ctx.strokeRect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
                }
            }
        };

        drawCanvas();
    }, [backgroundImage, rectangles, drawing, startPoint, endPoint, canvasWidth, canvasHeight, selectedRectangleIndex]);

    useEffect(() => {
        const handleContextMenu = (event) => {
            event.preventDefault();
            setContextMenuPosition({x: event.clientX, y: event.clientY});
            setContextMenuVisible(true);
        };

        const handleWindowClick = () => {
            setContextMenuVisible(false);
        };

        window.addEventListener('click', handleWindowClick);

        if (contextMenuVisible) {
            window.addEventListener('contextmenu', handleContextMenu);
        } else {
            window.removeEventListener('contextmenu', handleContextMenu);
        }

        return () => {
            window.removeEventListener('click', handleWindowClick);
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [contextMenuVisible]);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            setBackgroundImage(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleCanvasMouseDown = (event) => {
        if (event.button !== 0) { // 如果不是鼠标左键，则不处理
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const clickedRectangleIndex = rectangles.findIndex(rect => {
            return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
        });

        if (clickedRectangleIndex !== -1) {
            setSelectedRectangleIndex(clickedRectangleIndex);
        } else {
            setStartPoint({x, y});
            setEndPoint({x, y});
            setDrawing(true);
            setSelectedRectangleIndex(-1);
        }
    };


    const handleCanvasMouseUp = (event) => {
        if (event.button !== 0) { // 如果不是鼠标左键，则不处理
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setEndPoint({x, y});
        setDrawing(false);

        if (selectedRectangleIndex !== -1) {
            // Update the selected rectangle's position and size
            const newRectangles = rectangles.map((rect, index) => {
                if (index === selectedRectangleIndex) {
                    const width = Math.abs(endPoint.x - startPoint.x); // 计算矩形宽度
                    const height = Math.abs(endPoint.y - startPoint.y); // 计算矩形高度
                    const newX = Math.min(startPoint.x, endPoint.x);
                    const newY = Math.min(startPoint.y, endPoint.y);
                    return {x: newX, y: newY, width, height};
                }
                return rect;
            });
            setRectangles(newRectangles);
        } else {
            const width = Math.abs(endPoint.x - startPoint.x); // 计算矩形宽度
            const height = Math.abs(endPoint.y - startPoint.y); // 计算矩形高度
            const newX = Math.min(startPoint.x, endPoint.x);
            const newY = Math.min(startPoint.y, endPoint.y);
            setRectangles(prevRectangles => [...prevRectangles, {x: newX, y: newY, width, height}]);
        }
    };


    const handleCanvasMouseMove = (event) => {
        if (drawing && selectedRectangleIndex === -1) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setEndPoint({x, y});
        }
    };

    const handleContextMenuClick = (action) => {
        if (action === 'delete' && selectedRectangleIndex !== -1) {
            const newRectangles = rectangles.filter((rect, index) => index !== selectedRectangleIndex);
            setRectangles(newRectangles);
            setSelectedRectangleIndex(-1);
            setContextMenuVisible(false);
        }
    };

    return (
        <div style={{position: 'relative'}}>
            <input type="file" onChange={handleImageUpload}/>
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onMouseDown={handleCanvasMouseDown}
                onMouseUp={handleCanvasMouseUp}
                onMouseMove={handleCanvasMouseMove}
                onContextMenu={(event) => {
                    event.preventDefault();
                }}
                style={{border: '1px solid black'}}
            ></canvas>
            {contextMenuVisible && (
                <div
                    ref={contextMenuRef}
                    style={{
                        position: 'absolute',
                        top: contextMenuPosition.y,
                        left: contextMenuPosition.x,
                        backgroundColor: 'white',
                        border: '1px solid black',
                        padding: '5px'
                    }}
                >
                    <ul style={{listStyleType: 'none', padding: 0}}>
                        <li onClick={() => handleContextMenuClick('delete')}>Delete</li>
                    </ul>
                </div>
            )}
            <div style={{position: 'absolute', bottom: '10px', right: '10px'}}>
                <ThumbnailCanvas width={canvasWidth} height={canvasHeight} rectangles={rectangles}/>
            </div>
        </div>
    );
};

export default Online2DDrawer;
