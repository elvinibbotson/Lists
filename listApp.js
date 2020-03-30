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
var currentListItem=null;
var mode=null;
var lastSave=null;
var months="JanFebMarAprMayJunJulAugSepOctNovDec";

// EVENT LISTENERS
/*
id("main").addEventListener('click', function() {
	id("menu").style.display="none";
})
*/

/*  
id('menuButton').addEventListener('click', function() { // MENU BUTTON
	var display = id("menu").style.display;
	if(display == "block") id("menu").style.display = "none";
	else id("menu").style.display = "block";
})
*/

id('editButton').addEventListener('click', function() { // EDIT MODE
    setMode('edit');
    /*
    mode='edit';
    window.localStorage.setItem('mode',mode);
    // list of all items without checkboxes but with click action
    */
})

id('listButton').addEventListener('click', function() { // LIST MODE
    setMode('list');
    /*
    mode='list';
    window.localStorage.setItem('mode',mode);
    // list of all items with checkboxes
    */
})

id('shopButton').addEventListener('click', function() { // SHOP MODE
    setMode('shop');
    /*
    mode='shop';
    window.localStorage.setItem('mode',mode);
    // list of checked items with empty checkboxes
    */
})

function setMode(m) {
    console.log("set mode to "+m);
    mode=m;
    window.localStorage.setItem('mode',mode); // remember mode
    var request = window.indexedDB.open("listDB"); // update database
    request.onsuccess = function(event) {
        console.log("request: "+request);
        db=event.target.result;
        console.log("DB open");
        var dbTransaction = db.transaction('items',"readwrite");
        console.log("indexedDB transaction ready");
        var dbObjectStore = dbTransaction.objectStore('items');
        console.log("indexedDB objectStore ready");
        // code to write items from database
        var request=dbObjectStore.clear(); // empty database
        request.onsuccess=function(event) {
            for(var i in items) {
                var request=dbObjectStore.add(items[i]); // update log in database
    		    request.onsuccess = function(event)  {
    	    		console.log("item "+i+" added - "+items[i].text);
    	    	};
	    	    request.onerror = function(event) {console.log("error adding "+item.id);};
	        }
        }
        request.onerror = function(event) {console.log("error clearing database"+item);};
        /*
        for(var i in items) {
            var request=dbObjectStore.add(items[i]); // update log in database
    		request.onsuccess = function(event)  {
    			console.log("item "+i+" updated - "+items[i].text);
    		};
	    	request.onerror = function(event) {console.log("error updating log "+item.id);};
	    }
	    */
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

/*	
id("import").addEventListener('click', function() { // IMPORT OPTION
    console.log("IMPORT");
	id('importDialog').style.display='block';
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
	fileName += months.substr(n*3,3);
	n = today.getFullYear() % 100;
	if(n<10) fileName+="0";
	fileName += n + ".json";
	var dbTransaction = db.transaction('items',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	var request = dbObjectStore.openCursor();
	var items=[];
	dbTransaction = db.transaction('items',"readwrite");
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
*/

id('addButton').addEventListener('click', function() { // ADD BELOW BUTTON
    id('itemField').value="";
    id('addDialog').style.display='block';
})

id('saveButton').addEventListener('click', function() { // INSERT NEW ITEM
    item={};
    item.checked=false;
    item.text=id('itemField').value;
    // check no items with this text
    console.log("check "+item.text+" is new");
    for(var i in items) {
        console.log(i+": "+items[i].text);
        if(items[i].text==item.text) alert('already exists');
    }
	console.log('insert '+item.text+" after "+items[listIndex].text);
	items.splice(listIndex+1,0,item);
	populateList();
	currentListItem.style.backgroundColor='white';
	id('addDialog').style.display='none';
	id('controls').style.display='none';
	/*
	var dbTransaction = db.transaction('items',"readwrite");
	console.log("indexedDB transaction ready");
	var dbObjectStore = dbTransaction.objectStore('items');
	console.log("indexedDB objectStore ready");
	console.log("save item - listIndex is "+listIndex);
	// CHANGE THIS TO INSERT ITEMS
	if(listIndex == null) { // add new item
		var request = dbObjectStore.add(item);
		request.onsuccess = function(event) {
			console.log("new item added: "+item.text);
			app.populateList();
		};
		request.onerror = function(event) {console.log("error adding new item");};
	}
	else { // update existing log
		var request = dbObjectStore.put(item); // update log in database
		request.onsuccess = function(event)  {
			console.log("item "+item.id+" updated");
			populateList();
		};
		request.onerror = function(event) {console.log("error updating log "+item.id);};
	}
	*/
});
  
id('cancelButton').addEventListener('click', function() { // CANCEL ADD BELOW
    console.log("cancel add");
    id('addDialog').style.display='none';
    id('controls').style.display='none';
})

id('deleteButton').addEventListener('click', function() { // DELETE ITEM
    // remove current item from list and from items array
    // remove from database
    console.log("delete item "+listIndex+" - "+items[listIndex].text); // delete item
    items.splice(listIndex,1);
    populateList();
    /*
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
	*/
    id('controls').style.display='none';
})

// EDIT SELECTED ITEM
function showControls() {
	console.log("edit item: "+listIndex);
	item = items[listIndex];
	console.log("edit item: "+listIndex+" - "+item.text);
	if(currentListItem) currentListItem.style.backgroundColor='white'; // deselect any previously selected item
	currentListItem=id('list').children[listIndex];
	currentListItem.style.backgroundColor='yellow'; // highlight new selection
	id('controls').style.display='block';
	// id("editControls").classList.add('dialog-container--visible');
}
  
// POPULATE ITEMS LIST
function populateList() {
	console.log("populate item  - mode is "+mode);
	id('list').innerHTML=""; // clear list
	var html="";
	for(var i in items) {
	    console.log("list item "+i+" "+items[i].text+" checked:"+items[i].checked);
	    if((mode=='shop')&&(!items[i].checked)) continue;
	    var listItem = document.createElement('li');
		listItem.index=i;
	 	listItem.classList.add('list-item');
	 	html=""
	 	switch(mode) {
	 	    case 'edit':
	 	        listItem.addEventListener('click', function(){listIndex=this.index; showControls();});
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
		console.log("item html: "+html);
		listItem.innerHTML=html;
		id('list').appendChild(listItem);
		console.log("list item "+i+": "+items[i].text);
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
	/*
	items = [];
	var dbTransaction = db.transaction('items',"readwrite");
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
			console.log("list "+items.length+" items");
			if(items.length<1) {
			    console.log("initialise with first item - bread");
			    items=[{text: 'bread', checked: false}];
			}
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
				html=items[i].text+"<br>";
				listItem.innerHTML=html;
		  		id('list').appendChild(listItem);
  			}
  		}
	}
	request.onerror = function(event) {
		console.log("cursor request failed");
	}
	*/
}

// START-UP CODE
console.log("STARTING");
/*
var defaultData = { // first use - just one item: bread
    items: [{text: 'bread', checked: false}]
}
*/
mode='edit'; // default/first use mode
mode=window.localStorage.getItem('mode'); // recover last mode
console.log("mode: "+mode);
var request = window.indexedDB.open("listDB");
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
    var request = dbObjectStore.openCursor();
    request.onsuccess = function(event) {  
	    var cursor = event.target.result;  
        if (cursor) {
    		items.push(cursor.value);
    		console.log("item: "+cursor.value.text+"/"+cursor.value.checked);
	    	cursor.continue();  
        }
    	else {
    		console.log("No more entries!");
    		console.log(items.length+" items");
    		if(items.length<1) {
			    console.log("initialise with first item - bread");
			    items=[{text: 'bread', checked: false}];
			}
    		// ***** for now always start in edit mode *****
    		console.log('build list');
    	    populateList();
	    }
    }
}
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