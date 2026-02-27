'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  Bars3Icon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { fetchPdfSettings } from '@/lib/pdf/pdf-settings';

/*  Public types  */
export interface ExportOverrides {
  recipientNameOverride: string;
  extraNote: string;
  showBankDetails: boolean;
  showSignatureLine: boolean;
  customFooter: string;
}

export const DEFAULT_EXPORT_OVERRIDES: ExportOverrides = {
  recipientNameOverride: '',
  extraNote: '',
  showBankDetails: false,
  showSignatureLine: false,
  customFooter: '',
};

interface Props {
  open: boolean;
  onClose: () => void;
  documentType: 'invoice' | 'bill' | 'quotation' | 'proforma' | 'receipt';
  documentNumber: string;
  recipientName: string;
  generateHTML: (overrides: ExportOverrides) => string;
}

const DOC_LABELS: Record<Props['documentType'], string> = {
  invoice: 'Invoice',
  bill: 'Bill',
  quotation: 'Quotation',
  proforma: 'Proforma Invoice',
  receipt: 'Receipt',
};

/*
  SINGLE-MODE EDITOR
  
  Click           select element  (blue outline + 8 resize handles)
  Drag selected   move element
  Double-click    enter text edit (green outline, cursor in text)
  Esc             if editing: stop editing (keep selected)
                   if selected: deselect
  Del key         delete selected element (only when NOT editing text)
  Ctrl+Z / Y      undo / redo
   handle        reorder whole document section
  Text boxes are position:absolute  drag anywhere on the document
*/
function buildEditingScript(): string {
  return String.raw`(function () {
'use strict';

var SECT_SELS = ['.header','.info-section','.invoice-details',
  '.items-table','.totals-section','.payment-info',
  '.notes','.notes-section','.footer','[data-section]'];

/*  STATE  */
var selectedEl  = null;
var editingEl   = null;
var moving      = false;
var moveEl      = null;
var dragPending = false;
var editDragPending = false;
var dragSX=0, dragSY=0;
var freeDragOX=0, freeDragOY=0;
var resizing=false, resDir='', rsEl=null;
var rsX=0, rsY=0, rsW=0, rsH=0;

/*  HISTORY  */
var hist=[], hIdx=-1, MAX_H=80, _noHist=false;
function saveHist(){
  if(_noHist) return;
  hist=hist.slice(0,hIdx+1);
  hist.push(document.body.innerHTML);
  if(hist.length>MAX_H) hist.shift();
  hIdx=hist.length-1;
  refreshBar();
}
function undo(){
  if(hIdx<=0) return;
  exitAll(); hIdx--;
  _noHist=true; document.body.innerHTML=hist[hIdx]; _noHist=false;
  reattach();
}
function redo(){
  if(hIdx>=hist.length-1) return;
  exitAll(); hIdx++;
  _noHist=true; document.body.innerHTML=hist[hIdx]; _noHist=false;
  reattach();
}

/*  STYLES  */
var S=document.createElement('style');
S.id='pde-editor-styles';
S.textContent=
  '#pde-bar{position:sticky;top:0;z-index:9999;background:#0f172a;display:flex;'+
  'align-items:center;gap:2px;padding:4px 8px;flex-wrap:nowrap;min-height:38px;'+
  'box-shadow:0 2px 8px rgba(0,0,0,.4);font-family:system-ui,sans-serif;}'+

  '.pde-b{background:transparent;border:none;color:#cbd5e1;cursor:pointer;padding:4px 8px;'+
  'border-radius:5px;font-size:13px;line-height:1.3;font-family:system-ui,sans-serif;'+
  'display:inline-flex;align-items:center;gap:3px;white-space:nowrap;}'+
  '.pde-b:hover:not(:disabled){background:#334155;color:#f1f5f9}'+
  '.pde-b.on{background:#1d4ed8;color:#fff}'+
  '.pde-b.red{color:#fca5a5}.pde-b.red:hover:not(:disabled){background:#7f1d1d}'+
  '.pde-b:disabled{opacity:.25;cursor:default}'+
  '.pde-sep{width:1px;height:20px;background:#334155;margin:0 3px;flex-shrink:0}'+
  '.pde-sel{background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:5px;'+
  'padding:2px 5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif}'+
  '.pde-col{width:22px;height:22px;border-radius:4px;border:2px solid #475569;'+
  'cursor:pointer;padding:0;flex-shrink:0}'+

  '.invoice,.document-wrapper{position:relative!important}'+

  '[data-pde]:not(.pde-sel-el):not(.pde-ed-el):hover{outline:1px dashed #93c5fd!important}'+
  '.pde-sel-el{outline:2px solid #3b82f6!important;outline-offset:2px;cursor:move!important}'+
  '.pde-ed-el{outline:2px solid #22c55e!important;outline-offset:2px;cursor:text!important}'+

  '.pde-rh{position:fixed;width:10px;height:10px;background:#fff;border:2px solid #3b82f6;'+
  'border-radius:2px;z-index:10001;display:none;box-sizing:border-box;pointer-events:auto}'+

  '#pde-xbtn{position:fixed;background:#ef4444;color:#fff;border:none;border-radius:50%;'+
  'width:20px;height:20px;font-size:14px;line-height:1;cursor:pointer;z-index:10002;'+
  'display:none;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,.4);padding:0}'+
  '#pde-xbtn:hover{background:#b91c1c}'+

  '/* dropline removed */'+

  '.pde-sec{position:relative}'+
  '.ds-src{opacity:.3}'+
  '.pde-drop-here::before{content:"";display:block;height:3px;background:#3b82f6;'+
  'border-radius:2px;margin-bottom:4px}'+
  '.pde-grip{position:absolute;left:-30px;top:50%;transform:translateY(-50%);'+
  'width:22px;height:22px;background:#3b82f6;color:#fff;border-radius:5px;'+
  'display:none;align-items:center;justify-content:center;font-size:13px;'+
  'cursor:grab;user-select:none;z-index:9998;box-shadow:0 1px 6px rgba(59,130,246,.5)}'+
  '.pde-sec:hover .pde-grip{display:flex}'+

  '.pde-tb{position:absolute;padding:8px 10px;border:1px dashed #94a3b8;border-radius:4px;'+
  'min-height:28px;min-width:120px;background:rgba(255,255,255,.96);font-size:14px;'+
  'color:#111;z-index:100;'+
  'box-sizing:border-box;word-break:break-word;cursor:move}'+

  '#pde-status{position:sticky;bottom:0;left:0;right:0;padding:3px 12px;z-index:9999;'+
  'font-family:system-ui,sans-serif;font-size:10.5px;background:rgba(15,23,42,.88);'+
  'color:#64748b;display:flex;align-items:center;gap:6px}'+
  '#pde-status .hi{font-weight:700;color:#e2e8f0}'+
  '#pde-status kbd{background:#1e293b;color:#94a3b8;padding:0 4px;border-radius:3px;font-size:10px}';
document.head.appendChild(S);

/*  TOOLBAR  */
var bar=document.createElement('div'); bar.id='pde-bar';
function mkBtn(html,tip,cb,cls){
  var b=document.createElement('button');
  b.className='pde-b'+(cls?' '+cls:'');
  b.innerHTML=html; b.title=tip||'';
  b.addEventListener('mousedown',function(e){e.preventDefault();});
  b.addEventListener('click',cb);
  return b;
}
function sep(){var d=document.createElement('div');d.className='pde-sep';return d;}

var undoBtn = mkBtn('&#8630;','Undo (Ctrl+Z)',function(){undo();});
var redoBtn = mkBtn('&#8631;','Redo (Ctrl+Y)',function(){redo();});
var boldBtn = mkBtn('<b>B</b>','Bold',         function(){fmt('bold');});
var italBtn = mkBtn('<i>I</i>','Italic',        function(){fmt('italic');});
var ulBtn   = mkBtn('<u>U</u>','Underline',     function(){fmt('underline');});
var stBtn   = mkBtn('<s>S</s>','Strikethrough', function(){fmt('strikeThrough');});
var alLBtn  = mkBtn('&#8592;','Align Left',   function(){fmt('justifyLeft');});
var alCBtn  = mkBtn('&#8596;','Center',        function(){fmt('justifyCenter');});
var alRBtn  = mkBtn('&#8594;','Align Right',  function(){fmt('justifyRight');});

var fontSel=document.createElement('select'); fontSel.className='pde-sel'; fontSel.title='Font';
['Default','Arial','Georgia','Times New Roman','Courier New','Verdana','Trebuchet MS'].forEach(function(f){
  var o=document.createElement('option');o.value=f;o.textContent=f;fontSel.appendChild(o);
});
fontSel.addEventListener('mousedown',function(e){e.stopPropagation();});
fontSel.addEventListener('change',function(){
  fmt('fontName',fontSel.value==='Default'?'inherit':fontSel.value);
});

var sizeSel=document.createElement('select'); sizeSel.className='pde-sel'; sizeSel.title='Size';
[8,9,10,11,12,13,14,15,16,18,20,22,24,28,32,36,40,48].forEach(function(n){
  var o=document.createElement('option');o.value=n;o.textContent=n+'px';
  if(n===14)o.selected=true;sizeSel.appendChild(o);
});
sizeSel.addEventListener('mousedown',function(e){e.stopPropagation();});
sizeSel.addEventListener('change',function(){
  fmt('fontSize','7');
  document.querySelectorAll('font[size="7"]').forEach(function(f){
    f.removeAttribute('size');f.style.fontSize=sizeSel.value+'px';
  });
});

var fgCol=document.createElement('input');fgCol.type='color';fgCol.value='#000000';
fgCol.className='pde-col';fgCol.title='Text colour';
fgCol.addEventListener('change',function(){fmt('foreColor',fgCol.value);});
var hlCol=document.createElement('input');hlCol.type='color';hlCol.value='#ffff00';
hlCol.className='pde-col';hlCol.title='Highlight';hlCol.style.marginLeft='2px';
hlCol.addEventListener('change',function(){fmt('hiliteColor',hlCol.value);});

var delBtn  = mkBtn('&#x2715; Delete','Delete selected element (Del)',function(){doDelete();},'red');
var tboxBtn = mkBtn('&#x271a; Text Box','Insert floating text box',function(){insertTextBox();});
var divBtn  = mkBtn('&mdash; Divider','Insert divider line',function(){insertDivider();});
var spcBtn  = mkBtn('&#x25a1; Spacer','Insert blank spacer',function(){insertSpacer();});
var imgBtn  = mkBtn('&#x1f5bc; Image','Insert image from URL',function(){insertImage();});

[undoBtn,redoBtn,sep(),
 boldBtn,italBtn,ulBtn,stBtn,sep(),
 alLBtn,alCBtn,alRBtn,sep(),
 fontSel,sizeSel,sep(),fgCol,hlCol,sep(),
 delBtn,sep(),
 tboxBtn,divBtn,spcBtn,imgBtn
].forEach(function(el){bar.appendChild(el);});
document.body.insertBefore(bar,document.body.firstChild);

/* floating  delete badge */
var xbtn=document.createElement('button');xbtn.id='pde-xbtn';
xbtn.innerHTML='&times;';xbtn.title='Delete element';
document.body.appendChild(xbtn);
xbtn.addEventListener('click',function(){doDelete();});

/* no drop line — all drags are free-floating */

/* status bar */
var statusBar=document.createElement('div');statusBar.id='pde-status';
document.body.appendChild(statusBar);

/*  RESIZE HANDLES  */
var DIRS=['nw','n','ne','e','se','s','sw','w'];
var RH={};
var RHCUR={nw:'nw-resize',n:'n-resize',ne:'ne-resize',e:'e-resize',
           se:'se-resize',s:'s-resize',sw:'sw-resize',w:'w-resize'};
DIRS.forEach(function(d){
  var h=document.createElement('div');h.className='pde-rh';h.dataset.dir=d;
  h.style.cursor=RHCUR[d];document.body.appendChild(h);RH[d]=h;
  h.addEventListener('mousedown',function(e){
    if(!selectedEl)return;
    resizing=true;rsEl=selectedEl;resDir=d;
    rsX=e.clientX;rsY=e.clientY;
    var cs=getComputedStyle(rsEl);
    rsW=parseFloat(cs.width)||rsEl.offsetWidth;
    rsH=parseFloat(cs.height)||rsEl.offsetHeight;
    saveHist();e.preventDefault();e.stopPropagation();
  });
});
function showRH(el){
  if(!el){hideRH();return;}
  var r=el.getBoundingClientRect(),sx=window.scrollX,sy=window.scrollY,hw=5;
  var pos={
    nw:{top:r.top+sy-hw,     left:r.left+sx-hw},
    n :{top:r.top+sy-hw,     left:r.left+sx+r.width/2-hw},
    ne:{top:r.top+sy-hw,     left:r.right+sx-hw},
    e :{top:r.top+sy+r.height/2-hw,left:r.right+sx-hw},
    se:{top:r.bottom+sy-hw,  left:r.right+sx-hw},
    s :{top:r.bottom+sy-hw,  left:r.left+sx+r.width/2-hw},
    sw:{top:r.bottom+sy-hw,  left:r.left+sx-hw},
    w :{top:r.top+sy+r.height/2-hw,left:r.left+sx-hw}
  };
  DIRS.forEach(function(d){
    RH[d].style.top =pos[d].top +'px';
    RH[d].style.left=pos[d].left+'px';
    RH[d].style.display='block';
  });
}
function hideRH(){DIRS.forEach(function(d){RH[d].style.display='none';});}

/*  SKIP LIST  */
var SKIP=/^(SCRIPT|STYLE|HEAD|HTML|BODY|BR|INPUT|SELECT|TEXTAREA)$/i;
function isSel(el){
  if(!el||el.nodeType!==1)return false;
  if(SKIP.test(el.tagName))return false;
  if(el===bar||bar.contains(el))return false;
  if(el===statusBar||el===xbtn)return false;
  if(el.classList.contains('pde-rh')||el.classList.contains('pde-grip'))return false;
  /* children inside a text box must not be individually selectable or draggable */
  if(el.closest&&el.closest('.pde-tb')&&!el.classList.contains('pde-tb'))return false;
  return true;
}
function tagAll(){
  document.querySelectorAll('*').forEach(function(el){if(isSel(el))el.dataset.pde='1';});
}
tagAll();

/*  SELECT  */
function posXBtn(el){
  if(!el){xbtn.style.display='none';return;}
  var r=el.getBoundingClientRect();
  xbtn.style.top =(r.top +window.scrollY-8)+'px';
  xbtn.style.left=(r.right+window.scrollX-8)+'px';
  xbtn.style.display='flex';
}
function selectElement(el){
  if(selectedEl)selectedEl.classList.remove('pde-sel-el');
  hideRH();xbtn.style.display='none';delBtn.disabled=true;
  selectedEl=el||null;
  if(!selectedEl){setStatus('idle');return;}
  selectedEl.classList.add('pde-sel-el');
  posXBtn(selectedEl);showRH(selectedEl);
  delBtn.disabled=false;
  setStatus('selected');
}

/*  EDIT  */
var _fmtEl=null;
function startEdit(el){
  if(!el||!isSel(el))return;
  if(editingEl===el)return;
  stopEdit();
  if(selectedEl!==el)selectElement(el);
  saveHist();
  editingEl=el;
  el.classList.remove('pde-sel-el');el.classList.add('pde-ed-el');
  el.contentEditable='true';el.spellcheck=false;
  el.focus();_fmtEl=null;refreshBar();setStatus('editing');
}
function stopEdit(){
  if(!editingEl)return;
  editingEl.contentEditable='false';
  editingEl.classList.remove('pde-ed-el');
  editingEl.classList.add('pde-sel-el');
  editingEl.blur();
  var prev=editingEl;editingEl=null;_fmtEl=null;
  selectedEl=prev;
  posXBtn(selectedEl);showRH(selectedEl);
  refreshBar();setStatus('selected');
}
function fmt(cmd,val){
  if(!editingEl)return;
  if(editingEl!==_fmtEl){saveHist();_fmtEl=editingEl;}
  document.execCommand(cmd,false,val||null);
  refreshBar();
}

/*  DELETE  */
function doDelete(){
  var t=selectedEl;if(!t)return;
  if(editingEl)stopEdit();
  saveHist();exitAll();
  if(t.parentNode)t.parentNode.removeChild(t);
  refreshBar();
}

/*  INSERT  */
function afterAnchor(){
  var a=editingEl||selectedEl;
  if(a&&!a.classList.contains('pde-tb'))return{par:a.parentNode,ref:a.nextSibling};
  var w=document.querySelector('.invoice')||document.querySelector('.document-wrapper')||document.body;
  return{par:w,ref:null};
}
function insertNode(node){
  saveHist();var p=afterAnchor();
  p.par.insertBefore(node,p.ref);tagAll();
}
var _tbCount=0;
function insertTextBox(){
  /* clear any existing selection/edit first */
  exitAll();
  var d=document.createElement('div');d.className='pde-tb';d.dataset.pde='1';
  d.textContent='Text box — double-click to edit';
  var wrapper=document.querySelector('.invoice')||
              document.querySelector('.document-wrapper')||document.body;
  wrapper.style.position='relative';
  var wr=wrapper.getBoundingClientRect();
  var scrollY=window.scrollY||document.documentElement.scrollTop;
  /* stagger each new box by 30px so they never overlap */
  var stagger=(_tbCount%8)*30;
  var initLeft=Math.max(10,Math.round((wr.width-220)/2)+stagger);
  var initTop =Math.max(10,Math.round(window.innerHeight*0.35-wr.top+scrollY)+stagger);
  d.style.left=initLeft+'px';d.style.top=initTop+'px';d.style.width='220px';
  _tbCount++;
  saveHist();wrapper.appendChild(d);tagAll();
  selectElement(d);
}
function insertDivider(){
  var hr=document.createElement('hr');
  hr.style.cssText='border:none;border-top:1px solid #e5e7eb;margin:12px 0;';
  insertNode(hr);
}
function insertSpacer(){
  var d=document.createElement('div');
  d.style.cssText='height:24px;width:100%;';d.dataset.pde='1';insertNode(d);
}
function insertImage(){
  var url=prompt('Paste image URL:');if(!url)return;
  var img=document.createElement('img');img.src=url;img.alt='';
  img.style.maxWidth='200px';img.style.height='auto';insertNode(img);
}

/*  MOUSE  */
document.addEventListener('mousedown',function(e){
  var t=e.target;
  if(t===bar||bar.contains(t))return;
  if(t===statusBar||statusBar.contains(t))return;
  if(t===xbtn)return;
  if(t.classList.contains('pde-rh'))return;
  if(t.classList.contains('pde-grip'))return;

  /* click inside editing element — let browser place cursor, but track for drag */
  if(editingEl&&(t===editingEl||editingEl.contains(t))){
    dragSX=e.clientX;dragSY=e.clientY;
    var _er=editingEl.getBoundingClientRect();
    freeDragOX=e.clientX-_er.left;
    freeDragOY=e.clientY-_er.top;
    editDragPending=true;
    /* do NOT preventDefault — let browser place text cursor */
    return;
  }

  /* click outside editing element  stop edit */
  if(editingEl){stopEdit();}

  /* prepare drag on already-selected element */
  if(selectedEl&&(t===selectedEl||selectedEl.contains(t))){
    dragPending=true;
    dragSX=e.clientX;dragSY=e.clientY;
    /* record cursor offset from element top-left for all elements */
    var _elr=selectedEl.getBoundingClientRect();
    freeDragOX=e.clientX-_elr.left;
    freeDragOY=e.clientY-_elr.top;
    e.preventDefault();
  }
},true);

document.addEventListener('mousemove',function(e){
  /* resize */
  if(resizing&&rsEl){
    var dx=e.clientX-rsX,dy=e.clientY-rsY,d=resDir,nw=rsW,nh=rsH;
    if(d==='e'||d==='ne'||d==='se')nw=Math.max(40,rsW+dx);
    if(d==='w'||d==='nw'||d==='sw')nw=Math.max(40,rsW-dx);
    if(d==='s'||d==='se'||d==='sw')nh=Math.max(12,rsH+dy);
    if(d==='n'||d==='ne'||d==='nw')nh=Math.max(12,rsH-dy);
    if(d!=='n'&&d!=='s')rsEl.style.width=nw+'px';
    if(d!=='e'&&d!=='w')rsEl.style.minHeight=nh+'px';
    showRH(rsEl);e.preventDefault();return;
  }
  /* drag start threshold (4px) */
  if((dragPending||editDragPending)&&!moving){
    var dist=Math.sqrt(Math.pow(e.clientX-dragSX,2)+Math.pow(e.clientY-dragSY,2));
    if(dist>4){
      /* if dragging out of an editing element, exit edit mode first */
      if(editDragPending&&editingEl){
        var _dragTarget=editingEl;
        stopEdit();
        selectElement(_dragTarget);
        var _dr=_dragTarget.getBoundingClientRect();
        freeDragOX=dragSX-_dr.left;
        freeDragOY=dragSY-_dr.top;
      }
      editDragPending=false;
      moving=true;moveEl=selectedEl;dragPending=false;
      saveHist();
      /* lift element into absolute positioning at its current visual position */
      if(!moveEl.classList.contains('pde-tb')){
        var wrapper=document.querySelector('.invoice')||
                    document.querySelector('.document-wrapper')||document.body;
        wrapper.style.position='relative';
        var wr=wrapper.getBoundingClientRect();
        var mr=moveEl.getBoundingClientRect();
        /* store original DOM position for undo */
        moveEl._origParent=moveEl.parentNode;
        moveEl._origNext  =moveEl.nextSibling;
        /* snapshot current size before detaching from flow */
        var mw=moveEl.offsetWidth;
        var mh=moveEl.offsetHeight;
        /* detach and re-attach to wrapper as overlay */
        moveEl.style.position='absolute';
        moveEl.style.width   =mw+'px';
        moveEl.style.minHeight=mh+'px';
        moveEl.style.left=(mr.left-wr.left)+'px';
        moveEl.style.top =(mr.top -wr.top +window.scrollY)+'px';
        moveEl.style.zIndex='200';
        moveEl.style.boxShadow='0 4px 16px rgba(0,0,0,.18)';
        wrapper.appendChild(moveEl);
        tagAll();
      }
    }
  }
  /* active move — free absolute drag for all elements */
  if(moving&&moveEl){
    var container=moveEl.offsetParent||document.body;
    var cr=container.getBoundingClientRect();
    var nx=e.clientX-cr.left-freeDragOX;
    var ny=e.clientY-cr.top -freeDragOY;
    moveEl.style.left=Math.max(0,nx)+'px';
    moveEl.style.top =Math.max(0,ny)+'px';
    showRH(moveEl);posXBtn(moveEl);
    e.preventDefault();
  }
});

document.addEventListener('mouseup',function(){
  dragPending=false;
  editDragPending=false;
  if(resizing){resizing=false;rsEl=null;}
  if(moving&&moveEl){
    /* clean up lift state on non-tb elements (keep absolute, just remove shadow) */
    if(!moveEl.classList.contains('pde-tb')){
      moveEl.style.boxShadow='';
      delete moveEl._origParent;
      delete moveEl._origNext;
    }
    selectElement(moveEl);
    moveEl=null;moving=false;
  }
});

/*  CLICK / DBLCLICK  */
document.addEventListener('click',function(e){
  var t=e.target;
  if(t===bar||bar.contains(t))return;
  if(t===statusBar||statusBar.contains(t))return;
  if(t===xbtn||t.classList.contains('pde-rh'))return;
  if(moving)return;
  /* clicks inside already-editing element: browser handles cursor */
  if(editingEl&&(t===editingEl||editingEl.contains(t)))return;
  if(!isSel(t)){selectElement(null);return;}
  selectElement(t);
  e.stopPropagation();
},true);

document.addEventListener('dblclick',function(e){
  var t=e.target;
  if(t===bar||bar.contains(t)||t===xbtn||t.classList.contains('pde-rh'))return;
  /* walk up to a selectable element */
  var el=t;
  while(el&&el!==document.body&&!isSel(el))el=el.parentElement;
  if(!el||!isSel(el))return;
  e.preventDefault();
  startEdit(el);
},true);

/*  KEYBOARD  */
document.addEventListener('keydown',function(e){
  var ctrl=e.ctrlKey||e.metaKey;
  if(ctrl&&e.key==='z'&&!e.shiftKey){e.preventDefault();undo();return;}
  if(ctrl&&(e.key==='y'||(e.key==='z'&&e.shiftKey))){e.preventDefault();redo();return;}
  if(e.key==='Escape'){
    e.preventDefault();
    if(editingEl)stopEdit();else selectElement(null);
    return;
  }
  /* Delete only when selected but NOT in text-edit */
  if((e.key==='Delete'||e.key==='Backspace')&&selectedEl&&!editingEl){
    e.preventDefault();doDelete();return;
  }
  /* Enter in edit: line break not paragraph */
  if(editingEl&&e.key==='Enter'&&!e.shiftKey){
    e.preventDefault();document.execCommand('insertLineBreak');return;
  }
},true);

/*  SECTION DRAG REORDER  */
var secSrc=null;
function attachSects(){
  var list=[];SECT_SELS.forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el){
      if(list.indexOf(el)===-1&&!el.closest('#pde-bar')&&el.id!=='pde-status')list.push(el);
    });
  });
  list.forEach(function(sec){
    if(sec.classList.contains('pde-sec'))return;
    sec.classList.add('pde-sec');
    var h=document.createElement('div');h.className='pde-grip';h.textContent='\u2803';
    h.title='Drag to reorder this section';
    sec.insertBefore(h,sec.firstChild);
    h.addEventListener('mousedown',function(e){sec.draggable=true;e.stopPropagation();});
    h.addEventListener('mouseup',function(){sec.draggable=false;});
    sec.addEventListener('dragstart',function(e){
      secSrc=sec;e.dataTransfer.effectAllowed='move';
      saveHist();setTimeout(function(){sec.classList.add('ds-src');},0);
    });
    sec.addEventListener('dragend',function(){
      sec.classList.remove('ds-src');sec.draggable=false;
      document.querySelectorAll('.pde-drop-here').forEach(function(x){x.classList.remove('pde-drop-here');});
    });
    sec.addEventListener('dragover',function(e){
      e.preventDefault();if(sec!==secSrc)sec.classList.add('pde-drop-here');
    });
    sec.addEventListener('dragleave',function(){sec.classList.remove('pde-drop-here');});
    sec.addEventListener('drop',function(e){
      e.preventDefault();
      if(secSrc&&sec!==secSrc){
        var par=sec.parentNode;
        var si=Array.from(par.children).indexOf(secSrc);
        var ti=Array.from(par.children).indexOf(sec);
        if(si<ti)par.insertBefore(secSrc,sec.nextSibling);else par.insertBefore(secSrc,sec);
      }
      sec.classList.remove('pde-drop-here');
    });
  });
}
attachSects();

window.addEventListener('scroll',function(){
  if(selectedEl){showRH(selectedEl);posXBtn(selectedEl);}
},true);

/*  TOOLBAR REFRESH  */
function refreshBar(){
  undoBtn.disabled=hIdx<=0;redoBtn.disabled=hIdx>=hist.length-1;
  var ed=!!editingEl;
  [boldBtn,italBtn,ulBtn,stBtn,alLBtn,alCBtn,alRBtn].forEach(function(b){b.disabled=!ed;});
  [fontSel,sizeSel,fgCol,hlCol].forEach(function(b){b.disabled=!ed;});
  if(ed){
    try{
      boldBtn.classList.toggle('on',document.queryCommandState('bold'));
      italBtn.classList.toggle('on',document.queryCommandState('italic'));
      ulBtn.classList.toggle('on',  document.queryCommandState('underline'));
    }catch(ex){}
  }
  delBtn.disabled=!selectedEl;
}

/*  STATUS  */
function setStatus(s){
  if(s==='idle'){
    statusBar.innerHTML='Click to select &bull; Double-click to edit text &bull; '+
      '<kbd>Del</kbd>=delete &bull; <kbd>Ctrl+Z</kbd>=undo &bull; &#x2803; icon=reorder sections';
  }else if(s==='selected'){
    statusBar.innerHTML='<span class="hi">Selected</span> &mdash; '+
      'Drag to move &bull; Blue handles to resize &bull; Double-click to edit text &bull; '+
      '<kbd>Del</kbd>=delete &bull; <kbd>Esc</kbd>=deselect';
  }else if(s==='editing'){
    var isTb=editingEl&&editingEl.classList.contains('pde-tb');
    statusBar.innerHTML='<span class="hi">Editing text</span> &mdash; '+
      'Format bar is active &bull; <kbd>Esc</kbd>=stop editing'+
      (isTb?' &bull; Use the <strong>&#x2630; drag</strong> bar at top of box to move it':'');
  }else{
    statusBar.innerHTML=s;
  }
}

/*  EXIT ALL  */
function exitAll(){
  if(editingEl)stopEdit();
  selectElement(null);
  moving=false;moveEl=null;dragPending=false;
}

/*  REATTACH after undo/redo  */
function reattach(){
  _tbCount=document.querySelectorAll('.pde-tb').length;
  tagAll();attachSects();exitAll();refreshBar();setStatus('idle');
}

/* INIT */
refreshBar();setStatus('idle');saveHist();
window.pdeExitAll=exitAll;
window.parent.postMessage({type:'pde-ready'},'*');

}());`;
}

