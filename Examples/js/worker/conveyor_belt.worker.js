import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.161.0/three.module.js';
import initJolt from '../jolt-physics.wasm-compat.js';

const wrapQuat = (q) => new THREE.Quaternion(q.GetX(), q.GetY(), q.GetZ(), q.GetW());
const wrapVec3 = (v) => new THREE.Vector3(v.GetX(), v.GetY(), v.GetZ());
const DegreesToRadians = (deg) => deg * (Math.PI / 180.0);

export default async (module) => {
  
  const contactListener = {};
  contactListener.OnContactAdded = (body1, body2, manifold, settings) => {
    body1 = Jolt.wrapPointer(body1, Jolt.Body);
    body2 = Jolt.wrapPointer(body2, Jolt.Body);
    manifold = Jolt.wrapPointer(manifold, Jolt.ContactManifold);
    settings = Jolt.wrapPointer(settings, Jolt.ContactSettings);

    const rotation1 = wrapQuat(body1.GetRotation());
    const rotation2 = wrapQuat(body2.GetRotation());

    const body1LinearBelt = body1.GetUserData() == 1;
    const body2LinearBelt =  body2.GetUserData() == 1;
    if (body1LinearBelt || body2LinearBelt) {
      // Determine the world space surface velocity of both bodies
      const cLocalSpaceVelocity = new THREE.Vector3(0, 0, -10.0);
      const body1LinearSurfaceVelocity = body1LinearBelt ? cLocalSpaceVelocity.applyQuaternion(rotation1) : new THREE.Vector3(0, 0, 0);
      const body2LinearSurfaceVelocity = body2LinearBelt ? cLocalSpaceVelocity.applyQuaternion(rotation2) : new THREE.Vector3(0, 0, 0);

      // Calculate the relative surface velocity
      const v = body2LinearSurfaceVelocity.sub(body1LinearSurfaceVelocity);
      settings.mRelativeLinearSurfaceVelocity.Set(v.x, v.y, v.z);
    }

    const body1Angular = body1.GetUserData() == 2;
    const body2Angular =  body2.GetUserData() == 2;

    if (body1Angular || body2Angular) {
      // Determine the world space angular surface velocity of both bodies
      const cLocalSpaceAngularVelocity = new THREE.Vector3(0, DegreesToRadians(10.0), 0);
      const body1AngularSurfaceVelocity = body1Angular ? cLocalSpaceAngularVelocity.applyQuaternion(rotation1) : new THREE.Vector3(0, 0, 0);
      const body2AngularSurfaceVelocity = body2Angular ? cLocalSpaceAngularVelocity.applyQuaternion(rotation2) : new THREE.Vector3(0, 0, 0);

      // Note that the angular velocity is the angular velocity around body 1's center of mass, so we need to add the linear velocity of body 2's center of mass
      const COM1 = wrapVec3(body1.GetCenterOfMassPosition());
      const COM2 = wrapVec3(body2.GetCenterOfMassPosition());
      const body2LinearSurfaceVelocity = body2Angular ?
        body2AngularSurfaceVelocity.cross(COM1.clone().sub(COM2)) : new THREE.Vector3(0, 0, 0);

      // Calculate the relative angular surface velocity
      const rls = body2LinearSurfaceVelocity;
      settings.mRelativeLinearSurfaceVelocity.Set(rls.x, rls.y, rls.z);
      const ras = body2AngularSurfaceVelocity.sub(body1AngularSurfaceVelocity);
      settings.mRelativeAngularSurfaceVelocity.Set(ras.x, ras.y, ras.z);
    }
  };
  contactListener.OnContactPersisted = (body1, body2, manifold, settings) => {
    // Same behavior as contact added
    contactListener.OnContactAdded(body1, body2, manifold, settings);
  };
  contactListener.OnContactRemoved = (subShapePair) => {
    // Required for JSInterface to have this function exist
  };
  contactListener.OnContactValidate = (body1, body2, baseOffset, collideShapeResult) => {
    // Required for JSInterface to have this function exist
    return Jolt.ValidateResult_AcceptAllContactsForThisBodyPair;
  };
  const Jolt = await initJolt(module);

  // Listen to any pointer to give this class
  Jolt.setClassProxy(Jolt.ContactListenerJS, new Proxy({}, {
    get: () => contactListener
  })); 

  return Jolt
}
