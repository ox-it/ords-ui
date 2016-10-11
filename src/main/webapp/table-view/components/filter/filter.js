angular.module("ords").directive(
    'filter',
    function () {
        return {
            link: function (scope, elem) {

                //
                // Set up the filter. When the table metadata is loaded
                // and the filter view is ready, make it visible.
                //
                scope.$watch("tableData", function () {
                    if (scope.tableData && scope.tableMetadata) {

                        //
                        // Destroy any existing filter
                        //
                        $("#rqb").empty();

                        //
                        // Set up the filter
                        //
                        var initialising_filter = filter.init(scope.tableName, scope.tableMetadata, scope.filter, scope.filterParams);
                        $("#filter-button").click(function () { $("#filter-form").submit() });
                        $("#filter-inner").show();
                        $("#clear-filter-button").click(function () { $("#filter-form-element").val(""); $("#params-form-element").val(""); $("#filter-form").submit() });
                    }
                });

                //
                // Filter the results
                //
                scope.applyFilter = function () {
                    scope.filter = filter.sql;
                    scope.filterParams = JSON.stringify(filter.params);
                    scope.startRow = 0;
                    scope.tablelist();
                };

                //
                // Clear the filter
                //
                scope.clearFilter = function() {
                    scope.filter = null;
                    scope.filterParams = null;
                    scope.startRow = 0;
                    scope.tablelist();
                }

            },
            templateUrl: 'table-view/components/filter/filter.html'
        }
    }
);

var filter = {};

filter.getTableColumns = function (table) {
    var columns = [];
    var default_column = "";

    for (column in table.columns) {
        var rqcol = {};
        rqcol.name = column;
        rqcol.label = column;

        //
        // Convert datatypes
        //
        var original_type = table.columns[column].datatype;
        var final_type = "";
        if (original_type.indexOf("VARCHAR") !== -1) final_type = "STRING";
        if (original_type.indexOf("TEXT") !== -1) final_type = "STRING";
        if (original_type.indexOf("CHAR") !== -1) final_type = "STRING";
        if (original_type.indexOf("BOOLEAN") !== -1) final_type = "BOOLEAN";

        if (original_type.indexOf("INTEGER") !== -1) final_type = "NUMBER";
        if (original_type.indexOf("DECIMAL") !== -1) final_type = "NUMBER";
        if (original_type.indexOf("BIGINT") !== -1) final_type = "NUMBER";
        if (original_type.indexOf("DOUBLE PRECISION") !== -1) final_type = "NUMBER";
        if (original_type.indexOf("REAL") !== -1) final_type = "NUMBER";

        if (original_type.indexOf("TIME WITHOUT TIME ZONE") !== -1) final_type = "DATE";
        if (original_type.indexOf("DATE") !== -1) final_type = "DATE";
        if (original_type.indexOf("TIMESTAMP") !== -1) final_type = "DATE";

        if (final_type === "") final_type = "STRING"; // default
        rqcol.type = final_type;

        columns.push(rqcol);
    }
    return columns;
}

