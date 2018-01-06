
var gl, program;
var myphi = 0, zeta = 30, radius = 40, fovy = Math.PI/3;

var texturesId = [];
var texturesIdCube = [];

var totalCubes = 7; //Total of cubes in the genga tower

//Objects dimensions
var x = 0, y = 1, z = 2;
var tableDimensions = [20.0, 2.0, 20.0];
var tableLegDimensions = [3.0, 50.0, 3.0];
var cubeDimensions = [3.0, 1.0, 1.0];

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

  //skybox
  program.skyboxIndex           = gl.getUniformLocation(program, "skybox");
  program.invTIndex             = gl.getUniformLocation(program, "invT");
  program.myTextureCube         = gl.getUniformLocation(program, "myTextureCube");

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

  //Porpios del shader procedural por ejemplo el marmol
  program.Color1Index           = gl.getUniformLocation(program, "Color1");
  program.Color2Index           = gl.getUniformLocation(program, "Color2");
  program.ScaleIndex            = gl.getUniformLocation(program, "Scale");
  gl.uniform1f(program.ScaleIndex, 10.0);
  gl.uniform3f(program.Color2Index, 1.0, 1.0, 1.0);
  gl.uniform3f(program.Color1index, 0.3, 0.3, 0.3);

  //Shader de la pata de la mesa
  program.StripeWidthIndex      = gl.getUniformLocation(program, "StripeWidth");
  program.StripeScale           = gl.getUniformLocation(program, "StripeScale");
  gl.uniform1f(program.StripeWidthIndex, 5.0);
  gl.uniform1f(program.StripeScaleIndex, 20.0);

  program.UseProceduralIndex    = gl.getUniformLocation(program, "UseProcedural");
  gl.uniform1i(program.myTextureCubeIndex, 0);
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

function setProcedural(i)
{
  gl.uniform1i(program.UseProceduralIndex, i);
}

function drawSolid(model) {

  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.vertexAttribPointer (program.vertexPositionAttribute,  3, gl.FLOAT, false, 8*4,   0);
  gl.vertexAttribPointer (program.vertexNormalAttribute,    3, gl.FLOAT, false, 8*4, 3*4);
  gl.vertexAttribPointer (program.vertexTexcoordsAttribute, 2, gl.FLOAT, false, 8*4, 6*4);

  gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);

}

function drawSkyboxAndReflectObject()
{
  setProcedural(-1);

  var _phi    = myphi * Math.PI / 180.0;
  var _zeta   = zeta * Math.PI/180.0;
  var x       = radius * Math.cos(_zeta) * Math.sin(_phi);
  var y     = radius * Math.sin(_zeta);
  var z     = radius * Math.cos(_zeta) * Math.cos(_phi);

  var modelMatrix      = mat4.create();
  var modelViewMatrix  = mat4.create();
  var aux              = mat4.create();

  mat4.fromTranslation (aux, [x, y, z]);
  mat4.fromScaling     (modelMatrix, [120.0,120.0,120.0]);
  mat4.multiply  (modelMatrix, aux, modelMatrix);
  mat4.multiply  (modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix  (modelViewMatrix);

  gl.uniform1f (program.skyboxIndex, 1.0);
  drawSolid (exampleCube);
  gl.uniform1f (program.skyboxIndex, 0.0);
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

  //Skybox
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texturesIdCube[0]);
  drawSkyboxAndReflectObject();

  DrawTable();
  DrawCubes();
}

