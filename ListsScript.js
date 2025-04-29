function id(el) {
	return document.getElementById(el);
}
'use strict';
// GLOBAL VARIABLES	
// var db=null;
var lists=[]; // array of list items
var notes=[]; // array of note items
var items=[];
var item=null;
var itemIndex;
var list={};
// var currentListItem=null;
var currentDialog='displayDialog';
var depth=0;
var path=[];
var lastSave=null;
var months="JanFebMarAprMayJunJulAugSepOctNovDec";
var dragStart={};

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
        list.id=list.owner;
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

// DISPLAY MESSAGES
function display(message) {
	id('message').innerText=message;
	showDialog('displayDialog',true);
}

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
		// if((lists.length>0)||(notes.length>0)) { // can only delete empty lists
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
	item.owner=list.id;
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
    item.owner=list.id;
    item.type=1;
	showDialog('listDialog',true);
})
id('addNoteButton').addEventListener('click',function() {
	showDialog('noteDialog',true);
})

// MOVE UP/DOWN
id('noteUpButton').addEventListener('click', function() {move(true);})
id('noteDownButton').addEventListener('click', function() {move(false);})
function move(up) { // move note up/down
	// for(var i in notes) console.log('note '+i+': '+notes[i].text+' id: '+notes[i].id);
	console.log('move note '+item.id+' index: '+item.index+'; up is '+up);
    if(up && item.index<1) return; // cannot move up if already first...
    if(!up && (notes.length-item.index<2)) return; // ...or down if already last
    if(up) item.index--; // shift this item up...
    else item.index++; // ...or down
    items[itemIndex]=item;
    /*
    var dbTransaction=db.transaction('items',"readwrite");
    var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var putRequest=dbObjectStore.put(item);
	putRequest.onsuccess=function(event) {
		console.log('note '+item.id+" updated - index:"+item.index+' type:'+item.type+' owner:'+item.owner);
		// now move item above/below
		if(up) {itemIndex--;}
		else {itemIndex++;}
		item=notes[itemIndex];
		if(up) item.index++;
		else item.index--;
		items[notes[itemIndex]]=item;
		/*
		putRequest=dbObjectStore.put(item);
		putRequest.onsuccess=function(event) {
			console.log('note '+item.id+" updated - index:"+item.index+' type:'+item.type+' owner:'+item.owner);
			showDialog('noteDialog',false);
			loadList();
		}
		putRequest.onerror=function(event) {console.log("error updating note "+item.index);}
		*/
	console.log('note updated - index:'+item.index+' type:'+item.type+' path:'+item.path);
	showDialog('noteDialog',false);
	//putRequest.onerror=function(event) {console.log("error updating note "+item.index);}
}

// NOTE
id('noteAddButton').addEventListener('click',function() {
	item.text=id('noteField').value;
	item.path=list.path;
	items.push(item);
	console.log("new note:"+item.text+"type:"+item.type+" path:"+item.path+" added");
	/*
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var addRequest=dbObjectStore.add(item);
	addRequest.onsuccess=function(event) {
		item.id=event.target.result;
		console.log("new note:"+item.text+"type:"+item.type+" owner:"+item.owner+" added - id is "+item.id);
		loadList();
	};
	addRequest.onerror=function(event) {console.log("error adding new note");};
	*/
	showDialog('noteDialog',false);
	saveData();
	loadList();
})
id('noteSaveButton').addEventListener('click',function() {
	item.text=id('noteField').value;
	console.log('save note '+item.text);
	items[itemIndex]=item;
	/* OLD CODE...
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var putRequest=dbObjectStore.put(item);
	putRequest.onsuccess=function(event) {
		console.log('note '+item.index+" updated");
		loadList();
	};
	putRequest.onerror=function(event) {console.log("error updating note "+item.index);};
	*/
	console.log('note updated');
	loadList();
	showDialog('noteDialog',false);
})
id('deleteNoteButton').addEventListener('click',function() {
	/*
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var request=dbObjectStore.delete(item.id);
	request.onsuccess=function(event) {
		console.log('note deleted');
		showDialog('noteDialog',false);
		loadList();
	}
	request.onerror=function(event) {console.log('error deleting note')};
	*/
})

