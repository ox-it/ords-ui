angular.module( "ords" ).directive(
	'vqd',
	['State','$timeout',
	function(State, $timeout) {
  	  	return {
			scope: 
			{
				schema: "=",
				sql: "="
			},
    		controller: function($scope) {
				if (State.data.schema){
					vqd.restore(State.data);
				}

				//
				// Show the VQD
				//
				$scope.show = function(){
					$scope.showVQD = true;
					//
					// We have to repaint when the control is shown as jsPlumb Draws
					// connectors in the wrong place when rendered off-screen while
					// the control is hidden
					//
					$timeout(function(){vqd.jsplumb.repaintEverything()},0);
				}

			},
			link: function($scope, element, attrs, ctrl) {

      			$scope.$watch('schema', function(newVal) {
        			// the `$watch` function will fire even if the
        			//  property is undefined, so we'll
        			// check for it
        			if (newVal) {
						//
						// If there is no current state data, or the schema loaded
						// differs from that held in state, we clear the state for the VQD and
						// start again
						//
						if (
							!State.data || 
							JSON.stringify(State.data.schema) !== JSON.stringify(newVal)
						){
							if (!State.data){ State.data = {}; };
							State.data.schema = newVal;
							State.data.tables = [];
							State.data.constraints = [];
							vqd.restore(State.data);
							$timeout(function(){vqd.jsplumb.repaintEverything()},5000);
						}
					}
				  });
          	},
    		templateUrl: 'database-explorer/components/vqd/vqd.html'
  	  	}
	}
	]);

//
// Visual Query Designer
// A simple SQL statement generator using jsPlumb and jQueryUI
// @author scott wilson
//
var vqd = {};

vqd.clear = function(){
	$(".vqd_table_checkbox").prop('checked', false);
	vqd.tableListUpdated();
	vqd.queryUpdated();
}

vqd.restore = function(data, $timeout){

	//
	// Set the internal state model to the passed in value
	//
	vqd.state = data;

	//
	// Set up schema
	//
	vqd.schema = data.schema;

	vqd.init();

	vqd.load();	
}

vqd.load = function(){
	//
	// This basically "locks" the state until we're finished
	//
	vqd.isLoading = true;

	//
	// Restore tables
	//
	for (var table in vqd.state.tables){
		var tableId = vqd.state.tables[table].table;
		var tableName = vqd.state.tables[table].tableName;
		$("#vqd_table_checkbox_"+tableId).prop('checked', true);
		vqd.addTable(tableName);
	}

	//
	// Restore columns
	//
	for (var table in vqd.state.tables){
		var tableId = vqd.state.tables[table].table;
		for (var column in vqd.state.tables[table].columns){
			var columnId = vqd.state.tables[table].columns[column];
			$("#vqd_column_checkbox_"+ tableId + "_____"+ columnId).prop('checked', true);
		}
	}

	//
	// Restore constraints
	//
	if (!vqd.state.constraints) vqd.state.constraints  = [];
	vqd.renderConstraintList();

	//
	// Generate query
	//
	vqd.jsplumb.recalculateOffsets($(".vqd_tableview"));
	vqd.renderJoins();
	vqd.queryUpdated();

	//
	// Allow state to be overwritten with new changes
	//
	vqd.isLoading = false;
}

//
// Set up VQD using the supplied JSON schema data
//
vqd.init = function(){
	
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
	
	$(".vqd_tableview").empty();

	vqd.renderTableControl();

	//
	// Constraint editor
	// 
	$("#vqd_add_constraint_button").on("click", vqd.addConstraint);
	vqd.renderConstraintOptions();
	vqd.renderConstraintList();
	
	vqd.jsplumb = jsPlumb.getInstance();
	vqd.jsplumb.setContainer($(".vqd_tableview"));
}

//
// Adds a constraint
//
vqd.addConstraint = function(){
	var constraint = {};
	constraint.columnValue = $("#vqd_constraint_column_select_control").val();
	constraint.column = $("#vqd_constraint_column_select_control option:selected").text();
	constraint.operator = $("#vqd_constraint_operator_select_control option:selected").text();
	constraint.value = $("#vqd_constraint_value_input").val();

	//
	// Wrap non-numeric values
	//
	var datatype = vqd.getColumnType(constraint.column.split(".")[0], constraint.column.split(".")[1]);
	if (
		datatype !== "BIGINT" && 
		datatype !== "INTEGER" && 
		datatype !== "FLOAT" && 
		datatype !== "REAL" && 
		datatype !== "DOUBLE" &&
		!((constraint.operator == "IS" || constraint.operator == "IS NOT" ) && constraint.value == "NULL")
		)	
	{
		constraint.value = "'" + constraint.value + "'";
	}

	vqd.state.constraints.push(constraint);
	vqd.renderConstraintList();
	vqd.queryUpdated();
}

//
// Remove a constraint
//
vqd.removeConstraint = function(obj){
	var constraint = $(obj).parent().get(0);
	var list = $(constraint).parent().get(0);
	var index = $(list).children().index(constraint);
	vqd.state.constraints.splice(index, 1);
	vqd.renderConstraintList();	
	vqd.queryUpdated();
}

