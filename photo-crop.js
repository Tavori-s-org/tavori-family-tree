// Coordinates are normalized against the original photo, independent of preview size.
export function cropGeometry(width,height,crop={x:.5,y:.5,zoom:1}){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new Error('Invalid image dimensions');
  const zoom=Math.max(1,Math.min(4,Number(crop.zoom)||1)),size=Math.min(width,height)/zoom;
  const cx=Math.max(size/2,Math.min(width-size/2,(Number.isFinite(crop.x)?crop.x:.5)*width));
  const cy=Math.max(size/2,Math.min(height-size/2,(Number.isFinite(crop.y)?crop.y:.5)*height));
  return {left:cx-size/2,top:cy-size/2,size,x:cx/width,y:cy/height,zoom};
}
export function moveCrop(width,height,crop,dx,dy,previewWidth){
  if(!Number.isFinite(previewWidth)||previewWidth<=0)throw new Error('Invalid preview width');
  const g=cropGeometry(width,height,crop);
  return cropGeometry(width,height,{x:g.x-dx*g.size/previewWidth/width,y:g.y-dy*g.size/previewWidth/height,zoom:g.zoom});
}