function DrawTable()
{
  setProcedural(1);
  var modelMatrix = mat4.create();
  var modelViewMatrix = mat4.create();
  var matT = mat4.create();
  var matR = mat4.create();
  var matS = mat4.create();

  //Lateral de la mesa
  mat4.fromScaling(matS, [tableDimensions[x], tableDimensions[y], tableDimensions[z]]);
  mat4.fromRotation(matR, Math.PI/2, [1.0, 0.0, 0.0]);

  mat4.multiply(modelMatrix, matS, matR);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

   // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  // se envia al Shader el material del objeto
  // En este ejemplo es el mismo material para los dos objetos
  setShaderMaterial(White_plastic);

  // se selecciona una unidad de textura
  gl.activeTexture(gl.TEXTURE3);

  // se cambia el objeto textura de la unidad de textura activa
  gl.bindTexture(gl.TEXTURE_2D, texturesId[1]);
  drawSolid(exampleCylinder);

  //Superficies de la mesa
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);

  mat4.fromScaling(matS, [tableDimensions[x], 0.000001, tableDimensions[z]]);
  mat4.fromRotation(matR, -Math.PI/2, [1, 0, 0]);

  mat4.multiply(modelMatrix, matS, matR);
  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

   // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));
  drawSolid(exampleCone);

  mat4.fromRotation(matR, Math.PI, [1, 0, 0]);
  mat4.fromTranslation(matT, [0, -tableDimensions[y], 0]);

  mat4.multiply(modelMatrix, matR, modelMatrix);
  mat4.multiply(modelMatrix, matT, modelMatrix);
  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

   // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));
  drawSolid(exampleCone);

  //pata de la mesa
  setProcedural(2);
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);

  mat4.fromRotation(matR, Math.PI/2, [1, 0, 0]);
  mat4.fromScaling(matS, [tableLegDimensions[x], tableLegDimensions[y], tableLegDimensions[z]]);
  mat4.fromTranslation(matT, [0, -tableDimensions[y], 0]);

  mat4.multiply(modelMatrix, matS, matR);
  mat4.multiply(modelMatrix, matT, modelMatrix);
  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

   // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));
  drawSolid(exampleCylinder);


}

function DrawCubes()
{
  setProcedural(0);

  for(var i = 0; i < totalCubes; i++)
  {
    DrawCubeLines(i);
  }
}

function DrawCubeLines(level)
{
	var modelMatrix = mat4.create();
	var modelViewMatrix = mat4.create();
	var matA = mat4.create(); //Translation matrix
	var matB = mat4.create(); //RotationMatrix
	var matC = mat4.create(); //ScaleMatrix

  mat4.fromRotation(matB, (Math.PI/2)*((level)%2), [0, 1, 0]);
  mat4.fromScaling(matC, [cubeDimensions[x], cubeDimensions[y], cubeDimensions[z]]);

	for(var i = 0; i < 3; i++)
	{
	   mat4.identity(modelMatrix);
     mat4.identity(modelViewMatrix);

     mat4.fromTranslation(matA, [((i-1)*cubeDimensions[z]*(level%2)), ((cubeDimensions[y]*level)+cubeDimensions[y]/2), ((i-1)*cubeDimensions[z]*-((level+1)%2))]);

     mat4.multiply(modelMatrix, matB, matC);
     mat4.multiply(modelMatrix, matA, modelMatrix);

     mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);

     // se obtiene la matriz de transformacion de la normal y se envia al shader
     gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
     setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

     // se envia al Shader el material del objeto
     // En este ejemplo es el mismo material para los dos objetos
     setShaderMaterial(White_plastic);

     // se selecciona una unidad de textura
     gl.activeTexture(gl.TEXTURE3);

     gl.bindTexture(gl.TEXTURE_2D, texturesId[1]);
     drawSolid(exampleCube);
	}
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
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texturesIdCube[texturePos]);

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

  texturesIdCube[texturePos].loaded = true;
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

function initTexturesCube() {


  var serverUrl  = "http://cphoto.uji.es/vj1221/assets/textures/";
  var texFolders = ["PereaBeach1/"];

  for (var texturePos = 0; texturePos < texFolders.length; texturePos++) {

    // creo el objeto textura
    texturesIdCube[texturePos] = gl.createTexture();
    texturesIdCube[texturePos].loaded = false;

    // solicito la carga de la textura
    loadCubeMapFromServer(serverUrl+texFolders[texturePos], texturePos);

  }

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
  var texFilenames = ["alpha_maps/alpha_map01.jpg", "wood_1163214.JPG"];

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
  initTexturesCube();

}

initWebGL();
