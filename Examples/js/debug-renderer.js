const unwrapV3 = (ptr) => wrapVec3(Jolt.wrapPointer(ptr, Jolt.RVec3));
const textDecoder = new TextDecoder();
class DebugRenderer {
    lineCache = {};
    lineMesh = {};
    triangleCache = {};
    triangleMesh = {};
    materialCache = {};
    meshList = [];
    geometryList = [];
    geometryCache = [];
    textCache = [];
    textList = [];
    renderer;
    css3dRender;
    constructor(jolt) {
        const renderer = this.renderer = new jolt.DebugRendererJS();
        renderer.DrawLine = this.drawLine.bind(this);
        renderer.DrawTriangle = this.drawTriangle.bind(this);
        renderer.DrawText3D = this.drawText3D.bind(this);
        renderer.DrawGeometryWithID = this.drawGeometryWithID.bind(this);
        renderer.CreateTriangleBatchID = this.createTriangleBatchID.bind(this);
        renderer.CreateTriangleBatchIDWithIndex = this.createTriangleBatchIDWithIndex.bind(this);
    }
    initialized = false;
    Initialize() {
        if (!this.initialized) {
            this.renderer.Initialize();
            this.initialized = true;
        }
    }
    DrawBodies(system, inDrawSettings) {
        this.renderer.DrawBodies(system, inDrawSettings);
    }
    DrawConstraints(system) {
        this.renderer.DrawConstraints(system);
    }
    drawLine(inFrom, inTo, inColor) {
        const colorU32 = Jolt.wrapPointer(inColor, Jolt.Color).mU32 >>> 0;
        const arr = this.lineCache[colorU32] = this.lineCache[colorU32] || [];
        const v0 = unwrapV3(inFrom);
        const v1 = unwrapV3(inTo);
        arr.push(v0, v1);
    }
    drawTriangle(inV1, inV2, inV3, inColor, inCastShadow) {
        const colorU32 = Jolt.wrapPointer(inColor, Jolt.Color).mU32 >>> 0;
        const arr = this.lineCache[colorU32] = this.lineCache[colorU32] || [];
        const v0 = unwrapV3(inV1);
        const v1 = unwrapV3(inV2);
        const v2 = unwrapV3(inV3);
        arr.push(v0, v1);
        arr.push(v1, v2);
        arr.push(v2, v0);
    }
    drawText3D(inPosition, inStringPtr, inStringLen, inColor, inHeight) {
        const color = Jolt.wrapPointer(inColor, Jolt.Color).mU32 >>> 0;
        const position = unwrapV3(inPosition);
        const height = inHeight;
        const text = textDecoder.decode(Jolt.HEAPU8.subarray(inStringPtr, inStringPtr + inStringLen));
        this.textList.push({ color, position, height, text });
    }
    drawGeometryWithID(inModelMatrix, inWorldSpaceBounds, inLODScaleSq, inModelColor, inGeometryID, inCullMode, inCastShadow, inDrawMode) {
        const colorU32 = Jolt.wrapPointer(inModelColor, Jolt.Color).mU32 >>> 0;
        const modelMatrix = Jolt.wrapPointer(inModelMatrix, Jolt.RMat44);
        const v0 = wrapVec3(modelMatrix.GetAxisX());
        const v1 = wrapVec3(modelMatrix.GetAxisY());
        const v2 = wrapVec3(modelMatrix.GetAxisZ());
        const v3 = wrapVec3(modelMatrix.GetTranslation());
        const matrix = new THREE.Matrix4().makeBasis(v0, v1, v2).setPosition(v3);
        this.geometryList.push({ matrix: matrix, geometry: this.geometryCache[inGeometryID], color: colorU32 });
    }
    createTriangleBatchID(inTriangles, inTriangleCount) {
        const batchID = this.geometryCache.length;
        // Get a view on the triangle data (does not make a copy)
        const position = new Float32Array(9 * inTriangleCount);
        const normal = new Float32Array(9 * inTriangleCount);
        const uv = new Float32Array(6 * inTriangleCount);
        let p_idx = 0;
        let n_idx = 0;
        let uv_idx = 0;
        const wrapFloats = (ptr, len) => Jolt.HEAPF32.subarray(ptr / 4, ptr / 4 + len);
        const { mPositionOffset, mNormalOffset, mUVOffset, mSize } = Jolt.DebugRendererVertexTraits.prototype;
        for (let i = 0; i < inTriangleCount; i++) {
            let triOffset = inTriangles + i * Jolt.DebugRendererTriangleTraits.prototype.mSize;
            for (let j = 0; j < 3; j++) {
                const vertOffset = triOffset + Jolt.DebugRendererTriangleTraits.prototype.mVOffset + j * mSize;
                position.set(wrapFloats(vertOffset + mPositionOffset, 3), p_idx);
                p_idx += 3;
                normal.set(wrapFloats(vertOffset + mNormalOffset, 3), n_idx);
                n_idx += 3;
                uv.set(wrapFloats(vertOffset + mUVOffset, 2), uv_idx);
                uv_idx += 2;
            }
        }
        // Create a three mesh
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        this.geometryCache.push(geometry);
        return batchID;
    }
    createTriangleBatchIDWithIndex(inVertices, inVertexCount, inIndices, inIndexCount) {
        const batchID = this.geometryCache.length;
        // Get a view on the triangle data (does not make a copy)
        const position = new Float32Array(3 * inVertexCount);
        const normal = new Float32Array(3 * inVertexCount);
        const uv = new Float32Array(2 * inVertexCount);
        let p_idx = 0;
        let n_idx = 0;
        let uv_idx = 0;
        const wrapFloats = (ptr, len) => Jolt.HEAPF32.subarray(ptr / 4, ptr / 4 + len);
        const { mPositionOffset, mNormalOffset, mUVOffset, mSize } = Jolt.DebugRendererVertexTraits.prototype;
        for (let j = 0; j < inVertexCount; j++) {
            const vertOffset = inVertices + Jolt.DebugRendererTriangleTraits.prototype.mVOffset + j * mSize;
            position.set(wrapFloats(vertOffset + mPositionOffset, 3), p_idx);
            p_idx += 3;
            normal.set(wrapFloats(vertOffset + mNormalOffset, 3), n_idx);
            n_idx += 3;
            uv.set(wrapFloats(vertOffset + mUVOffset, 2), uv_idx);
            uv_idx += 2;
        }
        const index = new Uint32Array(inIndexCount);
        index.set(Jolt.HEAPU32.subarray(inIndices / 4, inIndices / 4 + inIndexCount));
        // Create a three mesh
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        geometry.setIndex(new THREE.BufferAttribute(index, 1));
        this.geometryCache.push(geometry);
        return batchID;
    }
    getMeshMaterial(color) {
        if (!this.materialCache[color]) {
            this.materialCache[color] = new THREE.MeshPhongMaterial({ color: color });
        }
        return this.materialCache[color];
    }
    Finish() {
        Object.entries(this.lineCache).forEach(([colorU32, points]) => {
            const color = parseInt(colorU32, 10);
            if (this.lineMesh[color]) {
                this.lineMesh[color].geometry = new THREE.BufferGeometry().setFromPoints(points);
            }
            else {
                const material = new THREE.LineBasicMaterial({ color: color });
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                this.lineMesh[color] = new THREE.LineSegments(geometry, material);
                scene.add(this.lineMesh[color]);
            }
        });
        Object.entries(this.triangleCache).forEach(([colorU32, points]) => {
            const color = parseInt(colorU32, 10);
            if (this.triangleMesh[color]) {
                this.triangleMesh[color].geometry = new THREE.BufferGeometry().setFromPoints(points);
            }
            else {
                const material = this.getMeshMaterial(color);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                this.triangleMesh[color] = new THREE.Mesh(geometry, material);
                scene.add(this.triangleMesh[color]);
            }
        });
        this.meshList.forEach(mesh => mesh.visible = false);
        this.geometryList.forEach(({ geometry, color, matrix }, i) => {
            const material = this.getMeshMaterial(color);
            let mesh = this.meshList[i];
            if (!mesh) {
                mesh = this.meshList[i] = new THREE.Mesh(geometry, material);
                scene.add(mesh);
            }
            else {
                mesh.material = material;
                mesh.geometry = geometry;
            }
            matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
            mesh.visible = true;
        });
        this.textCache.forEach(mesh => mesh.visible = false);
        this.textList.forEach(({ position, text, color, height }, i) => {
            let mesh = this.textCache[i];
            if (!this.css3dRender) {
                this.css3dRender = new THREE.CSS3DRenderer();
                this.css3dRender.setSize(renderer.domElement.width, renderer.domElement.height);
                const element = this.css3dRender.domElement;
                element.style.position = 'absolute';
                element.style.left = element.style.right = element.style.top = element.style.bottom = '0px';
                document.getElementById('container').append(this.css3dRender.domElement);

	            window.addEventListener('resize', () => {
                    this.css3dRender.setSize(renderer.domElement.width, renderer.domElement.height);
                }, false);
            }
            if (!mesh) {
                const div = document.createElement('div')
                div.style.display = 'inline-block'
                mesh = this.textCache[i] = new THREE.CSS3DObject(div);
                scene.add(mesh);
            }
            else {
                mesh.element.innerText = text;
                mesh.element.style.fontSize = '1px'
                mesh.element.style.color = '#' + ('000000' + color.toString(16)).substr(-6);
            }
            mesh.position.copy(position);
            mesh.visible = true;
        });
        this.geometryList = [];
        this.textList = [];
        this.lineCache = {};
        this.triangleCache = {};
    }
}
