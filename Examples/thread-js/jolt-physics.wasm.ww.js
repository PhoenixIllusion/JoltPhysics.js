// N.B. The contents of this file are duplicated in src/library_wasm_worker.js
// in variable "_wasmWorkerBlobUrl" (where the contents are pre-minified) If
// doing any changes to this file, be sure to update the contents there too.
import initJolt from './jolt-physics.wasm.js';

let Jolt;
let JoltInterface;
let done = true;
onmessage = async function(d) {
    d = d.data;
    if(d['ThreadPool'] && d['ThreadPoolIndex']) {
        const threadPool = Jolt.wrapPointer(d['ThreadPool'], Jolt.WebJobSystemThreadPool);
				postMessage('loaded');
        threadPool.ThreadMain(d['ThreadPoolIndex']);
    }
    if(d['JoltInterface']) {
        JoltInterface = Jolt.wrapPointer(d['JoltInterface'], Jolt.JoltInterface);
				postMessage('loaded');
    }
    if(d['Step'] && done) {
        done = false;
        JoltInterface.Step(1/60, 1);
        done = true;
    }
    if(d['wasm']) {
        d['instantiateWasm'] = (info, receiveInstance) => {
            var instance = new WebAssembly.Instance(d['wasm'], info);
            receiveInstance(instance, d['wasm']);
            return instance.exports;
        }
				initJolt(d);
        Jolt = d;
        // Drop now unneeded references to from the Module object in this Worker,
        // these are not needed anymore.
        d.wasm = d.mem = d.js = 0;
				postMessage('init');
    }
}