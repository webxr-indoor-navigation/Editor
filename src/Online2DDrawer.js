import React, {useState, useRef, useEffect} from 'react';
import ThumbnailCanvas from "./ThumbnailCanvas";

const Online2DDrawer = () => {
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [rectangles, setRectangles] = useState([]);
    const [drawing, setDrawing] = useState(false); // Whether drawing rectangle
    const [startPoint, setStartPoint] = useState({x: 0, y: 0}); // Starting point coordinates
    const [endPoint, setEndPoint] = useState({x: 0, y: 0}); // Diagonal point coordinates
    const [canvasWidth, setCanvasWidth] = useState(1600); // Canvas width
    const [canvasHeight, setCanvasHeight] = useState(1200); // Canvas height
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

    const handleCanvasClick = (event) => {
        const rect = mainCanvasRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (!drawing) {
            // Set start point and begin drawing
            setStartPoint({x, y});
            setEndPoint({x, y});
            setDrawing(true);
            setSelectedRectangleIndex(-1);
        } else {
            // Finish drawing
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
        <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <input type="file" onChange={handleImageUpload} style={{marginBottom: '10px'}}/>
            <div style={{position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                <div style={{
                    marginRight: '60px', // Add margin-right to create space between canvases
                    marginBottom: '10px',
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
                <ThumbnailCanvas width={canvasWidth} height={canvasHeight} rectangles={rectangles}/>
            </div>
        </div>
    );
};

export default Online2DDrawer;
