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
  }

  export interface BodyOptions {
    isStatic?: boolean;
    restitution?: number;
    friction?: number;
    frictionAir?: number;
    label?: string;
    chamfer?: { radius: number };
    collisionFilter?: {
      category: number;
      mask: number;
      group?: number;
    };
    render?: {
      fillStyle?: string;
      strokeStyle?: string;
      lineWidth?: number;
    };
  }

  // Namespace definitions
  export namespace Body {
    function create(options: any): Body;
    function setPosition(body: Body, position: Vector): void;
    function setVelocity(body: Body, velocity: Vector): void;
    function setAngle(body: Body, angle: number): void;
    function setAngularVelocity(body: Body, velocity: number): void;
    function applyForce(body: Body, position: Vector, force: Vector): void;
  }

  export namespace Bodies {
    function rectangle(x: number, y: number, width: number, height: number, options?: BodyOptions): Body;
    function circle(x: number, y: number, radius: number, options?: BodyOptions): Body;
    function polygon(x: number, y: number, sides: number, radius: number, options?: BodyOptions): Body;
  }

  export namespace Composite {
    function add(composite: any, body: Body | Body[]): any;
    function remove(composite: any, body: Body, deep?: boolean): any;
    function clear(composite: any, keepStatic?: boolean): void;
  }

  export namespace Engine {
    function create(options?: any): any;
    function update(engine: any, delta?: number): void;
    function clear(engine: any): void;
  }

  export namespace World {
    function add(world: any, body: Body | Body[]): any;
    function remove(world: any, body: Body, deep?: boolean): any;
    function clear(world: any, keepStatic?: boolean): void;
  }
}