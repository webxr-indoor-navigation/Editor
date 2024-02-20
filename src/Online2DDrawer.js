import React, {useState, useRef, useEffect} from 'react';
import ThumbnailCanvas from "./ThumbnailCanvas";

const Online2DDrawer = () => {
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [rectangles, setRectangles] = useState([]);
    const [drawing, setDrawing] = useState(false); // Whether drawing rectangle
    const [startPoint, setStartPoint] = useState({x: 0, y: 0}); // Starting point coordinates
    const [endPoint, setEndPoint] = useState({x: 0, y: 0}); // Diagonal point coordinates
    const [canvasWidth, setCanvasWidth] = useState(800); // Canvas width
    const [canvasHeight, setCanvasHeight] = useState(600); // Canvas height
    const [selectedRectangleIndex, setSelectedRectangleIndex] = useState(-1); // Index of selected rectangle

    const mainCanvasRef = useRef(null);
    const backgroundCanvasRef = useRef(null); // Ref for background image canvas

    useEffect(() => {
        const bgCanvas = backgroundCanvasRef.current;
        const bg_ctx = bgCanvas.getContext('2d');

        const drawCanvas = () => {
            bg_ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            // Draw background image
            if (backgroundImage) {
                console.log("draw backgroundImage");
                const image = new Image();
                image.onload = () => {
                    bg_ctx.drawImage(image, 0, 0, bgCanvas.width, bgCanvas.height);
                };
                image.src = backgroundImage;
            }
        };

        drawCanvas();

    }, [backgroundImage])

    useEffect(() => {
        const mainCanvas = mainCanvasRef.current;
        const main_ctx = mainCanvas.getContext('2d');

        const drawCanvas = () => {
            main_ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
            // If there is no background image, only draw rectangles
            main_ctx.strokeStyle = 'red';
            main_ctx.lineWidth = 2;
            rectangles.forEach((rect, index) => {
                if (index !== selectedRectangleIndex) {
                    main_ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
                }
            });

            // Draw temporary rectangle (from start point to current mouse position)
            if (drawing) {
                main_ctx.strokeRect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
            }
        };

        drawCanvas();
    }, [rectangles, drawing, startPoint, endPoint, canvasWidth, canvasHeight, selectedRectangleIndex]);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            setBackgroundImage(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleCanvasMouseDown = (event) => {
        if (event.button !== 0) { // If not left mouse button, do nothing
            return;
        }

        const rect = mainCanvasRef.current.getBoundingClientRect();
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
        if (event.button !== 0) { // If not left mouse button, do nothing
            return;
        }

        const rect = mainCanvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setEndPoint({x, y});
        setDrawing(false);

        if (selectedRectangleIndex !== -1) {
            // Update the selected rectangle's position and size
            const newRectangles = rectangles.map((rect, index) => {
                if (index === selectedRectangleIndex) {
                    const width = Math.abs(endPoint.x - startPoint.x); // Calculate rectangle width
                    const height = Math.abs(endPoint.y - startPoint.y); // Calculate rectangle height
                    const newX = Math.min(startPoint.x, endPoint.x);
                    const newY = Math.min(startPoint.y, endPoint.y);
                    return {x: newX, y: newY, width, height};
                }
                return rect;
            });
            setRectangles(newRectangles);
        } else {
            const width = Math.abs(endPoint.x - startPoint.x); // Calculate rectangle width
            const height = Math.abs(endPoint.y - startPoint.y); // Calculate rectangle height
            const newX = Math.min(startPoint.x, endPoint.x);
            const newY = Math.min(startPoint.y, endPoint.y);
            setRectangles(prevRectangles => [...prevRectangles, {x: newX, y: newY, width, height}]);
        }
    };

    const handleCanvasMouseMove = (event) => {
        if (drawing && selectedRectangleIndex === -1) {
            const rect = mainCanvasRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setEndPoint({x, y});
        }
    };


    return (
        <div style={{position: 'relative'}}>
            <input type="file" onChange={handleImageUpload}/>
            <canvas
                ref={backgroundCanvasRef} // Use ref for background canvas
                width={canvasWidth}
                height={canvasHeight}
                style={{ position: 'absolute', top: 100, left: 200, zIndex: 0, border: '1px solid black' }}
            ></canvas>
            <canvas
                ref={mainCanvasRef}
                width={canvasWidth}
                height={canvasHeight}
                onMouseDown={handleCanvasMouseDown}
                onMouseUp={handleCanvasMouseUp}
                onMouseMove={handleCanvasMouseMove}
                onContextMenu={(event) => {
                    event.preventDefault();
                }}
                style={{ position: 'absolute', top: 100, left: 200, zIndex: 1, border: '1px solid black' }}
            ></canvas>
            <div style={{position: 'absolute', bottom: '10px', right: '10px'}}>
                <ThumbnailCanvas width={canvasWidth} height={canvasHeight} rectangles={rectangles}/>
            </div>
        </div>
    );
};

export default Online2DDrawer;
