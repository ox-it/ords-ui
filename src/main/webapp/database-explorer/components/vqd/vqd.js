angular.module( "ords" ).directive(
	'vqd',
	function() {
  	  	return {
			scope: 
			{
				schema: "=",
				sql: "="
			},
    		controller: function($scope) {
			},
			link: function($scope, element, attrs, ctrl) {
      			$scope.$watch('schema', function(newVal) {
        			// the `$watch` function will fire even if the
        			//  property is undefined, so we'll
        			// check for it
        			if (newVal) {
						vqd.init(newVal);
					}
				  });
          	},
    		templateUrl: 'database-explorer/components/vqd/vqd.html'
  	  	}
	}
);

//
// Visual Query Designer
// A simple SQL statement generator using jsPlumb and jQueryUI
// @author scott wilson
//
var vqd = {};

//
// Set up VQD using the supplied JSON schema data
//
vqd.init = function(data){
	
	var cssId = 'vqd_css';
	if (!document.getElementById(cssId))
	{
	    var head  = document.getElementsByTagName('head')[0];
	    var link  = document.createElement('link');
	    link.id   = cssId;
	    link.rel  = 'stylesheet';
	    link.type = 'text/css';
	    link.href = 'database-explorer/components/vqd/vqd.css';
	    link.media = 'all';
	    head.appendChild(link);
	}	
	
	vqd.schema = data;
	vqd.renderTableControl();
	
	vqd.jsplumb = jsPlumb.getInstance();
	vqd.jsplumb.setContainer($(".vqd_tableview"));
	
}

//
// Create a control for the table list
//
vqd.renderTableControl = function(){
	var tableControls = $("<div id='vqd_tableselect_control'></div>");
	for (table in vqd.schema.tables){
		var tableControlContainer = $("<div></div>");
		var tableControlCheckbox = $("<input id='vqd_table_checkbox_"+table.hashCode()+"' type='checkbox'></input>");
		tableControlCheckbox.on("click", vqd.tableListUpdated);
		
		tableControlContainer.append(tableControlCheckbox);
		tableControlContainer.append(table);
		tableControls.append(tableControlContainer);
	}
	$(".vqd_tableselect").append(tableControls);
}

//
// Return the list of tables that the user has selected
//
vqd.getSelectedTables = function(){
	var tables = [];
	for (table in vqd.schema.tables){
		if ($("#vqd_table_checkbox_"+table.hashCode()).is(":checked")){
			tables.push(table);
		}
	}
	return tables;
}

//
// Updates the SQL based on the current state of the editor
//
vqd.queryUpdated = function(){
	var sql = "";
	var columns = [];
	var tables = vqd.getSelectedTables();

	for (var i = 0; i < tables.length; i++){
		var table = tables[i];
		for (column in vqd.schema.tables[vqd.getTableNameFromHashCode(table.hashCode())].columns){
			if ($("#vqd_column_checkbox_"+table.hashCode()+"_____"+column.hashCode()).is(":checked")){
				columns.push( "\"" + table + "\".\"" + column + "\"");
			}
		}
	}
	
	if (columns.length !== 0 && tables.length !== 0){	
		
		//
		// SELECT scope
		// 
		sql = "SELECT ";
		for (var i = 0; i < columns.length; i++){
			var column = columns[i];
			sql += column;
			sql += ",";
		}
		sql = sql.substring(0, sql.length - 1);
	
		sql += " FROM ";
		for (var i = 0; i < tables.length; i++){
			var table = tables[i];
			sql += "\"" + table + "\"";
			sql += ",";
		}
		sql = sql.substring(0, sql.length - 1);	
		
		//
		// Joins
		//
		var clauses =[];
		var joins = vqd.getAllJoins();
		for (var i = 0; i < joins.length; i++){
			var joinData = joins[i];
			var clause = "\"" + joinData.table + "\".\"" + joinData.column + "\" = \"" + joinData.referenceTable + "\".\"" + joinData.referenceColumn + "\"";
			clauses.push(clause);
		}
		
		//
		// Conditions
		//
		
		if (clauses.length > 0){
			sql += " WHERE ";
			for (var i = 0; i < clauses.length; i++){
				sql += clauses[i];
				if (i < clauses.length-1) sql += " AND ";
			}
		}
		
	} else {
		sql = "";
	}
	
	if (tables.length > 1 && vqd.getUnjoinedTables().length > 0){
		vqd.showUnjoinedTablesWarning();
	} else {
		vqd.hideUnjoinedTablesWarning();
	}

	
	$(".vqd_sql").val(sql);
}

//
// Gets table scheme data for specified table name
//
vqd.getTableData = function (tableName){
	return vqd.schema.tables[tableName];
}

//
// Updates the visual editor based on the state of the 
// table list control
//
vqd.tableListUpdated = function(){
	for (table in vqd.schema.tables){
		if ($("#vqd_table_checkbox_"+table.hashCode()).is(":checked")){
			if (!$("#vqd_table_box_"+table.hashCode()).length){
				vqd.addTable(table);	
			}
		} else {
			if ($("#vqd_table_box_"+table.hashCode()).length){
				vqd.removeTable(table);	
			}
		}
	}
	vqd.renderJoins();
	vqd.queryUpdated();
}

