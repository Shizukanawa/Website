let Run = function(vertexShaderURL, fragmentShaderURL){
    loadTextResource(vertexShaderURL, function(vsErr, vsText){
        if(vsErr){
            alert('Fatal error getting vertex shader (see console)');
            console.error(vsErr);
        }
        else{
            loadTextResource(fragmentShaderURL, function(fsErr, fsText){
                if(fsErr){
                    alert('Fatal error getting fragment shader (see console)');
                    console.error(fsText);
                }
                else{
                    RunCube(vsText, fsText);
                }
            });
        }
    });
}

let RunCube = function(vertexShaderSource, fragmentShaderSource){
    let canvas = document.getElementById("game-surface")
    let gl = canvas.getContext("webgl");

    if (!gl) {
        console.log("WebGL not support without using experimental WebGL");
        gl = canvas.getContext("experimental-webgl");
    }

    if (!gl) {
        alert("Your browser does not support WebGL");
    }

    gl.clearColor(0.75, 0.85, 0.8, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);

    //
    // Create Shaders
    //

    let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    let program = createProgram(gl, vertexShader, fragmentShader)

    //
    // Create buffer
    //

    let boxVertices =
    [ // X, Y, Z            R, G, B
        // Top
        -1.0, 1.0, -1.0,    0.5, 0.5, 0.5,
        -1.0, 1.0, 1.0,     0.5, 0.5, 0.5,
        1.0, 1.0, 1.0,      0.5, 0.5, 0.5,
        1.0, 1.0, -1.0,     0.5, 0.5, 0.5,

        // Left
        -1.0, 1.0, 1.0,     0.75, 0.25, 0.5,
        -1.0, -1.0, 1.0,    0.75, 0.25, 0.5,
        -1.0, -1.0, -1.0,   0.75, 0.25, 0.5,
        -1.0, 1.0, -1.0,    0.75, 0.25, 0.5,

        // Right
        1.0, 1.0, 1.0,      0.25, 0.25, 0.75,
        1.0, -1.0, 1.0,     0.25, 0.25, 0.75,
        1.0, -1.0, -1.0,    0.25, 0.25, 0.75,
        1.0, 1.0, -1.0,     0.25, 0.25, 0.75,

        // Front
        1.0, 1.0, 1.0,      1.0, 0.0, 0.15,
        1.0, -1.0, 1.0,     1.0, 0.0, 0.15,
        -1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
        -1.0, 1.0, 1.0,     1.0, 0.0, 0.15,

        // Back
        1.0, 1.0, -1.0,     0.0, 1.0, 0.15,
        1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
        -1.0, -1.0, -1.0,   0.0, 1.0, 0.15,
        -1.0, 1.0, -1.0,    0.0, 1.0, 0.15,

        // Bottom
        -1.0, -1.0, -1.0,   0.5, 0.5, 1.0,
        -1.0, -1.0, 1.0,    0.5, 0.5, 1.0,
        1.0, -1.0, 1.0,     0.5, 0.5, 1.0,
        1.0, -1.0, -1.0,    0.5, 0.5, 1.0,
    ];

    let boxIndices = 
    [
        // Top      Shows what triangles makes the squares. For the top it's the 0st, 1st and 2nd line makes the first triangle.
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
    ]

    let boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    let boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    let positionAttributeLocation = gl.getAttribLocation(program, "vertPosition");
    let colorAttributeLocation = gl.getAttribLocation(program, "vertColor");
    gl.vertexAttribPointer(
        positionAttributeLocation, //Attribute Location
        3, //Number of elements per attribute (since ours is vec3 it is 3)
        gl.FLOAT, //Type of elements
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT, //Size of an individual vertex
        0 //Offset from the beginning of a single vertex to this attribute
    );

    gl.vertexAttribPointer(
        colorAttributeLocation, //Attribute Location
        3, //Number of elements per attribute (since ours is vec3 it is 3)
        gl.FLOAT, //Type of elements
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT, //Size of an individual vertex
        3 * Float32Array.BYTES_PER_ELEMENT //Offset from the beginning of a single vertex to this attribute
    );

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(colorAttributeLocation);

    let mat4 = glMatrix.mat4;

    // Tell OpenGL state machine which program should be active.
    gl.useProgram(program);

    let matWorldUniformLocation = gl.getUniformLocation(program, "mWorld");
    let matViewUniformLocation = gl.getUniformLocation(program, "mView");
    let matProjUniformLocation = gl.getUniformLocation(program, "mProj")

    let degree = Math.PI / 180;
    let worldMatrix = new Float32Array(16);
    let viewMatrix = new Float32Array(16);
    let projMatrix = new Float32Array(16);
    mat4.identity(worldMatrix);
    mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
    mat4.perspective(projMatrix, 45 * degree, canvas.width / canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    let xRotationMatrix = new Float32Array(16);
    let yRotationMatrix = new Float32Array(16);

    //
    //Main render loop
    //
    let identityMatrix = new Float32Array(16);
    mat4.identity(identityMatrix);
    let angle = 0;
    let loop = function(){
        angle = performance.now() / 1000 / 6 * 2 * Math.PI;
        mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0]);
        mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
        mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0)

        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
}

function createShader(gl, type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader){
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Link Program Error", gl.getProgramInfoLog(program));
        return;
    }
    
    /*
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error("Validating Program Error", gl.getProgramInfoLog(program));
        return;
    }*/
    return program;
}