// LIST
id('listAddButton').addEventListener('click',function() {
	if(id('checkBoxes').checked) item.type|=2;
	if(id('checkAlpha').checked) item.type|=4;
	console.log('list type: '+item.type);
	item.text=id('listField').value;
	items.push(item);
	/*
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var addRequest=dbObjectStore.add(item);
	addRequest.onsuccess=function(event) {
		item.id=event.target.result;
		console.log("new list added - id is "+item.id);
		loadList();
	};
	addRequest.onerror=function(event) {console.log("error adding new list");};
	*/
	showDialog('listDialog',false);
})
id('listSaveButton').addEventListener('click',function() {
	if(id('checkBoxes').checked) item.type|=2;
	if(id('checkAlpha').checked) item.type|=4;
	console.log('list type: '+item.type);
	item.text=id('listField').value;
	logs[itemIndex]=item;
	/*
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var putRequest=dbObjectStore.put(item);
	putRequest.onsuccess=function(event) {
		console.log('list '+item.index+" updated");
		loadList();
	};
	putRequest.onerror=function(event) {console.log("error updating list "+item.index);};
	*/
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
	/*
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var delRequest=dbObjectStore.delete(list.id);
	delRequest.onsuccess=function(event) {
		console.log('list deleted');
		showDialog('listDialog',false);
		depth--;
		path.pop();
		list.id=list.owner;
		console.log('back to list '+list.id);
		loadList();
	}
	delRequest.onerror=function(event) {console.log('error deleting list')};
	*/
})
/* id('cancelListButton').addEventListener('click',function() {
    showDialog('listDialog',false);
}) */

function checkItem(n) {
    notes[n].checked=!notes[n].checked;
    console.log(notes[n].text+" checked is "+notes[n].checked);
    item=items[notes[n]];
    item.checked=notes[n].checked;
    items[notes[n]]=item;
    /* update database
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var getRequest=dbObjectStore.get(notes[n].id);
	getRequest.onsuccess=function(event) otes[n{
	    var data=event.target.result;
        data.checked=notes[n].checked;
        var putRequest=dbObjectStore.put(data);
		putRequest.onsuccess=function(event) {
			console.log('item '+notes[n].text+" updated");
		};
		putRequest.onerror=function(event) {console.log("error updating item "+notes[n].text);};
	}
	getRequest.onerror=function(event) {console.log('error getting item')};
	*/
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
	if((lists.length<1)&&(notes.length<1)) { // no data: restore backup?
		console.log("no data - restore backup?");
		showDialog('importDialog',true);
		return;
	}
	else populateList();
	/* OLD CODE...
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var item={};
	if(list.id!==null) {
		console.log("get list item "+list.id);
		var request=dbObjectStore.get(list.id);
		request.onsuccess=function() {
			item=event.target.result;
			console.log("list item "+item.text+"; type: "+item.type+"; owner: "+item.owner);
			var t=item.text;
			list.name=t;
			list.type=item.type;
			
			if(path) {
				owner=path[0];
				var i=1;
				while(i<path.length) owner+='.'+path[i++];
				console.log('owner: '+owner+'; path: '+path);
			}
		};
		request.onerror=function() {console.log("error retrieving item "+list.id);}
	}
	else {
	    list.name="Lists";
	    list.type=1;
	    owner='';
	}
	lists=[];
	notes=[];
	request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {
		var cursor=event.target.result;
		if(cursor) {
			if(cursor.value.owner==list.id) { // just items in this list
				// NEW CODE TO MAKE NEW DATA SET...
				var log={};
				log.owner=owner;
				log.text=cursor.value.text;
				log.type=cursor.value.type;
				log.index=cursor.value.index;
				logs.push(log);
				
				if(cursor.value.type<1) notes.push(cursor.value); // add to notes[] if type 0...
				else lists.push(cursor.value); // ...otherwise add to lists[]
				// items.push(cursor.value);
				console.log("item id: "+cursor.value.id+"; index: "+cursor.value.index+"; "+cursor.value.text+"; type: "+cursor.value.type+"; owner: "+cursor.value.owner);
			}
			cursor.continue ();
		}
		else {
			console.log("No more entries! "+lists.length+" lists; "+notes.length+' notes');
			// NEW CODE TO MAKE NEW DATA SET...
			var data=JSON.stringify(logs);
			window.localStorage.setItem('items',data);
			
			populateList();
		}
	}
	*/
}

