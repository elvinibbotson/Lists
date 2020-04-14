function id(el) {
	// console.log("return element whose id is "+el);
	return document.getElementById(el);
}

'use strict';
	
// GLOBAL VARIABLES	
var db=null;
var items=[];
var item=null;
var itemIndex=0;
var listName='List';
var currentListItem=null;
var mode='edit';
var lastSave=null;
var months="JanFebMarAprMayJunJulAugSepOctNovDec";
var dragStart=0;
// var dragEnd=0;

// DRAG TO CHANGE MODE
id('main').addEventListener('touchstart', function(event) {
    // console.log(event.changedTouches.length+" touches");
    dragStart=event.changedTouches[0].clientX;
    // console.log('start drag at '+dragStart);
})

id('main').addEventListener('touchend', function(event) {
    // console.log(evt.changedTouches.length+" touches");
    // dragEnd=evt.changedTouches[0].clientX;
    // console.log("end drag at "+dragEnd);
    var drag=dragStart-event.changedTouches[0].clientX;
    console.log("dragged "+drag);
    if(drag<-20) { // drag right
        if(mode=='list') setMode('edit');
        else if(mode=='shop') setMode('list');
    }
    else if(drag>20) {  // drag left
        if(mode=='edit') setMode('list');
        else if(mode=='list') setMode('shop');
    }
})

/* EDIT MODE
id('editButton').addEventListener('click', function() {
    setMode('edit');
})

// LIST MODE
id('listButton').addEventListener('click', function() {
    setMode('list');
})

// SHOP MODE
id('shopButton').addEventListener('click', function() {
    setMode('shop');
})
*/

// SET MODE
function setMode(m) {
    console.log("set mode to "+m);
    mode=m;
    window.localStorage.setItem('mode',mode); // remember mode
    save();
}

// MOVE ITEM UP
id('upButton').addEventListener('click', function() {
    console.log("move "+item.text+" up");
    items.splice(itemIndex,1); // remove from original slot...
    items.splice(itemIndex-1,0,item); // ...and insert a slot higher
    populateList();
    itemIndex--;
    showControls();
})

// MOVE ITEM DOWN
id('downButton').addEventListener('click', function() {
    console.log("move "+item.text+" down below item "+(itemIndex+1));
    items.splice(itemIndex,1); // remove from original slot...
    items.splice(itemIndex+1,0,item); // ...and insert a slot lower
    populateList();
    itemIndex++;
    showControls();
})

// ADD BUTTON
id('addButton').addEventListener('click', function() {
    id('itemField').value="";
    id('clue').innerHTML=items[itemIndex].text;
    id('addDialog').style.display='block';
})

// INSERT NEW ITEM
id('saveButton').addEventListener('click', function() {
    item={};
    item.checked=false;
    item.text=id('itemField').value;
    // check no items with this text
    console.log("check "+item.text+" is new");
    for(var i in items) {
        // console.log(i+": "+items[i].text);
        if(items[i].text==item.text) alert('already exists');
    }
	console.log('insert '+item.text+" before "+items[itemIndex].text);
	items.splice(itemIndex,0,item);
	for(i in items) console.log(i+": "+items[i].text);
	populateList();
	currentListItem.style.backgroundColor='white';
	id('addDialog').style.display='none';
	id('controls').style.display='none';
});

// CANCEL ADD
id('cancelButton').addEventListener('click', function() {
    console.log("cancel add");
    id('addDialog').style.display='none';
    id('controls').style.display='none';
})

// DELETE ITEM
id('deleteButton').addEventListener('click', function() {
    console.log("delete item "+itemIndex+" - "+items[itemIndex].text); // delete item
    items.splice(itemIndex,1);
    populateList();
    id('controls').style.display='none';
})

// EDIT SELECTED ITEM
function showControls() {
    itemIndex=parseInt(itemIndex);
	item=items[itemIndex];
	console.log("edit item: "+itemIndex+" - "+item.text);
	if(currentListItem) currentListItem.style.backgroundColor='white'; // deselect any previously selected item
	currentListItem=id('list').children[itemIndex];
	currentListItem.style.backgroundColor='yellow'; // highlight new selection
	id('controls').style.display='block';
}
  
// POPULATE ITEMS LIST
function populateList() {
	console.log("populate list - mode is "+mode+"; "+items.length+" items");
	id('list').innerHTML=""; // clear list
	var html="";
	for(var i in items) {
	    // console.log("list item "+i+" "+items[i].text+" checked:"+items[i].checked);
	    if((mode=='shop')&&(!items[i].checked)) continue;
	    var listItem = document.createElement('li');
		listItem.index=i;
	 	listItem.classList.add('list-item');
	 	html=""
	 	switch(mode) {
	 	    case 'edit':
	 	        listItem.addEventListener('click', function(){itemIndex=this.index; showControls();});
	 	        break;
	 	    default:
	 	        html="<input type='checkbox'";
	 	        if((mode=='list')&&(items[i].checked)) html+=" checked>";
	 	        else html+=">";
	 	        listItem.addEventListener('click', function(){
	 	            items[this.index].checked=!items[this.index].checked;
	 	            console.log("checked: "+items[this.index].checked);
	 	        });
	 	}
		html+=items[i].text+"<br>";
		// console.log("item html: "+html);
		listItem.innerHTML=html;
		id('list').appendChild(listItem);
		// console.log("list item "+i+": "+items[i].text);
	}
	id('editButton').style.backgroundColor='silver';
	id('listButton').style.backgroundColor='silver';
    id('shopButton').style.backgroundColor='silver';
	switch(mode) {
	    case 'edit':
	        id('editButton').style.backgroundColor='white';
	        break;
	    case 'list':
	        id('listButton').style.backgroundColor='white';
	        break;
	    case 'shop':
	        id('shopButton').style.backgroundColor='white';
	}
	id('controls').style.display='none';
	if(items.length<1) id('addDialog').style.display='block';
	var today=new Date();
	if(today.getMonth()!=lastSave) backup(); // backup every month
}

