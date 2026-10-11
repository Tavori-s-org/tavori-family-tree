import test from 'node:test';
import assert from 'node:assert/strict';
import {cropGeometry,moveCrop} from '../photo-crop.js';
import {normalizeFamily} from '../model.js';
test('square crop stays inside portrait and landscape originals at every edge and zoom',()=>{
 for(const [w,h] of [[1200,800],[800,1200],[640,640]])for(const x of [0,.3,1])for(const y of [0,.7,1])for(const zoom of [1,2,4]){const g=cropGeometry(w,h,{x,y,zoom});assert.ok(g.left>=0&&g.top>=0);assert.ok(g.left+g.size<=w+.00001&&g.top+g.size<=h+.00001);assert.equal(g.size,Math.min(w,h)/zoom);}
});
test('drag follows the image and moves immediately after an edge clamp',()=>{
 const c={x:.5,y:.5,zoom:2},g=moveCrop(1200,800,c,100,0,400);assert.equal(g.x,.5-100/1200);assert.equal(g.y,.5);
 const edge=moveCrop(1200,800,c,10000,0,400),back=moveCrop(1200,800,edge,-10,0,400);assert.ok(back.x>edge.x);
});
test('zoom retains the selected center when possible and old images start centered',()=>{
 assert.deepEqual(cropGeometry(1200,800),{left:200,top:0,size:800,x:.5,y:.5,zoom:1});const g=cropGeometry(1200,800,{x:.7,y:.5,zoom:4});assert.equal(g.x,.7);
 assert.throws(()=>cropGeometry(0,800));
});
test('crop metadata and original survive normalization while removal clears both',()=>{
 const photo='data:image/png;base64,YQ==',p={id:'p',name:'שם',photo,photoOriginal:photo,photoCrop:{x:.6,y:.4,zoom:2}};
 const family=raw=>normalizeFamily({version:1,people:[raw]});assert.deepEqual(family(p).people[0].photoCrop,p.photoCrop);assert.equal(family(p).people[0].photoOriginal,photo);
 assert.equal(family({...p,photo:''}).people[0].photoOriginal,'');assert.equal(family({...p,photo:''}).people[0].photoCrop,null);
 for(const photoCrop of [{x:2,y:.5,zoom:1},{x:.5,y:.5,zoom:5},{x:'.5',y:.5,zoom:1}])assert.throws(()=>family({...p,photoCrop}));
 assert.throws(()=>family({...p,photoOriginal:'https://evil.example/a.jpg'}));
});
