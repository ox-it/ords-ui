/**
 * Get a localised lang string.
 * 
 * This will prefix the identifier with "sd", so "delete" will get the string
 * with the identifier "sddelete"
 * 
 * @param {String} str The string identifier from lang.properties, minus the "sd" prefix
 * @returns {String}
 */
function _(str) { /* getText */
    str = "sd"+str;
    var localeStr = ""
    // If there langdebug URL parameter is set, return the string identifier too
    var debug = gup('langdebug');
	if (!(str in window.LOCALE)) { return str; }
	localeStr = window.LOCALE[str];
    if (debug) {
        localeStr = "["+str+"] "+localeStr;
    }
    return localeStr;
}

var thisDesigner;

var LOCALE = {};
var SQL = {};
var loaded = false;
var currently_saving = false;

var host = window.location.host;
var protocol = window.location.protocol
// dbId defined in schemaController

function dbURL() {
	return protocol+"//"+host+"/api/1.0/structure/"+dbId;
}

SQL.Request = OZ.Class();

SQL.Request.POST = 'post';
SQL.Request.GET = 'get';
SQL.Request.PUT = 'put';
SQL.Request.DELETE = 'delete';

SQL.Request.ok = 200;
SQL.Request.created = 201;
SQL.Request.forbidden = 403;
SQL.Request.conflict = 409;
SQL.Request.bad_request = 400;
SQL.Request.internal_server_error = 500;

SQL.Request.prototype.init = function(owner) {
    this.owner = owner;
    this.Promise = this.bind(this.Promise);
}

/**
 * Do an XHR and return a promise that resolves when the reqeust completes
 * 
 * @param {String} url The URL to Request
 * @param {String} method The method to use
 * @param {Object} data The body of the request
 * @param {String} type The MIME type of the request (defaults to application/json)
 * @returns {Promise}
 */
SQL.Request.prototype.Promise = function(url, method, data, type) {
    var owner = this.owner;
    return new Promise(function(resolve, reject) {
        
        if (typeof type === "undefined") {
            type = "application/json";
        }
        // Create a new XHR to request the URL
        xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader("Content-Type", type);
        xhr.setRequestHeader("Cache-Control", "max-age=0"); // No caching!

        /**
         * When the request completes, check the HTTP error code - if it indicates
         * success, resolve the promise, otherwise reject it.
         * 
         * @param {Event} e
         * @returns {undefined}
         */
        xhr.onload = function(e) {
        	switch ( this.status ) {
        		case SQL.Request.ok:
        			if (!this.responseText) {
        				resolve();
        			}
        			else {
                		response = JSON.parse(this.responseText);
                		resolve(response);
                	}
                	break;
                
                case SQL.Request.created:
            		if (owner.io) {
                    	owner.setUnsavedChanges();
                	}
                	resolve();
                	break;
                
                case SQL.Request.bad_request:
                	if (!this.responseText ) {
            			reject("Bad Request");
            		}
            		else {
            			error = JSON.parse(this.responseText);
            			reject(error.message);
            		}
                	break;
                
                case SQL.Request.conflict:
                	if (!this.responseText ) {
            			reject("Naming Conflict");
            		}
            		else {
            			error = JSON.parse(this.responseText);
            			reject(error.message);
            		}
                	break;
                
                case SQL.Request.internal_server_error:
                	if (!this.responseText ) {
            			reject("Internal Server Error");
            		}
            		else {
            			error = JSON.parse(this.responseText);
            			reject(error.message);
            		}
                	break;
            }
        };

        /**
         * If there's an error with the request, reject the promise
         * 
         * @param {Event} e
         * @returns {undefined}
         */
        xhr.onerror = function(e) {
            error = JSON.parse(this.responseText);
            reject(error.message);
        };

        xhr.send(data);
    });

    return promise;
};

/* -------------------- base visual element -------------------- */

SQL.Visual = OZ.Class(); /* abstract parent */
SQL.Visual.prototype.init = function() {
	this._init();
	this._build();
};

SQL.Visual.prototype._init = function() {
	this.dom = {
		container: null,
		title: null
	};
	this.data = {
		title:""
	};
};

SQL.Visual.prototype._build = function() {}

SQL.Visual.prototype.toXML = function() {}

SQL.Visual.prototype.fromXML = function(node) {}

SQL.Visual.prototype.destroy = function() { /* "destructor" */
	var p = this.dom.container.parentNode;
	if (p && p.nodeType == 1) {
		p.removeChild(this.dom.container);
	}
}

SQL.Visual.prototype.setTitle = function(text) {
	if (!text) { return; }
	this.data.title = text;
	this.dom.title.innerHTML = text;
}

SQL.Visual.prototype.getTitle = function() {
	return this.data.title;
}

SQL.Visual.prototype.redraw = function() {}

/* --------------------- table row ( = db column) ------------ */

SQL.Row = OZ.Class().extend(SQL.Visual);

SQL.Row.prototype.init = function(owner, title, data) {
	this.owner = owner;
	this.relations = [];
	this.keys = [];
	this.selected = false;
	this.expanded = false;
	
	SQL.Visual.prototype.init.apply(this);
	
	this.data.type = "INTEGER";
	this.data.size = "";
	this.data.def = null;
	this.data.nll = true;
	this.data.ai = false;
	this.data.comment = "";

	if (data) { this.update(data); }
	this.setTitle(title);
}

SQL.Row.prototype._build = function() {
	this.dom.container = OZ.DOM.elm("tbody");
	
	this.dom.content = OZ.DOM.elm("tr");
	this.dom.selected = OZ.DOM.elm("div", {className:"selected",innerHTML:"&raquo;&nbsp;"});
	this.dom.title = OZ.DOM.elm("div", {className:"title"});
	var td1 = OZ.DOM.elm("td");
	var td2 = OZ.DOM.elm("td", {className:"typehint"});
	this.dom.typehint = td2;

	OZ.DOM.append(
		[this.dom.container, this.dom.content],
		[this.dom.content, td1, td2],
		[td1, this.dom.selected, this.dom.title]
	);
	
	this.enter = this.bind(this.enter);
	this.changeComment = this.bind(this.changeComment);

	OZ.Event.add(this.dom.container, "click",this.bind(this.click));
	OZ.Event.add(this.dom.container, "dblclick",this.bind(this.dblclick));
}

SQL.Row.prototype.select = function() {
	if (this.selected) { return; }
	this.selected = true;
	this.redraw();
}

SQL.Row.prototype.deselect = function() {
	if (!this.selected) { return; }
	this.selected = false;
	this.redraw();
	this.collapse();
}

SQL.Row.prototype.setTitle = function(t) {
	var old = this.getTitle();
	for (var i=0;i<this.relations.length;i++) {
		var r = this.relations[i];
		if (r.row1 != this) { continue; }
		var tt = r.row2.getTitle().replace(new RegExp(old,"g"),t);
		if (tt != r.row2.getTitle()) { r.row2.setTitle(tt); }
	}
	
	SQL.Visual.prototype.setTitle.apply(this, [t]);
}

SQL.Row.prototype.click = function(e) { /* clicked on row */
	this.dispatch("rowclick", this);
	this.owner.owner.rowManager.select(this);
}

SQL.Row.prototype.dblclick = function(e) { /* dblclicked on row */
	OZ.Event.prevent(e);
	OZ.Event.stop(e);
	this.expand();
}

SQL.Row.prototype.update = function(data) { /* update subset of row data */
	var des = thisDesigner;
	if (data.nll && data.def && data.def.match(/^null$/i)) { data.def = null; }
	
	for (var p in data) { this.data[p] = data[p]; }
	if (!this.data.nll && this.data.def === null) { this.data.def = ""; }

	var elm = this.getDataType();
	for (var i=0;i<this.relations.length;i++) {
		var r = this.relations[i];
		if (r.row1 == this) { r.row2.update({type:this.data.type,size:this.data.size}); }
	}
	this.redraw();
}

/*SQL.Row.prototype.up = function() { /* shift up *//* 
	var r = this.owner.rows;
	var idx = r.indexOf(this);
	if (!idx) { return; }
	r[idx-1].dom.container.parentNode.insertBefore(this.dom.container,r[idx-1].dom.container);
	r.splice(idx,1);
	r.splice(idx-1,0,this);
	this.redraw();
}

SQL.Row.prototype.down = function() { /* shift down *//*
	var r = this.owner.rows;
	var idx = r.indexOf(this);
	if (idx+1 == this.owner.rows.length) { return; }
	r[idx].dom.container.parentNode.insertBefore(this.dom.container,r[idx+1].dom.container.nextSibling);
	r.splice(idx,1);
	r.splice(idx+1,0,this);
	this.redraw();
}*/

SQL.Row.prototype.buildEdit = function() {
	OZ.DOM.clear(this.dom.container);
	
	var elms = [];
	this.dom.name = OZ.DOM.elm("input");
	this.dom.name.type = "text";
	elms.push(["name",this.dom.name]);
	OZ.Event.add(this.dom.name, "keypress", this.enter);

	this.dom.type = this.buildTypeSelect(this.data.type);
    this.dom.typeHelpToggle = OZ.DOM.elm("a");
    this.dom.typeHelpToggle.innerHTML = _("showhelp");
	elms.push(["type",this.dom.type, this.dom.typeHelpToggle]);

    OZ.Event.add(this.dom.typeHelpToggle, "click", this.bind(this.toggleTypeHelp));
    
    this.dom.typeHelp = OZ.DOM.elm("p");
    this.dom.typeHelp.id = "typeHelp";
    elms.push(["", this.dom.typeHelp]);

    OZ.Event.add(this.dom.type, "change", this.bind(this.changeType));

	this.dom.size = OZ.DOM.elm("input");
	this.dom.size.type = "text";
	this.dom.size.id = "dataLength";
	elms.push(["size",this.dom.size]);

	this.dom.def = OZ.DOM.elm("input");
	this.dom.def.type = "text";
    this.dom.def.id = "defaultValue";
	elms.push(["def",this.dom.def]);

	this.dom.ai = OZ.DOM.elm("input");
	this.dom.ai.type = "checkbox";
	elms.push(["ai",this.dom.ai]);

	this.dom.nll = OZ.DOM.elm("input");
	this.dom.nll.type = "checkbox";
	elms.push(["null",this.dom.nll]);
	
	this.dom.comment = OZ.DOM.elm("span",{className:"comment"});
	this.dom.comment.innerHTML = this.data.comment;

	this.dom.commentbtn = OZ.DOM.elm("input");
	this.dom.commentbtn.type = "button";
	this.dom.commentbtn.value = _("comment");
	
	OZ.Event.add(this.dom.commentbtn, "click", this.changeComment);
    
	this.dom.donebtn = OZ.DOM.elm("input");
	this.dom.donebtn.type = "button";
	this.dom.donebtn.value = _("done");
	
	OZ.Event.add(this.dom.donebtn, "click", this.bind(this.done));

	for (var i=0;i<elms.length;i++) {
		var row = elms[i];
		var tr = OZ.DOM.elm("tr");
		var td1 = OZ.DOM.elm("td");
		var td2 = OZ.DOM.elm("td");
		var l = OZ.DOM.text("");
        if (row[0] !== "") {
		    l = OZ.DOM.text(_(row[0])+": ");
        }
		OZ.DOM.append(
			[tr, td1, td2],
			[td1, l],
			[td2, row[1]]
		);
        if (row[2]) {
            OZ.DOM.append([td2, row[2]]);
        }
		this.dom.container.appendChild(tr);
	}
	
	var tr = OZ.DOM.elm("tr");
	var td1 = OZ.DOM.elm("td");
	var td2 = OZ.DOM.elm("td");
	OZ.DOM.append(
		[tr, td1, td2],
		[td1, this.dom.comment],
		[td2, this.dom.commentbtn],
		[td2, this.dom.donebtn]
	);
	this.dom.container.appendChild(tr);
}

/**
 * Save updated column comment
 * 
 * @param {Event} e
 * @returns {undefined}
 */
SQL.Row.prototype.changeComment = function(e) {
    var comment = this.data.comment === null ? "" : this.data.comment;
	var c = prompt(_("commenttext"),comment);
	if (c === null) { return; }
    this.owner.owner.showOverlay();
    // Create the column comment URL and request
    //var dbURL = protocol+"//:"+host+"/api/1.0/structure/"+dbId+"/";
    var commentURL = dbURL()+'/table/'+this.owner.getTitle()+'/comment/staging';
    var commentRequest = {comment: c};
    this.owner.owner.request.Promise(commentURL, SQL.Request.PUT, JSON.stringify(commentRequest)).then(
        function() {
            // Once saved, update the interface
            this.data.comment = c;
            this.dom.comment.innerHTML = this.data.comment;
            this.owner.owner.hideOverlay();
        }.bind(this),
        this.owner.owner.error
    );
}

SQL.Row.prototype.expand = function() {
	if (this.expanded) { return; }
	this.expanded = true;
	this.buildEdit();
	this.load();
	this.redraw();
	this.dom.name.focus();
	this.dom.name.select();
}

