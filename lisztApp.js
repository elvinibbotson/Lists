function id(el) {
	return document.getElementById(el);
}
'use strict';
// GLOBAL VARIABLES	
var db=null;
var items=[];
var item=null;
var itemIndex=0;
var list={};
var currentListItem=null;
var currentDialog=null;
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
        if(depth<1) list.id=list.owner=null;
        console.log('list.id: '+list.id+' path: '+path+' depth: '+depth);
        loadListItems();
    }
    else if((drag.x>50)&&(depth>0)&&list.type%4==3) {  // drag left to change checklist to 'shopping' view
        console.log("switch to 'check' view");
        path.push('CHECK');
        populateList(true);
    }
})

// SHOW/HIDE DIALOG
function showDialog(dialog,show) {
    console.log('show '+dialog+': '+show);
    if(currentDialog) id(currentDialog).style.display='none';
    if(show) {
        id(dialog).style.display='block';
        currentDialog=dialog;
    }
    else {
        id(dialog).style.display='none';
        currentDialog=null;
    }
}

// TAP ON HEADER
id('heading').addEventListener('click',function() {
	if(depth>0) { // list heading - show item edit dialog
		id('listTitle').innerHTML='list';
		id(listField.value=list.name);
		console.log('edit list header - '+items.length+' items');
		id('checkAlpha').checked=list.type&2;
		id('checkBoxes').checked=list.type&4;
		if(items.length>0) { // can only delete empty lists
			id('deleteListButton').style.display='none';
			console.log('disable delete');
		}
		else id('deleteListButton').style.display='block';
		id('listUpButton').style.display='none';
		id('listDownButton').style.display='none';
		showDialog('listDialog',true);
	}
	else showDialog('dataDialog',true);
});

// ADD NEW ITEMS
id('buttonNew').addEventListener('click', function(){
    if(depth<2 && list.type>0) { // list above depth 2 - can add sub-list
        showDialog('addDialog',true);
    }
    else {
        item=null;
        id('noteTitle').innerHTML='new note';
        id('noteField').value='';
        id('noteDownButton').style.display='none';
		id('noteUpButton').style.display='none';
		id('deleteNoteButton').style.display='none';
        showDialog('noteDialog',true);
    }
})
id('addListButton').addEventListener('click',function() {
	id('listTitle').innerHTML='new list';
	id('listField').value='';
	id('checkAlpha').checked=false;
	id('checkBoxes').checked=false;
	id('listDownButton').style.display='none';
	id('listUpButton').style.display='none';
	id('deleteListButton').style.display='none';
	item={};
    item.owner=list.id;
    item.type=1;
	showDialog('listDialog',true);
})
id('addNoteButton').addEventListener('click',function() {
	item=null;
	id('noteTitle').innerHTML='new note';
	id('noteField').value='';
	id('noteDownButton').style.display='none';
	id('noteUpButton').style.display='none';
	id('deleteNoteButton').style.display='none';
	item={};
	item.owner=list.id;
	item.type=list.type-1;
	showDialog('noteDialog',true);

})
id('cancelAddButton').addEventListener('click',function() {
	showDialog('addDialog',false);
})

// MOVE UP/DOWN
id('listUpButton').addEventListener('click', function() {move(true);})
id('listDownButton').addEventListener
id('noteUpButton').addEventListener('click', function() {move(true);})
id('noteDownButton').addEventListener('click', function() {move(false);})
function move(up) { // move list/note item up/down
	console.log('move item type '+item.type);
    if(up && itemIndex<1) return; // cannot move up if already first...
    if(!up && (items.length-itemIndex<2)) return; // ...or down if already last
    console.log("move "+item.text+(up)?" up":" down");
    if(up) item.index--; // shift this item up...
    else item.index++; // ...or down
    var dbTransaction=db.transaction('items',"readwrite");
    var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
    var getRequest=dbObjectStore.get(item.id);
	getRequest.onsuccess=function(event) {
	    var data=event.target.result;
        if(up) data.index--;
        else data.index++;
        var putRequest=dbObjectStore.put(data);
		putRequest.onsuccess=function(event) {
			console.log('item '+item.index+" updated");
		};
		putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
	}
	getRequest.onerror=function(event) {console.log('error getting item')};
    if(up) {
    	item=items[itemIndex-1]; // shift previous item down...
    	item.index++;
    }
    else {
    	item=items[itemIndex+1]; // ...or next item up
    	item.index--;
    }
    getRequest=dbObjectStore.get(item.id);
	getRequest.onsuccess=function(event) {
	    var data=event.target.result;
        if(up) data.index++;
        else data.index--;
        putRequest=dbObjectStore.put(data);
		putRequest.onsuccess=function(event) {
			console.log('item '+item.index+" updated");
		};
		putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
	}
	getRequest.onerror=function(event) {console.log('error getting item')};
    populateList();
    if(up) itemIndex--;
    else itemIndex++;
}