//
// Removes a table when deselected by a user
//
vqd.removeTable = function(tableName){
	vqd.jsplumb.empty($("#vqd_table_box_"+tableName.hashCode()));
	vqd.jsplumb.remove($("#vqd_table_box_"+tableName.hashCode()));
}

//
// Adds a table when selected by a user
//
vqd.addTable = function(tableName){
	var tableData = vqd.getTableData(tableName);
	vqd.renderTable(tableName, tableData);	
}

//
// Creates the visual table editor for a table and
// adds it to the designer UI
//
vqd.renderTable = function(tableName, tableData){
	
	//
	// Get the last table added, if any. We use this for positioning
	//
	var lastTableAdded = null;
	if ($(".vqd_table").length > 0){ lastTableAdded = $(".vqd_table")[$(".vqd_table").length-1] }
	var tableDiv = $("<table id='vqd_table_box_"+tableName.hashCode()+"' class='vqd_table'></table>");
	var titleDiv = $("<thead><tr><td class='vqd_tablename'>"+tableName+"</td></tr></thead>");
	var columnsDiv = $("<tbody class='vqd_columns'></tbody>");
	
	//
	// Add columns
	//
	for (column in tableData.columns){
		columnsDiv.append(vqd.renderColumn(tableName, column))
	}
	tableDiv.append(titleDiv);
	tableDiv.append(columnsDiv);
	$(".vqd_tableview").append(tableDiv);
	
	//
	// Position it to the right of the last table added, or top left of the view if none have been added yet
	//
	if (lastTableAdded){
		tableDiv.position({my:"left top", at: "right", of: lastTableAdded, within:$(".vqd_tableview")});
	} else {
		tableDiv.position({my:"left top", at: "left top", of: $(".vqd_tableview")});	
	}
	//
	// Register the table as a draggable element
	//
	vqd.jsplumb.draggable(tableDiv, { containment: "parent"});
}

//
// Adds a column to a table editor control
//
vqd.renderColumn = function(tableName, columnName){
	var columnRow = $("<tr></tr>");
	var columnDiv = $("<td id='vqd_column_"+ tableName.hashCode() + "_____"+ columnName.hashCode() +"' class='vqd_column'></td>");
	var columnControl = $("<input id='vqd_column_checkbox_"+ tableName.hashCode() + "_____"+ columnName.hashCode() +"' type='checkbox'></input>");
	columnControl.on("click", vqd.queryUpdated);
	columnDiv.append(columnControl);
	columnDiv.append(columnName);
	columnRow.append(columnDiv);
	return columnRow;
}

//
// Returns the set of join metadata from the schema that apply
// to the current selection of tables in the designer
//
vqd.getAllJoins = function(){
	var joins = [];
	var tables = vqd.getSelectedTables();
	for (var i=0;i < tables.length; i++){
		var tableName = tables[i];
		var tableData = vqd.getTableData(tableName);
		var relations = tableData.relations;
		for (relation in relations){
			relations[relation].table = tableName;
			//
			// Check the reference table is also selected before we add the join.
			// Both ends must be included in the query.
			//
			var referenceTable = relations[relation].referenceTable;
			var referenceTables = vqd.getSelectedTables();
			for (var r = 0; r < referenceTables.length; r++){
				var ref = referenceTables[r];
				if (ref === referenceTable) joins.push(relations[relation]);
			}
		}
	}
	return joins;
}

vqd.getUnjoinedTables = function(){
	var tables = vqd.getSelectedTables();
	var joins = vqd.getAllJoins();
	var unjoinedTables = [];
	
	for (var t = 0; t < tables.length; t++){
		var unjoined = true;
		for (var j = 0; j < joins.length; j++){
			if (joins[j].table === tables[t]) unjoined = false;
			if (joins[j].referenceTable === tables[t]) unjoined = false;
		}
		if (unjoined) unjoinedTables.push(tables[t]);
	}
	return unjoinedTables;
}

vqd.showUnjoinedTablesWarning = function(){
	$("#vqd-unjoined").css('display','block');
	
}

vqd.hideUnjoinedTablesWarning = function(){
	$("#vqd-unjoined").css('display','none');
}

//
// Draws the connectors between table editors to show joins
//
vqd.renderJoins = function(){
	var relations = vqd.getAllJoins();
	jsPlumb.recalculateOffsets($(".vqd_tableview"));
	for (relation in relations){
		var table = relations[relation].table;
		var column = relations[relation].column;
		var refColumn = relations[relation].referenceColumn;
		var refTable = relations[relation].referenceTable;
		
		var startElement = $("#vqd_column_" + table.hashCode() + "_____"+ column.hashCode());
		var endElement = $("#vqd_column_" + refTable.hashCode() + "_____"+ refColumn.hashCode());
		var endpoint = {};
		if (startElement.length && endElement.length){
			vqd.jsplumb.connect({
				 source: startElement, 
				 target: endElement, 
				 anchors:["Left","Right" ], 
				 endpoint:["Dot", {radius:5}],
				 detachable:false
			})
		}
	}
}

vqd.getTableNameFromHashCode = function(hashcode){
	for (table in vqd.schema.tables){
		if (table.hashCode() === hashcode) return table;
	}
}

//
// generic HashCode function
//
String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}