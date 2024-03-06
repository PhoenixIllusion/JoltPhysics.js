import initJolt from '../jolt-physics.wasm-compat.js';

class VehicleConstraintCallbacks {
  constructor(jolt) {
    this.Jolt = jolt;
    this.wireCallbacks(this);
  }

  wireCallbacks(target) {
    target.GetCombinedFriction = this.getCombinedFriction.bind(this);
    target.OnPreStepCallback = this.onPreStepCallback.bind(this);
    target.OnPostCollideCallback = this.onPostCollideCallback.bind(this);
    target.OnPostStepCallback = this.onPostStepCallback.bind(this);
  }

  getCombinedFriction = (wheelIndex, tireFrictionDirection, tireFriction, body2, subShapeID2) => {
    body2 = this.Jolt.wrapPointer(body2, this.Jolt.Body);
    return Math.sqrt(tireFriction * body2.GetFriction()); // This is the default calculation
  };
  onPreStepCallback = (vehicle, deltaTime, physicsSystem) => { };
  onPostCollideCallback = (vehicle, deltaTime, physicsSystem) => { };
  onPostStepCallback = (vehicle, deltaTime, physicsSystem) => { };

  setJoltProxy() {
    this.Jolt.setClassProxy(this.Jolt.VehicleConstraintCallbacksJS, new Proxy({}, { get: () => this}));
  }
};

export default async (module) => {
  const Jolt = await initJolt(module);

  const contactListener = new VehicleConstraintCallbacks(Jolt);
  contactListener.setJoltProxy();

  return Jolt
}