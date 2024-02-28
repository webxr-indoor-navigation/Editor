import './App.css';
import Online2DDrawer from "./Online2DDrawer";
import 'bootstrap/dist/css/bootstrap.min.css';
import React from "react";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

function App() {

    function Editor() {
        return (
            <div className="App">
                <Online2DDrawer/>
            </div>
        );
    }

    function Manual() {
        return (
            <></>
        );
    }

    function About() {
        return (
            <div>
                <h2>Final Year Project at the University of Liverpool</h2>
                <p>Indoor Navigation System using webXR API</p>
            </div>
        );
    }


    return (
        <Tabs
            defaultActiveKey="Editor"
            className="mb-3"
        >
            <Tab eventKey="Editor" title="Editor">
                <Editor></Editor>
            </Tab>
            <Tab eventKey="Manual" title="Manual" disabled>
                <Manual></Manual>
            </Tab>
            <Tab eventKey="About" title="About" disabled>
                <About></About>
            </Tab>
        </Tabs>
    );
}

export default App;
