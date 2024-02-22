export interface POI {
    X: number;
    Y: number;
    uuid: string;
    name: string;
}

export interface Point{
    X: number;
    Y: number;
}

export interface History {
    type: String;
    args: any;
}


export interface Rect {
    X: number;
    Y: number;
    width: number;
    height: number;
}

export interface Scale {
    startPoint: Point;
    endPoint: Point;
    distanceInRealWorld: number;
}
