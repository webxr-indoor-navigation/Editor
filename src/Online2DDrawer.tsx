import React, {useState, useRef, useEffect} from 'react';
import ThumbnailCanvas from "./ThumbnailCanvas";
import { v4 as uuid } from 'uuid';
import {History, POI, Point, Rect, Scale} from "./types";

const userOperations = {
    drawCorridor: "drawCorridor",
    drawPOI: "drawPOI",
    addScale: "addScale"
};

const generateUUID = () => {
    return uuid();
};

const Online2DDrawer = () => {
    // State variables initialization
    const [backgroundImage, setBackgroundImage] = useState<any>();
    const [rectangles, setRectangles] = useState<Rect[]>([]);
    const [POIs, setPOIs] = useState<POI[]>([]);
    const [scale, setScale] = useState<Scale>();
    const [drawing, setDrawing] = useState(false); // Whether drawing rectangle or circle
    const [userOperation, setUserOperation] = useState(userOperations.drawCorridor); // Type of shape to draw
    const [startPoint, setStartPoint] = useState<Point>({X: 0, Y: 0}); // Starting point coordinates
    const [endPoint, setEndPoint] = useState<Point>({X: 0, Y: 0}); // Diagonal point coordinates
    const [canvasWidth] = useState<number>(800); // Canvas width
    const [canvasHeight, setCanvasHeight] = useState<number>(600); // Canvas height
    const [history, setHistory] = useState<History[]>([]); // 用于存储操作历史记录的数组
    const [redoHistory, setRedoHistory] = useState<History[]>([]); // 用于存储撤销的操作历史记录的数组

    // References for canvas elements
    const mainCanvasRef = useRef<any>(null);
    const backgroundCanvasRef = useRef<any>(null); // Ref for background image canvas

    // 添加一个新的矩形到画布上，并记录操作历史


    const addScale = (newScale: Scale) => {
        setScale(newScale);
        setHistory(prevHistory => [...prevHistory, {type: userOperations.addScale, args: newScale}]); // 记录操作历史
    };

    const addRectangle = (newRectangle: Rect) => {
        setRectangles(prevRectangles => [...prevRectangles, newRectangle]);
        setHistory(prevHistory => [...prevHistory, {type: userOperations.drawCorridor, args: newRectangle}]); // 记录操作历史
    };
    const addPOI = (newPOI: POI) => {
        setPOIs(prevPOIs => [...prevPOIs, newPOI]);
        setHistory(prevHistory => [...prevHistory, {type: userOperations.drawPOI, args: newPOI}]); // 记录操作历史
    };
    const previewPOI = (newPOI: POI) => {
        setPOIs(prevPOIs => [...prevPOIs, newPOI]);
    };

    // 撤销最后一个操作
    const undo = () => {
        if (history) {
            console.log("history length: " + history.length);

            const lastOperation = history[history.length - 1];
            const lastOperationType = lastOperation.type;

            switch (lastOperationType) {
                case userOperations.drawCorridor:
                    setRectangles(prevRectangles => prevRectangles.slice(0, -1)); // 移除最后一个矩形
                    break;
                case userOperations.drawPOI:
                    setPOIs(prevPOIs => prevPOIs.slice(0, -1));
                    break;
                case userOperations.addScale:
                    setScale(undefined)
                    break;
                default:
                    break;
            }
            setRedoHistory(prevRedoHistory => [...prevRedoHistory, lastOperation]); // 将操作添加到重做历史中
            setHistory(prevHistory => prevHistory.slice(0, -1)); // 移除最后一个操作记录
        }
    };

    // 重做最后一个撤销的操作
    const redo = () => {
        if (redoHistory) {
            console.log("redoHistory length: " + redoHistory.length);

            const lastUndoOperation = redoHistory[redoHistory.length - 1];
            const lastUndoOperationType = lastUndoOperation.type;
            const args = redoHistory[redoHistory.length - 1].args;
            switch (lastUndoOperationType) {
                case userOperations.drawCorridor:
                    addRectangle(args);
                    break;
                case userOperations.drawPOI:
                    addPOI(args);
                    break;
                case userOperations.addScale:
                    addScale(args);
                    break;
                default:
                    break;
            }
            setRedoHistory(prevRedoHistory => prevRedoHistory.slice(0, -1)); // 从重做历史中移除最后一个操作
        }
    };


    // Effect to draw shapes on the main canvas
    useEffect(() => {
        const mainCanvas = mainCanvasRef.current;
        const main_ctx = mainCanvas.getContext('2d');

        const drawCanvas = () => {
            main_ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

            // draw rectangles
            main_ctx.strokeStyle = 'red';
            main_ctx.lineWidth = 2;

            if (rectangles)
                rectangles.forEach((rect: Rect) => {
                    main_ctx.strokeRect(rect.X, rect.Y, rect.width, rect.height);
                    // Draw vertex coordinates
                    main_ctx.fillStyle = 'blue';
                    main_ctx.font = '16px Arial';
                    main_ctx.fillText(`(${Math.round(rect.X)}, ${Math.round(rect.Y)})`, Math.round(rect.X) - 30, Math.round(rect.Y) - 10);
                    main_ctx.fillText(`(${Math.round(rect.X + rect.width)}, ${Math.round(rect.Y)})`, Math.round(rect.X + rect.width), Math.round(rect.Y) - 10);
                    main_ctx.fillText(`(${Math.round(rect.X + rect.width)}, ${Math.round(rect.Y + rect.height)})`, Math.round(rect.X + rect.width), Math.round(rect.Y + rect.height) + 15);
                    main_ctx.fillText(`(${Math.round(rect.X)}, ${Math.round(rect.Y + rect.height)})`, Math.round(rect.X) - 30, Math.round(rect.Y + rect.height) + 15);
                });

            // draw POIs
            main_ctx.strokeStyle = 'orange';
            main_ctx.lineWidth = 2;

            if (POIs)
                POIs.forEach(POI => {
                    main_ctx.beginPath();
                    const radius = 10;
                    main_ctx.arc(POI.X, POI.Y, radius, 0, 2 * Math.PI);
                    main_ctx.stroke();
                    main_ctx.closePath();

                    // Draw vertex coordinates
                    main_ctx.font = '16px Arial';
                    main_ctx.fillText("." + POI.name, Math.round(POI.X) - 15, Math.round(POI.Y) - 15);
                });

            // draw scale
            if (scale) {
                main_ctx.strokeStyle = 'black'; // 设置线段颜色为黑色
                main_ctx.lineWidth = 5; // 设置线段宽度为 2 像素

                // 开始绘制线段
                main_ctx.beginPath();
                main_ctx.moveTo(scale.startPoint.X, scale.startPoint.Y); // 设置线段起点
                main_ctx.lineTo(scale.endPoint.X, scale.endPoint.Y); // 设置线段终点
                main_ctx.stroke();

                // Draw vertex coordinates
                main_ctx.fillStyle = 'blue';
                main_ctx.font = '16px Arial';
                main_ctx.fillText(scale.distanceInRealWorld + " m",
                    Math.round(scale.startPoint.X + scale.endPoint.X) / 2 - 15,
                    Math.round(scale.startPoint.Y + scale.endPoint.Y) / 2 - 10);
            }


            // for preview purpose: drawing temporary shape (from start point to current mouse position)
            if (drawing) {
                switch (userOperation) {
                    case userOperations.drawCorridor:
                        main_ctx.strokeStyle = 'red';
                        main_ctx.lineWidth = 2;
                        main_ctx.strokeRect(startPoint.X, startPoint.Y, endPoint.X - startPoint.X, endPoint.Y - startPoint.Y);
                        break;
                    case userOperations.addScale:
                        main_ctx.strokeStyle = 'black'; // 设置线段颜色为黑色
                        main_ctx.lineWidth = 5; // 设置线段宽度为 2 像素

                        // 开始绘制线段
                        main_ctx.beginPath();
                        main_ctx.moveTo(startPoint.X, startPoint.Y); // 设置线段起点
                        main_ctx.lineTo(endPoint.X, endPoint.Y); // 设置线段终点
                        main_ctx.stroke(); // 绘制线段

                        break;
                    default:
                        console.log("unknown user operation");
                        break;
                }
            }
        };

        drawCanvas();
    }, [rectangles, POIs, scale, drawing, startPoint, endPoint, userOperation]);

    // Function to handle image upload
    const handleImageUpload = (event: any) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target) {
                setBackgroundImage(e.target.result);
            }
        };
        reader.readAsDataURL(file);
    };


    // Function to draw background image
    const drawBackgroundImage = (imageUrl: string) => {
        const bgCanvas = backgroundCanvasRef.current;
        const bg_ctx = bgCanvas.getContext('2d');

        const image = new Image();

        image.onload = () => {
            bg_ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            bg_ctx.drawImage(image, 0, 0, bgCanvas.width, bgCanvas.height);

            setCanvasHeight(image.height / image.width * canvasWidth)
        };
        image.src = imageUrl;

    };

    // Effect to draw background image when it changes
    useEffect(() => {
        if (backgroundImage) {
            drawBackgroundImage(backgroundImage);
        } else {
            drawBackgroundImage(process.env.PUBLIC_URL + "/rescaledFloorMap.jpg");
        }
    }, [backgroundImage, canvasHeight]);


    // Function to handle canvas click event
    const handleCanvasClick = (event: { clientX: number; clientY: number; }) => {
        const rect = mainCanvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        switch (userOperation) {
            case userOperations.drawCorridor:
                if (!drawing) {
                    // set start point and allow preview
                    setStartPoint({X: x, Y: y});
                    setDrawing(true);
                } else {
                    const width = Math.abs(endPoint.X - startPoint.X); // Calculate rectangle width
                    const height = Math.abs(endPoint.Y - startPoint.Y); // Calculate rectangle height
                    const newX = Math.min(startPoint.X, endPoint.X);
                    const newY = Math.min(startPoint.Y, endPoint.Y);
                    addRectangle({X: newX, Y: newY, width, height})
                    setDrawing(false);
                }
                break;
            case userOperations.drawPOI:
                previewPOI({X: endPoint.X, Y: endPoint.Y, uuid: generateUUID(), name: '!!!'})

                setTimeout(() => {
                    const poiName = window.prompt('Please enter the name of the POI:'); // 弹出对话框让用户输入 POI 名称
                    setPOIs(prevPOIs => prevPOIs.slice(0, -1)); // 移除最后一个矩形
                    if (poiName === null) { // 用户点击了取消按钮
                        return; // 直接返回，不执行后续代码
                    }
                    if (poiName.trim() === '') { // 用户输入为空
                        window.alert('POI name cannot be empty. Please enter a valid name.'); // 提示用户输入不能为空
                        return; // 直接返回，不执行后续代码
                    }
                    addPOI({X: endPoint.X, Y: endPoint.Y, uuid: generateUUID(), name: poiName}); // 添加 POI
                }, 100); // 设置延迟 100 毫秒
                break;
            case userOperations.addScale:
                if (!drawing) {
                    // set start point and allow preview
                    setStartPoint({X: x, Y: y});
                    setDrawing(true);
                } else {
                    setTimeout(() => {
                        const distanceInRealWorld = window.prompt('Please enter the distance (in meters) in real world :'); // 弹出对话框让用户输入 POI 名称
                        if (distanceInRealWorld === null) { // 用户点击了取消按钮
                            return; // 直接返回，不执行后续代码
                        }
                        if (distanceInRealWorld.trim() === '') { // 用户输入为空
                            window.alert('Length cannot be empty. Please enter a valid length.'); // 提示用户输入不能为空
                            return; // 直接返回，不执行后续代码
                        }
                        addScale({
                            startPoint: startPoint,
                            endPoint: endPoint,
                            distanceInRealWorld: parseFloat(distanceInRealWorld)
                        });
                        setDrawing(false);
                    }, 100); // 设置延迟 100 毫秒


                }
                break;

            default:
                console.log("unknown user operation");
                break;
        }
    }

    // Function to handle canvas mouse move event
    const handleCanvasMouseMove = (event: { clientX: number; clientY: number; }) => {
        const rect = mainCanvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setEndPoint({X: x, Y: y});
    };

    // Function to handle key press event
    const handleKeyPress = (event: { key: string; shiftKey: any; metaKey: any; }) => {
        if (event.key === 'Escape') {
            console.log("ESC input");
            setDrawing(false);
            return
        }

        if (event.shiftKey && event.metaKey && event.key === 'z') {
            redo(); // 当用户按下shift+Ctrl+Z时执行撤销操作
            return;
        }

        if (event.metaKey && event.key === 'z') {
            undo(); // 当用户按下Ctrl+Z时执行撤销操作
            return;
        }

        if (1) {

        }

    };

    // Function to handle shape type change
    const handleShapeTypeChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setDrawing(false);
        setUserOperation(event.target.value);
    };

    // Render JSX
    return (
        <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <input type="file" onChange={handleImageUpload} style={{marginBottom: '10px'}}/>
            <div style={{position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                <div style={{
                    border: '1px solid black',
                    width: canvasWidth,
                    height: canvasHeight,
                    position: 'relative'
                }}>
                    <canvas
                        ref={backgroundCanvasRef} // Use ref for background canvas
                        width={canvasWidth}
                        height={canvasHeight}
                        style={{position: 'absolute', top: 0, left: 0, zIndex: 0}}
                    ></canvas>
                    <canvas
                        onKeyDown={handleKeyPress} tabIndex={0}
                        ref={mainCanvasRef}
                        width={canvasWidth}
                        height={canvasHeight}
                        onMouseMove={handleCanvasMouseMove}
                        onClick={handleCanvasClick}
                        onContextMenu={(event) => {
                            event.preventDefault();
                        }}
                        style={{position: 'absolute', top: 0, left: 0, zIndex: 1}}
                    ></canvas>
                </div>
                <ThumbnailCanvas mainCanvasWidth={canvasWidth} mainCanvasHeight={canvasHeight} rectangles={rectangles}
                                 POIs={POIs} scale={scale}/>
            </div>
            <div>
                <label htmlFor="shapeType">User Operation:</label>
                <select id="shapeType" value={userOperation} onChange={handleShapeTypeChange}>
                    <option value={userOperations.drawCorridor}>draw corridor (walkable area)</option>
                    <option value={userOperations.drawPOI}>add POI (destination)</option>
                    <option value={userOperations.addScale}>add scale</option>
                </select>
            </div>
        </div>
    );
};

export default Online2DDrawer;
