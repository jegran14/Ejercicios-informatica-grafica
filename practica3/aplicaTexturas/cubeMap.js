
var gl, program;
var myphi = 0, zeta = 30, radius = 15, fovy = Math.PI/5;
var nGrados = 0;

var texturesId = [];

function getWebGLContext() {
    
  var canvas = document.getElementById("myCanvas");
    
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    
  for (var i = 0; i < names.length; ++i) {
    try {
      return canvas.getContext(names[i]);
    }
    catch(e) {
    }
  }
    
  return null;
    
}

function initShaders() {
    
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, document.getElementById("myVertexShader").text);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(vertexShader));
    return null;
  }
 
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, document.getElementById("myFragmentShader").text);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(fragmentShader));
    return null;
  }
    
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
    
  gl.linkProgram(program);
    
  gl.useProgram(program);
    
  program.vertexPositionAttribute = gl.getAttribLocation( program, "VertexPosition");
  program.vertexNormalAttribute   = gl.getAttribLocation ( program, "VertexNormal");

  gl.enableVertexAttribArray(program.vertexPositionAttribute);
  gl.enableVertexAttribArray(program.vertexNormalAttribute);
    
  program.modelViewMatrixIndex  = gl.getUniformLocation( program, "modelViewMatrix");
  program.normalMatrixIndex     = gl.getUniformLocation( program, "normalMatrix");
  program.projectionMatrixIndex = gl.getUniformLocation( program, "projectionMatrix");
  program.skyboxIndex           = gl.getUniformLocation( program, 'skybox');
  program.invTIndex             = gl.getUniformLocation( program, 'invT');
  program.myTextureIndex        = gl.getUniformLocation( program, 'myTexture');
  
  gl.uniform1i(program.myTextureIndex, 0);
  
}

function initRendering() {
    
  gl.clearColor(0.15,0.15,0.15,1.0);
  gl.enable(gl.DEPTH_TEST);
    
}

function initBuffers(model) {
    
  model.idBufferVertices = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
    
  model.idBufferIndices = gl.createBuffer ();
  gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
    
}

function initPrimitives() {
    
  initBuffers(examplePlane);
  initBuffers(exampleCube);
  initBuffers(exampleCone);
  initBuffers(exampleCylinder);
  initBuffers(exampleSphere);
    
  myTorus = makeTorus(0.5, 1, 100, 100);
  initBuffers(myTorus);
    
}

function setShaderProjectionMatrix(projectionMatrix) {
    
  gl.uniformMatrix4fv(program.projectionMatrixIndex, false, projectionMatrix);
    
}

function setShaderModelViewMatrix(modelViewMatrix) {
    
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
    
}

function setShaderNormalMatrix(normalMatrix) {
    
  gl.uniformMatrix3fv(program.normalMatrixIndex, false, normalMatrix);
    
}

function getNormalMatrix(modelViewMatrix) {
    
  var normalMatrix = mat3.create();
    
  mat3.normalFromMat4(normalMatrix, modelViewMatrix);
    
  return normalMatrix;
    
}

function getProjectionMatrix() {
    
  var projectionMatrix  = mat4.create();
    
  mat4.perspective(projectionMatrix, fovy, 2.0, 0.1, 100.0);
    
  return projectionMatrix;
    
}

function getCameraMatrix() {
    
  var _phi  = myphi* Math.PI / 180.0;
  var _zeta = zeta * Math.PI / 180.0;
    
  // conversion de coordenadas polares (_zeta,_phi) a rectangulares (x, y, z)
  // ver: https://en.wikipedia.org/wiki/Spherical_coordinate_system
  var x = radius * Math.cos(_zeta) * Math.sin(_phi);
  var y = radius * Math.sin(_zeta);
  var z = radius * Math.cos(_zeta) * Math.cos(_phi);
    
  var cameraMatrix = mat4.create();
  mat4.lookAt(cameraMatrix, [x, y, z], [0, 0, 0], [0, 1, 0]);
    
  return cameraMatrix;
    
}

function drawSolid(model) {
    
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.vertexAttribPointer (program.vertexPositionAttribute,  3, gl.FLOAT, false, 8*4,   0);
  gl.vertexAttribPointer (program.vertexNormalAttribute,    3, gl.FLOAT, false, 8*4, 3*4);
    
  gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
    
}

