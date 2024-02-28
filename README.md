# Indoor Navigation Editor

Welcome to the Indoor Navigation Editor, a web-based tool designed to manually extract key information from floor maps for use with NavMesh way-finding algorithms.

---


## Demo
[Demo](https://webxr-indoor-navigation.github.io/Editor/)

---


## Repo
[GitHub](https://github.com/webxr-indoor-navigation/Editor)

---


## Step 0: Upload Floor Map

A demo floor map is already preloaded for your convenience. 
However, you have the option to replace it by uploading your own floor map. 

Please ensure that you maintain the width and height ratio of your floor map when capturing.

---
## Step 1: Define Walkable Area

![step1](https://raw.githubusercontent.com/webxr-indoor-navigation/Editor/main/mics/step1-draw-walkable-area-ezgif.com-video-to-gif-converter.gif)

To define the walkable areas on the map, follow these steps:
1. Select "User Operation" > "Draw Corridor (Walkable Area)".
2. Currently, the tool supports defining rectangles by specifying their diagonals.
3. You can overlap rectangles as needed. All rectangles will be combined to generate a single polygon representing the walkable area.

---

## Step 2: Define Points of Interest (POIs)

![step2](https://raw.githubusercontent.com/webxr-indoor-navigation/Editor/main/mics/step2-add-POIs-ezgif.com-video-to-gif-converter.gif)

To define Points of Interest (POIs) on the map, follow these steps:
1. Select "User Operation" > "Add POI (Destination)".
2. Click on the map to define the location of the POI.
3. Move the mouse to indicate the direction the POI faces.
   - QR codes will be associated with the POIs, and this direction represents their orientation.

---


## Step 3: Define Scale

![step3](https://raw.githubusercontent.com/webxr-indoor-navigation/Editor/main/mics/step3-add-scale-ezgif.com-video-to-gif-converter.gif)


To establish the scale of the map, follow these steps:
1. Select "User Operation" > "Add Scale".
2. Click on the map to define the start and end points of a known distance in reality.
3. Enter the real distance corresponding to the selected points.
4. The scale ratio will be displayed in the right window, indicating the relationship between meters and pixels on the map.

---


## Export

1. All exportation will be scaled in meter.

---


## Shortcuts

1. Undo: `Metakey` + `Z`
2. Redo: `Metakey` + `Shift` + `Z`
3. Quit current user operation: `Esc`
