// ---------------------------------------------------------------------------
// Primitiva geometrica toro
// J. Ribelles
// Septiembre 2014
// ---------------------------------------------------------------------------


function makeTorus (innerRadius, outerRadius, nSides, nRings) {
        
  var torus = {
      "vertices" : [],
      "indices"  : []
  };
  
  if (nSides < 1 ) nSides = 1;
  if (nRings < 1 ) nRings = 1;
        
  var dpsi =  2.0 * Math.PI / nRings ;
  var dphi = -2.0 * Math.PI / nSides ;
  var psi  =  0.0;
  
  for (var j = 0; j < nRings; j++) {
    var cpsi = Math.cos ( psi ) ;
    var spsi = Math.sin ( psi ) ;
    phi      = 0.0;

    for (var i = 0; i < nSides; i++) {
      var offset = 3 * ( j * (nSides+1) + i ) ;
      var cphi   = Math.cos ( phi ) ;
      var sphi   = Math.sin ( phi ) ;
      torus.vertices[offset + 0] = cpsi * ( outerRadius + cphi * innerRadius ) ;
      torus.vertices[offset + 1] = spsi * ( outerRadius + cphi * innerRadius ) ;
      torus.vertices[offset + 2] =                        sphi * innerRadius   ;
      phi += dphi;
    }

    var offset = torus.vertices.length;
    for (var i = 0; i < 3; i++)
      torus.vertices[offset + i] = torus.vertices[offset-nSides*3+i];

    psi += dpsi;
  }

  var offset = torus.vertices.length;
  for (var i = 0; i < 3*(nSides+1); i++){
    torus.vertices[offset+i] = torus.vertices[i];
  }

  for (var j = 0; j < nRings; j++){
    for (var i = 0; i < nSides; i++){
      torus.indices[(6*j*nSides)+6*i]   = (j*(nSides+1))+i;
      torus.indices[(6*j*nSides)+6*i+1] = (j*(nSides+1))+i+1;
      torus.indices[(6*j*nSides)+6*i+2] = (j*(nSides+1))+i+(nSides+1); 
      torus.indices[(6*j*nSides)+6*i+3] = (j*(nSides+1))+i+1;
      torus.indices[(6*j*nSides)+6*i+4] = (j*(nSides+1))+i+(nSides+1)+1;
      torus.indices[(6*j*nSides)+6*i+5] = (j*(nSides+1))+i+(nSides+1); 
    }
  }

  return torus; 
}