/*  Modal component  */
export default function PreExportModal({
  open,
  onClose,
  documentType,
  documentNumber,
  recipientName,
  generateHTML,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [overrides, setOverrides] = useState<ExportOverrides>({ ...DEFAULT_EXPORT_OVERRIDES });
  const [editorReady, setEditorReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [initDone, setInitDone] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [srcdoc, setSrcdoc] = useState('');

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'pde-ready') setEditorReady(true);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (!open) { setEditorReady(false); setInitDone(false); return; }
    setEditorReady(false); setInitDone(false); setGenerating(false);
    fetchPdfSettings()
      .then((settings) => {
        const initial: ExportOverrides = {
          recipientNameOverride: '',
          extraNote: '',
          showBankDetails: settings.showBankDetails ?? false,
          showSignatureLine: settings.showSignatureLine ?? false,
          customFooter: settings.footerText || '',
        };
        setOverrides(initial);
        setSrcdoc(generateHTML(initial));
        setInitDone(true);
      })
      .catch(() => {
        const initial = { ...DEFAULT_EXPORT_OVERRIDES };
        setOverrides(initial);
        setSrcdoc(generateHTML(initial));
        setInitDone(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const script = doc.createElement('script');
      script.id = 'pde-editor-script';
      script.textContent = buildEditingScript();
      doc.body.appendChild(script);
    } catch { /* cross-origin guard */ }
  }, []);

  const update = useCallback(
    <K extends keyof ExportOverrides>(key: K, value: ExportOverrides[K]) => {
      setOverrides((prev) => {
        const next = { ...prev, [key]: value };
        setSrcdoc(generateHTML(next));
        return next;
      });
    },
    [generateHTML],
  );

  const handleGenerate = () => {
    setGenerating(true);
    // tell the iframe to exit editing/selection first, then wait one frame
    const iwin = iframeRef.current?.contentWindow as (Window & { pdeExitAll?: () => void }) | null;
    iwin?.pdeExitAll?.();
    setTimeout(() => {
    try {
      let html = '';
      const iframeDoc = iframeRef.current?.contentDocument;
      if (iframeDoc) {
        const clone = iframeDoc.documentElement.cloneNode(true) as HTMLElement;
        // strip all editor chrome
        ['#pde-bar', '#pde-xbtn', '#pde-status',
         '.pde-grip', '.pde-rh'].forEach((sel) => {
          clone.querySelectorAll(sel).forEach((el) => el.remove());
        });
        // remove the editor CSS entirely (it contains dashed borders, cursor:move, etc.)
        clone.querySelector('#pde-editor-styles')?.remove();
        // remove the editor script so it doesn't re-initialize in the print window
        clone.querySelector('#pde-editor-script')?.remove();
        clone.querySelectorAll('.pde-sec').forEach((el) => el.classList.remove('pde-sec'));
        clone.querySelectorAll('.pde-sel-el,.pde-ed-el').forEach((el) => {
          (el as HTMLElement).classList.remove('pde-sel-el', 'pde-ed-el');
        });
        // strip text-box editor styling so it prints cleanly
        clone.querySelectorAll<HTMLElement>('.pde-tb').forEach((el) => {
          el.style.border = 'none';
          el.style.cursor = '';
          el.style.outline = 'none';
        });
        // remove drag lift styles
        clone.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
          el.style.boxShadow = '';
          if (el.style.zIndex === '200') el.style.zIndex = '';
        });
        clone.querySelectorAll('[contenteditable]').forEach((el) =>
          (el as HTMLElement).removeAttribute('contenteditable'));
        clone.querySelectorAll('[data-pde]').forEach((el) =>
          (el as HTMLElement).removeAttribute('data-pde'));
        // remove any remaining editor style tags as fallback
        clone.querySelectorAll('style').forEach((el) => {
          if (el.textContent?.includes('pde-bar') ||
              el.textContent?.includes('pde-sel-el')) el.remove();
        });
        // print styles
        const ps = document.createElement('style');
        ps.textContent =
          '@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}' +
          '@page{margin:.5in}}';
        clone.querySelector('head')?.appendChild(ps);
        html = '<!DOCTYPE html>' + clone.outerHTML;
      } else {
        html = generateHTML(overrides);
      }

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); setGenerating(false); onClose(); }, 350);
      } else {
        setGenerating(false);
      }
    } catch { setGenerating(false); }
    }, 80);
  };

  if (!open) return null;
  const docLabel = DOC_LABELS[documentType];
  const showRecipientOverride = documentType !== 'bill';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '97vw', height: '95vh', maxWidth: '1600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
            >
              {sidebarOpen
                ? <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
                : <Bars3Icon className="w-4 h-4 text-gray-500" />}
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900">Document Editor</h2>
              <p className="text-xs text-gray-400 truncate">{docLabel} {documentNumber}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {editorReady ? (
              <span className="text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Editor ready
              </span>
            ) : (
              <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Loading
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={generating || !initDone}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              {generating ? 'Opening' : 'Print / Save PDF'}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors" aria-label="Close">
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

          {/* Sidebar */}
          {sidebarOpen && (
            <aside className="w-72 shrink-0 border-r bg-white overflow-y-auto flex flex-col">
              <div className="p-4 space-y-4 flex-1">

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">How to use</p>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-1.5">Select &amp; Move</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li><span className="font-medium">Click</span> any element to select it</li>
                      <li><span className="font-medium">Drag</span> the selected element to move it</li>
                      <li><span className="font-medium">Blue handles</span> to resize width / height</li>
                      <li><span className="font-medium"> icon</span> to reorder whole sections</li>
                      <li><span className="font-medium">Del key</span> or <span className="text-red-600"> badge</span> to delete</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-1.5">Edit Text</p>
                    <ul className="text-xs text-green-700 space-y-1">
                      <li><span className="font-medium">Double-click</span> any element to edit its text</li>
                      <li>Format bar becomes active: B I U S, align, font, size, colour</li>
                      <li><span className="font-medium">Esc</span> to stop editing (element stays selected)</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1.5">Insert</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li><span className="font-medium"> Text Box</span> — floating overlay; drag it to move (double-click to edit its text)</li>
                      <li><span className="font-medium"> Divider</span>  horizontal rule</li>
                      <li><span className="font-medium"> Spacer</span>  blank gap</li>
                      <li><span className="font-medium"> Image</span>  from URL</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1.5">Keyboard shortcuts</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
                      <span><kbd className="bg-gray-200 px-1 rounded text-gray-700">Ctrl+Z</kbd> Undo</span>
                      <span><kbd className="bg-gray-200 px-1 rounded text-gray-700">Ctrl+Y</kbd> Redo</span>
                      <span><kbd className="bg-gray-200 px-1 rounded text-gray-700">Del</kbd> Delete</span>
                      <span><kbd className="bg-gray-200 px-1 rounded text-gray-700">Esc</kbd> Deselect</span>
                      <span><kbd className="bg-gray-200 px-1 rounded text-gray-700">Dbl-click</kbd> Edit</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest pt-2 border-t">
                  Quick Settings
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  These rebuild the document  your direct edits will be lost.
                </p>

                {showRecipientOverride && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Recipient Display Name</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={recipientName}
                      value={overrides.recipientNameOverride}
                      onChange={(e) => update('recipientNameOverride', e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">Leave blank: <em>{recipientName}</em></p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Note or Message</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    style={{ minHeight: '72px' }}
                    placeholder="e.g. Please remit within 5 business days."
                    value={overrides.extraNote}
                    onChange={(e) => update('extraNote', e.target.value)}
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  {([
                    { key: 'showBankDetails' as const, label: 'Bank Payment Details', desc: 'Bank of America routing & account' },
                    { key: 'showSignatureLine' as const, label: 'Signature Line', desc: 'Authorized signature at bottom' },
                  ] as const).map(({ key, label, desc }) => (
                    <label key={key} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                      <input type="checkbox" className="mt-0.5" checked={overrides[key]} onChange={(e) => update(key, e.target.checked)} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Footer Message</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Thank you for your business!"
                    value={overrides.customFooter}
                    onChange={(e) => update('customFooter', e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>

              <div className="px-4 py-3 border-t bg-amber-50">
                <p className="text-xs text-amber-700 leading-relaxed">
                   Changing a Quick Setting <strong>reloads</strong> the document and discards direct edits.
                </p>
              </div>
            </aside>
          )}

          {/* Editor canvas */}
          <div className="flex-1 bg-slate-200 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
            <div className="flex-1 overflow-auto p-6 flex justify-center items-start" style={{ minHeight: 0 }}>
              {!initDone ? (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : (
                <div
                  className="bg-white shadow-2xl"
                  style={{ width: '210mm', minHeight: '297mm', position: 'relative', borderRadius: '2px' }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={srcdoc}
                    onLoad={handleIframeLoad}
                    className="w-full border-0 block"
                    style={{ height: '100%', minHeight: '297mm' }}
                    title="Document Editor"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