// NOTE
id('confirmNoteButton').addEventListener('click',function() {
	item.text=id('noteField').value;
	item.type=0;
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	if(item.id) { // editing note
		var getRequest=dbObjectStore.get(item.id);
		getRequest.onsuccess=function(event) {
	    	var data=event.target.result;
        	data.text=item.text;
        	data.type=item.type;
        	var putRequest=dbObjectStore.put(data);
			putRequest.onsuccess=function(event) {
				console.log('note '+item.index+" updated");
			};
			putRequest.onerror=function(event) {console.log("error updating note "+item.index);};
		}
		getRequest.onerror=function(event) {console.log('error getting list')};
	}
	else { // no id so adding new note
		var addRequest=dbObjectStore.add(item);
		addRequest.onsuccess=function(event) {
			item.id=event.target.result;
			console.log("new note "+item.text+" added - id is "+item.id);
		};
		addRequest.onerror=function(event) {console.log("error adding new note");};
	}
	showDialog('noteDialog',false);
	itemIndex=null;
    currentListItem=null;
	loadListItems();
})
id('deleteNoteButton').addEventListener('click',function() {
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var request=dbObjectStore.delete(item.id);
	request.onsuccess=function(event) {
		console.log('note deleted');
		showDialog('noteDialog',false);
		loadListItems();
	}
	request.onerror=function(event) {console.log('error deleting note')};
})
id('cancelNoteButton').addEventListener('click',function() {
    showDialog('noteDialog',false);
})

// LIST
id('confirmListButton').addEventListener('click',function() {
	if(id('checkBoxes').checked) item.type|=2;
	if(id('checkAlpha').checked) item.type|=4;
	console.log('list type: '+item.type);
	item.text=id('listField').value;
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	if(item.id) { // editing list
		var getRequest=dbObjectStore.get(item.id);
		getRequest.onsuccess=function(event) {
	    	var data=event.target.result;
        	data.text=item.text;
        	data.type=item.type;
        	var putRequest=dbObjectStore.put(data);
			putRequest.onsuccess=function(event) {
				console.log('list '+item.index+" updated");
			};
			putRequest.onerror=function(event) {console.log("error updating list "+item.index);};
		}
		getRequest.onerror=function(event) {console.log('error getting list')};
	}
	else { // no id so adding new list
		var addRequest=dbObjectStore.add(item);
		addRequest.onsuccess=function(event) {
			item.id=event.target.result;
			console.log("new list added - id is "+item.id);
		};
		addRequest.onerror=function(event) {console.log("error adding new list");};
	}
	showDialog('listDialog',false);
	itemIndex=null;
    currentListItem=null;
	loadListItems();
})
id('deleteListButton').addEventListener('click',function() {
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
		loadListItems();
	}
	delRequest.onerror=function(event) {console.log('error deleting list')};
})
id('cancelListButton').addEventListener('click',function() {
    showDialog('listDialog',false);
})

