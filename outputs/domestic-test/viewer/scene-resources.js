/** Release only the geometry/material ownership already held by the viewer. */
function disposeMesh(object){
  object.geometry?.dispose();
  for(const material of Array.isArray(object.material)?object.material:[object.material])material?.dispose();
}

export function disposeSceneResource(scene,resource){
  if(resource){scene.remove(resource.group);if(resource.lamps)scene.remove(resource.lamps);resource.dispose();}
  return null;
}

export function disposeSceneGroup(scene,group){
  if(group){scene.remove(group);group.traverse(disposeMesh);}
  return null;
}

export function clearBuildingMeshes(group,meshes){
  for(const mesh of meshes){disposeMesh(mesh);for(const child of mesh.children)disposeMesh(child);}
  group.clear();
}
