const unwrapV3 = (ptr) => wrapVec3(Jolt.wrapPointer(ptr, Jolt.RVec3));
const textDecoder = new TextDecoder();
class DebugRenderer {
    materialCache = {};
    lineCache = {};
    lineMesh = {};
    triangleCache = {};
    triangleMesh = {};
    meshList = [];
    geometryList = [];
    geometryCache = [];
    textCache = [];
    textList = [];
    renderer;
    css3dRender;
    constructor() {
        const renderer = this.renderer = new Jolt.DebugRendererJS();
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
        this.geometryList.push({ matrix: matrix, geometry: this.geometryCache[inGeometryID], color: colorU32, drawMode: inDrawMode, cullMode: inCullMode });
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
    getMeshMaterial(color, cullMode, drawMode) {
        const key = `${color}|${cullMode}|${drawMode}`;
        if (!this.materialCache[key]) {
            const material = this.materialCache[key] = new THREE.MeshPhongMaterial({ color: color });
            if (drawMode == Jolt.EDrawMode_Wireframe) {
                material.wireframe = true;
            }
            if (cullMode !== undefined) {
                switch (cullMode) {
                    case Jolt.ECullMode_Off:
                        material.side = THREE.DoubleSide;
                        break;
                    case Jolt.ECullMode_CullBackFace:
                        material.side = THREE.FrontSide;
                        break;
                    case Jolt.ECullMode_CullFrontFace:
                        material.side = THREE.BackSide;
                        break;
                }
            }
        }
        return this.materialCache[key];
    }
    Render() {
        [Object.values(this.lineMesh), Object.values(this.triangleMesh), this.meshList, this.textCache].forEach(meshes => {
            meshes.forEach(mesh => mesh.visible = false);
        });
        Object.entries(this.lineCache).forEach(([colorU32, points]) => {
            const color = parseInt(colorU32, 10);
            if (this.lineMesh[color]) {
                this.lineMesh[color].geometry = new THREE.BufferGeometry().setFromPoints(points);
                const mesh = this.lineMesh[color];
                mesh.visible = true;
            }
            else {
                const material = new THREE.LineBasicMaterial({ color: color });
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const mesh = this.lineMesh[color] = new THREE.LineSegments(geometry, material);
                mesh.layers.set(1);
                scene.add(mesh);
            }
        });
        Object.entries(this.triangleCache).forEach(([colorU32, points]) => {
            const color = parseInt(colorU32, 10);
            if (this.triangleMesh[color]) {
                this.triangleMesh[color].geometry = new THREE.BufferGeometry().setFromPoints(points);
                const mesh = this.triangleMesh[color];
                mesh.visible = true;
            }
            else {
                const material = this.getMeshMaterial(color, undefined, undefined);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const mesh = this.triangleMesh[color] = new THREE.Mesh(geometry, material);
                mesh.layers.set(1);
                scene.add(mesh);
            }
        });
        this.geometryList.forEach(({ geometry, color, matrix, cullMode, drawMode }, i) => {
            const material = this.getMeshMaterial(color, cullMode, drawMode);
            let mesh = this.meshList[i];
            if (!mesh) {
                mesh = this.meshList[i] = new THREE.Mesh(geometry, material);
                mesh.layers.set(1);
                scene.add(mesh);
            }
            else {
                mesh.material = material;
                mesh.geometry = geometry;
            }
            matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
            mesh.visible = true;
        });
        this.textList.forEach(({ position, text, color, height }, i) => {
            let mesh = this.textCache[i];
            if (!this.css3dRender) {
                this.css3dRender = new THREE.CSS3DRenderer();
                this.css3dRender.setSize(renderer.domElement.width, renderer.domElement.height);
                const element = this.css3dRender.domElement;
                element.style.position = 'absolute';
                element.style.left = element.style.right = element.style.top = element.style.bottom = '0';
                document.getElementById('container')?.append(element);
            }
            if (!mesh) {
                mesh = this.textCache[i] = new THREE.CSS3DObject(document.createElement('div'));
                mesh.element.style.display = 'block';
                mesh.element.style.fontSize = '1px';
                mesh.layers.set(1);
                scene.add(mesh);
            }
            else {
                mesh.element.innerText = text;
                mesh.element.style.color = '#' + ('000000' + color.toString(16)).substr(-6);
            }
            mesh.position.copy(position);
            mesh.visible = true;
        });
        this.css3dRender && this.css3dRender.render(scene, camera);
        this.geometryList = [];
        this.textList = [];
        this.lineCache = {};
        this.triangleCache = {};
    }
}
const BodyDrawSettingsMap = [
    { key: 'mDrawShape', label: 'Shape' },
    { key: 'mDrawShapeWireframe', label: 'Shape Wireframe' },
    { key: 'mDrawShapeColor', label: 'Shape Color', options: [
            { key: "EShapeColor_InstanceColor", label: 'Instance Color' },
            { key: "EShapeColor_ShapeTypeColor", label: 'Shape Type Color' },
            { key: "EShapeColor_MotionTypeColor", label: 'Motion Color' },
            { key: "EShapeColor_SleepColor", label: 'Sleep Color' },
            { key: "EShapeColor_IslandColor", label: 'Island Color' },
            { key: "EShapeColor_MaterialColor", label: 'Material Color' }
        ] },
    { key: 'mDrawGetSupportFunction', label: 'Get Support Function' },
    { key: 'mDrawSupportDirection', label: 'Support Direction' },
    { key: 'mDrawGetSupportingFace', label: 'Get Supporting Face' },
    { key: 'mDrawBoundingBox', label: 'Bounding Box' },
    { key: 'mDrawCenterOfMassTransform', label: 'Center of Mass Transform' },
    { key: 'mDrawWorldTransform', label: 'World Transform' },
    { key: 'mDrawVelocity', label: 'Velocity' },
    { key: 'mDrawMassAndInertia', label: 'Mass And Intertia' },
    { key: 'mDrawSleepStats', label: 'Sleep Stats' },
    { header: 'Soft Body' },
    { key: 'mDrawSoftBodyVertices', label: 'Vertices' },
    { key: 'mDrawSoftBodyVertexVelocities', label: 'Vertex Velocities' },
    { key: 'mDrawSoftBodyEdgeConstraints', label: 'Edge Constraints' },
    { key: 'mDrawSoftBodyBendConstraints', label: 'Bend Constraints' },
    { key: 'mDrawSoftBodyVolumeConstraints', label: 'Volume Constraints' },
    { key: 'mDrawSoftBodySkinConstraints', label: 'Skin Constraints' },
    { key: 'mDrawSoftBodyLRAConstraints', label: 'LRA Constraints' },
    { key: 'mDrawSoftBodyPredictedBounds', label: 'Predicted Bounds' },
];
class RenderWidget {
    renderer;
    bodyDrawSettings;
    domElement;
    drawConstraints = true;
    drawBodies = true;
    constructor(jolt) {
        window.Jolt = jolt;
        this.renderer = new DebugRenderer();
        this.bodyDrawSettings = new Jolt.BodyManagerDrawSettings();
        this.domElement = document.createElement('div');
        this.domElement.className = "debug-renderer";
        this.domElement.innerHTML = `<style> .debug-renderer { z-index: 2; position: absolute; right: 0; top: 0; max-width: 300px } .debug-renderer label { display: block }</style>`;
    }
    init() {
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 10, 5);
        dirLight.layers.set(1);
        scene.add(dirLight);
        scene.layers.mask = 3;
        const renderMask = document.createElement('select');
        renderMask.innerHTML = `<option value='1' selected>ORIGINAL</option><option value='2'>DEBUG</option><option value='3'>BOTH</option>`;
        renderMask.onchange = () => camera.layers.mask = parseInt(renderMask.value, 10);
        this.domElement.append(renderMask);
        this.addCheckBox('Draw Bodies', this.drawBodies, (checked) => this.drawBodies = checked);
        this.addCheckBox('Draw Constraints', this.drawConstraints, (checked) => this.drawConstraints = checked);
        BodyDrawSettingsMap.forEach(item => {
            if (item.header) {
                const header = document.createElement('h2');
                header.innerText = item.header;
                this.domElement.append(header);
            }
            else {
                if (item.options) {
                    const label = document.createElement('label');
                    label.innerText = item.label;
                    this.domElement.append(label);
                    const options = document.createElement('select');
                    item.options.forEach(option => {
                        const o = document.createElement('option');
                        o.innerText = option.label;
                        o.value = option.key;
                        options.append(o);
                    });
                    options.onchange = () => {
                        this.bodyDrawSettings[item.key] = Jolt[options.value];
                    };
                    label.append(options);
                }
                else {
                    this.addCheckBox(item.label, this.bodyDrawSettings[item.key], (checked) => this.bodyDrawSettings[item.key] = checked);
                }
            }
        });
    }
    addCheckBox(labelText, initialValue, onChange) {
        const label = document.createElement('label');
        label.innerText = labelText;
        this.domElement.append(label);
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.checked = initialValue;
        check.onclick = () => { onChange(check.checked); };
        label.append(check);
    }
    render() {
        this.renderer.Initialize();
        if (this.drawBodies)
            this.renderer.DrawBodies(physicsSystem, this.bodyDrawSettings);
        if (this.drawConstraints)
            this.renderer.DrawConstraints(physicsSystem);
        this.renderer.Render();
    }
}