function drawSkyboxAndReflectObject() {

  // calculo la posición del skybox, que coincide con la de la camara
  var _phi  = myphi* Math.PI / 180.0;
  var _zeta = zeta * Math.PI / 180.0;
  var x     = radius * Math.cos(_zeta) * Math.sin(_phi);
  var y     = radius * Math.sin(_zeta);
  var z     = radius * Math.cos(_zeta) * Math.cos(_phi);
  
  // el skybox es un cubo muy grande situado en la posicion de la camara
  var modelMatrix      = mat4.create();
  var modelViewMatrix  = mat4.create();
  var aux              = mat4.create();

  mat4.fromTranslation (aux, [x, y, z]);
  mat4.fromScaling     (modelMatrix, [100.0,100.0,100.0]);
  mat4.multiply  (modelMatrix, aux, modelMatrix);
  mat4.multiply  (modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix  (modelViewMatrix);

  gl.uniform1f (program.skyboxIndex, 1.0);
  drawSolid (exampleCube);

  // ahora el objeto reflejante  
  var invT = mat3.create();
  mat3.fromMat4(invT,modelViewMatrix);
  mat3.invert  (invT,invT);
  gl.uniformMatrix3fv(program.invTIndex, false, invT);

  mat4.fromScaling (modelMatrix, [2.5,2.5,2.5]);
  mat4.fromRotation(aux, nGrados,[0.1,1,0.3]); // tecla 'a' para cambiar el ángulo
  mat4.multiply    (modelMatrix, aux, modelMatrix);
  mat4.multiply    (modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix (modelViewMatrix);
  setShaderNormalMatrix    (getNormalMatrix(modelViewMatrix));

  gl.uniform1f (program.skyboxIndex, 0.0);
//   drawSolid (myTorus);
  drawSolid (exampleSphere);

}

function drawScene() {
    
  // dibujamos la escena solo si todas las texturas estan cargadas
  for (var i = 0; i < texturesId.length; i++) {
    if (! texturesId[i].loaded) {
      return;
    }
  }
  
  // se inicializan los buffers de color y de profundidad
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  setShaderProjectionMatrix(getProjectionMatrix());

  // se establece la textura en la unidad 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texturesId[0]);  
  
  drawSkyboxAndReflectObject();

}

function initHandlers() {
    
  var mouseDown = false;
  var lastMouseX;
  var lastMouseY;

  var canvas = document.getElementById("myCanvas");

  canvas.addEventListener("mousedown",
    function(event) {
      mouseDown  = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    },
    false);

  canvas.addEventListener("mouseup",
    function() {
      mouseDown = false;
    },
    false);

  canvas.addEventListener("mousemove",
    function (event) {
      if (!mouseDown) {
        return;
      }
      var newX = event.clientX;
      var newY = event.clientY;
      if (event.shiftKey == 1) {
        if (event.altKey == 1) {
          // fovy
          fovy -= (newY - lastMouseY) / 100.0;
          if (fovy < 0.001) {
            fovy = 0.1;
          }
        } else {
          // radius
          radius -= (newY - lastMouseY) / 10.0;
          if (radius < 0.01) {
            radius = 0.01;
          }
        }
      } else {
        // position
        myphi -= (newX - lastMouseX);
        zeta  += (newY - lastMouseY);
        if (zeta < -80) {
          zeta = -80.0;
        }
        if (zeta > 80) {
          zeta = 80;
        }
      }
      lastMouseX = newX
      lastMouseY = newY;
      requestAnimationFrame(drawScene);
    },
    false);
  
  document.addEventListener("keydown",
    function (event) {
      switch (event.keyCode) {
        case 65: nGrados  += 0.03; break; // 'a'
      }
      requestAnimationFrame(drawScene);
    },
    false);
}

function isPowerOfTwo(x) {

  return (x & (x - 1)) == 0;

}

function nextHighestPowerOfTwo(x) {

  --x;
    
  for (var i = 1; i < 32; i <<= 1) {
    x = x | x >> i;
  }
    
  return x + 1;

}

function setCubeMapTexture(image, texturePos) {
  
  image.cont++;

  if (image.cont!= 6) return;
  
  var faces = [["posx.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
               ["negx.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
               ["posy.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
               ["negy.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
               ["posz.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
               ["negz.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];

  // se indica el objeto textura
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texturesId[texturePos]);

  // parametros de filtrado
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  // parametros de repeticion (coordenadas de textura mayores a uno)
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  for (var i = 0; i < 6; i++) {

    // las hacemos potencia de dos si no lo son
    if (!isPowerOfTwo(image[i].width) || !isPowerOfTwo(image[i].height)) {
    
      // Scale up the texture to the next highest power of two dimensions.
      var canvas    = document.createElement("canvas");
      canvas.width  = nextHighestPowerOfTwo(image[i].width);
      canvas.height = nextHighestPowerOfTwo(image[i].height);
    
      var ctx       = canvas.getContext("2d");
      ctx.drawImage(image[i], 0, 0, canvas.width, canvas.height);
      image[i] = canvas;
    
    }
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    // datos de la textura
    gl.texImage2D (faces[i][1], 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image[i]);
    
  }

  texturesId[texturePos].loaded = true;
  requestAnimationFrame(drawScene);
  
}

function loadCubeMapFromServer(folder, texturePos) {
  
  var image = [];
  var name  = [];

  image.cont = 0;

  for (var i = 0; i < 6; i++) {
  
    name[i]  = folder;
    image[i] = new Image();
    
    switch (i) {
      case 0 : name[i] += "posx.jpg"; break;
      case 1 : name[i] += "negx.jpg"; break;
      case 2 : name[i] += "posy.jpg"; break;
      case 3 : name[i] += "negy.jpg"; break;
      case 4 : name[i] += "posz.jpg"; break;
      case 5 : name[i] += "negz.jpg"; break;
    }

    image[i].addEventListener("load",
                       function() {
                       setCubeMapTexture(image, texturePos);
                       }, false);
    image[i].addEventListener("error",
                       function(err) {
                       console.log("MALA SUERTE: no esta disponible " + this.src);
                       }, false);
    image[i].crossOrigin = 'anonymous';
    image[i].src         = name[i];
  
  }
  
}

function initTextures() {

  var serverUrl  = "http://cphoto.uji.es/vj1221/assets/textures/";
  var texFolders = ["PereaBeach1/"];

  for (var texturePos = 0; texturePos < texFolders.length; texturePos++) {
  
    // creo el objeto textura
    texturesId[texturePos] = gl.createTexture();
    texturesId[texturePos].loaded = false;
    
    // solicito la carga de la textura
    loadCubeMapFromServer(serverUrl+texFolders[texturePos], texturePos);
    
  }

}

function initWebGL() {
    
  gl = getWebGLContext();
    
  if (!gl) {
    alert("WebGL no está disponible");
    return;
  }
    
  initShaders();
  initPrimitives();
  initRendering();
  initHandlers();
  initTextures();
    
}

initWebGL();
