import React, { useState, useRef, useEffect } from 'react';
import ThumbnailCanvas from "./ThumbnailCanvas";

// todo: rescale the input background image

const Online2DDrawer = () => {
	// State variables initialization
	const [backgroundImage, setBackgroundImage] = useState(null);
	const [rectangles, setRectangles] = useState([]);
	const [circles, setCircles] = useState([]);
	const [drawing, setDrawing] = useState(false); // Whether drawing rectangle or circle
	const [userOperation, setUserOperation] = useState('drawCorridor'); // Type of shape to draw
	const [startPoint, setStartPoint] = useState({ x: 0, y: 0 }); // Starting point coordinates
	const [endPoint, setEndPoint] = useState({ x: 0, y: 0 }); // Diagonal point coordinates
	const [canvasWidth, setCanvasWidth] = useState(800); // Canvas width
	const [canvasHeight, setCanvasHeight] = useState(600); // Canvas height
	const [selectedShapeIndex, setSelectedShapeIndex] = useState(-1); // Index of selected shape

	// References for canvas elements
	const mainCanvasRef = useRef(null);
	const backgroundCanvasRef = useRef(null); // Ref for background image canvas

	// Effect to draw background image when it changes
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
					bg_ctx.drawImage(image, 0, 0, bgCanvas.width-5, bgCanvas.height-5);
				};
				image.src = backgroundImage;
			}
		};

		drawCanvas();

	}, [backgroundImage])

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
				if (index !== selectedShapeIndex) {
					main_ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
					// Draw vertex coordinates
					main_ctx.fillStyle = 'blue';
					main_ctx.font = '12px Arial';
					main_ctx.fillText(`(${Math.round(rect.x)}, ${Math.round(rect.y)})`, Math.round(rect.x) - 30, Math.round(rect.y) - 10);
					main_ctx.fillText(`(${Math.round(rect.x + rect.width)}, ${Math.round(rect.y)})`, Math.round(rect.x + rect.width), Math.round(rect.y) - 10);
					main_ctx.fillText(`(${Math.round(rect.x + rect.width)}, ${Math.round(rect.y + rect.height)})`, Math.round(rect.x + rect.width), Math.round(rect.y + rect.height) + 15);
					main_ctx.fillText(`(${Math.round(rect.x)}, ${Math.round(rect.y + rect.height)})`, Math.round(rect.x) - 30, Math.round(rect.y + rect.height) + 15);

				}
			});

			circles.forEach((circle, index) => {
				if (index !== selectedShapeIndex) {
					main_ctx.beginPath();
					main_ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
					main_ctx.stroke();
					main_ctx.closePath();
				}
			});

			// Draw temporary shape (from start point to current mouse position)
			if (drawing) {
				if (userOperation === 'drawCorridor') {
					main_ctx.strokeRect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
				} else if (userOperation === 'drawPOI') {
					const radius = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
					main_ctx.beginPath();
					main_ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
					main_ctx.stroke();
					main_ctx.closePath();
				}
			}
		};

		drawCanvas();
	}, [rectangles, circles, drawing, startPoint, endPoint, userOperation, canvasWidth, canvasHeight, selectedShapeIndex]);

	// Function to handle image upload
	const handleImageUpload = (event) => {
		const file = event.target.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			setBackgroundImage(e.target.result);
		};
		reader.readAsDataURL(file);
	};

	// Effect to draw initial background image
	useEffect(() => {
		const bgCanvas = backgroundCanvasRef.current;
		const bg_ctx = bgCanvas.getContext('2d');

		bg_ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
		// Draw background image
		console.log("init");
		const image = new Image();
		image.onload = () => {
			bg_ctx.drawImage(image, 0, 0,bgCanvas.width, bgCanvas.height);
		};
		image.src = process.env.PUBLIC_URL + "/rescaledFloorMap.jpg";

	}, []);


	// Function to handle canvas click event
	const handleCanvasClick = (event) => {
		const rect = mainCanvasRef.current.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		if (!drawing) {
			// Set start point and begin drawing
			setStartPoint({ x, y });
			setEndPoint({ x, y });
			setDrawing(true);
			setSelectedShapeIndex(-1);
		} else {
			// Finish drawing
			setEndPoint({ x, y });
			setDrawing(false);

			if (selectedShapeIndex !== -1) {
				// Update the selected shape's position and size
				if (userOperation === 'drawCorridor') {
					const newRectangles = rectangles.map((rect, index) => {
						if (index === selectedShapeIndex) {
							const width = Math.abs(endPoint.x - startPoint.x); // Calculate rectangle width
							const height = Math.abs(endPoint.y - startPoint.y); // Calculate rectangle height
							const newX = Math.min(startPoint.x, endPoint.x);
							const newY = Math.min(startPoint.y, endPoint.y);
							return { x: newX, y: newY, width, height };
						}
						return rect;
					});
					setRectangles(newRectangles);
				} else if (userOperation === 'drawPOI') {
					const radius = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
					const newCircles = circles.map((circle, index) => {
						if (index === selectedShapeIndex) {
							return { x: startPoint.x, y: startPoint.y, radius };
						}
						return circle;
					});
					setCircles(newCircles);
				}
			} else {
				if (userOperation === 'drawCorridor') {
					const width = Math.abs(endPoint.x - startPoint.x); // Calculate rectangle width
					const height = Math.abs(endPoint.y - startPoint.y); // Calculate rectangle height
					const newX = Math.min(startPoint.x, endPoint.x);
					const newY = Math.min(startPoint.y, endPoint.y);
					setRectangles(prevRectangles => [...prevRectangles, { x: newX, y: newY, width, height }]);
				} else if (userOperation === 'drawPOI') {
					const radius = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
					setCircles(prevCircles => [...prevCircles, { x: startPoint.x, y: startPoint.y, radius }]);
				}
			}
		}
	};

	// Function to handle canvas mouse move event
	const handleCanvasMouseMove = (event) => {
		if (drawing && selectedShapeIndex === -1) {
			const rect = mainCanvasRef.current.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			setEndPoint({ x, y });
		}
	};

	// Function to handle key press event
	const handleKeyPress = (event) => {
		console.log("ESC input");

		if (event.key === 'Escape') {
			setDrawing(false);
		}
	};

	// Function to handle shape type change
	const handleShapeTypeChange = (event) => {
		setUserOperation(event.target.value);
	};

	// Render JSX
	return (
		<div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<input type="file" onChange={handleImageUpload} style={{ marginBottom: '10px' }} />
			<div style={{ position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
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
						style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
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
						style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
					></canvas>
				</div>
				<ThumbnailCanvas width={canvasWidth} height={canvasHeight} rectangles={rectangles} />
			</div>
			<div>
				<label htmlFor="shapeType">Shape Type:</label>
				<select id="shapeType" value={userOperation} onChange={handleShapeTypeChange}>
					<option value="drawCorridor">draw corridor (walkable area)</option>
					<option value="drawPOI">add POI (destination)</option>
				</select>
			</div>
		</div>
	);
};

export default Online2DDrawer;
