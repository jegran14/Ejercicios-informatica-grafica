
var gl, program;
var myphi = 0, zeta = 30, radius = 15, fovy = Math.PI/30;

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
  gl.enableVertexAttribArray(program.vertexPositionAttribute);
    
  program.modelViewMatrixIndex  = gl.getUniformLocation( program, "modelViewMatrix");
  program.projectionMatrixIndex = gl.getUniformLocation( program, "projectionMatrix");
    
  // normales
  program.vertexNormalAttribute = gl.getAttribLocation ( program, "VertexNormal");
  program.normalMatrixIndex     = gl.getUniformLocation( program, "normalMatrix");
  gl.enableVertexAttribArray(program.vertexNormalAttribute);
    
  // coordenadas de textura
  program.vertexTexcoordsAttribute = gl.getAttribLocation ( program, "VertexTexcoords");
  gl.enableVertexAttribArray(program.vertexTexcoordsAttribute);
  program.myTextureIndex           = gl.getUniformLocation( program, 'myTexture');
  program.repetition               = gl.getUniformLocation( program, "repetition");
  gl.uniform1i(program.myTextureIndex, 3);
  gl.uniform1f(program.repetition,     1.0);

  // material
  program.KaIndex               = gl.getUniformLocation( program, "Material.Ka");
  program.KdIndex               = gl.getUniformLocation( program, "Material.Kd");
  program.KsIndex               = gl.getUniformLocation( program, "Material.Ks");
  program.alphaIndex            = gl.getUniformLocation( program, "Material.alpha");
    
  // fuente de luz
  program.LaIndex               = gl.getUniformLocation( program, "Light.La");
  program.LdIndex               = gl.getUniformLocation( program, "Light.Ld");
  program.LsIndex               = gl.getUniformLocation( program, "Light.Ls");
  program.PositionIndex         = gl.getUniformLocation( program, "Light.Position");
  
}

function initRendering() {
    
  gl.clearColor(0.15,0.15,0.15,1.0);
  gl.enable(gl.DEPTH_TEST);
    
  setShaderLight();
    
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
    
  mat4.perspective(projectionMatrix, fovy, 1.0, 0.1, 100.0);
    
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

function setShaderMaterial(material) {
    
  gl.uniform3fv(program.KaIndex,    material.mat_ambient);
  gl.uniform3fv(program.KdIndex,    material.mat_diffuse);
  gl.uniform3fv(program.KsIndex,    material.mat_specular);
  gl.uniform1f (program.alphaIndex, material.alpha);
    
}

function setShaderLight() {
    
  gl.uniform3f(program.LaIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.LdIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.LsIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.PositionIndex, 10.0,10.0,0.0); // en coordenadas del ojo
    
}

function drawSolid(model) {
    
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.vertexAttribPointer (program.vertexPositionAttribute,  3, gl.FLOAT, false, 8*4,   0);
  gl.vertexAttribPointer (program.vertexNormalAttribute,    3, gl.FLOAT, false, 8*4, 3*4);
  gl.vertexAttribPointer (program.vertexTexcoordsAttribute, 2, gl.FLOAT, false, 8*4, 6*4);
    
  gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
    
}

function drawScene() {
    
  // dibujamos la escena solo si todas las texturas tienen ya una imagen cargada
  for (var i = 0; i < texturesId.length; i++) {
    if (! texturesId[i].loaded) {
      return;
    }
  }
  
  // se inicializan los buffers de color y de profundidad
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  setShaderProjectionMatrix(getProjectionMatrix());

  // se calcula la matriz de transformación del modelo
  var modelMatrix = mat4.create();  
  mat4.fromScaling (modelMatrix, [0.5, 0.5, 0.5]);
  
  // se opera la matriz de transformacion de la camara con la del modelo y se envia al shader
  var modelViewMatrix = mat4.create();
  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));
    
  // se envia al Shader el material del objeto
  // En este ejemplo es el mismo material para los dos objetos
  setShaderMaterial(White_plastic);
    
  // se selecciona una unidad de textura
  gl.activeTexture(gl.TEXTURE3);

  // se asigna un objeto textura a la unidad de textura activa
  gl.bindTexture(gl.TEXTURE_2D, texturesId[0]);
  drawSolid(exampleCone);
    
  // se cambia el objeto textura de la unidad de textura activa
  gl.bindTexture(gl.TEXTURE_2D, texturesId[1]);
  drawSolid(exampleCube); 

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
    
  var colors = document.getElementsByName("color");
    
  for (var i = 0; i < colors.length; i++) {
    colors[i].addEventListener("change",
                                changeColorHandler(i),
                                false);
  }
  
  function changeColorHandler(i) {
    return function(){
      setColor(program[(this.id)+"Index"], this.value);
      requestAnimationFrame(drawScene);
    };
  }
    
  var textureFilename = document.getElementsByName("TextureFilename");
  
  for (var i = 0; i < textureFilename.length; i++) {
    textureFilename[i].addEventListener("change",
                                        changeTextureHandler(i),
                                        false);
  }
  
  function changeTextureHandler(texturePos) {
    return function(){
      if (this.files[0]!= undefined) {
        texturesId[texturePos].loaded = false;
        loadTextureFromFile(this.files[0], texturePos);
      }
    };
  }
    
  var range = document.getElementsByName("Repetition");
  
  range[0].addEventListener("mousemove",
                            function(){
                              gl.uniform1f(program.repetition, range[0].value);
                              requestAnimationFrame(drawScene);                              
                            },
                            false);

}

