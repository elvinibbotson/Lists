function id(el) {
	return document.getElementById(el);
} 
'use strict';
// GLOBAL VARIABLES	
var lists=[]; // array of list items
var notes=[]; // array of note items
var items=[];
var item=null;
var itemIndex;
var list={};
var currentDialog='displayDialog';
var depth=0;
var path=[];
var lastSave=null;
var months="JanFebMarAprMayJunJulAugSepOctNovDec";
var dragStart={};
var backupDay;
// var root; // OPFS root directory
// DRAG TO CHANGE DEPTH
id('main').addEventListener('touchstart', function(event) {
    // console.log(event.changedTouches.length+" touches");
    dragStart.x=event.changedTouches[0].clientX;
    dragStart.y=event.changedTouches[0].clientY;
    // console.log('start drag at '+dragStart.x+','+dragStart.y);
})
id('main').addEventListener('touchend', function(event) {
    var drag={};
    drag.x=dragStart.x-event.changedTouches[0].clientX;
    drag.y=dragStart.y-event.changedTouches[0].clientY;
    // console.log('drag '+drag.x+','+drag.y);
    if(Math.abs(drag.y)>50) return; // ignore vertical drags
    if((drag.x<-50)&&(depth>0)) { // drag right to decrease depth...
        console.log('path: '+path);
        if(path[path.length-1]=='CHECK') {
            path.pop();
            populateList(); // ...or just return from 'check' view
            return;
        }
        // list.id=list.owner;
        path.pop();
        depth--;
        if(depth<1) {
        	list.path='';
        	id('heading').innerHTML='Lists';
        }
		else {
	    	list.path=path[0];
	    	var i=1;
	    	while(i<path.length) {
	        	list.path+='.'+path[i++];
	    	}
		}
        console.log('list.path: '+list.path+' depth: '+depth);
        loadList();
    }
    else if(currentDialog && drag.x>50) { // drag left to cancel dialogs
    	console.log('CANCEL');
		id(currentDialog).style.display='none';
		currentDialog=null;
		id('buttonNew').style.display='block';
    }
})
// SHOW/HIDE DIALOG
function showDialog(dialog,show) {
    console.log('show '+dialog+': '+show);
    if(currentDialog) id(currentDialog).style.display='none';
    if(show) {
        id(dialog).style.display='block';
        currentDialog=dialog;
        id('buttonNew').style.display='none';
    }
    else {
        id(dialog).style.display='none';
        currentDialog=null;
        id('buttonNew').style.display='block';
    }
    console.log('current dialog: '+currentDialog);
}
// TAP ON HEADER
id('heading').addEventListener('click',function() {
	if(depth>0) { // list heading - show item edit dialog
		id('listDialogTitle').innerHTML='list';
		id(listField.value=list.name);
		console.log('edit list header - '+(lists.length+notes.length)+' items');
		id('checkAlpha').checked=list.type&4;
		id('checkBoxes').checked=list.type&2;
		if((lists.length>0)||(id('list').getElementsByTagName('li').lenght>0)) {
			id('deleteListButton').style.display='none';
			console.log('disable delete');
		}
		else id('deleteListButton').style.display='block';
		id('listAddButton').style.display='none';
		id('listSaveButton').style.display='block';
		showDialog('listDialog',true);
	}
	else showDialog('dataDialog',true);
});
// ADD NEW ITEM
id('buttonNew').addEventListener('click', function(){
	item={};
	id('noteTitle').innerHTML='new note';
	id('noteField').value='';
	id('noteDownButton').style.display='none';
	id('noteUpButton').style.display='none';
	id('deleteNoteButton').style.display='none';
	id('noteSaveButton').style.display='none';
	id('noteAddButton').style.display='block';
	// item.owner=list.id;
	item.type=0;
    if(depth<2 && list.type>0) { // list above depth 2 - can add sub-list...
        showDialog('addDialog',true);
    }
    else showDialog('noteDialog',true); // ...otherwise has to be note
})
id('addListButton').addEventListener('click',function() {
	id('listDialogTitle').innerHTML='new list';
	id('listField').value='';
	id('checkAlpha').checked=false;
	id('checkBoxes').checked=false;
	id('deleteListButton').style.display='none';
	id('listSaveButton').style.display='none';
	id('listAddButton').style.display='block';
	item={};
    // item.owner=list.id;
    item.type=1;
    item.path=list.path;
	showDialog('listDialog',true);
})
id('addNoteButton').addEventListener('click',function() {
	showDialog('noteDialog',true);
})
// MOVE UP/DOWN
id('noteUpButton').addEventListener('click', function() {move(true);})
id('noteDownButton').addEventListener('click', function() {move(false);})
function move(up) { // move note up/down
	var nextItem;
	// for(var i in notes) console.log('note '+i+': '+notes[i].text+' id: '+notes[i].id);
	console.log('move note '+itemIndex+' index: '+item.index+'; up is '+up);
    if(up && item.index<1) return; // cannot move up if already first...
    if(!up && (notes.length-item.index<2)) return; // ...or down if already last
    if(up)  item.index--; // shift this item up...
    else item.index++; // ...or down
    items[itemIndex]=item;
    save(); // WAS saveData();
	console.log('note updated - index:'+item.index+' type:'+item.type+' path:'+item.path);
	showDialog('noteDialog',false);
	loadList();
}
// NOTE
id('noteAddButton').addEventListener('click',function() {
	item.text=id('noteField').value;
	item.path=list.path;
	item.type=list.type-1;
	if(list.type<4) {
		if(notes.length>0) {
			var highest=items[notes[notes.length-1]].index;
		console.log('highest index: '+highest);
		item.index=highest+1;
		}
		else item.index=0;
	}
	items.push(item);
	console.log("new note:"+item.text+"type:"+item.type+" path:"+item.path+' index:'+item.index+" added");
	showDialog('noteDialog',false);
	save(); // WAS saveData();
	loadList();
})
id('noteSaveButton').addEventListener('click',function() {
	item.text=id('noteField').value;
	console.log('save note '+itemIndex+': '+item.text);
	items[itemIndex]=item;
	console.log('note updated');
	loadList();
	showDialog('noteDialog',false);
})
id('deleteNoteButton').addEventListener('click',function() {
	items.splice(itemIndex,1);
	save(); // WAS saveData();
	console.log('note deleted');
	showDialog('noteDialog',false);
	loadList();
})
// LIST
id('listAddButton').addEventListener('click',function() {
	if(id('checkBoxes').checked) item.type|=2;
	if(id('checkAlpha').checked) item.type|=4;
	console.log('list type: '+item.type);
	item.text=id('listField').value;
	console.log('new list: '+item.text+' type '+item.type+' path '+item.path);
	items.push(item);
	showDialog('listDialog',false);
	save();
	populateList();
})
id('listSaveButton').addEventListener('click',function() {
	if(id('checkBoxes').checked) item.type|=2;
	if(id('checkAlpha').checked) item.type|=4;
	console.log('list type: '+item.type);
	item.text=id('listField').value;
	items[itemIndex]=item;
	showDialog('listDialog',false);
	populateList();
})
id('deleteListButton').addEventListener('click',function() {
	items.splice(itemIndex,1);
	path.pop();
	depth--;
	console.log('list deleted');
	showDialog('listDialog',false);
	loadList();
})
function checkItem(n) {
    notes[n].checked=!notes[n].checked;
    console.log(notes[n].text+" checked is "+notes[n].checked);
    item=items[notes[n]];
    item.checked=notes[n].checked;
    items[notes[n]]=item;
}
// LOAD LIST ITEMS
function loadList() {
	console.log("load children of list.path "+list.path+" - depth: "+depth);
	// NEW CODE...
	if(list.path=='') {
	    list.type=1;
	    path=[];
	}
	else {
		console.log("get list for "+list.path);
	}
	lists=[];
	notes=[];
	for(var i=0;i<items.length;i++) {
		if(items[i].path==list.path) {
			if(items[i].type>0) lists.push(i); // add index of list item to lists[]...
			else notes.push(i); // ...or to notes[]
			console.log('list item '+i+': '+items[i].text);
		}
	}
	console.log("No more entries! "+lists.length+" lists; "+notes.length+' notes');
	/* if((lists.length<1)&&(notes.length<1)) { // no data: restore backup?
		console.log("no data - restore backup?");
		showDialog('restoreDialog',true);
		return;
	}
	else
	*/
	populateList();
}
// POPULATE LIST
function populateList() {
    var listItem;
    id("list").innerHTML=""; // clear list
	console.log("populate list for path "+path+" with "+(lists.length+notes.length)+" items - depth: "+depth);
	console.log('list type is '+list.type);
	if(path.length<1) id('heading').innerHTML='Lists';
	else {
	    list.path=path[0];
	    var i=1;
	    while(i<path.length) {
	        list.path+='.'+path[i++];
	    }
	    console.log('list.path: '+list.path);
	id('heading').innerHTML=list.path;
	}
	// show lists first, sorted alphabetically
	lists.sort(function(a,b){ // always sort list items alphabetically...
		if(items[a].text.toUpperCase()<items[b].text.toUpperCase()) return -1;
		if(items[a].text.toUpperCase()>items[b].text.toUpperCase()) return 1;
		return 0;
	});
	console.log('lists sorted');
	// show notes below lists - sorted alphabetically?
	if(list.type&4) notes.sort(function(a,b){ // sort notes alphabetically...
		if(items[a].text.toUpperCase()<items[b].text.toUpperCase()) return -1;
		if(items[a].text.toUpperCase()>items[b].text.toUpperCase()) return 1;
		return 0;
	});
	else notes.sort(function(a,b){return items[a].index-items[b].index}); // ...or by .index
	for(var i in lists) { // list first...
		listItem=document.createElement('li');
		listItem.index=i;
		listItem.innerText=items[lists[i]].text;
		listItem.addEventListener('click',function() {
			itemIndex=lists[this.index];
			console.log('open list '+itemIndex);
			item=items[itemIndex];
	 		console.log('name: '+item.text);
			list.type=item.type;
			list.name=item.text;
			if(list.path.length<1) list.path=item.text;
			else list.path+='.'+item.text;
			console.log('open list '+list.name+' type:'+list.type+' path: '+list.path);
			depth++;
			path.push(list.name);
			loadList();
		});
		listItem.style.fontWeight='bold'; // lists are bold
		id('list').appendChild(listItem);
	}
	for(var i in notes) { // ...then notes
		console.log('note '+i+': '+notes[i]+'; index: '+items[notes[i]].index+' - '+items[notes[i]].text);
		notes[i].index=i;
		if((list.type&2)&&(notes[i].checked)) continue; // don't show checked items
		listItem=document.createElement('li');
		listItem.index=i;
		if(list.type&2) { // checkbox list
		    var itemBox=document.createElement('input');
	 	    itemBox.setAttribute('type','checkbox');
	 	    itemBox.index=i;
	 	    itemBox.checked=items[notes[i]].checked;
	 	    itemBox.addEventListener('change',function() {checkItem(this.index);}); // toggle item .checked property
	 	    listItem.appendChild(itemBox);
		}
		var itemText=document.createElement('span');
	 	itemText.index=i;
        itemText.innerText=items[notes[i]].text;
	 	listItem.appendChild(itemText);
	 	itemText.addEventListener('click',function(event) {
			itemIndex=notes[this.index];
			item=items[itemIndex];
			console.log('note '+itemIndex+': '+item.text+'; type '+item.type+'; index: '+item.index);
			id('noteTitle').innerHTML='note';
			console.log('note is '+item.text);
			id('noteField').value=item.text;
			id('noteUpButton').style.display='block';
			id('noteDownButton').style.display='block';
			id('deleteNoteButton').style.display='block';
			id('noteAddButton').style.display='none';
			id('noteSaveButton').style.display='block';
			showDialog('noteDialog',true);
		})
		id('list').appendChild(listItem);
	}
}
// DATA
function load() {
	var data=localStorage.getItem('ListsData');
	if(!data) {
		id('restoreMessage').innerText='no data - restore?';
		showDialog('restoreDialog',true);
		return;
	}
	items=JSON.parse(data);
	console.log(items.length+' items');
	list.path='';
	loadList();
	var today=Math.floor(new Date().getTime()/86400000);
	var days=today-backupDay;
	if(days>15) days='ages';
	if(days>4) { // backup reminder every 5 days
		id('backupMessage').innerText=days+' since last backup';
		toggleDialog('backupDialog',true);
	}
	/* OLD OPFS METHOD
	root=await navigator.storage.getDirectory();
	console.log('OPFS root directory: '+root);
	var persisted=await navigator.storage.persist();
	console.log('persisted: '+persisted);
	var handle=await root.getFileHandle('ListsData');
	var file=await handle.getFile();
	console.log('read from file '+file);
	var loader=new FileReader();
    loader.addEventListener('load',function(evt) {
    	var data=evt.target.result;
    	console.log('data: '+data.length+' bytes');
    	// var json=JSON.parse(data);
    	// items=json.items;
    	items=JSON.parse(data);
		console.log(items.length+' items');
		list.path='';
		loadList();
    });
    loader.addEventListener('error',function(event) {
    	console.log('load failed - '+event);
    });
	loader.readAsText(file);
	*/
}
function save() {
	var data=JSON.stringify(items);
	window.localStorage.setItem('ListsData',data);
	console.log('data saved');
}
/*
function save() {
	var handle=await root.getFileHandle('ListsData',{create:true});
	var data=JSON.stringify(items);
	var writable=await handle.createWritable();
    await writable.write(data);
    await writable.close();
	console.log('data saved to ListsData');
}
*/
id('backupButton').addEventListener('click',function() {showDialog('dataDialog',false); backup();});
id('restoreButton').addEventListener('click',function() {showDialog('restoreDialog',true)});
id("fileChooser").addEventListener('change', function() {
	var file=id('fileChooser').files[0];
	console.log("file: "+file+" name: "+file.name);
	var fileReader=new FileReader();
	fileReader.addEventListener('load', function(evt) {
		console.log("file read: "+evt.target.result);
	  	var data=evt.target.result;
		var json=JSON.parse(data);
		items=json.items;
		console.log(items.length+" items loaded");
		save(); // WAS writeData();
		console.log('data imported and saved');
		showDialog('restoreDialog',false);
		load();
  	});
  	fileReader.readAsText(file);
  	
});
id('confirmBackup').addEventListener('click',backup);
function backup() {
  	var fileName="ListsData.json";
	data={'items': items};
	var json=JSON.stringify(data);
	var blob=new Blob([json], {type:"data:application/json"});
  	var a=document.createElement('a');
	a.style.display='none';
    var url=window.URL.createObjectURL(blob);
	console.log(fileName+" ready to save: "+blob.size+" bytes");
   	a.href=url;
   	a.download=fileName;
    document.body.appendChild(a);
    a.click();
}
// START-UP CODE
backupDay=window.localStorage.getItem('backupDay');
if(backupDay) console.log('last backup on day '+backupDay);
else backupDay=0;
load();
/*
var data=window.localStorage.getItem('items');
if(data && data!='undefined') {
	console.log('JSON: '+data);
	items=JSON.parse(data);
	console.log(items.length+' items');
	list.path='';
	loadList();
}
else showDialog('importDialog',true);
*/
// implement service worker if browser is PWA friendly
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
} else { //Register the ServiceWorker
	navigator.serviceWorker.register('sw.js', {
		scope: '/Lists/'
	}).then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}