// UPDATE DATABASE
function save() {
    console.log("SAVE");
    var request = window.indexedDB.open("listDB"); // update database
    request.onsuccess = function(event) {
        // console.log("request: "+request);
        db=event.target.result;
        // console.log("DB open");
        var dbTransaction = db.transaction('items',"readwrite");
        // console.log("indexedDB transaction ready");
        var dbObjectStore = dbTransaction.objectStore('items');
        // console.log("indexedDB objectStore ready");
        var request=dbObjectStore.clear(); // clear database
        request.onsuccess=function(event) {
            for(var i in items) {
                items[i].id=i;
                var request=dbObjectStore.add(items[i]); // update log in database
                console.log(i+": "+items[i].text);
    		    request.onsuccess=function(event)  {
    	    		// console.log("item "+i+" added - "+items[i].text);
    	    	};
	    	    request.onerror = function(event) {console.log("error adding "+items[i].text);};
	        }
        }
        request.onerror = function(event) {console.log("error clearing database"+item);};
	    populateList(); // rebuild list for new mode
    }
    request.onupgradeneeded = function(event) {
	    var dbObjectStore = event.currentTarget.result.createObjectStore("items", { keyPath: "id", autoIncrement: true });
        console.log("new items ObjectStore created");
    };
    request.onerror = function(event) {
	    alert("indexedDB error");
    };
}

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
		    items[i].id=i;
			console.log("add "+items[i].text);
			var request=dbObjectStore.add(items[i]);
			request.onsuccess=function(e) {
				console.log(items.length+" items added to database");
			};
			request.onerror=function(e) {console.log("error adding item");};
		}
		id('importDialog').style.display='none';
		alert("backup imported - restart");
  	});
  	fileReader.readAsText(file);
});

// CANCEL RESTORE
id('buttonCancelImport').addEventListener('click', function() {
    id('importDialog').style.display='none';
});

// BACKUP
function backup() {
  	console.log("EXPORT");
	var fileName="list.json";
	var dbTransaction=db.transaction('items',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	var request=dbObjectStore.openCursor();
	var items=[];
	dbTransaction=db.transaction('items',"readwrite");
	console.log("indexedDB transaction ready");
	dbObjectStore=dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	request=dbObjectStore.openCursor();
	request.onsuccess=function(event) {  
		var cursor=event.target.result;  
    		if(cursor) {
			    items.push(cursor.value);
			    // console.log("log "+cursor.value.id+", date: "+cursor.value.date+", "+cursor.value.text);
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
console.log("STARTING");
mode=window.localStorage.getItem('mode'); // recover last mode...
if(mode==null) mode='edit';
lastSave=window.localStorage.getItem('lastSave'); // ...and month of last backup
console.log("mode: "+mode+"; lastSave: "+lastSave);
window.setInterval(save,60000); // save changes to database every minute
var request = window.indexedDB.open("listDB"); // open database and load items
request.onsuccess = function(event) {
    console.log("request: "+request);
    db=event.target.result;
    console.log("DB open");
    var dbTransaction = db.transaction('items',"readwrite");
    console.log("indexedDB transaction ready");
    var dbObjectStore = dbTransaction.objectStore('items');
    console.log("indexedDB objectStore ready");
    // code to read items from database
    items=[];
    console.log("items array ready");
    var request=dbObjectStore.openCursor();
    request.onsuccess = function(event) {  
	    var cursor = event.target.result;  
        if(cursor) {
    		items.push(cursor.value);
    		// console.log("item: "+cursor.value.text+"/"+cursor.value.checked);
	    	cursor.continue();  
        }
    	else {
    		console.log("No more entries - "+items.length+" items");
    		if(items.length<1) {
			    console.log("initialise with first item - bread");
			    items=[{text: 'bread', checked: false}];
			    id('importDialog').style.display='block'; // offer to restore from backup
			}
			else {
			    for(var i in items) {
			        console.log(i+": "+items[i].text);
			    }
			}
    		console.log('build list');
    	    populateList();
	    }
    }
}
request.onupgradeneeded = function(event) {
    event.currentTarget.result.deleteObjectStore("items");
    console.log("***CREATE NEW ITEMS OBJECT STORE***");
    var dbObjectStore=event.currentTarget.result.createObjectStore("items",{keyPath:'id'});
	// var dbObjectStore = event.currentTarget.result.createObjectStore("items", { keyPath: "id", autoIncrement: true });
    console.log("new items ObjectStore created");
};
request.onerror = function(event) {
	alert("indexedDB error");
};
// implement service worker if browser is PWA friendly 
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
}
else { //Register the ServiceWorker
	navigator.serviceWorker.register('listSW.js', {
	    scope: '/List/'
    }).then(function(reg) {
	    console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}