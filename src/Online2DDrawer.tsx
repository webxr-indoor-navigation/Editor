import React, {useState, useRef, useEffect} from 'react';
import ThumbnailCanvas from "./ThumbnailCanvas";
import {v4 as uuid} from 'uuid';
import {History, POI, Point, Rect, Scale} from "./types";
import CanvasPropertySetter from "./CanvasPropertySetter";

const userOperations = {
    drawCorridor: "drawCorridor",
    drawPOI: "drawPOI",
    addScale: "addScale"
};

const generateUUID = () => {
    return uuid();
};


const Online2DDrawer = () => {
    // key data
    const [rectangles, setRectangles] = useState<Rect[]>([]);
    const [POIs, setPOIs] = useState<POI[]>([]);
    const [scale, setScale] = useState<Scale>();

    // helper variable
    const [backgroundImage, setBackgroundImage] = useState<any>();
    const [startPoint, setStartPoint] = useState<Point>({x: 0, y: 0}); // Starting point coordinates
    const [endPoint, setEndPoint] = useState<Point>({x: 0, y: 0}); // Diagonal point coordinates

    // user operation related
    const [drawing, setDrawing] = useState(false); // Whether drawing rectangle or circle
    const [userOperation, setUserOperation] = useState(userOperations.drawCorridor); // Type of shape to draw
    const [history, setHistory] = useState<History[]>([]); // 用于存储操作历史记录的数组
    const [redoHistory, setRedoHistory] = useState<History[]>([]); // 用于存储撤销的操作历史记录的数组

    // canvas property
    const [canvasWidth] = useState<number>(800); // Canvas width
    const [canvasHeight, setCanvasHeight] = useState<number>(600); // Canvas height
    const [displayVertex, setDisplayVertex] = useState<boolean>(false);
    const [poiRadius, setPoiRadius] = useState<number>(20);

    // References for canvas elements
    const mainCanvasRef = useRef<any>(null);
    const backgroundCanvasRef = useRef<any>(null); // Ref for background image canvas

    function facingAdjust(P1: Point, P2: Point, scale: number = 1): Point {
        // 计算线段长度
        const distance = Math.sqrt(Math.pow(P2.x - P1.x, 2) + Math.pow(P2.y - P1.y, 2));

        // 计算单位向量
        const unitVectorX = (P2.x - P1.x) / distance;
        const unitVectorY = (P2.y - P1.y) / distance;

        // 计算新点的坐标
        const newX = P1.x + scale * unitVectorX;
        const newY = P1.y + scale * unitVectorY;

        return {x: newX, y: newY};
    }

    function facingDisplay(POI: POI, scale: number): Point {
        return facingAdjust({x: POI.x, y: POI.y}, POI.facing, scale);
    }


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
                    main_ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

                    // Draw vertex coordinates
                    if (displayVertex) {
                        main_ctx.fillStyle = 'blue';
                        main_ctx.font = '16px Arial';
                        main_ctx.fillText(`(${Math.round(rect.x)}, ${Math.round(rect.y)})`, Math.round(rect.x) - 30, Math.round(rect.y) - 10);
                        main_ctx.fillText(`(${Math.round(rect.x + rect.width)}, ${Math.round(rect.y)})`, Math.round(rect.x + rect.width), Math.round(rect.y) - 10);
                        main_ctx.fillText(`(${Math.round(rect.x + rect.width)}, ${Math.round(rect.y + rect.height)})`, Math.round(rect.x + rect.width), Math.round(rect.y + rect.height) + 15);
                        main_ctx.fillText(`(${Math.round(rect.x)}, ${Math.round(rect.y + rect.height)})`, Math.round(rect.x) - 30, Math.round(rect.y + rect.height) + 15);
                    }
                });

            // draw POIs
            main_ctx.strokeStyle = 'orange';
            main_ctx.lineWidth = 2;

            if (POIs)
                POIs.forEach(POI => {
                    main_ctx.beginPath();
                    main_ctx.arc(POI.x, POI.y, poiRadius, 0, 2 * Math.PI);
                    main_ctx.stroke();
                    main_ctx.closePath();

                    // Draw POI name
                    main_ctx.font = '16px Arial';
                    main_ctx.fillText("." + POI.name, Math.round(POI.x) - 15, Math.round(POI.y) - 15);

                    // Draw facing direction
                    main_ctx.beginPath();
                    main_ctx.moveTo(POI.x, POI.y);
                    const p: Point = facingDisplay(POI, poiRadius);
                    main_ctx.lineTo(p.x, p.y);
                    main_ctx.stroke();
                });

            // draw scale
            if (scale) {
                main_ctx.strokeStyle = 'black'; // 设置线段颜色为黑色
                main_ctx.lineWidth = 5; // 设置线段宽度为 2 像素

                // 开始绘制线段
                main_ctx.beginPath();
                main_ctx.moveTo(scale.startPoint.x, scale.startPoint.y); // 设置线段起点
                main_ctx.lineTo(scale.endPoint.x, scale.endPoint.y); // 设置线段终点
                main_ctx.stroke();

                // Draw vertex coordinates
                main_ctx.fillStyle = 'blue';
                main_ctx.font = '16px Arial';
                main_ctx.fillText(scale.distanceInRealWorld + " m",
                    Math.round(scale.startPoint.x + scale.endPoint.x) / 2 - 15,
                    Math.round(scale.startPoint.y + scale.endPoint.y) / 2 - 10);
            }


            // for preview purpose: drawing temporary shape (from start point to current mouse position)
            if (drawing) {
                switch (userOperation) {
                    case userOperations.drawCorridor:
                        main_ctx.strokeStyle = 'red';
                        main_ctx.lineWidth = 2;
                        main_ctx.strokeRect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
                        break;
                    case userOperations.addScale:
                        main_ctx.strokeStyle = 'black'; // 设置线段颜色为黑色
                        main_ctx.lineWidth = 5; // 设置线段宽度为 2 像素

                        // 开始绘制线段
                        main_ctx.beginPath();
                        main_ctx.moveTo(startPoint.x, startPoint.y); // 设置线段起点
                        main_ctx.lineTo(endPoint.x, endPoint.y); // 设置线段终点
                        main_ctx.stroke(); // 绘制线段

                        break;

                    case userOperations.drawPOI:
                        // draw POIs
                        main_ctx.strokeStyle = 'orange';
                        main_ctx.lineWidth = 2;
                        main_ctx.beginPath();
                        main_ctx.arc(startPoint.x, startPoint.y, poiRadius, 0, 2 * Math.PI);
                        main_ctx.stroke();
                        main_ctx.closePath();

                        // Draw facing direction
                        const end = facingAdjust(startPoint, endPoint, poiRadius);

                        main_ctx.beginPath();
                        main_ctx.moveTo(startPoint.x, startPoint.y);
                        main_ctx.lineTo(end.x, end.y);
                        main_ctx.stroke();
                        break;
                    default:
                        console.log("unknown user operation");
                        break;
                }
            }
        };

        drawCanvas();
    }, [rectangles, POIs, scale, drawing, startPoint, endPoint, userOperation, displayVertex, poiRadius]);

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
                    setStartPoint({x: x, y: y});
                    setDrawing(true);
                } else {
                    const width = Math.abs(endPoint.x - startPoint.x); // Calculate rectangle width
                    const height = Math.abs(endPoint.y - startPoint.y); // Calculate rectangle height
                    const newX = Math.min(startPoint.x, endPoint.x);
                    const newY = Math.min(startPoint.y, endPoint.y);
                    addRectangle({x: newX, y: newY, width, height})
                    setDrawing(false);
                }
                break;
            case userOperations.drawPOI:
                if (!drawing) {
                    // set start point and allow preview
                    setStartPoint({x: x, y: y});
                    setDrawing(true);
                } else {
                    setDrawing(false);

                    previewPOI({
                        x: startPoint.x,
                        y: startPoint.y,
                        uuid: generateUUID(),
                        name: '!!!',
                        facing: facingAdjust(startPoint, endPoint)
                    })
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
                        addPOI({
                            x: startPoint.x,
                            y: startPoint.y,
                            uuid: generateUUID(),
                            name: poiName,
                            facing: facingAdjust(startPoint, endPoint)
                        }); // 添加 POI
                    }, 100); // 设置延迟 100 毫秒
                }

                break;

            case userOperations.addScale:
                if (!drawing) {
                    // set start point and allow preview
                    setStartPoint({x: x, y: y});
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
        setEndPoint({x: x, y: y});
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
            <CanvasPropertySetter displayVertex={displayVertex}
                                  onDisplayVertexChange={setDisplayVertex}
                                  onPoiRadiusChange={setPoiRadius}
                                  poiRadius={poiRadius}/>
        </div>
    );
};

export default Online2DDrawer;
