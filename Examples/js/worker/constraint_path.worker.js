import initJolt from '../jolt-physics.wasm-compat.js';


const LENGTH = 100;

class PathConstraintPath {
  constructor(jolt) {
    this.Jolt = jolt;
    this.radius = 2;
    this.wireCallbacks(this);
  }

  wireCallbacks(target) {
    target.GetPointOnPath = this.getPointOnPath.bind(this);
    target.GetPathMaxFraction = this.getPathMaxFraction.bind(this);
    target.GetClosestPoint = this.getClosestPoint.bind(this);
  }

  getPointOnPath(inFraction, outPathPositionPtr, outPathTangentPtr, outPathNormalPtr, outPathBinormalPtr) {
    const outPathPosition = this.Jolt.wrapPointer(outPathPositionPtr, this.Jolt.Vec3);
    const outPathTangent = this.Jolt.wrapPointer(outPathTangentPtr, this.Jolt.Vec3);
    const outPathNormal = this.Jolt.wrapPointer(outPathNormalPtr, this.Jolt.Vec3);
    const outPathBinormal = this.Jolt.wrapPointer(outPathBinormalPtr, this.Jolt.Vec3);

    inFraction *= (2 * Math.PI) / LENGTH;
    const z = Math.sin(inFraction);
    const x = Math.cos(inFraction);

    outPathPosition.Set(x*2,0,z*2);
    outPathTangent.Set(-z,0, x);
    outPathNormal.Set(0,1,0);
    outPathBinormal.Set(-x,0,-z);
  }

  getClosestPoint(vecPtr, fractionHint) {
    const jVec3 = this.Jolt.wrapPointer(vecPtr, this.Jolt.Vec3);
    const frac = (Math.atan2(jVec3.GetZ(), jVec3.GetX()) + 2 * Math.PI) % (2 * Math.PI);
    return LENGTH * frac / (2 * Math.PI);
  }

  getPathMaxFraction(){
    return LENGTH;
  }

  setJoltProxy() {
    this.Jolt.setClassProxy(this.Jolt.PathConstraintPathJS, new Proxy({}, { get: () => this}));
  }
};

export { PathConstraintPath };

export default async (module) => {
  const Jolt = await initJolt(module);

  const contactListener = new PathConstraintPath(Jolt);
  contactListener.setJoltProxy();

  return Jolt
}