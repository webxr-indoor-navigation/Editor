import React from 'react';
import {Vector2, Shape, ExtrudeGeometry, MeshBasicMaterial, Mesh} from 'three';
import {OBJExporter} from "three/examples/jsm/exporters/OBJExporter";


interface ExtrudedPolygonExporterParams {
    jsonData: [[{ X: number, Y: number }]] | undefined;
}

const ExtrudedPolygonExporter = (props: ExtrudedPolygonExporterParams) => {
    // todo: currently, it is limited to output only one obj file...
    const exportOBJ = () => {
        if (props.jsonData == null) return;
        const vertices = props.jsonData[0].map(point => new Vector2(point.X, point.Y));
        console.log(vertices);

        const starShape = new Shape(vertices);

        const extrusionSettings = {
            steps: 1,
            depth: 20,
            bevelEnabled: false,
        };

        const extrudeGeometry = new ExtrudeGeometry(starShape, extrusionSettings);
        // 将几何体沿着z轴旋转90度
        extrudeGeometry.rotateX(Math.PI / 2);
        const material = new MeshBasicMaterial({color: 0x00ff00});
        const mesh = new Mesh(extrudeGeometry, material);

        // Instantiate an exporter
        const exporter = new OBJExporter();

        // Parse the input and generate the OBJ output
        const data = exporter.parse(mesh);
        // 创建一个Blob对象并下载
        const blob = new Blob([data], {type: 'text/plain'});
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'extruded_polygon.obj';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    };

    return (
        <div>
            <button onClick={exportOBJ}>Export OBJ - corridor</button>
        </div>
    );
};

export default ExtrudedPolygonExporter;