// POPULATE LIST
function populateList() {
    var listItem;
    id("list").innerHTML=""; // clear list
	console.log("populate list for path "+path+" with "+items.length + " items - depth: "+depth);
	console.log('list type is '+list.type);
	if(path.length<1)
    id('heading').innerHTML=list.name;
	else {
	    id('heading').innerHTML=path[0];
	    var i=1;
	    while(i<path.length) {
	        id('heading').innerHTML+='.'+path[i++];
	    }
	}
	// separate into lists and notes
	var listItems=[];
	var noteItems=[];
	for(var i in items) {
		if(items[i].type>0) listItems.push(items[i]);
		else noteItems.push(items[i]);
	}
	// show lists first, sorted alphabetically
	listItems.sort(function(a,b){ // always sort list items alphabetically...
		if(a.text.toUpperCase()<b.text.toUpperCase()) return -1;
		if(a.text.toUpperCase()>b.text.toUpperCase()) return 1;
		return 0;
	});
	// show notes below lists - sorted alphabetically?
	if(list.type&4) noteItems.sort(function(a,b){ // sort notes alphabetically...
		if(a.text.toUpperCase()<b.text.toUpperCase()) return -1;
		if(a.text.toUpperCase()>b.text.toUpperCase()) return 1;
		return 0;
	});
	else noteItems.sort(function(a,b){return a.index-b.index}); // ...or by .index
	for(var i in listItems) { // list first...
		console.log('listItem '+i+': '+listItems[i].text);
		if((list.type&2)&&(items[i].checked)) continue; // don't show checked items
		listItem=document.createElement('li');
		listItem.index=i;
		listItem.innerText=listItems[i].text;
		listItem.addEventListener('click',function() {
	 		itemIndex=this.index;
	 		item=items[itemIndex];
	 		console.log('open list '+itemIndex);
			list.id=listItems[this.index].id;
			list.type=listItems[this.index].type;
			list.name=listItems[this.index].text;
			list.owner=listItems[this.index].owner;
			console.log('open list '+list.name+' id:'+list.id+' type:'+list.type+' owner: '+list.owner);
			depth++;
			path.push(list.name);
			loadListItems();
		});
		listItem.style.fontWeight='bold'; // lists are bold
		id('list').appendChild(listItem);
	}
	for(var i in noteItems) { // ...then notes
		console.log('noteItem '+i+': '+noteItems[i].text);
		if((list.type&2)&&(items[i].checked)) continue; // don't show checked items
		listItem=document.createElement('li');
		listItem.index=i;
		if(list.type&2) { // checkbox list
		    var itemBox=document.createElement('input');
	 	    itemBox.setAttribute('type','checkbox');
	 	    itemBox.index=i;
	 	    itemBox.checked=items[i].checked;
	 	    itemBox.addEventListener('change',function() {checkItem(this.index);}); // toggle item .checked property
	 	    listItem.appendChild(itemBox);
		}
		var itemText=document.createElement('span');
	 	itemText.index=i;
        itemText.innerText=noteItems[i].text;
	 	listItem.appendChild(itemText);
	 	listItem.addEventListener('click',function() {
			itemIndex=this.index;
			item=noteItems[itemIndex];
			console.log('note item '+itemIndex+': '+item.text+'; type '+item.type);
			id('noteTitle').innerHTML='note';
			id('noteField').innerText=item.text;
			id('noteUpButton').style.display='block';
			id('noteDownButton').style.display='block';
			id('deleteNoteButton').style.display='block';
			showDialog('noteDialog',true);
		})
		console.log('add '+itemText.innerText+' to list');
		id('list').appendChild(listItem);
	}
	
	/*
	for(var i in items) {
	    if((list.type&2)&&(items[i].checked)) continue; // don't show checked items
		listItem=document.createElement('li');
		listItem.index=i;
		if(list.type&2) { // checkbox list
		    var itemBox=document.createElement('input');
	 	    itemBox.setAttribute('type','checkbox');
	 	    itemBox.index=i;
	 	    itemBox.checked=items[i].checked;
	 	    itemBox.addEventListener('change',function() {checkItem(this.index);}); // toggle item .checked property
	 	    listItem.appendChild(itemBox);
		}
		var itemText=document.createElement('span');
	 	itemText.index=i;
        itemText.innerText=items[i].text;
	 	listItem.appendChild(itemText);
	 	if(items[i].type&1) { // tap on a list to open it
		    listItem.addEventListener('click',function() {
	 	    	itemIndex=this.index;
	 	    	item=items[itemIndex];
	 	    	console.log('open list '+itemIndex);
		    	list.id=items[this.index].id;
		    	list.type=items[this.index].type;
		    	list.name=items[this.index].text;
		    	list.owner=items[this.index].owner;
		    	console.log('open list '+list.name+' id:'+list.id+' type:'+list.type+' owner: '+list.owner);
		    	depth++;
		    	path.push(list.name);
		    	loadListItems();
	 		});
		    listItem.style.fontWeight='bold'; // lists are bold
		}
		else { // tap on note to edit it
			listItem.addEventListener('click',function() {
				itemIndex=this.index;
				item=items[itemIndex];
				console.log('note item '+itemIndex+': '+item.text+'; type '+item.type);
				id('noteTitle').innerHTML='note';
				id('noteField').innerText=item.text;
				id('noteUpButton').style.display='block';
				id('noteDownButton').style.display='block';
				id('deleteNoteButton').style.display='block';
				showDialog('noteDialog',true);
			})
		}
		id('list').appendChild(listItem);
	}
	*/
}