SQL.Row.prototype.collapse = function() {
	if (!this.expanded) { return; }

	var data = {
        type: this.dom.type.value,
		def: this.dom.def.value,
		size: this.dom.size.value,
		nll: this.dom.nll.checked,
		ai: this.dom.ai.checked
	}

    var columnRequest = {}
    // Create a Promise in case we need the user to confirm data type changes.
    var warningPromise = new Promise(function(resolve, reject) {resolve();});
    if (this.dom.name.value !== this.getTitle()) {
        // If the name has been changed, set the new name in the request
        columnRequest.newname = this.dom.name.value;
    }
    if (data.type !== this.data.type || data.size !== this.data.size) {
        // If the data type's changed, set the new type in the request
        columnRequest.datatype = data.type;
        if (data.size != null && data.size.length > 0) {
            // If there's a length, add it to the data type
            columnRequest.datatype += "("+data.size+")";
        }
        if (data.size === null || data.size.length === 0) {
            // If there's a null or 0 length, there's the potential for data
            // loss if we're switching from char or decimal, so set a warning
            if (data.type === "CHAR" && this.data.type !== "BOOLEAN") {
                warningPromise = this.owner.owner.confirm(_("datatypewarning1"));
            } else if (data.type === "DECIMAL") {
                warningPromise = this.owner.owner.confirm(_("datatypewarning4"));
            }
        } else if ((data.size !== null && data.size !== "") && data.size < this.data.size) {
            // If the size has been reduced, there's a potential for data loss
            // with pretty much any type, so set a warning
            warningPromise = this.owner.owner.confirm(_("datatypewarning2"));
        } else if ((["BIGINT", "DECIMAL", "REAL", "DOUBLE PRECISION"].indexOf(this.data.type) > -1 && data.type === "INTEGER")
                || (["DECIMAL", "REAL", "DOUBLE PRECISION"].indexOf(this.data.type) > -1 && data.type === "BIGINT")
                || (["DECIMAL", "DOUBLE PRECISION"].indexOf(this.data.type) > -1 && data.type === "REAL") 
                || (this.data.type === "DECIMAL" && data.type === "DOUBLE PRECISION") 
                || (this.data.type !== "BOOLEAN" && data.type === "CHAR")) {
            // There are several to/from type combinations that may result in
            // data loss. If we're doing one of those, set a warning.
            warningPromise = this.owner.owner.confirm(_("datatypewarning3"));    
        }
    }
    if (data.def !== this.data.def && data.def !== "NULL") {
        if (!(this.data.def === null && this.dom.def.disabled)) {
            // If a default value has been set, set it in the request
            columnRequest.defaultvalue = data.def;
        }
    }
    // Set autoincrement and nullable in the request
    if (data.ai != this.data.ai) {
        columnRequest.autoincrement = data.ai;
    }
    if (data.nll != this.data.nll) {
        columnRequest.nullable = data.nll;
    }
    
    if (Object.getOwnPropertyNames(columnRequest).length === 0) {
        // If there's nothing in the request object, then nothing's actually
        // been changed so no need to communicate with the server, just
        // collapse the form.
        this.expanded = false;
        OZ.DOM.clear(this.dom.container);
        this.dom.container.appendChild(this.dom.content);
    } else {
        warningPromise.then(
            // If no warning has been set, this promise will resolve immediately,
            // otherwise it will wait until the user confirms
            function() {
                var tableName = this.owner.getTitle();
                var colName = this.getTitle();
                var columnURL = dbURL()+"/table/"+tableName+"/column/"+colName+"/staging";
                this.owner.owner.showOverlay();
                // Send the request to save the changes
                return this.owner.owner.request.Promise(columnURL, SQL.Request.PUT, JSON.stringify(columnRequest));        
            }.bind(this),
            function(){return new Promise(function(resolve, reject){reject(false);});}
        ).then(
            function() {
                // If all's well, collapse the form
                this.expanded = false;
                OZ.DOM.clear(this.dom.container);
                this.dom.container.appendChild(this.dom.content);

                this.update(data);
                this.setTitle(this.dom.name.value);
                this.owner.owner.hideOverlay();
            }.bind(this),
            function(message) {
                if (message) {
                    this.owner.owner.error(message);
                }
            }.bind(this)
        );
    }
}

SQL.Row.prototype.load = function() { /* put data to expanded form */
	this.dom.name.value = this.getTitle();
	var def = this.data.def;
	if (def === null) { def = "NULL"; }
	
	this.dom.def.value = def;
    if (this.data.size !== "null") {
    	this.dom.size.value = this.data.size;
    }
	this.dom.nll.checked = this.data.nll;
	this.dom.ai.checked = this.data.ai;
    if (this.data.ai) {
        this.dom.def.disabled = true;
        this.dom.def.value = "";
    }
    OZ.Event.add(this.dom.ai, "click", this.toggleDefault);
    this.updateFormForType(this.dom.type.value);
    this.dom.typeHelp.parentElement.parentElement.style.display = "none";
}

SQL.Row.prototype.redraw = function() {
	var color = this.getColor();
	this.dom.container.style.backgroundColor = color;
	OZ.DOM.removeClass(this.dom.title, "primary");
	OZ.DOM.removeClass(this.dom.title, "key");
	if (this.isPrimary()) { OZ.DOM.addClass(this.dom.title, "primary"); }
	if (this.isKey()) { OZ.DOM.addClass(this.dom.title, "key"); }
	this.dom.selected.style.display = (this.selected ? "" : "none");
    if (this.data.comment !== null) {
    	this.dom.container.title = this.data.comment;
    }
	
	var typehint = [];
	if (this.owner.owner.getOption("showtype")) {
		var type = this.getDataType();
		typehint.push(type.sql);
	}
	
	if (this.owner.owner.getOption("showsize") && this.data.size) {
		typehint.push("(" + this.data.size + ")");
	}
	
	this.dom.typehint.innerHTML = typehint.join(" ");
	this.owner.redraw();
	this.owner.owner.rowManager.redraw();
}

SQL.Row.prototype.addRelation = function(r) {
	this.relations.push(r);
}

SQL.Row.prototype.removeRelation = function(r) {
	var idx = this.relations.indexOf(r);
	if (idx == -1) { return; }
	this.relations.splice(idx,1);
}

SQL.Row.prototype.addKey = function(k) {
	this.keys.push(k);
	this.redraw();
}

SQL.Row.prototype.removeKey = function(k) {
	var idx = this.keys.indexOf(k);
	if (idx == -1) { return; }
	this.keys.splice(idx,1);
	this.redraw();
}

SQL.Row.prototype.getDataType = function() {
	var type = this.data.type;
	var types = this.owner.owner.datatypes.types;
    return types[type];
}

SQL.Row.prototype.getColor = function() {
	var type = this.getDataType();
	var g = this.owner.owner.datatypes.groups[type.group];
	return type.color || g.color || "#fff";
}

SQL.Row.prototype.buildTypeSelect = function(id) { /* build selectbox with avail datatypes */
	var s = OZ.DOM.elm("select");
    s.id = "datatype";
	var gs = this.owner.owner.datatypes.groups;
    var basicOg = OZ.DOM.elm("optgroup");
    basicOg.label = _("basictypes");
    s.appendChild(basicOg);
	for (gid in gs) {
		var g = gs[gid];
		var og = OZ.DOM.elm("optgroup");
		og.style.backgroundColor = g.color || "#fff";
		og.label = g.label;
		s.appendChild(og);
		var ts = this.owner.owner.datatypes.types;
		for (var tid in ts) {
			var t = ts[tid]
            if (t.group === gid) {
                var o = OZ.DOM.elm("option");
                o.value = t.sql;
                if (o.value === id) {
                    o.selected = true;
                }
                if (t.color) { o.style.backgroundColor = t.color; }
                if (t.note) { o.title = t.note; }
                o.innerHTML = t.label;
                if (t.basic) {
                    basicO = o.cloneNode(true);
                    basicO.style.backgroundColor = g.color;
                    basicOg.appendChild(basicO);
                    this.basicOffset++;
                }
                og.appendChild(o);
            }
		}
	}
	return s;
}

SQL.Row.prototype.destroy = function() {
	SQL.Visual.prototype.destroy.apply(this);
	while (this.relations.length) {
		this.owner.owner.removeRelation(this.relations[0]);
    }
	for (var i=0;i<this.keys.length;i++){ 
		this.keys[i].removeRow(this);
    }
}