filter.init = function (tableName, filter_metadata, req_filter, req_params) {

    filter.rawdata = filter_metadata;
    var table = filter_metadata.tables[tableName];
    var rq = {};
    rq.meta = {};
    rq.meta.tables = [];

    //
    // Main table
    //
    var rqtable = {};
    rqtable.name = tableName;
    rqtable.label = tableName;
    rqtable.columns = filter.getTableColumns(table);
    default_column = rqtable.columns[0].name;

    //
    // Foreign tables
    //
    rqtable.fks = [];
    for (relation in table.relations) {
        var fk = {};
        fk.referencedTableName = table.relations[relation].referenceTable;
        fk.name = relation;
        fk.label = table.relations[relation].referenceTable + " (" + table.relations[relation].column + ")" + " ... ";
        fk.foreignKeyNames = [table.relations[relation].column];
        fk.referencedKeyNames = [table.relations[relation].referenceColumn];
        fk.reverseLabel = rqtable.label + " (" + table.relations[relation].column + ")";
        rqtable.fks.push(fk);

        var fktable = {};
        fktable.name = table.relations[relation].referenceTable;
        fktable.label = fk.label;
        fktable.columns = filter.getTableColumns(table.relations[relation]);
        fktable.fks = [];
        rq.meta.tables.push(fktable);
    }

    rq.meta.tables.push(rqtable);

    //
    // Add in defined types
    //
    rq.meta.types = [{
        "name": "STRING",
        "editor": "TEXT",
        "operators": [{
            "name": "=",
            "label": "is",
            "cardinality": "ONE"
        }, {
                "name": "<>",
                "label": "is not",
                "cardinality": "ONE"
            }, {
                "name": "LIKE",
                "label": "like",
                "cardinality": "ONE"
            }, {
                "name": "CONTAINS",
                "label": "contains",
                "cardinality": "ONE"
            }, {
                "name": "IS NULL",
                "label": "is NULL",
                "cardinality": "ZERO"
            }]
				}, {
            "name": "DATE",
            "editor": "DATE",
            "operators": [{
                "name": "=",
                "label": "is",
                "cardinality": "ONE"
            }, {
                    "name": "<>",
                    "label": "is not",
                    "cardinality": "ONE"
                }, {
                    "name": "<",
                    "label": "before",
                    "cardinality": "ONE"
                }, {
                    "name": ">",
                    "label": "after",
                    "cardinality": "ONE"
                }]
        }, {
            "name": "NUMBER",
            "editor": "NUMBER",
            "operators": [{
                "name": "=",
                "label": "is",
                "cardinality": "ONE"
            }, {
                    "name": "<>",
                    "label": "is not",
                    "cardinality": "ONE"
                }, {
                    "name": "IS NULL",
                    "label": "is NULL",
                    "cardinality": "ZERO"
                }, {
                    "name": ">",
                    "label": "greater than",
                    "cardinality": "ONE"
                }, {
                    "name": "<",
                    "label": "less than",
                    "cardinality": "ONE"
                }]
        }, {
            "editor": "SELECT",
            "name": "BOOLEAN",
            "operators": [{
                "name": "=",
                "label": "is",
                "cardinality": "ONE"
            }]
        }
    ];

    //
    // Set the value of the filter form element
    // to the current SQL output of the control
    //
    rq.onSqlChange = function (sql, args) {
        var out = {};
        out.sql = sql;
        out.sql = out.sql.replace(/\n/g, " "); // Remove newlines
        out.sql = out.sql.replace("SELECT  FROM", "SELECT \"x0\".* FROM"); // Add back in the global select - RQB removes it
        out.params = [];
        for (param in args) {
            var paramObject = {};
            paramObject.type = ({}).toString.call(args[param]).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
            paramObject.value = args[param];
            out.params.push(paramObject);
        }
        filter.sql = out.sql;
        filter.params = out.params;

    }

    rq.enumerate = function (request, response) {
        if (request.columnTypeName == 'BOOLEAN') {
            response([
                { value: 'f', label: 'False' },
                { value: 't', label: 'True' }
            ]);
        }
				}

    rq.editors = [
        {
            name: 'DATE',
            format: 'dd.MM.yyyy hh:mm:ss'
        }
    ]

    rq.from = function () {
        this.visible = false;
    }

    filter.rq = rq;
    filter.initial_query = "SELECT * FROM \"" + tableName + "\" \"x0\" WHERE (\"x0\".\"" + default_column + "\" = ?)";
    filter.initial_params = [];
    
    //
    // See if we already have a filter defined for this page; if so,
    // we can load it into the filter UI.
    //
    if (req_filter !== null && req_filter !== "null" && req_filter !== "" && typeof req_filter !== 'undefined') {

        filter.initial_query = req_filter;

        //
        // Hack to remove "x0".* as for some reason
        // RQB doesn't like it
        //
        filter.initial_query = filter.initial_query.replace("SELECT \"x0\".* FROM", "SELECT * FROM");
    }

    if (req_params !== null && req_params !== "null" && req_params !== "" && typeof req_params !== 'undefined') {
        try {
            var paramsJSON = JSON.parse(req_params);
            var params = [];
            for (var i in paramsJSON) {
                if (paramsJSON[i].type === "date" || paramsJSON[i].type === "timestamp") {
                    params.push(new Date(paramsJSON[i].value));
                } else {
                    params.push(paramsJSON[i].value);
                }
            }
            filter.initial_params = params;
        }
        catch (err) {
            filter.initial_params = [];
        }
    }

    try {
        RedQueryBuilderFactory.create(rq, filter.initial_query, filter.initial_params);
    } catch (err) {
        console.log(err);
        //
        // There is a problem with the filter. Replace it with default values.
        // TODO make this work! At present the exception isn't thrown.
        //
        filter.initial_query = "SELECT * FROM \"" + tableName + "\" \"x0\" WHERE (\"x0\".\"" + default_column + "\" = ?)";
        filter.initial_params = [];
        RedQueryBuilderFactory.create(rq, filter.initial_query, filter.initial_params);
    }
};