function checkItem(n) {
    items[n].checked=!items[n].checked;
    console.log(items[n].text+" checked is "+items[n].checked);
    // update database
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var getRequest=dbObjectStore.get(items[n].id);
	getRequest.onsuccess=function(event) {
	    var data=event.target.result;
        data.checked=items[n].checked;
        var putRequest=dbObjectStore.put(data);
		putRequest.onsuccess=function(event) {
			console.log('item '+items[n].text+" updated");
		};
		putRequest.onerror=function(event) {console.log("error updating item "+item[n].text);};
	}
	getRequest.onerror=function(event) {console.log('error getting item')};
}

// LOAD LIST ITEMS
function loadListItems() {
	console.log("load children of list.id "+list.id+" - depth: "+depth+' owner: '+list.owner);
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
			if(item.secure>0) t=cryptify(t,keyCode);
			list.name=t;
			list.type=item.type;
		};
		request.onerror=function() {console.log("error retrieving item "+list.id);}
	}
	else {
	    list.name="Lists";
	    list.type=1;
	}
	items=[];
	request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {
		var cursor=event.target.result;
		if(cursor) {
			if(cursor.value.owner==list.id) { // just items in this list
				if(cursor.value.type==4) cursor.value.type=0; // **** TEMPORARY FIX ****
				items.push(cursor.value);
				console.log("item id: "+cursor.value.id+"; index: "+cursor.value.index+"; "+cursor.value.text+"; type: "+cursor.value.type+"; owner: "+cursor.value.owner);
			}
			cursor.continue ();
		}
		else {
			console.log("No more entries! "+items.length+" items");
			if(list.id===null) { // backup checks
				/* temporary code to remove wrongly numbered data
				if(items[0].id<1) {
					alert('CORRUPTED DATA: CLEAR DATABASE');
					request=dbObjectStore.clear();
				}
				*/
				if(items.length<1) { // no data: restore backup?
				    console.log("no data - restore backup?");
				    // document.getElementById('importDialog').style.display='block';
				    showDialog('importDialog',true);
				}
				else { // monthly backups
				    var today=new Date();
				    console.log('this month: '+today.getMonth()+"; last save: "+lastSave);
				    if(today.getMonth()!=lastSave) backup();
				}
			}
			populateList();
		}
	}
}

// DATA
id('backupButton').addEventListener('click',function() {showDialog('dataDialog',false); backup();});
id('importButton').addEventListener('click',function() {showDialog('importDialog',true)});
id('dataCancelButton').addEventListener('click',function() {showDialog('dataDialog',false)});

// RESTORE BACKUP
id("fileChooser").addEventListener('change', function() {
	var file=id('fileChooser').files[0];
	console.log("file: "+file+" name: "+file.name);
	var fileReader=new FileReader();
	fileReader.addEventListener('load', function(evt) {
		console.log("file read: "+evt.target.result);
	  	var data=evt.target.result;
		var json=JSON.parse(data);
		console.log("json: "+json);
		var items=json.items;
		console.log(items.length+" items loaded");
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
		showDialog('importDialog',false);
		alert("backup imported - restart");
  	});
  	fileReader.readAsText(file);
});

// CANCEL RESTORE
id('cancelImportButton').addEventListener('click', function() {
    showDialog('importDialog',false);
});

// BACKUP
function backup() {
  	var fileName="lists";
	var date=new Date();
	fileName+=date.getFullYear();
	fileName+=(date.getMonth()+1);
	fileName+=date.getDate()+".json";
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
			console.log("data ready to save: "+blob.size+" bytes");
   			a.href=url;
   			a.download=fileName;
    		document.body.appendChild(a);
    		a.click();
			alert(fileName+" saved to downloads folder");
			var today=new Date();
			lastSave=today.getMonth();
			window.localStorage.setItem('lastSave',lastSave); // remember month of backup
		}
	}
}

// START-UP CODE
lastSave=window.localStorage.getItem('lastSave');
console.log("last save: "+lastSave);
// load items from database
var request=window.indexedDB.open("listsDB");
request.onsuccess=function (event) {
	db=event.target.result;
	console.log("DB open");
	var dbTransaction=db.transaction('items','readwrite');
	console.log("indexedDB transaction ready");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	var request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {
		
		list.id=list.owner=null;
		loadListItems();
	};
};
request.onupgradeneeded=function(event) {
	var dbObjectStore=event.currentTarget.result.createObjectStore("items",{
		keyPath:'id',autoIncrement: true
	});
	console.log("items database ready");
}
request.onerror=function(event) {
	alert("indexedDB error code "+event.target.errorCode);
};
	
// implement service worker if browser is PWA friendly
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
} else { //Register the ServiceWorker
	navigator.serviceWorker.register('listsSW.js', {
		scope: '/liszt/'
	}).then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}