SQL.Row.prototype.toXML = function() {
	var xml = "";
	
	var t = this.getTitle().replace(/"/g,"&quot;");
	var nn = (this.data.nll ? "1" : "0");
	var ai = (this.data.ai ? "1" : "0");
	xml += '<row name="'+t+'" null="'+nn+'" autoincrement="'+ai+'">\n';

	var type = this.getDataType();
	var t = type.sql;
	if (this.data.size.length) { t += "("+this.data.size+")"; }
	xml += "<datatype>"+t+"</datatype>\n";
	
	if (this.data.def || this.data.def === null) {
		var q = type.quote;
		var d = this.data.def;
		if (d === null) { 
			d = "NULL"; 
		} else if (d != "CURRENT_TIMESTAMP") { 
			d = q+d+q; 
		}
		xml += "<default>"+d+"</default>";
	}

	for (var i=0;i<this.relations.length;i++) {
		var r = this.relations[i];
		if (r.row2 != this) { continue; }
		xml += '<relation table="'+r.row1.owner.getTitle()+'" row="'+r.row1.getTitle()+'" />\n';
	}
	
	if (this.data.comment) { 
		var escaped = this.data.comment.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
		xml += "<comment>"+escaped+"</comment>\n"; 
	}
	
	xml += "</row>\n";
	return xml;
}

SQL.Row.prototype.readschema = function(row) {
	
	var obj = { type:0, size:"" };
	obj.nll = (row.nullable);
	obj.ai = (row.autoincrement);
    obj.comment = row.comment;
	
	var d = row.datatype;
	if (d.length) { 
		var r = d.match(/^([^\(]+)(\((.*)\))?.*$/);
		var type = r[1];
		if (r[3]) { obj.size = r[3]; }
		var types = this.owner.owner.datatypes.types;
		for (var id in types) {
			var sql = types[id].sql;
			var re = types[id].re;
			if (sql == type || (re && new RegExp(re).exec(type)) ) { obj.type = sql; }
		}
	}
	
	var elm = this.owner.owner.datatypes.types[obj.type];
	var d = row.default;
	if (d && d.length) { 
		obj.def = d;
	}

	this.update(obj);
}

SQL.Row.prototype.isPrimary = function() {
	for (var i=0;i<this.keys.length;i++) {
		var k = this.keys[i];
		if (k.getType() == "PRIMARY") { return true; }
	}
	return false;
}

SQL.Row.prototype.isUnique = function() {
	for (var i=0;i<this.keys.length;i++) {
		var k = this.keys[i];
		var t = k.getType();
		if (t == "PRIMARY" || t == "UNIQUE") { return true; }
	}
	return false;
}

SQL.Row.prototype.isKey = function() {
	return this.keys.length > 0;
}

SQL.Row.prototype.enter = function(e) {
	if (e.keyCode == 13) { 
		this.collapse();
	}
}

SQL.Row.prototype.toggleDefault = function(e) {
    def = OZ.$('defaultValue');
    def.disabled = !def.disabled;
}

SQL.Row.prototype.changeType = function(e) {
    newtype = e.target.value;
    this.updateFormForType(newtype);
}

SQL.Row.prototype.updateFormForType = function(type) {
    var types = this.owner.owner.datatypes.types;
    hasLength = types[type].length;
    
    if (hasLength) {
        this.dom.size.disabled = false;
    } else {
        this.dom.size.disabled = true;
        this.dom.size.value = "";
    }
    if (type === "INTEGER") {
        this.dom.ai.disabled = false;
    } else {
        this.dom.ai.disabled = true;
        this.dom.ai.checked = false;
        if (this.dom.def.disabled) {
            this.dom.def.disabled = false;
        }
    }
    this.dom.typeHelp.innerHTML = _(type.toLowerCase().replace(" ", "_")+"_help");
}

SQL.Row.prototype.toggleTypeHelp = function() {
    var tableRow = this.dom.typeHelp.parentElement.parentElement;
    if (tableRow.style.display === "none") {
        tableRow.style.display = "table-row";
    } else {
        tableRow.style.display = "none";
    }
}

SQL.Row.prototype.done = function(e) {
    this.collapse();
}
/* --------------------------- relation (connector) ----------- */

SQL.Relation = OZ.Class().extend(SQL.Visual);
SQL.Relation._counter = 0;
SQL.Relation.prototype.init = function(owner, row1, row2) {
	this.constructor._counter++;
	this.owner = owner;
	this.row1 = row1;
	this.row2 = row2;
	this.hidden = false;
	SQL.Visual.prototype.init.apply(this);
	
	this.row1.addRelation(this);
	this.row2.addRelation(this);
	
	this.dom = [];
	if (CONFIG.RELATION_COLORS) {
		var colorIndex = this.constructor._counter - 1;
		var color = CONFIG.RELATION_COLORS[colorIndex % CONFIG.RELATION_COLORS.length];
	} else {
		var color = "#000";
	}
	
	if (this.owner.vector) {
		var path = document.createElementNS(this.owner.svgNS, "path");
		path.setAttribute("stroke", color);
		path.setAttribute("stroke-width", CONFIG.RELATION_THICKNESS);
		path.setAttribute("fill", "none");
		this.owner.dom.svg.appendChild(path);
		this.dom.push(path);
	} else {
		for (var i=0;i<3;i++) {
			var div = OZ.DOM.elm("div",{position:"absolute",className:"relation",backgroundColor:color});
			this.dom.push(div);
			if (i & 1) { /* middle */
				OZ.Style.set(div,{width:CONFIG.RELATION_THICKNESS+"px"});
			} else { /* first & last */
				OZ.Style.set(div,{height:CONFIG.RELATION_THICKNESS+"px"});
			}
			this.owner.dom.container.appendChild(div);
		}
	}
	
	this.redraw();
}

SQL.Relation.prototype.show = function() {
	this.hidden = false;
	for (var i=0;i<this.dom.length;i++) {
		this.dom[i].style.visibility = "";
	}
}

SQL.Relation.prototype.hide = function() {
	this.hidden = true;
	for (var i=0;i<this.dom.length;i++) {
		this.dom[i].style.visibility = "hidden";
	}
}

SQL.Relation.prototype.redrawNormal = function(p1, p2, half) {
	if (this.owner.vector) {
		var str = "M "+p1[0]+" "+p1[1]+" C "+(p1[0] + half)+" "+p1[1]+" ";
		str += (p2[0]-half)+" "+p2[1]+" "+p2[0]+" "+p2[1];
		this.dom[0].setAttribute("d",str);
	} else {
		this.dom[0].style.left = p1[0]+"px";
		this.dom[0].style.top = p1[1]+"px";
		this.dom[0].style.width = half+"px";

		this.dom[1].style.left = (p1[0] + half) + "px";
		this.dom[1].style.top = Math.min(p1[1],p2[1]) + "px";
		this.dom[1].style.height = (Math.abs(p1[1] - p2[1])+CONFIG.RELATION_THICKNESS)+"px";

		this.dom[2].style.left = (p1[0]+half+1)+"px";
		this.dom[2].style.top = p2[1]+"px";
		this.dom[2].style.width = half+"px";
	}
}

SQL.Relation.prototype.redrawSide = function(p1, p2, x) {
	if (this.owner.vector) {
		var str = "M "+p1[0]+" "+p1[1]+" C "+x+" "+p1[1]+" ";
		str += x+" "+p2[1]+" "+p2[0]+" "+p2[1];
		this.dom[0].setAttribute("d",str);
	} else {
		this.dom[0].style.left = Math.min(x,p1[0])+"px";
		this.dom[0].style.top = p1[1]+"px";
		this.dom[0].style.width = Math.abs(p1[0]-x)+"px";
		
		this.dom[1].style.left = x+"px";
		this.dom[1].style.top = Math.min(p1[1],p2[1]) + "px";
		this.dom[1].style.height = (Math.abs(p1[1] - p2[1])+CONFIG.RELATION_THICKNESS)+"px";
		
		this.dom[2].style.left = Math.min(x,p2[0])+"px";
		this.dom[2].style.top = p2[1]+"px";
		this.dom[2].style.width = Math.abs(p2[0]-x)+"px";
	}
}

SQL.Relation.prototype.redraw = function() { /* draw connector */
	if (this.hidden) { return; }
	var t1 = this.row1.owner.dom.container;
	var t2 = this.row2.owner.dom.container;

	var l1 = t1.offsetLeft;
	var l2 = t2.offsetLeft;
	var r1 = l1 + t1.offsetWidth;
	var r2 = l2 + t2.offsetWidth;
	var t1 = t1.offsetTop + this.row1.dom.container.offsetTop + Math.round(this.row1.dom.container.offsetHeight/2);
	var t2 = t2.offsetTop + this.row2.dom.container.offsetTop + Math.round(this.row2.dom.container.offsetHeight/2);
	
	if (this.row1.owner.selected) { t1++; l1++; r1--; }
	if (this.row2.owner.selected) { t2++; l2++; r2--; }
	
	var p1 = [0,0];
	var p2 = [0,0];
	
	if (r1 < l2 || r2 < l1) { /* between tables */
		if (Math.abs(r1 - l2) < Math.abs(r2 - l1)) {
			p1 = [r1,t1];
			p2 = [l2,t2];
		} else {
			p1 = [r2,t2];
			p2 = [l1,t1];
		}
		var half = Math.floor((p2[0] - p1[0])/2);
		this.redrawNormal(p1, p2, half);
	} else { /* next to tables */
		var x = 0;
		var l = 0;
		if (Math.abs(l1 - l2) < Math.abs(r1 - r2)) { /* left of tables */
			p1 = [l1,t1];
			p2 = [l2,t2];
			x = Math.min(l1,l2) - CONFIG.RELATION_SPACING;
		} else { /* right of tables */
			p1 = [r1,t1];
			p2 = [r2,t2];
			x = Math.max(r1,r2) + CONFIG.RELATION_SPACING;
		}
		this.redrawSide(p1, p2, x);
	} /* line next to tables */
}

SQL.Relation.prototype.destroy = function() {
	this.row1.removeRelation(this);
	this.row2.removeRelation(this);
	for (var i=0;i<this.dom.length;i++) {
		this.dom[i].parentNode.removeChild(this.dom[i]);
	}
}

/* --------------------- db table ------------ */

SQL.Table = OZ.Class().extend(SQL.Visual);

SQL.Table.prototype.init = function(owner, name, x, y, z) {
	this.owner = owner;
	this.rows = [];
	this.keys = [];
	this.zIndex = 0;
	this._ec = [];

	this.flag = false;
	this.selected = false;
	SQL.Visual.prototype.init.apply(this);
	this.data.comment = "";
	
	this.setTitle(name);
	this.x = x || 0;
	this.y = y || 0;
	this.setZ(z);
	this.snap();
}

SQL.Table.prototype._build = function() {
	this.dom.container = OZ.DOM.elm("div", {className:"table"});
	this.dom.content = OZ.DOM.elm("table");
	var thead = OZ.DOM.elm("thead");
	var tr = OZ.DOM.elm("tr");
	this.dom.title = OZ.DOM.elm("td", {className:"title", colSpan:2});
	
	OZ.DOM.append(
		[this.dom.container, this.dom.content],
		[this.dom.content, thead],
		[thead, tr],
		[tr, this.dom.title]
	);
	
	this.dom.mini = OZ.DOM.elm("div", {className:"mini"});
	this.owner.map.dom.container.appendChild(this.dom.mini);

	this._ec.push(OZ.Event.add(this.dom.container, "click", this.bind(this.click)));
	this._ec.push(OZ.Event.add(this.dom.container, "dblclick", this.bind(this.dblclick)));
	this._ec.push(OZ.Event.add(this.dom.container, "mousedown", this.bind(this.down)));
	this._ec.push(OZ.Event.add(this.dom.container, "touchstart", this.bind(this.down)));
	this._ec.push(OZ.Event.add(this.dom.container, "touchmove", OZ.Event.prevent));
}

SQL.Table.prototype.setTitle = function(t) {
	var old = this.getTitle();
	for (var i=0;i<this.rows.length;i++) {
		var row = this.rows[i];
		for (var j=0;j<row.relations.length;j++) {
			var r = row.relations[j];
			if (r.row1 != row) { continue; }
			var tt = row.getTitle().replace(new RegExp(old,"g"),t);
			if (tt != row.getTitle()) { row.setTitle(tt); }
		}
	}
	SQL.Visual.prototype.setTitle.apply(this, [t]);
}

SQL.Table.prototype.getRelations = function() {
	var arr = [];
	for (var i=0;i<this.rows.length;i++) {
		var row = this.rows[i];
		for (var j=0;j<row.relations.length;j++) {
			var r = row.relations[j];
			if (arr.indexOf(r) == -1) { arr.push(r); }
		}
	}
	return arr;
}

SQL.Table.prototype.showRelations = function() {
	var rs = this.getRelations();
	for (var i=0;i<rs.length;i++) { rs[i].show(); }
}

SQL.Table.prototype.hideRelations = function() {
	var rs = this.getRelations();
	for (var i=0;i<rs.length;i++) { rs[i].hide(); }
}

SQL.Table.prototype.click = function(e) {
	OZ.Event.stop(e);
	var t = OZ.Event.target(e);
	this.owner.tableManager.select(this);
	
	if (t != this.dom.title) { return; } /* click on row */

	this.dispatch("tableclick",this);
	this.owner.rowManager.select(false);
}

SQL.Table.prototype.dblclick = function(e) {
	var t = OZ.Event.target(e);
	if (t == this.dom.title) { this.owner.tableManager.edit(); }
}

SQL.Table.prototype.select = function() { 
	if (this.selected) { return; }
	this.selected = true;
	OZ.DOM.addClass(this.dom.container, "selected");
	OZ.DOM.addClass(this.dom.mini, "mini_selected");
	this.redraw();
}

SQL.Table.prototype.deselect = function() { 
	if (!this.selected) { return; }
	this.selected = false;
	OZ.DOM.removeClass(this.dom.container, "selected");
	OZ.DOM.removeClass(this.dom.mini, "mini_selected");
	this.redraw();
}

SQL.Table.prototype.addRow = function(title, data) {
	var r = new SQL.Row(this, title, data);
	this.rows.push(r);
	this.dom.content.appendChild(r.dom.container);
	this.redraw();
	return r;
}

SQL.Table.prototype.removeRow = function(r) {
	var idx = this.rows.indexOf(r);
	if (idx == -1) { return; } 
	r.destroy();
	this.rows.splice(idx,1);
	this.redraw();
}

SQL.Table.prototype.addKey = function(name) {
	var k = new SQL.Key(this, name);
	this.keys.push(k);
	return k;
}

SQL.Table.prototype.removeKey = function(i) {
	var idx = this.keys.indexOf(k);
	if (idx == -1) { return; }
	k.destroy();
	this.keys.splice(idx,1);
}

SQL.Table.prototype.redraw = function() {
	var x = this.x;
	var y = this.y;
	if (this.selected) { x--; y--; }
	this.dom.container.style.left = x+"px";
	this.dom.container.style.top = y+"px";
	
	var ratioX = this.owner.map.width / this.owner.width;
	var ratioY = this.owner.map.height / this.owner.height;
	
	var w = this.dom.container.offsetWidth * ratioX;
	var h = this.dom.container.offsetHeight * ratioY;
	var x = this.x * ratioX;
	var y = this.y * ratioY;
	
	this.dom.mini.style.width = Math.round(w)+"px";
	this.dom.mini.style.height = Math.round(h)+"px";
	this.dom.mini.style.left = Math.round(x)+"px";
	this.dom.mini.style.top = Math.round(y)+"px";

	this.width = this.dom.container.offsetWidth;
	this.height = this.dom.container.offsetHeight;
	
	var rs = this.getRelations();
	for (var i=0;i<rs.length;i++) { rs[i].redraw(); }
}

SQL.Table.prototype.moveBy = function(dx, dy) {
	this.x += dx;
	this.y += dy;
	
	this.snap();
	this.redraw();
}

SQL.Table.prototype.moveTo = function(x, y) {
	this.x = x;
	this.y = y;

	this.snap();
	this.redraw();
}

SQL.Table.prototype.snap = function() {
	var snap = parseInt(thisDesigner.getOption("snap"));
	if (snap) {
		this.x = Math.round(this.x / snap) * snap;
		this.y = Math.round(this.y / snap) * snap;
	}
}

SQL.Table.prototype.down = function(e) { /* mousedown - start drag */
	OZ.Event.stop(e);
	var t = OZ.Event.target(e);
	if (t != this.dom.title) { return; } /* on a row */
	
	/* touch? */
	if (e.type == "touchstart") {
		var event = e.touches[0];
		var moveEvent = "touchmove";
		var upEvent = "touchend";
	} else {
		var event = e;
		var moveEvent = "mousemove";
		var upEvent = "mouseup";
	}
	
	/* a non-shift click within a selection preserves the selection */
	if (e.shiftKey || ! this.selected) {
		this.owner.tableManager.select(this, e.shiftKey);
	}

	var t = SQL.Table;
	t.active = this.owner.tableManager.selection;
	var n = t.active.length;
	t.x = new Array(n);
	t.y = new Array(n);
	for (var i=0;i<n;i++) {
		/* position relative to mouse cursor */ 
		t.x[i] = t.active[i].x - event.clientX;
		t.y[i] = t.active[i].y - event.clientY;
	}
	
	if (this.owner.getOption("hide")) { 
		for (var i=0;i<n;i++) {
			t.active[i].hideRelations();
		}
	}
	
	this.documentMove = OZ.Event.add(document, moveEvent, this.bind(this.move));
	this.documentUp = OZ.Event.add(document, upEvent, this.bind(this.up));
}

SQL.Table.prototype.toXML = function() {
	var t = this.getTitle().replace(/"/g,"&quot;");
	var xml = "";
	xml += '<table x="'+this.x+'" y="'+this.y+'" name="'+t+'">\n';
	for (var i=0;i<this.rows.length;i++) {
		xml += this.rows[i].toXML();
	}
	for (var i=0;i<this.keys.length;i++) {
		xml += this.keys[i].toXML();
	}
	var c = this.getComment();
	if (c) { 
		c = c.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
		xml += "<comment>"+c+"</comment>\n"; 
	}
	xml += "</table>\n";
	return xml;
}

SQL.Table.prototype.readschema = function(table) {
	var x = parseInt(table.x) || 0;
	var y = parseInt(table.y) || 0;
    var columns = table.columns;
    var sortedcolumns = Array();
    var indexes = table.indexes;
    this.data.comment = table.comment;
	this.moveTo(x, y);
    
    for (var name in columns) {
        var column = columns[name];
        column.name = name;
        sortedcolumns.push(column);
    }
    sortedcolumns.sort(function(a,b){return a.position - b.position;});
    
    for (c in sortedcolumns) {
        var row = sortedcolumns[c];
        var r = this.addRow(row.name);
        r.readschema(row);
    }
    for (name in indexes) {
        var key = indexes[name];
        var k = this.addKey(key.type, name);
        k.readschema(key);
    }
}

SQL.Table.prototype.getZ = function() {
	return this.zIndex;
}

SQL.Table.prototype.setZ = function(z) {
	this.zIndex = z;
	this.dom.container.style.zIndex = z;
}

SQL.Table.prototype.findNamedRow = function(n) { /* return row with a given name */
	for (var i=0;i<this.rows.length;i++) {
		if (this.rows[i].getTitle() == n) { return this.rows[i]; }
	}
	return false;
}

SQL.Table.prototype.addKey = function(type, name) {
	var i = new SQL.Key(this, type, name);
	this.keys.push(i);
	return i;
}

SQL.Table.prototype.removeKey = function(i) {
	var idx = this.keys.indexOf(i);
	if (idx == -1) { return; }
	i.destroy();
	this.keys.splice(idx,1);
}

SQL.Table.prototype.setComment = function(c) {
	this.data.comment = c;
	this.dom.title.title = this.data.comment;
}

SQL.Table.prototype.getComment = function() {
	return this.data.comment;
}

SQL.Table.prototype.move = function(e) { /* mousemove */
	var t = SQL.Table;
	thisDesigner.removeSelection();
	if (e.type == "touchmove") {
		if (e.touches.length > 1) { return; }
		var event = e.touches[0];
	} else {
		var event = e;
	}

	for (var i=0;i<t.active.length;i++) {
		var x = t.x[i] + event.clientX;
		var y = t.y[i] + event.clientY;
		t.active[i].moveTo(x,y);
	}
}

SQL.Table.prototype.up = function(e) {
	var t = SQL.Table;
	var d = thisDesigner;
	if (d.getOption("hide")) { 
		for (var i=0;i<t.active.length;i++) {
			t.active[i].showRelations(); 
			t.active[i].redraw();
		}
	}
	t.active = false;
	OZ.Event.remove(this.documentMove);
	OZ.Event.remove(this.documentUp);
    this.owner.setUnsavedChanges();
	this.owner.sync();
}

SQL.Table.prototype.destroy = function() {
	SQL.Visual.prototype.destroy.apply(this);
	this.dom.mini.parentNode.removeChild(this.dom.mini);
	while (this.rows.length) {
		this.removeRow(this.rows[0]);
	}
	this._ec.forEach(OZ.Event.remove, OZ.Event);
}

/* --------------------- db index ------------ */

SQL.Key = OZ.Class().extend(SQL.Visual);

SQL.Key.prototype.init = function(owner, type, name) {
	this.owner = owner;
	this.rows = [];
	this.type = type || "INDEX";
	this.name = name || "";
	SQL.Visual.prototype.init.apply(this);
}

SQL.Key.prototype.setName = function(n) {
	this.name = n;
}

SQL.Key.prototype.getName = function() {
	return this.name;
}

SQL.Key.prototype.setType = function(t) {
	if (!t) { return; }
	this.type = t;
	for (var i=0;i<this.rows.length;i++) { this.rows[i].redraw(); }
}

SQL.Key.prototype.getType = function() {
	return this.type;
}

SQL.Key.prototype.addRow = function(r) {
	if (r.owner != this.owner) { return; }
	this.rows.push(r);
	r.addKey(this);
}

SQL.Key.prototype.removeRow = function(r) {
	var idx = this.rows.indexOf(r);
	if (idx == -1) { return; }
	r.removeKey(this);
	this.rows.splice(idx,1);
}

SQL.Key.prototype.destroy = function() {
	for (var i=0;i<this.rows.length;i++) {
		this.rows[i].removeKey(this);
	}
}

SQL.Key.prototype.getLabel = function() {
	return this.name || this.type;
}

SQL.Key.prototype.toXML = function() {
	var xml = "";
	xml += '<key type="'+this.getType()+'" name="'+this.getName()+'">\n';
	for (var i=0;i<this.rows.length;i++) {
		var r = this.rows[i];
		xml += '<part>'+r.getTitle()+'</part>\n';
	}
	xml += '</key>\n';
	return xml;
}

SQL.Key.prototype.readschema = function(key) {
	this.setType(key.type);
	var columns = key.columns;
	for (c in columns) {
		var name = columns[c];
		var row = this.owner.findNamedRow(name);
		this.addRow(row);
	}
}

/* --------------------- rubberband -------------------- */

SQL.Rubberband = OZ.Class().extend(SQL.Visual);

SQL.Rubberband.prototype.init = function(owner) {
	this.owner = owner;
	SQL.Visual.prototype.init.apply(this);
	this.dom.container = OZ.$("rubberband");
	OZ.Event.add("area", "mousedown", this.bind(this.down));
}

SQL.Rubberband.prototype.down = function(e) {
	OZ.Event.prevent(e);
	var scroll = OZ.DOM.scroll();
	this.x = this.x0 = e.clientX + scroll[0];
	this.y = this.y0 = e.clientY + scroll[1];
	this.width = 0;
	this.height = 0;
	this.redraw();
	this.documentMove = OZ.Event.add(document, "mousemove", this.bind(this.move));
	this.documentUp = OZ.Event.add(document, "mouseup", this.bind(this.up));
}

SQL.Rubberband.prototype.move = function(e) {
	var scroll = OZ.DOM.scroll();
	var x = e.clientX + scroll[0];
	var y = e.clientY + scroll[1];
	this.width = Math.abs(x-this.x0);
	this.height = Math.abs(y-this.y0);
	if (x<this.x0) { this.x = x; } else { this.x = this.x0; }
	if (y<this.y0) { this.y = y; } else { this.y = this.y0; }
	this.redraw();
	this.dom.container.style.visibility = "visible";	
}

SQL.Rubberband.prototype.up = function(e) {
	OZ.Event.prevent(e);
	this.dom.container.style.visibility = "hidden";
	OZ.Event.remove(this.documentMove);
	OZ.Event.remove(this.documentUp);
	this.owner.tableManager.selectRect(this.x, this.y, this.width, this.height);
}

SQL.Rubberband.prototype.redraw = function() {
	this.dom.container.style.left = this.x+"px";
	this.dom.container.style.top = this.y+"px";
	this.dom.container.style.width = this.width+"px";
	this.dom.container.style.height = this.height+"px";
}

/* --------------------- minimap ------------ */

SQL.Map = OZ.Class().extend(SQL.Visual);

SQL.Map.prototype.init = function(owner) {
	this.owner = owner;
	SQL.Visual.prototype.init.apply(this);
	this.dom.container = OZ.$("minimap");
	this.width = this.dom.container.offsetWidth - 2;
	this.height = this.dom.container.offsetHeight - 2;
	
	this.dom.port = OZ.DOM.elm("div",{className:"port", zIndex:1});
	this.dom.container.appendChild(this.dom.port);
	this.sync = this.bind(this.sync);
	
	this.flag = false;
	this.sync();
	
	OZ.Event.add(window, "resize", this.sync);
	OZ.Event.add(window, "scroll", this.sync);
	OZ.Event.add(this.dom.container, "mousedown", this.bind(this.down));
	OZ.Event.add(this.dom.container, "touchstart", this.bind(this.down));
	OZ.Event.add(this.dom.container, "touchmove", OZ.Event.prevent);
}

SQL.Map.prototype.down = function(e) { /* mousedown - move view and start drag */
	this.flag = true;
	this.dom.container.style.cursor = "move";
	var pos = OZ.DOM.pos(this.dom.container);

	this.x = Math.round(pos[0] + this.l + this.w/2);
	this.y = Math.round(pos[1] + this.t + this.h/2);
	this.move(e);
	
	if (e.type == "touchstart") {
		var eventMove = "touchmove";
		var eventUp = "touchend";
	} else {
		var eventMove = "mousemove";
		var eventUp = "mouseup";
	}

	this.documentMove = OZ.Event.add(document, eventMove, this.bind(this.move));
	this.documentUp = OZ.Event.add(document, eventUp, this.bind(this.up));
}

SQL.Map.prototype.move = function(e) { /* mousemove */
	if (!this.flag) { return; }
	OZ.Event.prevent(e);
	
	if (e.type.match(/touch/)) {
		if (e.touches.length > 1) { return; }
		var event = e.touches[0];
	} else {
		var event = e;
	}
	
	var dx = event.clientX - this.x;
	var dy = event.clientY - this.y;
	if (this.l + dx < 0) { dx = -this.l; }
	if (this.t + dy < 0) { dy = -this.t; }
	if (this.l + this.w + 4 + dx > this.width) { dx = this.width - 4 - this.l - this.w; }
	if (this.t + this.h + 4 + dy > this.height) { dy = this.height - 4 - this.t - this.h; }
	
	
	this.x += dx;
	this.y += dy;
	
	this.l += dx;
	this.t += dy;
	
	var coefX = this.width / this.owner.width;
	var coefY = this.height / this.owner.height;
	var left = this.l / coefX;
	var top = this.t / coefY;
	
	if (OZ.webkit) {
		document.body.scrollLeft = Math.round(left);
		document.body.scrollTop = Math.round(top);
	} else {
		document.documentElement.scrollLeft = Math.round(left);
		document.documentElement.scrollTop = Math.round(top);
	}
	
	this.redraw();
}

SQL.Map.prototype.up = function(e) { /* mouseup */
	this.flag = false;
	this.dom.container.style.cursor = "";
	OZ.Event.remove(this.documentMove);
	OZ.Event.remove(this.documentUp);
}

SQL.Map.prototype.sync = function() { /* when window changes, adjust map */
	var dims = OZ.DOM.win();
	var scroll = OZ.DOM.scroll();
	var scaleX = this.width / this.owner.width;
	var scaleY = this.height / this.owner.height;

	var w = dims[0] * scaleX - 4 - 0;
	var h = dims[1] * scaleY - 4 - 0;
	var x = scroll[0] * scaleX;
	var y = scroll[1] * scaleY;
	
	this.w = Math.round(w);
	this.h = Math.round(h);
	this.l = Math.round(x);
	this.t = Math.round(y);
	
	this.redraw();
}

SQL.Map.prototype.redraw = function() {
	this.dom.port.style.width = this.w+"px";
	this.dom.port.style.height = this.h+"px";
	this.dom.port.style.left = this.l+"px";
	this.dom.port.style.top = this.t+"px";
}

/* --------------------- io ------------ */

SQL.IO = OZ.Class();

SQL.IO.prototype.init = function(owner) {
	this.owner = owner;
	this._name = ""; /* last used keyword */
	this.dom = {
		container:OZ.$("io")
	};

	var ids = ["serversave", "serverload", "quit"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		this.dom[id] = elm;
		elm.value = _(id);
	}
	
	var ids = ["output"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		elm.innerHTML = _(id);
	}
	
	this.dom.ta = OZ.$("textarea");
	this.dom.backend = OZ.$("backend");
	
	this.dom.container.parentNode.removeChild(this.dom.container);
	this.dom.container.style.visibility = "";
	
	OZ.Event.add(this.dom.serversave, "click", this.bind(this.serversave));
	OZ.Event.add(this.dom.serverload, "click", this.bind(this.revert));
    OZ.Event.add(this.dom.quit, "click", this.bind(this.quit));
	OZ.Event.add(document, "keydown", this.bind(this.press));
    if (!gup('db')) {
        this.dom.serverload.disabled = true;
    }
	this.build();
}

SQL.IO.prototype.loadStandardResponse = function(data, code) {
	if (!SQL.IO.prototype.check(code)) { return; }
	SQL.IO.prototype.fromXML(data);
	this.owner.setTitle(this.name);
}

SQL.IO.prototype.build = function() {
	OZ.DOM.clear(this.dom.backend);

	var bs = CONFIG.AVAILABLE_BACKENDS;
	var be = CONFIG.DEFAULT_BACKEND;
	var r = window.location.search.substring(1).match(/backend=([^&]*)/);
	if (r) {
		req = r[1];
		if (bs.indexOf(req) != -1) {
		  be = req;
		}
	}
	for (var i=0;i<bs.length;i++) {
		var o = OZ.DOM.elm("option");
		o.value = bs[i];
		o.innerHTML = bs[i];
		this.dom.backend.appendChild(o);
		if (bs[i] == be) { this.dom.backend.selectedIndex = i; }
	}
}

SQL.IO.prototype.click = function() { /* open io dialog */
	this.build();
	this.dom.ta.value = "";
	this.owner.window.open(_("saveload"),this.dom.container);
}

SQL.IO.prototype.readschema = function(schema) {
	if (!schema) {
        this.owner.alert('No schema to show!');
		return false; 
	}
    this.owner.readschema(schema);
	this.owner.window.close();
	return true;
}

SQL.IO.prototype.clientsave = function() {
	var xml = this.owner.toXML();
	this.dom.ta.value = xml;
}

SQL.IO.prototype.clientload = function() {
	var xml = this.dom.ta.value;
	if (!xml) {
		this.owner.alert(_("empty"));
		return;
	}
	try {
		if (window.DOMParser) {
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(xml, "text/xml");
		} else if (window.ActiveXObject) {
			var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.loadXML(xml);
		} else {
			throw new Error("No XML parser available.");
		}
	} catch(e) { 
		this.owner.alert(_("xmlerror")+': '+e.message);
		return;
	}
	this.fromXML(xmlDoc);
}

/**
 * Save changes made to the database
 * 
 * @param {Event} e
 * @returns {undefined}
 */
SQL.IO.prototype.serversave = function(e) {
    var positionRequest;
    var positionURL;
    var url;
	this.owner.confirm(_('saveconfirm')
	).then(
        function() {
            currently_saving = true;
            this.owner.showOverlay();
            var tables = this.owner.tables;
            var positions = [];
            // Create request for saving table positions
            for (t in tables) {
                var position = {
                    "tablename": tables[t].getTitle(),
                    "x": tables[t].x,
                    "y": tables[t].y
                };
                positions.push(position);
            }
            positionRequest = {"positions": positions};
            positionURL = dbURL()+"/positions";
            url = dbURL() + "/staging";

            // Save the changes to the database
            return this.owner.request.Promise(url, SQL.Request.PUT);        
        }.bind(this),
        this.owner.error
    ).then(
        function() {
            // Create a new working copy of the database for further changes
            return this.owner.request.Promise(url, SQL.Request.POST);
        }.bind(this),
        this.owner.error
    ).then(
        function() {
            // Save the current table positions
            return this.owner.request.Promise(positionURL, 
                                                SQL.Request.PUT, 
                                                JSON.stringify(positionRequest));
        }.bind(this),
        this.owner.error
    ).then(
        function() {
            this.owner.clearUnsavedChanges();
            this.owner.newdb = false;
            this.owner.hideOverlay();
            this.owner.alert(_("changessaved"));
        }.bind(this),
        function() {
            window.location.reload();
        }
    );
}

/**
 * If there are unsaved changes and this isn't a brand new database.
 * display a confirmation before leaving the page
 * 
 * @param {Event} e
 * @returns {undefined}
 */
SQL.IO.prototype.quit = function(e) {
    if (this.owner.unsavedChanges && !this.owner.newdb) {
        e.preventDefault();
        var request = this.owner.confirm(_("confirmquit")).then(
            function() {
                // If we're abandoning changes, delete the working copy
                var url = dabURL + '/staging';
                return this.owner.request.Promise(url, SQL.Request.DELETE);
            }.bind(this),
            function() {
                return new Promise(function(resolve, reject) {reject();});
            }
        ).then(
            function() {
                e.target.parentNode.submit();
            }
        );
    }
    var databasePageURL = protocol+"//"+host+"/app/#/project/"+projectId+"/"+projectDatabaseId;
	window.location.assign(databasePageURL);
    
}

SQL.IO.prototype.quicksave = function(e) {
	this.serversave(e, this._name);
}


function gup( name ) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if( results == null ) {
		return "";
	}
	else {
		return results[1];
	}
}

/**
 * Create a working copy of the database, then get the database schema from 
 * the server and hand it off to be loaded into the interface
 * 
 * @param {type} e
 * @returns {undefined}
 */
SQL.IO.prototype.serverload = function(e) {
    this.owner.showOverlay();
    // Create a clone
    var url = dbURL() + "/staging";
    this.owner.request.Promise(url, SQL.Request.GET).then(
    	function(response) {
    		this.readschema(response);
    		this.owner.setTitle(this.name);
    		this.owner.hideOverlay();
    		this.owner.clearUnsavedChanges();
    		if (this.owner.tables.length === 0) {
        		this.owner.newdb = true;
    		}
    		loaded = true;
    	}.bind(this)
    );
}

/**
 * If there's unsaved changes, display a confirmation. In confirmed, reload
 * the page which will throw away the working copy and create a new one with
 * unsaved changes lost.
 * 
 * @param {type} e
 * @returns {undefined}
 */
SQL.IO.prototype.revert = function(e) {
    if (this.owner.unsavedChanges) {
        this.owner.confirm(_('confirmload')).then(
            function() {
                window.location.reload();
            }
        );
    }
}

SQL.IO.prototype.check = function(code) {
	switch (code) {
		case 201:
		case 404:
		case 500:
		case 501:
		case 503:
			var lang = "http"+code;
			this.dom.ta.value = _("httpresponse")+": "+_(lang);
			return false;
		break;
		default: return true;
	}
}

SQL.IO.prototype.press = function(e) {
	switch (e.keyCode) {
		case 113:
			if (OZ.opera) {
				e.preventDefault();
			}
			this.quicksave(e);
		break;
	}
}

/* --------------------- table manager ------------ */

SQL.TableManager = OZ.Class();

SQL.TableManager.prototype.init = function(owner) {
	this.owner = owner;
    this.currentTable;
	this.dom = {
		container:OZ.$("table"),
		name:OZ.$("tablename"),
		comment:OZ.$("tablecomment")
	};
	this.selection = [];
	this.adding = false;
	
	var ids = ["addtable","removetable","aligntables","cleartables","addrow","edittable","tablekeys"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		this.dom[id] = elm;
		elm.value = _(id);
	}

	var ids = ["tablenamelabel","tablecommentlabel"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		elm.innerHTML = _(id);
	}
	
	
	this.select(false);
	
	this.save = this.bind(this.save);
	
	OZ.Event.add("area", "click", this.bind(this.click));
	OZ.Event.add(this.dom.addtable, "click", this.bind(this.preAdd));
	OZ.Event.add(this.dom.removetable, "click", this.bind(this.remove));
	OZ.Event.add(this.dom.cleartables, "click", this.bind(this.clear));
	OZ.Event.add(this.dom.addrow, "click", this.bind(this.addRow));
	OZ.Event.add(this.dom.aligntables, "click", this.owner.bind(this.owner.alignTables));
	OZ.Event.add(this.dom.edittable, "click", this.bind(this.edit));
	OZ.Event.add(this.dom.tablekeys, "click", this.bind(this.keys));
	OZ.Event.add(document, "keydown", this.bind(this.press));

	this.dom.container.parentNode.removeChild(this.dom.container);
}

/**
 * Add a row to a table, defaulting to a nullable integer
 * 
 * @param {type} e
 * @returns {undefined}
 */
SQL.TableManager.prototype.addRow = function(e) {
    var columnRequest = {
        datatype: "INTEGER",
        nullable: true
    };
    var columnURL = dbURL()+"/table/"+this.selection[0].getTitle()+"/column/"+_("newrow")+"/staging";
    this.owner.showOverlay();
    this.owner.request.Promise(columnURL, SQL.Request.POST, JSON.stringify(columnRequest)).then(
        function() {
            var newrow = this.selection[0].addRow(_("newrow"));
            this.owner.rowManager.select(newrow);
            newrow.expand();
            this.owner.hideOverlay();
        }.bind(this),
        this.owner.error
    );
}

SQL.TableManager.prototype.select = function(table, multi) { /* activate table */
	if (table) {
		if (multi) {
			var i = this.selection.indexOf(table);
			if (i < 0) {
				this.selection.push(table);
			} else {
				this.selection.splice(i, 1);
			}
		} else {
			if (this.selection[0] === table) { return; }
			this.selection = [table];
		}
	} else {
		this.selection = [];
	}
	this.processSelection();
}

SQL.TableManager.prototype.processSelection = function() {
	var tables = this.owner.tables;
	for (var i=0;i<tables.length;i++) {
		tables[i].deselect();
	}
	if (this.selection.length == 1) {
		this.dom.addrow.disabled = false;
		this.dom.edittable.disabled = false;
		this.dom.tablekeys.disabled = false;
		this.dom.removetable.value = _("removetable");
	} else {
		this.dom.addrow.disabled = true;
		this.dom.edittable.disabled = true;
		this.dom.tablekeys.disabled = true;
	}
	if (this.selection.length) {
		this.dom.removetable.disabled = false;
		if (this.selection.length > 1) { this.dom.removetable.value = _("removetables"); }
	} else {
		this.dom.removetable.disabled = true;
		this.dom.removetable.value = _("removetable");
	}
	for (var i=0;i<this.selection.length;i++) {
		var t = this.selection[i];
		t.owner.raise(t);
		t.select();
	}
}

SQL.TableManager.prototype.selectRect = function(x,y,width,height) { /* select all tables intersecting a rectangle */
	this.selection = [];
	var tables = this.owner.tables;
	var x1 = x+width;
	var y1 = y+height;
	for (var i=0;i<tables.length;i++) {
		var t = tables[i];
		var tx = t.x;
		var tx1 = t.x+t.width;
		var ty = t.y;
		var ty1 = t.y+t.height;
		if (((tx>=x && tx<x1) || (tx1>=x && tx1<x1) || (tx<x && tx1>x1)) &&
		    ((ty>=y && ty<y1) || (ty1>=y && ty1<y1) || (ty<y && ty1>y1)))
			{ this.selection.push(t); }
	}
	this.processSelection();
}

/**
 * Add a new table, create an initial column and make it the Primary Key
 * 
 * @param {type} e
 * @returns {undefined}
 */
SQL.TableManager.prototype.click = function(e) { /* finish adding new table */
	var newtable = false;
	if (this.adding) {
        this.owner.showOverlay();
		this.adding = false;
		OZ.DOM.removeClass("area","adding");
		this.dom.addtable.value = this.oldvalue;
		var scroll = OZ.DOM.scroll();
		var x = e.clientX + scroll[0];
		var y = e.clientY + scroll[1];
        // Add the table, column and key in the interface
		newtable = this.owner.addTable(this.generateName(),x,y);
		var r = newtable.addRow("id",{ai:true});
		var k = newtable.addKey("PRIMARY","");
		k.addRow(r);
        // Generate the URLs and requests for adding the table, column and key
        var tableURL = dbURL()+"/table/"+newtable.getTitle()+"/staging";
        var columnURL = dbURL()+"/table/"+newtable.getTitle()+"/column/"+r.getTitle()+"/staging";
        var constraintURL = dbURL()+"/table/"+newtable.getTitle()+"/constraint/pkey_"+newtable.getTitle()+"/staging";
        var columnRequest = {
            datatype: "integer",
            autoincrement: true
        }
        var constraintRequest = {
            primary: true,
            columns: [r.getTitle()]
        }
        // Create the table
        this.owner.request.Promise(tableURL, SQL.Request.POST).then(
            function(response) {
                // Adding table succeeds, create the column
                return this.owner.request.Promise(columnURL, SQL.Request.POST, JSON.stringify(columnRequest));
            }.bind(this), 
            function(response) {
                // Adding table fails
                this.owner.removeTable(newtable);
                this.owner.hideOverlay();
                this.owner.error(response);
            }.bind(this)
        ).then(
            function() {
                // Adding column succeed, create the primary key
                return this.owner.request.Promise(constraintURL, SQL.Request.POST, JSON.stringify(constraintRequest));
            }.bind(this), 
            function(response) {
                // Adding column fails
                this.owner.removeTable(newtable);
                this.owner.request.Promise(tableURL, SQL.Request.DELETE);
                this.owner.hideOverlay();
                this.owner.error(response);
            }.bind(this)
        ).then(
            function() {
                // Adding primary key succeeds
                this.select(newtable);
                this.owner.rowManager.select(false);
                if (this.selection.length === 1) { this.edit(e); } 
                this.owner.hideOverlay();
            }.bind(this), 
            function(response) {
                // Adding primary key fails
                this.owner.removeTable(newtable);
                this.owner.request.Promise(tableURL, SQL.Request.DELETE);
                this.owner.error(response);
                this.owner.hideOverlay();
            }.bind(this)
        );
	}
}

SQL.TableManager.prototype.preAdd = function(e) { /* click add new table */
	if (this.adding) {
		this.adding = false;
		OZ.DOM.removeClass("area","adding");
		this.dom.addtable.value = this.oldvalue;
	} else {
		this.adding = true;
		OZ.DOM.addClass("area","adding");
		this.oldvalue = this.dom.addtable.value;
		this.dom.addtable.value = "["+_("addpending")+"]";
	}
}

SQL.TableManager.prototype.clear = function(e) { /* remove all tables */
	if (!this.owner.tables.length) { return; }
	this.owner.confirm(_("confirmall")+" ?").then(
        function() {
            this.owner.clearTables();
        }.bind(this)
    );
}

/**
 * Delete a table
 * 
 * @param {type} e
 * @returns {undefined}
 */
SQL.TableManager.prototype.remove = function(e) {
	var titles = this.selection.slice(0);
	for (var i=0;i<titles.length;i++) { titles[i] = "'"+titles[i].getTitle()+"'"; }
	this.owner.confirm(_("confirmtable")+" "+titles.join(", ")+"?").then(
        function() {
            this.owner.showOverlay();
            var sel = this.selection.slice(0);
            for (var i=0;i<sel.length;i++) { 
                var table = sel[i];
                var deleteURL = dbURL()+"/table/"+table.getTitle()+"/staging";
                // Delete the table from the database
                this.owner.request.Promise(deleteURL, SQL.Request.DELETE).then(
                    function() {
                        // Remove the table from the interface
                        this.owner.removeTable(table); 
                        this.owner.hideOverlay();
                    }.bind(this), 
                    this.owner.error
                );
            }
        }.bind(this)
    );
}

SQL.TableManager.prototype.edit = function(e) {
	this.owner.window.open(_("edittable"), this.dom.container, this.save);
	
	var title = this.selection[0].getTitle();
	this.dom.name.value = title;

    var re = RegExp('<table[^>]+name="'+title+'"[^>]*>');

    if (thisDesigner.savedXML.match(re)) {
        this.dom.name.disabled = true;
        OZ.$('tablenamedisabledrow').setAttribute('style', 'display:table-row');
    } else {
        this.dom.name.disabled = false;
        OZ.$('tablenamedisabledrow').setAttribute('style', 'display:none');
    }
	try { /* throws in ie6 */
	var titles = this.selection.slice(0);
	for (var i=0;i<titles.length;i++) { titles[i] = "'"+titles[i].getTitle()+"'"; }
		this.dom.comment.value = this.selection[0].getComment();
	} catch(e) {}

	/* pre-select table name */
	this.dom.name.focus();
	if (OZ.ie) {
		try { /* throws in ie6 */
			this.dom.name.select();
		} catch(e) {}
	} else {
		this.dom.name.setSelectionRange(0, title.length);
	} 
}

SQL.TableManager.prototype.keys = function(e) { /* open keys dialog */
	this.owner.keyManager.open(this.selection[0]);
}

/**
 * Save changes to the current table
 * 
 * @returns {undefined}
 */
SQL.TableManager.prototype.save = function() {
    oldname = this.selection[0].getTitle();
    oldcomment = this.selection[0].data.comment;
    var namechange = oldname !== this.dom.name.value;
    var commentchange = oldcomment !== this.dom.comment.value;
    if (namechange || commentchange) {
        // If the table's name or comment has changed, save them to the working
        // copy on the server
        this.owner.showOverlay();
        (function() {
            if (namechange) {
                // If the name has changed, create the URL and request to
                // save the change
                tableRequest = {newname: this.dom.name.value};
                tableUrl = dbURL()+'/table/'+oldname+'/staging';
                if (commentchange) {
                    // If the comment has changed too, change we need to use
                    // the new table name in the URL
                    commentRequest = {comment: this.dom.comment.value};
                    commentUrl = dbURL()+'/table/'+this.dom.name.value+'/comment/staging';
                    // Change the table name
                    return this.owner.request.Promise(tableUrl, SQL.Request.POST, JSON.stringify(tableRequest)).then(
                        function() {
                            // Save the comment
                            return this.owner.request.Promise(commentUrl, SQL.Request.POST, JSON.stringify(commentRequest));
                        }.bind(this),
                        this.owner.error
                    );
                } else {
                    // If the comment hasn't changed, just change the table name
                    return this.owner.request.Promise(tableUrl, SQL.Request.PUT, JSON.stringify(tableRequest));
                }
            } else {
                // If the table name hasn't been changed, just save the comment
                commentRequest = {comment: this.dom.comment.value};
                commentUrl = dbURL()+'/table/'+oldname+'/comment/staging';
                return this.owner.request.Promise(commentUrl, SQL.Request.POST, JSON.stringify(commentRequest));
            }
        }.bind(this))().then(
            function() {
                // Set the new title and comment in the interface
                this.selection[0].setTitle(this.dom.name.value);
                this.selection[0].setComment(this.dom.comment.value);
                this.owner.hideOverlay();
            }.bind(this),
            this.owner.error   
        );
    }
}

SQL.TableManager.prototype.press = function(e) {
	var target = OZ.Event.target(e).nodeName.toLowerCase();
	if (target == "textarea" || target == "input") { return; } /* not when in form field */
	
	if (this.owner.rowManager.selected) { return; } /* do not process keypresses if a row is selected */

	if (!this.selection.length) { return; } /* nothing if selection is active */

	switch (e.keyCode) {
		case 46:
			this.remove();
			OZ.Event.prevent(e);
		break;
	}
}

SQL.TableManager.prototype.generateName = function() { 
    var name = _('newtable');
    var number = 1;
    var tables = this.owner.tables;
    var unique;
    do {
        unique = true;
        for (var i=0,j=tables.length; i<j; i++) { 
           if (tables[i].data.title === name+'_'+number) {
               number++;
               unique = false;
               break;
           }
        }
    } while (unique === false);
    return name+'_'+number; 
}

/* --------------------- row manager ------------ */

SQL.RowManager = OZ.Class();

SQL.RowManager.prototype.init = function(owner) {
	this.owner = owner;
	this.dom = {};
	this.selected = null;
	this.creating = false;
	this.connecting = false;
	
	var ids = ["editrow","removerow",/*"uprow","downrow",*/"foreigncreate","foreignconnect","foreigndisconnect"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		this.dom[id] = elm;
		elm.value = _(id);
	}

	this.select(false);
	
	OZ.Event.add(this.dom.editrow, "click", this.bind(this.edit));
//	OZ.Event.add(this.dom.uprow, "click", this.bind(this.up));
//	OZ.Event.add(this.dom.downrow, "click", this.bind(this.down));
	OZ.Event.add(this.dom.removerow, "click", this.bind(this.remove));
	OZ.Event.add(this.dom.foreigncreate, "click", this.bind(this.foreigncreate));
	OZ.Event.add(this.dom.foreignconnect, "click", this.bind(this.foreignconnect));
	OZ.Event.add(this.dom.foreigndisconnect, "click", this.bind(this.foreigndisconnect));
	OZ.Event.add(false, "tableclick", this.bind(this.tableClick));
	OZ.Event.add(false, "rowclick", this.bind(this.rowClick));
	OZ.Event.add(document, "keydown", this.bind(this.press));
}

SQL.RowManager.prototype.select = function(row) { /* activate a row */
	if (this.selected === row) { return; }
	if (this.selected) { this.selected.deselect(); }

	this.selected = row;
	if (this.selected) { this.selected.select(); }
	this.redraw();
}

/**
 *  Create relation by clicking target table after clicking "Create foreign key"
 *  
 *  First we need to create a new column in the target table, then create 
 *  the relationship
 */
SQL.RowManager.prototype.tableClick = function(e) { 
	if (!this.creating) { return; }
	
    this.owner.showOverlay();
    
	var r1 = this.selected;
	var t2 = e.target;
	
	var p = this.owner.getOption("pattern");
	p = p.replace(/%T/g,r1.owner.getTitle());
	p = p.replace(/%t/g,t2.getTitle());
	p = p.replace(/%R/g,r1.getTitle());

    // Generate a new constraint name and URLs for adding a new column and constraint
    var tableURL = dbURL()+"/table/"+t2.getTitle()+"/staging";
    var columnURL = dbURL()+"/table/"+t2.getTitle()+"/column/"+p+"/staging";
    var constraintName = "fkey_"+t2.getTitle()+"_"+p+"/staging";
    var constraintURL = dbURL()+"/table/"+t2.getTitle()+"/constraint/"+constraintName+"/staging";

    // Create requests for adding a new column (with the same data type as the
    // one that will be connected to it) and the new foreign key constraint
    var columnRequest = {
        datatype: r1.data.type,
        nullable: true,
        defaultvalue: null
    };
    
    var constraintRequest = {
        foreign: true,
        columns: [p],
        reftable: r1.owner.getTitle(),
        refcolumn: r1.getTitle()
    };

    // Add the new foreign key column to the table
    this.owner.request.Promise(columnURL, SQL.Request.POST, JSON.stringify(columnRequest)).then(
        function() {
            // Add the foreign key constraint to the table
            return this.owner.request.Promise(constraintURL, SQL.Request.POST, JSON.stringify(constraintRequest));
        }.bind(this),
        this.owner.error
    ).then(
        function() {
            // Update the interface with the new columnd and relationship
            var r2 = t2.addRow(p, r1.data);
            r2.update({"type":r1.data.type});
            r2.update({"ai":false});
            r2.update({"nll":true});
            r2.update({"def":null});
            rel = this.owner.addRelation(r1, r2);
            rel.data.title = constraintName;
            this.owner.hideOverlay();
        }.bind(this),
        this.owner.error
    );
    
}

/** 
 * Draw relation when clicking target row after clicking "Connect Foreign Key"
 */
SQL.RowManager.prototype.rowClick = function(e) { 
	if (!this.connecting) { return; }
	
	var r1 = this.selected;
	var r2 = e.target;
	
    if (r1.data.type !== r2.data.type) {
        this.owner.alert("The foreign key field you selected does not match the data type of the primary key field. The relationship was not created");
        return false;
    }
	if (r1 == r2) { return; }
    
    this.owner.showOverlay();
    var tableURL = dbURL()+"/table/"+r2.owner.getTitle()+"/staging";
    var constraintName = "fkey_"+r2.owner.getTitle()+"_"+r2.getTitle()+"";
    var constraintURL = dbURL()+"/table/"+r2.owner.getTitle()+"/constraint/"+constraintName+"/staging";

    var constraintRequest = {
        foreign: true,
        columns: [r2.getTitle()],
        reftable: r1.owner.getTitle(),
        refcolumn: r1.getTitle()
    };

    this.owner.request.Promise(constraintURL, SQL.Request.POST, JSON.stringify(constraintRequest)).then(
        function() {
            rel = this.owner.addRelation(r1, r2);
            rel.data.title = constraintName;
            this.owner.hideOverlay();
        }.bind(this),
        this.owner.error
    );
	
}

SQL.RowManager.prototype.foreigncreate = function(e) { /* start creating fk */
	this.endConnect();
	if (this.creating) {
		this.endCreate();
	} else {
		this.creating = true;
		this.dom.foreigncreate.value = "["+_("foreignpending")+"]";
	}
}

SQL.RowManager.prototype.foreignconnect = function(e) { /* start drawing fk */
	this.endCreate();
	if (this.connecting) {
		this.endConnect();
	} else {
		this.connecting = true;
		this.dom.foreignconnect.value = "["+_("foreignconnectpending")+"]";
	}
}

SQL.RowManager.prototype.foreigndisconnect = function(e) { /* remove connector */
	var rels = this.selected.relations;
	for (var i=rels.length-1;i>=0;i--) {
		var r = rels[i];
		if (r.row2 == this.selected) { this.owner.removeRelationDirect(r); }
	}
	this.redraw();
}

SQL.RowManager.prototype.endCreate = function() {
	this.creating = false;
	this.dom.foreigncreate.value = _("foreigncreate");
}

SQL.RowManager.prototype.endConnect = function() {
	this.connecting = false;
	this.dom.foreignconnect.value = _("foreignconnect");
}

/*SQL.RowManager.prototype.up = function(e) {
	this.selected.up();
	this.redraw();
}

SQL.RowManager.prototype.down = function(e) {
	this.selected.down();
	this.redraw();
}*/

/**
 * Remove a column from a table
 * 
 * @param {type} e
 * @returns {undefined}
 */
SQL.RowManager.prototype.remove = function(e) {
    var t;
	this.owner.confirm(_("confirmrow")+" '"+this.selected.getTitle()+"' ?").then(
        function() {
            this.owner.showOverlay();
            t = this.selected.owner;
            var tableName = t.getTitle();
            var colName = this.selected.getTitle();
            var columnURL = dbURL()+"/table/"+tableName+"/column/"+colName+"/staging";

            return this.owner.request.Promise(columnURL, SQL.Request.DELETE);
        }.bind(this)
    ).then(
        function() {
            this.selected.owner.removeRow(this.selected);
            
            var next = false;
            if (t.rows) { next = t.rows[t.rows.length-1]; }
            this.select(next);
            this.owner.hideOverlay();
        }.bind(this),
        this.owner.error
    );
}

SQL.RowManager.prototype.redraw = function() {
	this.endCreate();
	this.endConnect();
	if (this.selected) {
		var table = this.selected.owner;
		var rows = table.rows;
//		this.dom.uprow.disabled = (rows[0] == this.selected);
//		this.dom.downrow.disabled = (rows[rows.length-1] == this.selected);
		this.dom.removerow.disabled = false;
		this.dom.editrow.disabled = false;
		this.dom.foreigncreate.disabled = !(this.selected.isUnique());
		this.dom.foreignconnect.disabled = !(this.selected.isUnique());
		
		this.dom.foreigndisconnect.disabled = true;
		var rels = this.selected.relations;
		for (var i=0;i<rels.length;i++) {
			var r = rels[i];
			if (r.row2 == this.selected) { this.dom.foreigndisconnect.disabled = false; }
		}
		
	} else {
//		this.dom.uprow.disabled = true;
//		this.dom.downrow.disabled = true;
		this.dom.removerow.disabled = true;
		this.dom.editrow.disabled = true;
		this.dom.foreigncreate.disabled = true;
		this.dom.foreignconnect.disabled = true;
		this.dom.foreigndisconnect.disabled = true;
	}
}

SQL.RowManager.prototype.press = function(e) {
	if (!this.selected) { return; }
	
	var target = OZ.Event.target(e).nodeName.toLowerCase();
	if (target == "textarea" || target == "input") { return; } /* not when in form field */
	
	switch (e.keyCode) {
//		case 38:
//			this.up();
//			OZ.Event.prevent(e);
//		break;
//		case 40:
//			this.down();
//			OZ.Event.prevent(e);
//		break;
		case 46:
			this.remove();
			OZ.Event.prevent(e);
		break;
		case 13:
		case 27:
			this.selected.collapse();
		break;
	}
}

SQL.RowManager.prototype.edit = function(e) {
	this.selected.expand();
}

/* ----------------- key manager ---------- */

SQL.KeyManager = OZ.Class();

SQL.KeyManager.prototype.init = function(owner) {
	this.owner = owner;
	this.dom = {
		container:OZ.$("keys")
	}
	this.build();
}

SQL.KeyManager.prototype.build = function() {
	this.dom.list = OZ.$("keyslist");
	this.dom.type = OZ.$("keytype");
	this.dom.name = OZ.$("keyname");
	this.dom.left = OZ.$("keyleft");
	this.dom.right = OZ.$("keyright");
	this.dom.fields = OZ.$("keyfields");
	this.dom.avail = OZ.$("keyavail");
	this.dom.listlabel = OZ.$("keyslistlabel");

	var ids = ["keyadd","keyremove"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		this.dom[id] = elm;
		elm.value = _(id);
	}

	var ids = ["keyedit","keytypelabel","keynamelabel","keyfieldslabel","keyavaillabel"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		elm.innerHTML = _(id);
	}
	
	var types = ["PRIMARY","INDEX","UNIQUE"];
	for (var i=0;i<types.length;i++) {
		var o = OZ.DOM.elm("option");
		o.innerHTML = types[i];
		o.value = types[i];
		this.dom.type.appendChild(o);
	}

	this.purge = this.bind(this.purge);
    this.save = this.bind(this.save);

	OZ.Event.add(this.dom.list, "change", this.bind(this.listchange));
	OZ.Event.add(this.dom.type, "change", this.bind(this.typechange));
	OZ.Event.add(this.dom.name, "keyup", this.bind(this.namechange));
	OZ.Event.add(this.dom.keyadd, "click", this.bind(this.add));
	OZ.Event.add(this.dom.keyremove, "click", this.bind(this.remove));
	OZ.Event.add(this.dom.left, "click", this.bind(this.left));
	OZ.Event.add(this.dom.right, "click", this.bind(this.right));
	
	this.dom.container.parentNode.removeChild(this.dom.container);
}

SQL.KeyManager.prototype.listchange = function(e) {
	this.switchTo(this.dom.list.selectedIndex);
}

SQL.KeyManager.prototype.typechange = function(e) {
	this.key.setType(this.dom.type.value);
    if (this.key.getName() === "") {
        var name = "pkey_"+this.table.getTitle();
        this.dom.name.value = name;
        this.key.setName(name);
    }
	this.redrawListItem();
}

SQL.KeyManager.prototype.namechange = function(e) {
	this.key.setName(this.dom.name.value);
	this.redrawListItem();
}

SQL.KeyManager.prototype.add = function(e) {
	var type = (this.table.keys.length ? "INDEX" : "PRIMARY");
	this.table.addKey(type);
	this.sync(this.table);
    this.table.keys[this.table.keys.length-1].new = true;
	this.switchTo(this.table.keys.length-1);
}

/**
 * Remove a key in the key manager
 * 
 * @param {type} e
 * @returns {undefined}
 */
SQL.KeyManager.prototype.remove = function(e) {
	var index = this.dom.list.selectedIndex;
	if (index == -1) { return; }
    this.owner.showOverlay();
	var r = this.table.keys[index];
    var tableURL = dbURL()+"/table/"+this.table.getTitle()+"/staging";
    var indexURL = dbURL()+"/table/"+this.table.getTitle()+"/index/"+r.name+"/staging";
    // Send the request to remove the key
    this.owner.request.Promise(indexURL, SQL.Request.DELETE).then(
        function() {
            // Remove the key from the interface
            this.table.removeKey(r);
            this.sync(this.table);
            this.owner.hideOverlay();
        }.bind(this),
        function(response) {
            // If we get an error that tells us we can drop a constraint
            // instead, try that
            var pattern = /Hint: You can drop constraint (.+) on table (.+) instead/;
            var match = pattern.exec(response);
            if (match !== null) {
                var constraintURL = dbURL()+"/table/"+match[2]+"/constraint/"+match[1]+"/staging";
                return this.owner.request.Promise(constraintURL, SQL.Request.DELETE);
            } else {
                this.owner.hideOverlay();
                this.owner.alert(response);
            }
        }.bind(this)
    ).then(
        function() {
            // Remove the key from the interface
            this.table.removeKey(r);
            this.sync(this.table);
            this.owner.hideOverlay();
        }.bind(this),
        this.owner.error
    )
}

SQL.KeyManager.prototype.purge = function() { /* remove empty keys */
	for (var i=this.table.keys.length-1;i>=0;i--) {
		var k = this.table.keys[i];
		if (!k.rows.length) { this.table.removeKey(k); }
	}
}

/**
 * Save a newly created key
 * 
 * @returns {undefined}
 */
SQL.KeyManager.prototype.save = function() {
    this.owner.showOverlay();
	for (var i=this.table.keys.length-1;i>=0;i--) {
		var k = this.table.keys[i];
		if (!k.rows.length || !k.getName() === "") { 
            // If there's no rows or no key name, there's nothing to save
            // so just remove the key
            this.table.removeKey(k);
        } else {
            if (k.new) {
                // Genreate the URL for the key (it might be a simple index, or
                // a constraint if it's unique or primary)
                if (k.type === "INDEX") {
                    var url = dbURL()+"/table/"+this.table.getTitle()+"/index/"+k.getName()+"/staging";
                } else {
                    var url = dbURL()+"/table/"+this.table.getTitle()+"/constraint/"+k.getName()+"/staging";
                }
                // Construct the request data
                var requestEntity = {columns: []};
                for (r in k.rows) {
                    requestEntity.columns.push(k.rows[r].getTitle());
                }
                if (k.type === "UNIQUE") {
                    requestEntity.unique = true;
                } else if (k.type === "PRIMARY") {
                    requestEntity.primary = true;    
                }
                // Create the key
                this.owner.request.Promise(url, SQL.Request.POST, JSON.stringify(requestEntity)).then(
                    function() {
                        this.owner.hideOverlay();
                    }.bind(this),
                    this.owner.error
                );
                k.new = false;
            }
        }
	}
}

SQL.KeyManager.prototype.sync = function(table) { /* sync content with given table */
	this.table = table;
	this.dom.listlabel.innerHTML = _("keyslistlabel").replace(/%s/,table.getTitle());
	
	OZ.DOM.clear(this.dom.list);
	for (var i=0;i<table.keys.length;i++) {
		var k = table.keys[i];
		var o = OZ.DOM.elm("option");
		this.dom.list.appendChild(o);
		var str = (i+1)+": "+k.getLabel();
		o.innerHTML = str;
	}
	if (table.keys.length) { 
		this.switchTo(0); 
	} else {
		this.disable();
	}
}

SQL.KeyManager.prototype.redrawListItem = function() {
	var index = this.table.keys.indexOf(this.key);
	this.option.innerHTML = (index+1)+": "+this.key.getLabel();
}

SQL.KeyManager.prototype.switchTo = function(index) { /* show Nth key */
	this.enable();
	var k = this.table.keys[index];
	this.key = k;
	this.option = this.dom.list.getElementsByTagName("option")[index];
	
	this.dom.list.selectedIndex = index;
	this.dom.name.value = k.getName();

    this.dom.name.disabled = false;
    this.dom.type.disabled = false;
    this.dom.left.disabled = false;
    this.dom.right.disabled = false;
	
	var opts = this.dom.type.getElementsByTagName("option");
	for (var i=0;i<opts.length;i++) {
		if (opts[i].value == k.getType()) { this.dom.type.selectedIndex = i; }
	}

	OZ.DOM.clear(this.dom.fields);
	for (var i=0;i<k.rows.length;i++) {
		var o = OZ.DOM.elm("option");
		o.innerHTML = k.rows[i].getTitle();
		o.value = o.innerHTML;
		this.dom.fields.appendChild(o);
	}
	
	OZ.DOM.clear(this.dom.avail);
	for (var i=0;i<this.table.rows.length;i++) {
		var r = this.table.rows[i];
		if (k.rows.indexOf(r) != -1) { continue; }
		var o = OZ.DOM.elm("option");
		o.innerHTML = r.getTitle();
		o.value = o.innerHTML;
		this.dom.avail.appendChild(o);
	}
    
    if (!k.new) {
        this.dom.name.disabled = true;
        this.dom.type.disabled = true;
        this.dom.left.disabled = true;
        this.dom.right.disabled = true;
    }    
}

SQL.KeyManager.prototype.disable = function() {
	OZ.DOM.clear(this.dom.fields);
	OZ.DOM.clear(this.dom.avail);
	this.dom.keyremove.disabled = true;
	this.dom.left.disabled = true;
	this.dom.right.disabled = true;
	this.dom.list.disabled = true;
	this.dom.name.disabled = true;
	this.dom.type.disabled = true;
	this.dom.fields.disabled = true;
	this.dom.avail.disabled = true;
}

SQL.KeyManager.prototype.enable = function() {
	this.dom.keyremove.disabled = false;
	this.dom.left.disabled = false;
	this.dom.right.disabled = false;
	this.dom.list.disabled = false;
	this.dom.name.disabled = false;
	this.dom.type.disabled = false;
	this.dom.fields.disabled = false;
	this.dom.avail.disabled = false;
}

SQL.KeyManager.prototype.left = function(e) { /* add field to index */
	var opts = this.dom.avail.getElementsByTagName("option");
	for (var i=0;i<opts.length;i++) {
		var o = opts[i];
		if (o.selected) {
			var row = this.table.findNamedRow(o.value);
			this.key.addRow(row);
		}
	}
	this.switchTo(this.dom.list.selectedIndex);
}

SQL.KeyManager.prototype.right = function(e) { /* remove field from index */
	var opts = this.dom.fields.getElementsByTagName("option");
	for (var i=0;i<opts.length;i++) {
		var o = opts[i];
		if (o.selected) {
			var row = this.table.findNamedRow(o.value);
			this.key.removeRow(row);
		}
	}
	this.switchTo(this.dom.list.selectedIndex);
}

SQL.KeyManager.prototype.open = function(table) {
	this.sync(table);
	this.owner.window.open(_("tablekeys"),this.dom.container,this.save);
}

/* --------------------- window ------------ */

SQL.Window = OZ.Class();

SQL.Window.prototype.init = function(owner) {
	this.owner = owner;
	this.dom = {
		container:OZ.$("window"),
		background:OZ.$("background"),
		ok:OZ.$("windowok"),
		cancel:OZ.$("windowcancel"),
		title:OZ.$("windowtitle"),
		content:OZ.$("windowcontent"),
	}
	this.dom.ok.value = _("windowok");
	this.dom.cancel.value = _("windowcancel");
	OZ.Event.add(this.dom.ok, "click", this.bind(this.ok));
	OZ.Event.add(this.dom.cancel, "click", this.bind(this.close));
	OZ.Event.add(document, "keydown", this.bind(this.key));
	
	this.sync = this.bind(this.sync);
	
	OZ.Event.add(window, "scroll", this.sync);
	OZ.Event.add(window, "resize", this.sync);
	this.state = 0;
	
	this.sync();
}

SQL.Window.prototype.open = function(title, content, callback) {
	this.state = 1;
	this.callback = callback;
	while (this.dom.title.childNodes.length > 1) { this.dom.title.removeChild(this.dom.title.childNodes[1]); }

	var txt = OZ.DOM.text(title);
	this.dom.title.appendChild(txt);
	this.dom.background.style.visibility = "visible";
	OZ.DOM.clear(this.dom.content);
	this.dom.content.appendChild(content);
	
	var win = OZ.DOM.win();
	var scroll = OZ.DOM.scroll();
	this.dom.container.style.left = Math.round(scroll[0] + (win[0] - this.dom.container.offsetWidth)/2)+"px";
	this.dom.container.style.top = Math.round(scroll[1] + (win[1] - this.dom.container.offsetHeight)/2)+"px";
	
	this.dom.cancel.style.visibility = (this.callback ? "" : "hidden");
	this.dom.container.style.visibility = "visible";

	var formElements = ["input","select","textarea"];
	var all = this.dom.container.getElementsByTagName("*");
	for (var i=0;i<all.length;i++) {
		if (formElements.indexOf(all[i].tagName.toLowerCase()) != -1) {
			all[i].focus();
			break;
		}
	}
}

SQL.Window.prototype.key = function(e) {
	if (!this.state) { return; }
    OZ.Event.remove(this.dom.ok);
	if (e.keyCode == 13) { this.ok(e); }
	if (e.keyCode == 27) { this.close(); }
}

SQL.Window.prototype.ok = function(e) {
	if (!this.state) { return; }
	if (this.callback) { this.callback(); }
	this.close();
}

SQL.Window.prototype.close = function() {
	if (!this.state) { return; }
	this.state = 0;
	this.dom.background.style.visibility = "hidden";
	this.dom.container.style.visibility = "hidden";
}

SQL.Window.prototype.sync = function() { /* adjust background position */
	var dims = OZ.DOM.win();
	var scroll = OZ.DOM.scroll();
	this.dom.background.style.width = dims[0]+"px";
	this.dom.background.style.height = dims[1]+"px";
	this.dom.background.style.left = scroll[0]+"px";
	this.dom.background.style.top = scroll[1]+"px";
}

/* --------------------- options ------------ */

SQL.Options = OZ.Class();

SQL.Options.prototype.init = function(owner) {
	this.owner = owner;
	this.dom = {
		container:OZ.$("opts"),
		btn:OZ.$("options")
	}
	this.dom.btn.value = _("options");
	this.save = this.bind(this.save);
	this.build();
}

SQL.Options.prototype.build = function() {
	this.dom.optionlocale = OZ.$("optionlocale");
	this.dom.optiondb = OZ.$("optiondb");
	this.dom.optionsnap = OZ.$("optionsnap");
	this.dom.optionpattern = OZ.$("optionpattern");
	this.dom.optionhide = OZ.$("optionhide");
	this.dom.optionvector = OZ.$("optionvector");
	this.dom.optionshowsize = OZ.$("optionshowsize");
	this.dom.optionshowtype = OZ.$("optionshowtype");

	var ids = ["language","db","snap","pattern","hide","vector","showsize","showtype","optionsnapnotice","optionpatternnotice","optionsnotice"];
	for (var i=0;i<ids.length;i++) {
		var id = ids[i];
		var elm = OZ.$(id);
		elm.innerHTML = _(id);
	}
	
	var ls = CONFIG.AVAILABLE_LOCALES;
	for (var i=0;i<ls.length;i++) {
		var o = OZ.DOM.elm("option");
		o.value = ls[i];
		o.innerHTML = ls[i];
		this.dom.optionlocale.appendChild(o);
		if (this.owner.getOption("locale") == ls[i]) { this.dom.optionlocale.selectedIndex = i; }
	}

	var dbs = CONFIG.AVAILABLE_DBS;
	for (var i=0;i<dbs.length;i++) {
		var o = OZ.DOM.elm("option");
		o.value = dbs[i];
		o.innerHTML = dbs[i];
		this.dom.optiondb.appendChild(o);
		if (this.owner.getOption("db") == dbs[i]) { this.dom.optiondb.selectedIndex = i; }
	}

	
	OZ.Event.add(this.dom.btn, "click", this.bind(this.click));
	
	this.dom.container.parentNode.removeChild(this.dom.container);
}

SQL.Options.prototype.save = function() {
	this.owner.setOption("locale",this.dom.optionlocale.value);
	this.owner.setOption("db",this.dom.optiondb.value);
	this.owner.setOption("snap",this.dom.optionsnap.value);
	this.owner.setOption("pattern",this.dom.optionpattern.value);
	this.owner.setOption("hide",this.dom.optionhide.checked ? "1" : "");
	this.owner.setOption("vector",this.dom.optionvector.checked ? "1" : "");
	this.owner.setOption("showsize",this.dom.optionshowsize.checked ? "1" : "");
	this.owner.setOption("showtype",this.dom.optionshowtype.checked ? "1" : "");
}

SQL.Options.prototype.click = function() {
	this.owner.window.open(_("options"),this.dom.container,this.save);
	this.dom.optionsnap.value = this.owner.getOption("snap");
	this.dom.optionpattern.value = this.owner.getOption("pattern");
	this.dom.optionhide.checked = this.owner.getOption("hide");
	this.dom.optionvector.checked = this.owner.getOption("vector");
	this.dom.optionshowsize.checked = this.owner.getOption("showsize");
	this.dom.optionshowtype.checked = this.owner.getOption("showtype");
}

/* ------------------ minimize/restore bar ----------- */

SQL.Toggle = OZ.Class();

SQL.Toggle.prototype.init = function(elm) {
	this._state = null;
	this._elm = elm;
	OZ.Event.add(elm, "click", this._click.bind(this));
	
	var defaultState = true;
	if (document.location.href.match(/toolbar=hidden/)) { defaultState = false; }
	this._switch(defaultState);
}

SQL.Toggle.prototype._click = function(e) {
	this._switch(!this._state);
}

SQL.Toggle.prototype._switch = function(state) {
	this._state = state;
	if (this._state) {
		OZ.$("bar").style.height = "";
	} else {
		OZ.$("bar").style.overflow = "hidden";
		OZ.$("bar").style.height = this._elm.offsetHeight + "px";
	}
	this._elm.className = (this._state ? "on" : "off");
}

/* --------------------- www sql designer ------------ */

SQL.Designer = OZ.Class().extend(SQL.Visual);

SQL.Designer.prototype.init = function() {
	//SQL.Designer = this;
	
	thisDesigner = this;
    this.newdb = false;
	
	this.tables = [];
	this.relations = [];
	this.title = document.title;
	
	SQL.Visual.prototype.init.apply(this);
	new SQL.Toggle(OZ.$("toggle"));
	
	this.dom.container = OZ.$("area");
	this.minSize = [
		this.dom.container.offsetWidth,
		this.dom.container.offsetHeight
	];
	this.width = this.minSize[0];
	this.height = this.minSize[1];
	
	this.typeIndex = false;
	this.fkTypeFor = false;

    this.error = this.bind(this.error);

	this.vector = this.getOption("vector") && document.createElementNS;
	if (this.vector) {
		this.svgNS = "http://www.w3.org/2000/svg";
		this.dom.svg = document.createElementNS(this.svgNS, "svg");
		this.dom.container.appendChild(this.dom.svg);
	}

    this.dom.overlay = OZ.$("overlay");

    this.request = new SQL.Request(this);

	this.flag = 2;
    this.savedXML = "";
    this.unsavedChanges = false;
    window.onbeforeunload = this.checkunload;
    // Get the language string and data types
    Promise.all([this.requestLanguage(),this.requestDB()]).then(function(results){
            for (r in results) {
                if (Object.keys(results[r]).length > 2) {
                    window.LOCALE = results[r];
                } else {
                    this.datatypes = results[r];
                }
            } 
            this.init2();
        }.bind(this)
    ).catch(this.error);
}

/* update area size */
SQL.Designer.prototype.sync = function() {
	var w = this.minSize[0];
	var h = this.minSize[0];
	for (var i=0;i<this.tables.length;i++) {
		var t = this.tables[i];
		w = Math.max(w, t.x + t.width);
		h = Math.max(h, t.y + t.height);
	}
	
	this.width = w;
	this.height = h;
	this.map.sync();

	if (this.vector) {	
		this.dom.svg.setAttribute("width", this.width);
		this.dom.svg.setAttribute("height", this.height);
	}
}

/**
 * Get the language strings
 * 
 * @returns {Promise}
 */
SQL.Designer.prototype.requestLanguage = function() {
	var lang = this.getOption("locale")
	var bp = this.getOption("staticpath");
	var url = bp + "locale/lang.json";
    return this.request.Promise(url, SQL.Request.GET); 
}

SQL.Designer.prototype.languageResponse = function(data) {
	/*if (xmlDoc) {
		var strings = xmlDoc.getElementsByTagName("string");
		for (var i=0;i<strings.length;i++) {
			var n = strings[i].getAttribute("name");
			var v = strings[i].firstChild.nodeValue;
			window.LOCALE[n] = v;
		}
	}*/
    window.LOCALE = JSON.parse(data);
	this.flag--;
	if (!this.flag) { thisDesigner.init2(); }
}

/**
 * Get the data types
 * 
 * @returns {Promise}
 */
SQL.Designer.prototype.requestDB = function() { 
	var db = this.getOption("db");
	var bp = this.getOption("staticpath");
	var url = bp + "db/"+db+"/datatypes.json";
    return this.request.Promise(url, SQL.Request.GET);
}

SQL.Designer.prototype.init2 = function() { /* secondary init, after locale & datatypes were retrieved */
	this.map = new SQL.Map(this);
	this.rubberband = new SQL.Rubberband(this);
	this.tableManager = new SQL.TableManager(this);
	this.rowManager = new SQL.RowManager(this);
	this.keyManager = new SQL.KeyManager(this);
	this.io = new SQL.IO(this);
	this.options = new SQL.Options(this);
	this.window = new SQL.Window(this);

	this.sync();
	
	OZ.$("docs").value = _("docs");

	var url = window.location.href;
	var r = url.match(/keyword=([^&]+)/);
	if (r) {
		var keyword = r[1];
		this.io.serverload(false, keyword);
	}
	document.body.style.visibility = "visible";
    this.io.serverload();
}

SQL.Designer.prototype.getMaxZ = function() { /* find max zIndex */
	var max = 0;
	for (var i=0;i<this.tables.length;i++) {
		var z = this.tables[i].getZ();
		if (z > max) { max = z; }
	}
	
	OZ.$("controls").style.zIndex = max+5;
	return max;
}

SQL.Designer.prototype.addTable = function(name, x, y) {
	var max = this.getMaxZ();
	var t = new SQL.Table(this, name, x, y, max+1);
	this.tables.push(t);
	this.dom.container.appendChild(t.dom.container);
	return t;
}

SQL.Designer.prototype.removeTable = function(t) {
	this.tableManager.select(false);
	this.rowManager.select(false);
	var idx = this.tables.indexOf(t);
	if (idx == -1) { return; }
	t.destroy();
	this.tables.splice(idx,1);
}

SQL.Designer.prototype.addRelation = function(row1, row2) {
	var r = new SQL.Relation(this, row1, row2);
    this.relations.push(r);
    return r;
}

/**
 * Remove a relationship, and remove it from the database
 * 
 * Called when removing a relationship directly, rather than when it's removed
 * as a consequence of removing a row or table (in which case it's removed
 * from the database implicity, and trying to do so directly will cause an error)
 * 
 * @param {Object} r The relationship
 * @returns {undefined}
 */
SQL.Designer.prototype.removeRelationDirect = function(r) {
	var idx = this.relations.indexOf(r);
	if (idx == -1) { return; }
    this.showOverlay();
    constraintURL = dbURL()+"/table/"+r.row2.owner.getTitle()+"/constraint/"+r.data.title+"/staging";
    this.request.Promise(constraintURL, SQL.Request.DELETE).then(
        function() {
            // Once we've deleted the constraint form the database, update the interface
            r.destroy();
            this.relations.splice(idx,1);
            this.hideOverlay();
        }.bind(this),
        this.error
    );
}

/**
 * Remove a relationship from the interface
 * 
 * Just removes the visual representation of the relationship, for when the 
 * foreign key constraint will have been removed from the database implicitly
 * by another operation
 * 
 * @see removeRelationDirect
 * @param {Object} r The relationshup
 * @returns {undefined}
 */
SQL.Designer.prototype.removeRelation = function(r) {
	var idx = this.relations.indexOf(r);
	if (idx == -1) { return; }
    r.destroy();
    this.relations.splice(idx,1);
    this.hideOverlay();
}

SQL.Designer.prototype.getCookie = function() {
	var c = document.cookie;
	var obj = {};
	var parts = c.split(";");
	for (var i=0;i<parts.length;i++) {
		var part = parts[i];
		var r = part.match(/wwwsqldesigner=({.*?})/);
		if (r) { obj = eval("("+r[1]+")"); }
	}
	return obj;
}

SQL.Designer.prototype.setCookie = function(obj) {
	var arr = [];
	for (var p in obj) {
		arr.push(p+":'"+obj[p]+"'");
	}
	var str = "{"+arr.join(",")+"}";
	document.cookie = "wwwsqldesigner="+str+"; path=/";
}

SQL.Designer.prototype.getOption = function(name) {
	var c = this.getCookie();
	if (name in c) { return c[name]; }
	/* defaults */
	switch (name) {
		case "locale": return CONFIG.DEFAULT_LOCALE;
		case "db": return CONFIG.DEFAULT_DB;
		case "staticpath": return CONFIG.STATIC_PATH || "";
		case "xhrpath": return CONFIG.XHR_PATH || "";
		case "snap": return 0;
		case "showsize": return 0;
		case "showtype": return 0;
		case "pattern": return "%R_%T";
		case "hide": return false;
		case "vector": return true;
		default: return null;
	}
}

SQL.Designer.prototype.setOption = function(name, value) {
	var obj = this.getCookie();
	obj[name] = value;
	this.setCookie(obj);
}

SQL.Designer.prototype.raise = function(table) { /* raise a table */
	var old = table.getZ();
	var max = this.getMaxZ();
	table.setZ(max);
	for (var i=0;i<this.tables.length;i++) {
		var t = this.tables[i];
		if (t == table) { continue; }
		if (t.getZ() > old) { t.setZ(t.getZ()-1); }
	}
	var m = table.dom.mini;
	m.parentNode.appendChild(m);
}

SQL.Designer.prototype.clearTables = function() {
	while (this.tables.length) { this.removeTable(this.tables[0]); }
	this.setTitle(false);
}

SQL.Designer.prototype.alignTables = function() {
	var win = OZ.DOM.win();
	var avail = win[0] - OZ.$("bar").offsetWidth;
	var x = 10;
	var y = 10;
	var max = 0;
	
	this.tables.sort(function(a,b){
		return b.getRelations().length - a.getRelations().length;
	});

	for (var i=0;i<this.tables.length;i++) {
		var t = this.tables[i];
		var w = t.dom.container.offsetWidth;
		var h = t.dom.container.offsetHeight;
		if (x + w > avail) {
			x = 10;
			y += 10 + max;
			max = 0;
		}
		t.moveTo(x,y);
		x += 10 + w;
		if (h > max) { max = h; }
	}

	this.sync();
}

SQL.Designer.prototype.findNamedTable = function(name) { /* find row specified as table(row) */
	for (var i=0;i<this.tables.length;i++) {
		if (this.tables[i].getTitle() == name) { return this.tables[i]; }
	}
}


SQL.Designer.prototype.readschema = function(schema) {
	this.clearTables();
	var tables = schema.tables;
	for (name in tables) {
		var t = this.addTable(name, 0, 0);
		t.readschema(tables[name]);
	}

	for (var i=0;i<this.tables.length;i++) { /* ff one-pixel shift hack */
		this.tables[i].select(); 
		this.tables[i].deselect(); 
	}

	/* relations */
	for (name in tables) {
        var relations = tables[name].relations;
        for (relname in relations) {
            var rel = relations[relname];
            var tname = rel.referenceTable;
            var rname = rel.referenceColumn;
            
            var t1 = this.findNamedTable(tname);
            if (!t1) { continue; }
            var r1 = t1.findNamedRow(rname);
            if (!r1) { continue; }

            tname = name;
            rname = rel.column;
            var t2 = this.findNamedTable(tname);
            if (!t2) { continue; }
            var r2 = t2.findNamedRow(rname);
            if (!r2) { continue; }

            var newrel = this.addRelation(r1, r2);
            newrel.data.title = relname;
        }
	}
}

SQL.Designer.prototype.setTitle = function(t) {
	document.title = this.title + (t ? " - "+t : "");
}

SQL.Designer.prototype.removeSelection = function() {
	var sel = (window.getSelection ? window.getSelection() : document.selection);
	if (!sel) { return; }
	if (sel.empty) { sel.empty(); }
	if (sel.removeAllRanges) { sel.removeAllRanges(); }
}


SQL.Designer.prototype.checkunload = function(e) {
    if (this.unsavedChanges) {
        return false;
    }
};

/**
 * Sets the unsaved changes flag and enables the save/revert buttons
 * 
 * @returns {undefined}
 */
SQL.Designer.prototype.setUnsavedChanges = function() {
    this.unsavedChanges = true;
    if (this.io.dom.serversave.disabled === true) {
        this.io.dom.serversave.disabled = false;
    }
    if (this.io.dom.serverload.disabled === true) {
        this.io.dom.serverload.disabled = false;
    }
};

/**
 * Clears the unsaved changes flag and disables the save/revert buttons
 * 
 * @returns {undefined}
 */
SQL.Designer.prototype.clearUnsavedChanges= function() {
    this.unsavedChanges = false; 
    if (this.io.dom.serversave.disabled === false) {
        this.io.dom.serversave.disabled = true;
    }
    if (this.io.dom.serverload.disabled === false) {
        this.io.dom.serverload.disabled = true;
    }
};

/**
 * Show the "loading" overlay
 * 
 * @returns {undefined}
 */
SQL.Designer.prototype.showOverlay = function() {
    this.dom.overlay.style.display = 'block';
}

/**
 * Hide the "loading" overlay
 * 
 * @returns {undefined}
 */
SQL.Designer.prototype.hideOverlay = function() {
    this.dom.overlay.style.display = 'none';
}

/**
 * Hide the overlay (if it's visible) and show an error message instead
 * 
 * @param {String} message The message to display
 * @returns {undefined}
 */
SQL.Designer.prototype.error = function(message) {
    this.hideOverlay();
    this.alert(message);
}

/**
 * Displays a custom alert, so it can't be hidden by the browser
 * 
 * @param {String} message The message to display
 * @returns {undefined}
 */
SQL.Designer.prototype.alert = function(message) {
    var container = OZ.DOM.elm("div", {"className": "alert"});
    container.innerHTML = message;
    this.window.open('', container);
}

/**
 * Display a custom confirmation dialogue (so it can't be hidden by the browser)
 * 
 * @param {String} message The confirmation message to display
 * @returns {Promise} Resolved if the user confirms, rejected if they cancel
 */
SQL.Designer.prototype.confirm = function(message) {
    return new Promise(function(resolve, reject) {
        var container = OZ.DOM.elm("div", {"className": "confirm"});
        container.innerHTML = message;
        OZ.Event.add(this.window.dom.cancel, "click", reject);
        this.window.open('', container, resolve);
    }.bind(this));
}