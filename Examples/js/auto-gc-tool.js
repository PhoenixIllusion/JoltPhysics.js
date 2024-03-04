
let registry = undefined;

let Jolt;
export function registerJolt(jolt) {
  Jolt = jolt; 
}

let timerInterval;
let timerList = [];

function joltDestroy(joltObject) {
  // This should work, but currently assume 'mostly works' assuming there have been no casts.
  // Casts may cause the secondary class owner to free the Mem but this class doesn't know, resulting a a double-free
  if(Jolt.getCache(joltObject.constructor)[Jolt.getPointer(joltObject)]) {
    Jolt.destroy(joltObject);
    console.log("Destroyed ", joltObject);
  } else {
    console.warn("Warning: Object GC'd that may already be freed in Jolt.");
  }
}

if(!window.FinalizationRegistry) {
  console.warn("Browser does not support finalization registry. Pointers may not be automatically destroyed.");
  if(window.WeakRef) {
    console.warn("Falling back to WeakRef and Timer");
    timerInterval = window.setInterval(() => {
      // Reverse traversal of list for save removal of items in list
      for(let i=timerList.length-1; i>=0; --i) {
        const { weakRef, val } = timerList[i];
        if(!weakRef.deref()) {
          joltDestroy(val);
          timerList.splice(i,1);
          console.log("Destroyed via timer", val);
        }
      }
      //Arbitrary 5 second check for GC phase
    }, 5000)
  }
} else {
  registry = new window.FinalizationRegistry((joltObject) => {
    joltDestroy(joltObject);
    console.log("Destroyed via Finalization Registry");
  });
}

function AutoRef(object) {
  if(Jolt) {
    if(registry || timerInterval) {
      //Transparent proxy so that we pointers to inner Jolt item do not hard-ref this GC'able item
      const gcItem = new Proxy(object, {});
      if(registry) {
        registry.register(gcItem, object);
      } else if(timerInterval) {
        // Mirror pattern of Registery
        timerList.push({weakRef: new WeakRef(gcItem), val: object})
      }
      return gcItem;
    } else {
      // Possibly just return the object as-is, but then they will leak memory (possibly horribly)
      throw new Error("Automatic GC requires browser support for WeakRef or FinalizationRegistry");
    }
  } else {
    throw new Error("You must register Jolt with this import using 'registerJolt' to allow for access to Jolt.destroy")
  }
}

AutoRef.Vec3 = function (x, y, z) {
  return AutoRef(new Jolt.Vec3(x, y, z));
}
AutoRef.RVec3 = function (x, y, z) {
  return AutoRef(new Jolt.RVec3(x, y, z));
}
AutoRef.Quat = function (x, y, z, w) {
  return AutoRef(new Jolt.Quat(x, y, z, w));
}

export { AutoRef }