// POPULATE LIST
function populateList() {
    var listItem;
    // var listPath;
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
	 		// itemIndex=this.index;
	 		// item=items[lists[itemIndex]];
	 		// console.log('open list '+lists[itemIndex]);
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
		console.log('note '+i+': '+items[notes[i].text]);
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
			itemIndex=this.index;
			item=items[notes[itemIndex]];
			console.log('note '+itemIndex+': '+item.text+'; type '+item.type);
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
id('backupButton').addEventListener('click',function() {showDialog('dataDialog',false); backup();});
id('importButton').addEventListener('click',function() {showDialog('importDialog',true)});
/* id('dataCancelButton').addEventListener('click',function() {showDialog('dataDialog',false)}); */

// RESTORE BACKUP
id("fileChooser").addEventListener('change', function() {
	var file=id('fileChooser').files[0];
	console.log("file: "+file+" name: "+file.name);
	var fileReader=new FileReader();
	fileReader.addEventListener('load', function(evt) {
		console.log("file read: "+evt.target.result);
	  	var data=evt.target.result;
		items=JSON.parse(data);
		console.log(items.length+" items loaded");
		saveData();
		console.log('data imported and saved');
		/* OLD CODE...
		var dbTransaction=db.transaction('items',"readwrite");
		var dbObjectStore=dbTransaction.objectStore('items');
		for(var i=0;i<items.length;i++) {
			console.log("save "+items[i].text);
			var request=dbObjectStore.add(items[i]);
			request.onsuccess=function(e) {
				console.log(items.length+" items added to database");
			};
			request.onerror=function(e) {console.log("error adding item");};
		}
		*/
		showDialog('importDialog',false);
		display("backup imported - restart");
  	});
  	fileReader.readAsText(file);
});

// BACKUP
function backup() {
  	var fileName="ListsData.json";
	/* OLD CODE...
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var request=dbObjectStore.openCursor();
	var items=[];
	dbTransaction=db.transaction('items',"readwrite");
	console.log("indexedDB transaction ready");
	dbObjectStore=dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {  
		var cursor=event.target.result;  
    		if(cursor) { // read in every item
			    items.push(cursor.value);
			    cursor.continue();  
    		}
		else {
			console.log(items.length+" items - save");
			var data={'items': items};
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
			display(fileName+" saved to downloads folder");
			lastSave=date.getMonth();
			window.localStorage.setItem('lastSave',lastSave); // remember month of backup
		}
	}
	*/
	// NEW CODE...
	var data={'items': items};
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
	display(fileName+" saved to downloads folder");
}

// SAVE DATA
function saveData() {
	var data=JSON.stringify(items);
	window.localStorage.setItem('items',data);
	console.log('data saved');
}

// START-UP CODE
// lastSave=window.localStorage.getItem('lastSave');
// console.log("last save: "+lastSave);
// load items from database
/* OLD CODE...
var request=window.indexedDB.open("listsDB");
request.onsuccess=function (event) {
	db=event.target.result;
	console.log("DB open");
	var dbTransaction=db.transaction('items','readwrite');
	console.log("indexedDB transaction ready");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	// NEW CODE TO BUILD AND SAVE ARRAY OF ITEMS
	console.log('create item array');
	items=[];
	ids=[];
	paths=[];
	var p; // parent/path
	var request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {
		var cursor=event.target.result;
		if(cursor) {
			p=cursor.value.owner;
			if(p==null) p=''; // top-level items have no owner
			else {
				var n=ids.indexOf(p);
				p=paths[n];
			}
			if(cursor.value.type>0) { // a list item - add to ids and paths arrays
				ids.push(cursor.value.id);
				if(p.length>0) paths.push(p+'.'+cursor.value.text);
				else paths.push(cursor.value.text);
				console.log('add id & path; array sizes: '+ids.length+', '+paths.length);
			}
			item={};
			item.path=p;
			item.type=cursor.value.type;
			item.text=cursor.value.text;
			if(cursor.value.index) item.index=cursor.value.index;
			if(cursor.value.checked) item.checked=cursor.value.checked;
			items.push(item);
			console.log('add item '+item.text);
			cursor.continue();
		}
		else { // all items processed - save items
			console.log('no more items - save items[]');
			var data=JSON.stringify(items);
			window.localStorage.setItem('items',data);
			console.log('saved');
		}
		
		// list.id=list.owner=null;
		// loadList();
	};
};
request.onupgradeneeded=function(event) {
	db=event.currentTarget.result;
	if(!db.objectStoreNames.contains('items')) {
		var dbObjectStore=db.createObjectStore("items",{ keyPath:"id",autoIncrement:true });
		console.log("items store created");
	}
	else console.log("items store exists");
	console.log("database ready");
}
request.onerror=function(event) {
	alert("indexedDB error code "+event.target.errorCode);
};
*/
// NEW CODE...
var data=window.localStorage.getItem('items');
if(data && data!='undefined') {
	console.log('JSON: '+data);
	items=JSON.parse(data).items;
	console.log(items.length+' items');
	list.path='';
	loadList();
}
else showDialog('importDialog',true);
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