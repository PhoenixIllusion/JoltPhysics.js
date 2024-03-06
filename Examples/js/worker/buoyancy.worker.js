import initJolt from '../jolt-physics.wasm-compat.js';

const BALL = 1;
const MOVING_WATER = 2;
const STANDING_WATER = 3;
export { BALL, MOVING_WATER, STANDING_WATER };

class ContactListener {
  constructor(jolt) {
    this.Jolt = jolt;
    this.wireCallbacks(this);
  }

  wireCallbacks(target) {
    target.OnContactAdded = this.onContactAdded.bind(this);
    target.OnContactValidate = this.onContactValidate.bind(this);
    target.OnContactRemoved = this.onContactRemoved.bind(this);
    target.OnContactPersisted = this.OnContactAdded;
  }

  onContactAdded(body1, body2, manifold, settings) {
    body1 = this.Jolt.wrapPointer(body1, this.Jolt.Body);
    body2 = this.Jolt.wrapPointer(body2, this.Jolt.Body);
    const uData = [body1.GetUserData(), body2.GetUserData()].sort();
    // We cannot modify the velocity of an object in a contact callback, so we store the objects in a list and modify them in the update loop
    if (uData[0] == BALL) {
      const OTHER = uData[1];
      if(OTHER == MOVING_WATER || OTHER == STANDING_WATER) {
        this.Jolt.SharedMemory.prototype.mPointer = OTHER;
      }
    }
  }
  onContactValidate(body1, body2, baseOffset, collideShapeResult) {
    return this.Jolt.ValidateResult_AcceptAllContactsForThisBodyPair;
  }
  onContactRemoved(subShapePair){}

  setJoltProxy() {
    this.Jolt.setClassProxy(this.Jolt.ContactListenerJS, new Proxy({}, { get: () => this}));
  }
};

export { ContactListener };

export default async (module) => {
  const Jolt = await initJolt(module);

  const contactListener = new ContactListener(Jolt);
  contactListener.setJoltProxy();

  return Jolt
}