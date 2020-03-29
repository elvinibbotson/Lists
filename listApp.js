function id(el) {
	// console.log("return element whose id is "+el);
	return document.getElementById(el);
}

'use strict';
	
// GLOBAL VARIABLES	
var db=null;
var items=[];
var item=null;
var listIndex=null;
var listName='List';
var mode=null;
var lastSave=null;

// EVENT LISTENERS
id("main").addEventListener('click', function() {
	id("menu").style.display="none";
})
  
id('menuButton').addEventListener('click', function() { // MENU BUTTON
	var display = id("menu").style.display;
	if(display == "block") id("menu").style.display = "none";
	else id("menu").style.display = "block";
})

id('editMode').addEventListener('click', function() { // EDIT MODE
    window.localStorage.setItem('mode',mode);
    // list of all items without checkboxes but with click action
})

id('listMode').addEventListener('click', function() { // LIST MODE
    window.localStorage.setItem('mode',mode);
    // list of all items with checkboxes
})

id('checkMode').addEventListener('click', function() { // ChECK MODE
    window.localStorage.setItem('mode',mode);
    // list of checked items with empty checkboxes
})
	
id("import").addEventListener('click', function() { // IMPORT OPTION
    console.log("IMPORT");
	app.toggleDialog("importDialog", true);
})
	
id('buttonCancelImport').addEventListener('click', function() { // CANCEL IMPORT DATA
	id("menu").style.display="none";
	id("menu").style.display="none";
});
  
id("fileChooser").addEventListener('change', function() { // IMPORT FILE
	var file = id('fileChooser').files[0];
	console.log("file: "+file+" name: "+file.name);
	var fileReader=new FileReader();
	fileReader.addEventListener('load', function(evt) {
		console.log("file read: "+evt.target.result);
	  	var data=evt.target.result;
		var json=JSON.parse(data);
		console.log("json: "+json);
		var logs=json.logs;
		console.log(logs.length+" logs loaded");
		var dbTransaction = app.db.transaction('logs',"readwrite");
		var dbObjectStore = dbTransaction.objectStore('logs');
		for(var i=0;i<logs.length;i++) {
			console.log("add "+logs[i].text);
			var request = dbObjectStore.add(logs[i]);
			request.onsuccess = function(e) {
				console.log(logs.length+" logs added to database");
			};
			request.onerror = function(e) {console.log("error adding log");};
		}
		app.toggleDialog('importDialog',false);
		alert("logs imported - restart");
  	});
  	fileReader.readAsText(file);
});
  
