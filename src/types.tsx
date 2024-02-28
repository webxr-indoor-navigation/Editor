export interface POI {
    x: number;
    y: number;
    uuid: string;
    name: string;
    facing: Point;
}

export interface Point{
    x: number;
    y: number;
}

export interface History {
    type: String;
    args: any;
}


export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Scale {
    startPoint: Point;
    endPoint: Point;
    distanceInRealWorld: number;
}