//
// Update constraint list
//
vqd.renderConstraintList = function(){
	var constraintList = $("#vqd_constraint_list");
	constraintList.empty();
	for (i in vqd.state.constraints){
		var constraint = vqd.state.constraints[i];
		var el = $("<p></p>");
		var removeControl = $("<button class='button delete micro' onclick='vqd.removeConstraint(this)'>&times;</button>");
		var constraintElement = $("<span>"+constraint.column+" "+constraint.operator+" "+constraint.value+"</span> ");
		el.append(removeControl);
		el.append(constraintElement);
		constraintList.append(el);
	}
}

//
// Get the data type of the column
//
vqd.getColumnType = function(table, column){
	return vqd.schema.tables[table].columns[column].datatype;
}

//
// Updates the selector with currently available fields
//
vqd.renderConstraintOptions = function(){
	var constraintControls = $("#vqd_constraint_column_select_control");
	constraintControls.empty();
	var tables =  vqd.getSelectedTables()
	for (t in tables){
		var table = tables[t];
		for (column in vqd.schema.tables[table].columns){
			var optionText = table + "." + column;
			var optionValue = '\"'+table+'\"' + "." + '\"' + column + '\"';
			var optionElement = $("<option value='"+optionValue+"'>"+optionText+"</option>");
			constraintControls.append(optionElement);
		}
	}
}

//
// Create a control for the table list
//
vqd.renderTableControl = function(){
	var tableControls = $("<div id='vqd_tableselect_control'></div>");
	for (table in vqd.schema.tables){
		var tableControlContainer = $("<div></div>");
		var tableControlCheckbox = $("<input class='vqd_table_checkbox' id='vqd_table_checkbox_"+table.hashCode()+"' type='checkbox'></input>");
		tableControlCheckbox.on("click", vqd.tableListUpdated);
		
		tableControlContainer.append(tableControlCheckbox);
		tableControlContainer.append(table);
		tableControls.append(tableControlContainer);
	}
	$("#vqd_tableselect_control").remove();
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
// Saves the state model to allow users to recreate the Query
//
vqd.saveState = function(){
	var tables = vqd.getSelectedTables();

	//
	// Clear the state
	//
	vqd.state.tables = [];

	for (var i = 0; i < tables.length; i++){
		var table = tables[i];

		//
		// Create a state object for this table
		//
		var tableState = {};
		tableState.table = tables[i].hashCode();
		tableState.tableName = tables[i];
		tableState.columns =  [];

		for (column in vqd.schema.tables[vqd.getTableNameFromHashCode(table.hashCode())].columns){
			if ($("#vqd_column_checkbox_"+table.hashCode()+"_____"+column.hashCode()).is(":checked")){
				tableState.columns.push(column.hashCode());
			}
		}

		//
		// Add table to state model
		//
		vqd.state.tables.push(tableState);
	}
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
		// Other conditions?
		//
		for (var i = 0; i < vqd.state.constraints.length; i++){
			var constraint = vqd.state.constraints[i];
			var clause = constraint.columnValue + " " + constraint.operator + " " + constraint.value;
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

	//
	// If we aren't currently restoring a saved query state, save the changed query
	//
	if (!vqd.isLoading){
		vqd.saveState();
	}
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
	vqd.renderConstraintOptions();
}

//
// Adds a table when selected by a user
//
vqd.addTable = function(tableName){
	var tableData = vqd.getTableData(tableName);
	vqd.renderTable(tableName, tableData);	
	vqd.renderConstraintOptions();
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

	//
	// Sort the columns according to position metadata (as per Schema Designer)
	//
	// Note we use a clone of the column for this - we can't change the schema without invalidating
	// the stored query session.
	//
	var sortedColumns = [];
	for (var idx in tableData.columns) {
		var column = {};
		column.position = tableData.columns[idx].position;
		column.name = idx;
        sortedColumns.push(column);
    }
    sortedColumns.sort(function(a,b){return a.position - b.position;});

	//
	// Add columns in sort order
	//
	for (column in sortedColumns){
		columnsDiv.append(vqd.renderColumn(tableName, sortedColumns[column].name))
	}

	//
	// Assemble the final table control and attach to window
	//
	tableDiv.append(titleDiv);
	tableDiv.append(columnsDiv);
	$(".vqd_tableview").append(tableDiv);
	
	//
	// Position it to the right of the last table added, or top left of the view if none have been added yet
	// NOTE this doesn't work at present; the JQUERY-UI lib seems to interfere with JsPlumb.
	/*
	if (lastTableAdded){
		tableDiv.position({my:"left top", at: "right", of: lastTableAdded, within:$(".vqd_tableview")});
	} else {
		tableDiv.position({my:"left top", at: "left top", of: $(".vqd_tableview")});	
	}
	*/

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
			//
			// Create a clone of the relation; we do this as we don't want to
			// change the schema as that affects other functions
			//
			var join = JSON.parse(JSON.stringify(relations[relation]));
			join.table = tableName;
			//
			// Check the reference table is also selected before we add the join.
			// Both ends must be included in the query.
			//
			var referenceTable = join.referenceTable;
			var referenceTables = vqd.getSelectedTables();
			for (var r = 0; r < referenceTables.length; r++){
				var ref = referenceTables[r];
				if (ref === referenceTable) joins.push(join);
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
	vqd.jsplumb.recalculateOffsets($(".vqd_tableview"));
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
