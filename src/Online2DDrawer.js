import React, {useState, useRef, useEffect} from 'react';
import ThumbnailCanvas from "./ThumbnailCanvas";
import {v4 as uuid} from 'uuid';

// todo: rescale the input background image
const generateUUID = () => {
    return uuid();
};

const Online2DDrawer = () => {
    // State variables initialization
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [rectangles, setRectangles] = useState([]);
    const [POIs, setPOIs] = useState([]);
    const [drawing, setDrawing] = useState(false); // Whether drawing rectangle or circle
    const [userOperation, setUserOperation] = useState('drawCorridor'); // Type of shape to draw
    const [startPoint, setStartPoint] = useState({x: 0, y: 0}); // Starting point coordinates
    const [endPoint, setEndPoint] = useState({x: 0, y: 0}); // Diagonal point coordinates
    const [canvasWidth, setCanvasWidth] = useState(800); // Canvas width
    const [canvasHeight, setCanvasHeight] = useState(600); // Canvas height
    const [history, setHistory] = useState([]); // 用于存储操作历史记录的数组
    const [redoHistory, setRedoHistory] = useState([]); // 用于存储撤销的操作历史记录的数组

    // References for canvas elements
    const mainCanvasRef = useRef(null);
    const backgroundCanvasRef = useRef(null); // Ref for background image canvas

    // 添加一个新的矩形到画布上，并记录操作历史
    const addRectangle = (newRectangle) => {
        setRectangles(prevRectangles => [...prevRectangles, newRectangle]);
        setHistory(prevHistory => [...prevHistory, {'type': 'addRectangle', 'args': newRectangle}]); // 记录操作历史
    };
    const addPOI = (newPOI) => {
        setPOIs(prevPOIs => [...prevPOIs, newPOI]);
        setHistory(prevHistory => [...prevHistory, {'type': 'addPOI', 'args': newPOI}]); // 记录操作历史
    };
    const previewPOI = (newPOI) => {
        setPOIs(prevPOIs => [...prevPOIs, newPOI]);
    };

    // 撤销最后一个操作
    const undo = () => {
        if (history.length > 0) {
            console.log("history length: " + history.length);

            const lastOperation = history[history.length - 1];
            const lastOperationType = lastOperation['type'];

            switch (lastOperationType) {
                case 'addRectangle':
                    setRectangles(prevRectangles => prevRectangles.slice(0, -1)); // 移除最后一个矩形
                    break;
                case 'addPOI':
                    setPOIs(prevPOIs => prevPOIs.slice(0, -1)); // 移除最后一个矩形
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
        if (redoHistory.length > 0) {
            console.log("redoHistory length: " + redoHistory.length);

            const lastUndoOperation = redoHistory[redoHistory.length - 1];
            const lastUndoOperationType = lastUndoOperation['type'];
            const args = redoHistory[redoHistory.length - 1]['args'];
            switch (lastUndoOperationType) {
                case 'addRectangle':
                    addRectangle(args);
                    break;
                case 'addPOI':
                    addPOI(args);
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
            // If there is no background image, only draw shapes
            main_ctx.strokeStyle = 'red';
            main_ctx.lineWidth = 2;

            rectangles.forEach((rect, index) => {
                main_ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
                // Draw vertex coordinates
                main_ctx.fillStyle = 'blue';
                main_ctx.font = '16px Arial';
                main_ctx.fillText(`(${Math.round(rect.x)}, ${Math.round(rect.y)})`, Math.round(rect.x) - 30, Math.round(rect.y) - 10);
                main_ctx.fillText(`(${Math.round(rect.x + rect.width)}, ${Math.round(rect.y)})`, Math.round(rect.x + rect.width), Math.round(rect.y) - 10);
                main_ctx.fillText(`(${Math.round(rect.x + rect.width)}, ${Math.round(rect.y + rect.height)})`, Math.round(rect.x + rect.width), Math.round(rect.y + rect.height) + 15);
                main_ctx.fillText(`(${Math.round(rect.x)}, ${Math.round(rect.y + rect.height)})`, Math.round(rect.x) - 30, Math.round(rect.y + rect.height) + 15);
            });

            main_ctx.strokeStyle = 'orange';
            main_ctx.lineWidth = 2;
            POIs.forEach((POI, index) => {
                main_ctx.beginPath();
                const radius = 10;
                main_ctx.arc(POI.x, POI.y, radius, 0, 2 * Math.PI);
                main_ctx.stroke();
                main_ctx.closePath();

                // Draw vertex coordinates
                main_ctx.font = '16px Arial';
                main_ctx.fillText("." + POI.name, Math.round(POI.x) - 15, Math.round(POI.y) - 15);
            });

            // for preview purpose: drawing temporary shape (from start point to current mouse position)
            if (drawing) {
                switch (userOperation) {
                    case 'drawCorridor':
                        main_ctx.strokeStyle = 'red';
                        main_ctx.lineWidth = 2;
                        main_ctx.strokeRect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
                        break;
                    default:
                        console.log("unknown user operation");
                        break;
                }
            }
        };

        drawCanvas();
    }, [rectangles, POIs, drawing, startPoint, endPoint, userOperation]);

    // Function to handle image upload
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            setBackgroundImage(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // Function to draw background image
    const drawBackgroundImage = (imageUrl) => {
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
    const handleCanvasClick = (event) => {
        const rect = mainCanvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        switch (userOperation) {
            case 'drawCorridor':
                if (!drawing) {
                    // set start point and allow preview
                    setStartPoint({x, y});
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
            case 'drawPOI':
                previewPOI({x: endPoint.x, y: endPoint.y, uuid: generateUUID(), name: '!!!'})

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
                    addPOI({x: endPoint.x, y: endPoint.y, uuid: generateUUID(), name: poiName}); // 添加 POI
                }, 100); // 设置延迟 100 毫秒
                break;
            default:
                console.log("unknown user operation");
                break;
        }
    }

    // Function to handle canvas mouse move event
    const handleCanvasMouseMove = (event) => {
        const rect = mainCanvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setEndPoint({x, y});
    };

    // Function to handle key press event
    const handleKeyPress = (event) => {
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
    const handleShapeTypeChange = (event) => {
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
                                 POIs={POIs}/>
            </div>
            <div>
                <label htmlFor="shapeType">User Operation:</label>
                <select id="shapeType" value={userOperation} onChange={handleShapeTypeChange}>
                    <option value="drawCorridor">draw corridor (walkable area)</option>
                    <option value="drawPOI">add POI (destination)</option>
                </select>
            </div>
        </div>
    );
};

export default Online2DDrawer;