id("export").addEventListener('click', function() { // EXPORT FILE
  	console.log("EXPORT");
	var today= new Date();
	var fileName = "listItems" + today.getDate();
	var n = today.getMonth();
	fileName += app.months.substr(n*3,3);
	n = today.getFullYear() % 100;
	if(n<10) fileName+="0";
	fileName += n + ".json";
	var dbTransaction = app.db.transaction('items',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore('logs');
	console.log("indexedDB objectStore ready");
	var request = dbObjectStore.openCursor();
	
	var logs=[];
	dbTransaction = app.db.transaction('items',"readwrite");
	console.log("indexedDB transaction ready");
	dbObjectStore = dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	request = dbObjectStore.openCursor();
	request.onsuccess = function(event) {  
		var cursor = event.target.result;  
    		if (cursor) {
			    items.push(cursor.value);
			    // console.log("log "+cursor.value.id+", date: "+cursor.value.date+", "+cursor.value.text);
			    cursor.continue();  
    		}
		else {
			console.log(items.length+" items - save");
    		logs.sort(function(a,b) { return Date.parse(a.date)-Date.parse(b.date)}); //chronological order
			var data={'items': items};
			var json=JSON.stringify(data);
			var blob = new Blob([json], {type:"data:application/json"});
  			var a =document.createElement('a');
			a.style.display='none';
    		var url = window.URL.createObjectURL(blob);
			console.log("data ready to save: "+blob.size+" bytes");
   			a.href= url;
   			a.download = fileName;
    		document.body.appendChild(a);
    		a.click();
			alert(fileName+" saved to downloads folder");
			document.getElementById("menu").style.display="none";
		}
	}
})

id('addButton').addEventListener('click', function() { // ADD BELOW BUTTON
    id('itemField').text="";
    id('addDialog').style.display='block';
})

id('saveButton').addEventListener('click', function() { // SAVE NEW ITEM
    item.text=id('itemField').text;
    // check no items with this text
    
    app.toggleDialog('logDialog',false);
	console.log("save log - date: "+app.log.date+" "+app.days+" days text: "+app.log.text);
	var dbTransaction = app.db.transaction('logs',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore('logs');
	console.log("indexedDB objectStore ready");
	console.log("save log - logIndex is "+app.logIndex);
	if(app.logIndex == null) { // add new log
		var request = dbObjectStore.add(app.log);
		request.onsuccess = function(event) {
			console.log("new log added: "+app.log.text);
			app.populateList();
		};
		request.onerror = function(event) {console.log("error adding new log");};
	}
	else { // update existing log
		var request = dbObjectStore.put(app.log); // update log in database
		request.onsuccess = function(event)  {
			console.log("log "+app.log.id+" updated");
			app.populateList();
		};
		request.onerror = function(event) {console.log("error updating log "+app.log.id);};
	}
});
  
id('cancelButton').addEventListener('click', function() { // CANCEL ADD BELOW
    id('addDialog').style.display='none';
    id('editControls').style.display='none';
})

id('deleteButton').addEventListener('click', function() { // DELETE ITEM
    // remove current item from list and from items array
    // remove from database
    console.log("delete item "+itemIndex+" - "+item.text); // delete item
	var dbTransaction = db.transaction("items","readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore("items");
	var request = dbObjectStore.delete(item.id);
	request.onsuccess = function(event) {
		console.log("item "+item.id+" deleted");
		items.splice(itemIndex,1); // not needed - rebuilding anyway
		populateList();
	};
	request.onerror = function(event) {console.log("error deleting item "+item.id);};
    id('editControls').style.display='none';
})

/* Save items to localStorage FOR NOW - LATER USE HOODIE
saveLogs = function() {
    var logs = JSON.stringify(app.logs);
    localStorage.logs = logs;
	console.log("LOGS SAVED: "+logs);
};
*/
  
// EDIT SELECTED ITEM
function showControls() {
	console.log("edit item: "+itemIndex);
	item = items[itemIndex];
	id('itemText').innerHTML=item.text;
	// if first item disable 'move up'
	// if last item disable 'move down'
	// if only item disable 'delete'
	id('addButton').disabled=false; // can always add items
	id('editControls').style.display='block';
}
  
// POPULATE ITEMS LIST
function populateList() {
	console.log("populate item list");
	items = [];
	var dbTransaction = app.db.transaction('items',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	var request = dbObjectStore.openCursor();
	request.onsuccess = function(event) {  
		var cursor = event.target.result;  
    	if (cursor) {
			items.push(cursor.value);
    		cursor.continue();
		}
		else {
			console.log("list "+app.logs.length+" items");
			console.log("populate list");
			id('list').innerHTML=""; // clear list
			var html="";
			var d="";
			var mon=0;
  			for(var i = 0; i<items.length; i++) {
  			 	var listItem = document.createElement('li');
				listItem.index=i;
	 		 	listItem.classList.add('list-item');
				listItem.addEventListener('click', function(){listIndex=this.index; showControls();});
				html=app.logs[i].text+"<br>";
				d=app.logs[i].date;
				listItem.innerHTML=html;
		  		id('list').appendChild(listItem);
  			}
  		}
	}
	request.onerror = function(event) {
		console.log("cursor request failed");
	}
}

// START-UP CODE
console.log("STARTING");
var defaultData = { // first use - just one item: bread
    items: [{text: 'bread', checked: false}]
}
mode=window.localStorage.getItem('mode'); // recover last mode
console.log("mode: "+mode);
var request = window.indexedDB.open("listDB");
request.onsuccess = function(event) {
// console.log("request: "+request);
db=event.target.result;
console.log("DB open");
var dbTransaction = db.transaction('items',"readwrite");
console.log("indexedDB transaction ready");
var dbObjectStore = dbTransaction.objectStore('items');
console.log("indexedDB objectStore ready");
// code to read items from database
items=[];
console.log("items array ready");
var request = dbObjectStore.openCursor();
request.onsuccess = function(event) {  
	var cursor = event.target.result;  
    if (cursor) {
		items.push(cursor.value);
		cursor.continue();  
    }
	else {
		console.log("No more entries!");
		console.log(items.length+" items");
		// ***** for now always start in edit mode *****
		alert('build list');
	    populateList();
	}
};
request.onupgradeneeded = function(event) {
	var dbObjectStore = event.currentTarget.result.createObjectStore("items", { keyPath: "id", autoIncrement: true });
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
}