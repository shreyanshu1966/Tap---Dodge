declare module 'matter-js' {
  // Basic types
  export interface Vector {
    x: number;
    y: number;
  }

  export interface Bounds {
    min: Vector;
    max: Vector;
  }

  // Body related interfaces
  export interface Body {
    id: number;
    position: Vector;
    velocity: Vector;
    angle: number;
    angularVelocity: number;
    bounds: Bounds;
    label: string;
    isStatic: boolean;
    mass: number;
    inertia: number;
    density: number;
    friction: number;
    frictionStatic: number;
    frictionAir: number;
    restitution: number;
    sleepThreshold: number;
    render: {
      fillStyle?: string;
      strokeStyle?: string;
      lineWidth?: number;
      visible?: boolean;
      sprite?: {
        texture: string;
        xScale: number;
        yScale: number;
      };
    };
    timeScale?: number;
    collisionFilter: {
      category: number;
      mask: number;
      group: number;
    };
    parts?: Body[];
    parent?: Body;
    vertices: Vector[];
    chamfer?: {
      radius: number;
    };
  }

  export interface BodyOptions {
    isStatic?: boolean;
    restitution?: number;
    friction?: number;
    frictionStatic?: number;
    frictionAir?: number;
    density?: number;
    label?: string;
    sleepThreshold?: number;
    timeScale?: number;
    angle?: number;
    angularSpeed?: number;
    mass?: number;
    inertia?: number;
    collisionFilter?: {
      category: number;
      mask: number;
      group?: number;
    };
    chamfer?: { radius: number } | { radius: number[] } | { radius: number; quality: number };
    vertices?: Vector[];
    parts?: Body[];
    plugin?: any;
    render?: {
      visible?: boolean;
      opacity?: number;
      sprite?: {
        texture: string;
        xScale: number;
        yScale: number;
        yOffset?: number;
      };
      fillStyle?: string;
      strokeStyle?: string;
      lineWidth?: number;
    };
  }

  // Events
  export interface IEventCollision<T = {}> {
    name: string;
    source: any;
    pairs: CollisionPair[];
  }

  export interface CollisionPair {
    id: string;
    bodyA: Body;
    bodyB: Body;
    collision: {
      depth: number;
      tangent: Vector;
      normal: Vector;
      supports: Vector[];
      parentA: Body;
      parentB: Body;
    };
    activeContacts: Contact[];
    separation: number;
    isActive: boolean;
    timeCreated: number;
    timeUpdated: number;
    inverseMass: number;
    friction: number;
    frictionStatic: number;
    restitution: number;
    slop: number;
  }

  export interface Contact {
    vertex: Vector;
    normalImpulse: number;
    tangentImpulse: number;
  }

  export interface MouseConstraintOptions {
    mouse: Mouse;
    constraint: {
      stiffness: number;
      render: {
        visible: boolean;
      };
    };
  }

  export interface Mouse {
    element: HTMLElement;
    absolute: Vector;
    position: Vector;
    mousedownPosition: Vector;
    mouseupPosition: Vector;
    offset: Vector;
    scale: Vector;
    wheelDelta: number;
    button: number;
    pixelRatio: number;
  }

  // Engine interface
  export interface IEngine {
    world: IWorld;
    timing: {
      timestamp: number;
      timeScale: number;
    };
    broadphase: any;
    detector: any;
    pairs: any;
    resolver: any;
    runner: any;
    constraintIterations: number;
    positionIterations: number;
    velocityIterations: number;
    enableSleeping: boolean;
    events: any[];
    plugin: any;
    gravity: {
      x: number;
      y: number;
      scale: number;
    };
  }

  export interface IWorld {
    bodies: Body[];
    composites: any[];
    constraints: any[];
    gravity: {
      x: number;
      y: number;
      scale: number;
    };
    bounds: Bounds;
  }

  // Define namespaces
  export namespace Body {
    function create(options: any): Body;
    function nextGroup(isNonColliding?: boolean): number;
    function nextCategory(): number;
    function setStatic(body: Body, isStatic: boolean): void;
    function setDensity(body: Body, density: number): void;
    function setMass(body: Body, mass: number): void;
    function setPosition(body: Body, position: Vector): void;
    function setVelocity(body: Body, velocity: Vector): void;
    function setAngle(body: Body, angle: number): void;
    function setAngularVelocity(body: Body, velocity: number): void;
    function applyForce(body: Body, position: Vector, force: Vector): void;
    function translate(body: Body, translation: Vector): void;
    function rotate(body: Body, rotation: number, point?: Vector): void;
    function scale(body: Body, scaleX: number, scaleY: number, point?: Vector): void;
  }

  export namespace Bodies {
    function rectangle(x: number, y: number, width: number, height: number, options?: BodyOptions): Body;
    function circle(x: number, y: number, radius: number, options?: BodyOptions): Body;
    function polygon(x: number, y: number, sides: number, radius: number, options?: BodyOptions): Body;
    function fromVertices(x: number, y: number, vertexSets: Vector[][] | Vector[], options?: BodyOptions): Body;
    function trapezoid(x: number, y: number, width: number, height: number, slope: number, options?: BodyOptions): Body;
  }

  export namespace Composite {
    function create(options?: any): any;
    function add(composite: any, body: Body | Body[]): any;
    function remove(composite: any, body: Body | Body[], deep?: boolean): any;
    function clear(composite: any, keepStatic?: boolean, deep?: boolean): void;
    function allBodies(composite: any): Body[];
    function allConstraints(composite: any): any[];
    function allComposites(composite: any): any[];
    function get(composite: any, id: number, type: string): any;
    function rebase(composite: any): void;
    function translate(composite: any, translation: Vector, recursive?: boolean): void;
    function rotate(composite: any, rotation: number, point: Vector, recursive?: boolean): void;
    function scale(composite: any, scaleX: number, scaleY: number, point: Vector, recursive?: boolean): void;
  }

  export namespace Engine {
    function create(options?: any): IEngine;
    function update(engine: IEngine, delta?: number, correction?: number): void;
    function clear(engine: IEngine): void;
    function merge(engineA: IEngine, engineB: IEngine): void;
  }

  export namespace World {
    function add(world: IWorld, body: Body | Body[] | any): any;
    function remove(world: IWorld, body: Body | Body[] | any, deep?: boolean): any;
    function clear(world: IWorld, keepStatic?: boolean, deep?: boolean): void;
    const composite: any;  // Fixed: Changed 'function composite: any' to 'const composite: any'
  }

  export namespace Events {
    function on(object: any, eventNames: string, callback: (event: any) => void): void;
    function off(object: any, eventNames: string, callback: (event: any) => void): void;
    function trigger(object: any, eventNames: string, event?: any): void;
  }

  export namespace Mouse {
    function create(element: HTMLElement): Mouse;
    function setElement(mouse: Mouse, element: HTMLElement): void;
    function setOffset(mouse: Mouse, offset: Vector): void;
    function setScale(mouse: Mouse, scale: Vector): void;
  }

  export namespace MouseConstraint {
    function create(engine: IEngine, options: MouseConstraintOptions): any;
  }

  export namespace Detector {
    function collisions(pairs: any, detector: any): any;
  }

  export namespace Common {
    function isElement(obj: any): boolean;
    function extend(obj: any, deep?: boolean, ...sources: any[]): any;
    function clone(obj: any, deep?: boolean): any;
  }
}