import './App.css';
import Online2DDrawer from "./Online2DDrawer";
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
} from "react-router-dom";
import {Container} from "react-bootstrap";

function App() {

    function Home() {
        return (
            <div className="App">
                <Online2DDrawer/>
            </div>
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

    function NotFound() {
        return (
            <div>
                <h2>404 Not Found</h2>
                <p>Sorry, the page you are looking for does not exist.</p>
            </div>
        );
    }

    return (
        <Router>
            <Navbar expand="lg" className="bg-body-tertiary">
                <Container>
                    <Navbar.Brand href="Home">Indoor Navigation Editor</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link href="About">About</Nav.Link>
                            <Nav.Link href="https://github.com/webxr-indoor-navigation/Editor">GitHub</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>


            <Routes>
                <Route index element={<Home/>}/>
                <Route path="/About" element={<About/>}/>
                <Route path="/Home" element={<Home/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </Router>
    );
}

export default App;