function setColor (index, value) {

  var myColor = value.substr(1); // para eliminar el # del #FCA34D
      
  var r = myColor.charAt(0) + '' + myColor.charAt(1);
  var g = myColor.charAt(2) + '' + myColor.charAt(3);
  var b = myColor.charAt(4) + '' + myColor.charAt(5);

  r = parseInt(r, 16) / 255.0;
  g = parseInt(g, 16) / 255.0;
  b = parseInt(b, 16) / 255.0;
  
  gl.uniform3f(index, r, g, b);
  
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

function setTexture (image, texturePos) {

  // la hacemos de tamaño potencia de dos
  if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height)) {

    // Scale up the texture to the next highest power of two dimensions.
    var canvas    = document.createElement("canvas");
    canvas.width  = nextHighestPowerOfTwo(image.width);
    canvas.height = nextHighestPowerOfTwo(image.height);

    var ctx       = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    image = canvas;
      
  }
    
  // se indica el objeto textura
  gl.bindTexture(gl.TEXTURE_2D, texturesId[texturePos]);

  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    
  // datos de la textura
  gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    
  // parámetros de filtrado
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
  // parámetros de repetición (ccordenadas de textura mayores a uno)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    
  // creación del mipmap
  gl.generateMipmap(gl.TEXTURE_2D);

  texturesId[texturePos].loaded = true; // textura ya disponible

  requestAnimationFrame(drawScene);

}

function loadTextureFromFile(filename, texturePos) {

  var reader = new FileReader(); // Evita que Chrome se queje de SecurityError al cargar la imagen elegida por el usuario
  
  reader.addEventListener("load",
                          function() {
                            var image = new Image();
                            image.addEventListener("load",
                                                   function() {
                                                     setTexture(image, texturePos);
                                                  },
                                                   false);
                            image.src = reader.result;
                          },
                          false);
  
  reader.readAsDataURL(filename);

}

function loadTextureFromServer (filename, texturePos) {
    
  var image = new Image();
    
  image.addEventListener("load",
                         function() {
                           setTexture(image, texturePos);
                        },
                         false);
  image.addEventListener("error",
                         function(err) {
                           console.log("MALA SUERTE: no esta disponible " + this.src);
                        },
                         false);
  image.crossOrigin = 'anonymous'; // Esto evita que Chrome se queje de SecurityError al cargar la imagen de otro dominio
  image.src         = filename;

}

function initTextures() {

  var serverUrl    = "http://cphoto.uji.es/vj1221/assets/textures/";
  var texFilenames = ["alpha_maps/alpha_map01.jpg", "lined_shirt_material_2020101.JPG"];

  for (var texturePos = 0; texturePos < texFilenames.length; texturePos++) {
  
    // creo el objeto textura
    texturesId[texturePos] = gl.createTexture();
    texturesId[texturePos].loaded = false;
    
    // solicito la carga de la textura
    loadTextureFromServer(serverUrl+texFilenames[texturePos], texturePos);
    
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
    
//   requestAnimationFrame(drawScene);
    
}

initWebGL();
