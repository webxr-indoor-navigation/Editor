import React from 'react';

interface CanvasPropertySetterProps {
    displayVertex: boolean;
    poiRadius: number;
    onDisplayVertexChange: (value: boolean) => void;
    onPoiRadiusChange: (value: number) => void;
}

const CanvasPropertySetter: React.FC<CanvasPropertySetterProps> = ({ displayVertex, poiRadius, onDisplayVertexChange, onPoiRadiusChange }) => {
    const handleBooleanChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onDisplayVertexChange(event.target.checked);
    };

    const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(event.target.value);
        onPoiRadiusChange(value);
    };

    return (
        <div style={{textAlign: 'right'}}>
            <label>Display vertex coordinates for rectangles &nbsp;</label>
            <input
                type="checkbox"
                checked={displayVertex}
                onChange={handleBooleanChange}
            />
            <br/>
            <label>POI radius: {poiRadius}</label>
            <input
                type="range"
                min={10}
                max={100}
                value={poiRadius}
                onChange={handleNumberChange}
            />
        </div>
    );
};

export default CanvasPropertySetter;
