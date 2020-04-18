function id(el) {
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
var mode='list';
var lastSave=null;
var months="JanFebMarAprMayJunJulAugSepOctNovDec";
var dragStart={};
// var dragEnd=0;

// DRAG TO CHANGE MODE
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
    if(drag.x<-50) { // drag right
        // if(mode=='list') setMode('edit');
        // else 
        if(mode=='shop') setMode('list');
    }
    else if(drag.x>50) {  // drag left
        // if(mode=='edit') setMode('list');
        // else 
        if(mode=='list') setMode('shop');
    }
})

// SET MODE
function setMode(m) {
    alert("set mode to "+m);
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

// MORE DETAIL
id('moreButton').addEventListener('click', function() {
    console.log("more...");
    id('moreField').value=(items[itemIndex].more)?items[itemIndex].more:'';
    id('moreDialog').style.display='block';
})

// UPDATE DETAIL
id('okButton').addEventListener('click', function() {
    items[itemIndex].more=id('moreField').value;
    id('moreDialog').style.display='none';
    populateList();
})

// SHOW CONTROLS FOR EDITING
function showControls() {
    itemIndex=parseInt(itemIndex);
	item=items[itemIndex];
	console.log("edit item: "+itemIndex+" - "+item.text);
	if(currentListItem) currentListItem.style.backgroundColor='white'; // deselect any previously selected item
	if(currentListItem==id('list').children[itemIndex]) {
	    console.log("DESELECT");
	    id('controls').style.display='none';
	    currentListItem=null;
	}
	else {
	    currentListItem=id('list').children[itemIndex];
	    currentListItem.style.backgroundColor='yellow'; // highlight new selection
	    id('controls').style.display='block';
	}
	
}
  
// POPULATE ITEMS LIST
function populateList() {
	// console.log("populate list - mode is "+mode+"; "+items.length+" items");
	id('list').innerHTML=""; // clear list
	for(var i in items) {
	    if((mode=='shop')&&(!items[i].checked)) continue;
	    var listItem=document.createElement('li');
	 	listItem.classList.add('list-item');
	 	var itemBox=document.createElement('input');
	 	itemBox.setAttribute('type','checkbox');
	 	itemBox.index=i;
	 	if(mode=='list') itemBox.checked=items[i].checked;
	 	else itemBox.checked=false;
	 	itemBox.addEventListener('change',function() { // toggle item .checked property
	 	    items[this.index].checked=!items[this.index].checked;
	 	    console.log(items[this.index].text+' checked: '+items[this.index].checked);
	 	});
	 	listItem.appendChild(itemBox);
	 	var itemText=document.createElement('span');
	 	itemText.index=i;
	 	itemText.innerText=items[i].text;
	 	if(items[i].more) itemText.innerText+=': '+items[i].more;
	 	if(mode=='list') itemText.addEventListener('click',function() {
	 	    itemIndex=this.index;
	 	    showControls();
	 	});
	 	listItem.appendChild(itemText);
		id('list').appendChild(listItem);
	}
	alert(items.length+" items - mode: "+mode);
	id('listTab').style.backgroundColor=(mode=='list')?'white':'silver';
    id('shopTab').style.backgroundColor=(mode=='list')?'silver':'white';
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
        db=event.target.result;
        var dbTransaction=db.transaction('items',"readwrite");
        var dbObjectStore=dbTransaction.objectStore('items');
        var request=dbObjectStore.clear(); // clear database
        request.onsuccess=function(event) {
            for(var i in items) {
                items[i].id=i;
                var request=dbObjectStore.add(items[i]); // update log in database
                // console.log(i+": "+items[i].text);
    		    request.onsuccess=function(event)  {
    	    		// console.log("item "+i+" added - "+items[i].text);
    	    	};
	    	    request.onerror = function(event) {console.log("error adding "+items[i].text);};
	        }
        }
        request.onerror=function(event) {console.log("error clearing database"+item);};
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
if(mode==null) mode='list';

mode='list';

lastSave=window.localStorage.getItem('lastSave'); // ...and month of last backup
alert("mode: "+mode+"; lastSave: "+lastSave);
window.setInterval(save,60000); // save changes to database every minute
var request = window.indexedDB.open("listDB",4); // open database and load items
request.onsuccess = function(event) {
    console.log("request: "+request);
    db=event.target.result;
    console.log("DB open - version "+db.version);
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
			        console.log(i+": "+items[i].text+' checked: '+items[i].checked);
			    }
			}
    		console.log('build list');
    	    populateList();
	    }
    }
}
request.onupgradeneeded = function(event) {
    // event.currentTarget.result.deleteObjectStore("items");
    console.log("***CREATE NEW ITEMS OBJECT STORE***");
    var dbObjectStore=event.currentTarget.result.createObjectStore("items",{keyPath:'id'});
	// var dbObjectStore = event.currentTarget.result.createObjectStore("items", { keyPath: "id", autoIncrement: true });
    alert("new items ObjectStore created");
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