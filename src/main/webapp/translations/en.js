/*
 * Loco js export: Angular Gettext
 * Project: en.po conversion
 * Release: Working copy
 * Locale: en_GB, English (UK)
 * Exported by: Unregistered user
 * Exported at: Tue, 03 Nov 2015 15:24:16 +0000 
 */

/* global angular */ 

angular.module('gettext').run(['gettextCatalog', function (gettextCatalog) {
    'use strict';
    /* jshint -W100 */
    gettextCatalog.setStrings( "en", {"Gen403":"You are not authorised to do that. The action you have just tried to perform requires a higher permission level than the one you currently have for this project. If you believe you should be able to perform this action, please contact the project owner to discuss adjusting your permissions.","Gen410":"The project you are trying to work with has been deleted. To restore the project, please contact support.","Gen500":"Internal problem while performing this action - please contact support.\"","Verify200":"Thanks for confirming your email address. You can now use the ORDS","Verify400":"There has been an error verifying your code - please contact the ORDS help desk by emailing ords@it.ox.ac.uk.","ProPost201":"The project was successfully created.","ProPost400":"There has been a problem with your input. Please ensure all fields are filled in correctly.","ProGet400":"Unable to get project details.","ProGet404":"Unable to find original project in the database - please contact support.","ProPut400":"Unable to update project details. Make sure that the name and description fields contain at least 2 characters.","ProPut200":"The project was successfully edited.","ProPut404":"Unable to find original project in the database - please contact support.","ProDelete200":"Project deleted.","ProDelete400":"There was a problem deleting the project.","ProDelete404":"There was a problem deleting the project as it couldn't be found.","ProDelete410":"The project had already been deleted.","MemPut200":"Member details updated. The project member's authorisation has been updated","MemPut400":"Unable to update the members details.","MemPut404":"Unable to find original project in the database - please contact support.","MemDelete200":"Project member removed","MemDelete400":"There was a problem removing this project member","MemDelete404":"Unable to remove member as unable to find in database - please contact support.","Pro025":"A full project request has already been sent for this project","Pro026":"A full project request has been sent for this project. You will be notified in due course.","Pro027":"This project is already a full project","Pro006":"Error: You cannot use '___' in project metadata.","Pro011":"A project with this name already exists. Pick a different name.","Pro010":"Unable to find that user in the database.","Pro016":"This email address isn't currently registered with ORDS. Would you like to send the user an invitation to register?If you believe that this user is already registered with ORDS, please check that the email address is the one used when registering. (Some users may have multiple addresses or aliases - a departmental address and a college one, for example.) If the problem persists, please contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Pro018":"Unable to comply. Perhaps this user is already associated with the project?","Pro022":"ORDS has sent an invitation to this email address.","Pro023":"There has been a problem with your request. Please ensure the email you specified is valid, and if the problem persists then contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Pro024":"The email address you entered is invalid. Email addresses must be in the format user@domain","Dat001":[["Internal error accessing database information.","Milestone database version created."]],"Dat002":[["Unable to get table details.Null table name.","Internal data error."]],"Dat003":[["Record added successfully.","Unable to create milestone database version due to internal error."]],"Dat004":[["ORDS is unable to add that record. Please ensure that the data you are entering is consistent with the database schema (for example, Integer fields can only contain whole numbers, and some fields may have a maximum size specified). If the problem persists, please contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Test database version created."]],"Dat005":[["Error determining starting record.","There has been an internal error creating the test database version."]],"Dat006":[["Problem with user input.","Unable to add new empty database."]],"Dat007":[["Milestone database version successfully created.","Empty database added successfully."]],"Dat008":[["Test database version successfully created.","Database updated successfully."]],"Dat009":[["Empty database successfully created.","Internal error while trying to update the database."]],"Dat010":[["Unable to get specific internal information.","Internal error while trying to upload the database."]],"Dat011":[["Data saved.","The upload process is underway.You will be sent an email the process of uploading your database is complete."]],"Dat012":[["Problem updating data in table.","Database problem"]],"Dat013":"Problem obtaining database.","Dat014":"Too many records for trial.This is a trial project - you cannot add so many records to it.","Dat015":"Your database will be uploaded.You will be notified by email when the process has completed.","Dat016":"Database information edited successfully","Con001":"Test database version successfully copied to main.","Con002":"Unable to copy test database version to main due to internal error.","Con003":"Unable to copy test database version to main due to internal SQL error.","Con004":"Database successfully copied to milestone version.","Con005":"Unable to copy to milestone database version due to internal cloning error.","Con006":"Database successfully copied to test version.","Con007":"Unable to copy to test database version due to internal cloning error.","Con008":"Internal error getting dataset id.","Con009":"The dataset was successfully deleted.","Con010":"Unable to find the table from which to delete records.","Con011":"The record has been successfully deleted.","Con012":"Unable to delete the record.","Con013":"You are not authorised to remove the database for this project.","Con014":"Unable to find your user.","Con015":"Database successfully deleted.","Con016":"ORDS could not find the database to delete it.ORDS may have encountered an internal problem. Please report this to the ORDS help desk by emailing ords@it.ox.ac.uk, giving as much information as possible about what happened.","Con017":"The user was successfully removed.","Con018":"You are not authorised to remove the user for this project.","Con019":"Unable to delete database.","Con020":"Database version deleted from ORDS.","Con021":"Unable to delete project user.","Con022":"Unable to copy to milestone database version due to internal error.","Con023":"Internal error creating the main database version.","Con024":"ORDS could not find any database versions to delete.ORDS may have encountered an internal problem. Please report this to the ORDS help desk by emailing ords@it.ox.ac.uk, giving as much information as possible about what happened.","Con025":"Unable to create test database version.","Con026":"Unable to get internal details. Invalid opd.","Con027":"Problem obtaining database.","Con028":"The database has been deleted. However, ORDS encountered a problem. Please report this to the ORDS help desk by emailing ords@it.ox.ac.uk, giving as much information as possible about what happened.","Log001":"Unable to log you in with those credentials. Sorry.","Log002":"There has been an error verifying your code - please contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Sql001":"Internal error.","Sql002":"Schema updated successfully.","Pdu001":"There has been an internal problem doing this. Null items.","Pdu002":"Bad file name - try again (click the -Choose File- button to select the database).","Pdu003":"Internal error trying to create the database. Please contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Pdu004":"Unable to fix the schema.","Pdu005":"General processing error. Please contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Pdu006":"Unable to create database. Please contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Pdu007":"Unable to configure system. Please contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Pdu008":"Unable to generate data files. Please contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Pdu009":"Unable to get the required details from the database - please contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Pdu010":"This has already been imported. Nothing to do. This is likely a coding error.","Pdu011":"Unable to get the required details of the database - please contact the ORDS help desk by emailing ords@it.ox.ac.uk, giving as much information as possible about what happened.","Pdu012":"There has been a problem importing your database. Perhaps there has been some sort of data corruption, or the data format is not supported in ORDS? For help identifying the problem, please contact the ORDS help desk by emailing ords@it.ox.ac.uk","Pdu013":"There has been a problem importing the database and\/or its data into ORDS. The trace is appended here to help you assess what the problems might be.","Pdu014":"Your project is currently marked as a trial project - this database is too big for trial projects.Please select a smaller database, or contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Tvs001":"Internal database error.","Tvs002":"Unable to produce data for export.","Tvs003":"Problem getting data for the CSV file.","Tvs004":"Dataset exported successfully.","Tvs005":"Internal error getting project details.","Tvs006":"Unable to get data for dataset.","Tvs007":"Please enter a name for the dataset.","Tvs008":"Please enter a query for the dataset.","Tvs009":"Please enter a description for the dataset.","Tvs010":"Your dataset has been saved.","Tvs011":"Problem creating the static dataset.","Tvs012":"Problem storing the static dataset.","Tvs013":"Dataset edited successfully.","Tvs014":"For security reasons, only SELECT queries are allowed through this interface.","Tvs015":"Success.","Tvs016":"Datasets cannot be saved for trial projects. If you would like to request an upgrade to full project status, please click the 'Request full project' button on the project page, or contact the ORDS help desk by emailing ords@it.ox.ac.uk.","Uti001":"Unable to access file from the database.","Uti002":"File download successful.","Uti003":"There has been a problem preparing the data.","Fpg001":"Sorry - I don't understand that request. Please try something different.This is likely a coding error.","Fpg002":"You are not authorised to do that.The action you have just tried to perform requires a higher permission level than the one you currently have for this project.If you believe you should be able to perform this action, please contact the project owner to discuss adjusting your permissions.","Fpg003":"An unknown error occurred while trying to perform that action.","Fpg004":"Your session has expired. Please log in again.","Fpc001":"Unknown user.","Fpc002":"Internal problem accessing resources.","Fpc003":"Internal problem accessing project details.","Fpc004":"Unable to find the project to delete it.","Fpc005":"Project deleted successfully.","Fpc006":"Unable to delete project.","Fpl001":"Problem occurred during registration.","Fpl002":"You have successfully registered to use the ORDS. An email has been sent to the address you supplied.Please verify your account by clicking the link in this message.","Fpl003":"There was a problem with your registration detailsThere is already a registered user with the email address %s.","Fpp001":[["Unknown user. Are you sure you have registered?","Unknown user. Are you sure you have registered?"]],"Fpp002":"Project created successfully.","Fpp003":"Internal error creating project.","Fpp005":"You have not yet verified your email address. A new email has been sent to you.","Rst001":"Database with id %s does not exist","Rst002":"There is no %s instance for database %s","Rst003":"Database deletion failed, attempted to delete the database %s, which doesn't exist.","Rst004":"Changes to database %s saved successfully.","Rst005":"There is no table in %s called %s","Rst006":"Cannot create table %s a table with that name already exists","Rst007":"Table %s created successfully","Rst008":"Table %s renamed to %s","Rst009":"Cannot rename table %s table does not exist","Rst010":"Cannot rename table to %s there is already a table with that name","Rst011":"Table %s deleted successfully","Rst012":"Cannot delete table %s table does not exist","Rst013":"There is no field in %s called %s","Rst014":"There is no table in %s called %s","Rst015":"No datatype supplied for the new field","Rst016":"Field %s created successfully","Rst017":"Cannot field in table %s table doesn't exist","Rst018":"Cannot create field %s in table %s a field with that name already exists.","Rst019":"Field %s renamed to %s successfully","Rst020":"Field %s now nullable","Rst021":"Field %s no longer nullable","Rst022":"Data type for %s changed to %s","Rst023":"Default value removed from %s","Rst024":"Default value for %s set to %s","Rst025":"Request must specify at least one of newName, notnull, datatype, defaultValue or autoIncrement","Rst026":"Cannot modify field in table %s table doesn't exist","Rst027":"Cannot modify field %s field doesn't exist in table %s","Rst028":"Cannot rename field to %s field with that name already exists in table %s","Rst029":"Field %s successfully deleted from %s","Rst030":"Cannot delete field from table %s table does not exist","Rst031":"Cannot delete field %s from table %s field does not exist","Rst032":"There is no index for %s called %s","Rst033":"There is no table in %s called %s","Rst034":"Index '%s' created successfully","Rst035":"At least one field must be specified","Rst036":"Cannot create index on table %s table does not exist","Rst037":"Cannot create index %s on table %s there is already a index with that name.","Rst038":"newName must be specified","Rst039":"Cannot rename index on table %s table does not exist","Rst040":"Index %s renamed to %s","Rst041":"Cannot rename index %s on table %s index does not exist","Rst042":"Cannot rename index to %s a index with that name already exists on table %s","Rst043":"Index %s removed from %s","Rst044":"Cannot remove index from table %s table does not exist","Rst045":"Cannot remove index %s from table %s index does not exist","Rst046":"There is no constraint for %s called %s","Rst047":"There is no table in %s called %s","Rst048":"Constraint '%s' created successfully","Rst049":"At least one refColumn must be specified to create a foreign key","Rst050":"refTable must be specified to create a foreign key","Rst051":"A checkExpression must be specified when no constraint type is specified","Rst052":"Cannot create constraint on table %s table does not exist","Rst053":"Cannot create constraint %s on table %s there is already a constraint with that name.","Rst054":"Constraint %s renamed to %s","Rst055":"Cannot rename constraint on table %s table does not exist","Rst056":"Cannot rename constraint %s on table %s constraint does not exist","Rst057":"Cannot rename constraint to %s a constraint with that name already exists on table %s","Rst058":"Constraint %s removed from %s","Rst059":"Cannot remove constraint from table %s table does not exist","Rst060":"Cannot remove constraint %s from table %s constraint does not exist","Rst061":"Field specified as NOT NULL must have a non-null default value","Rst062":"You cannot specify a default for an auto-increment field","Rst063":"Only integer fields can have auto-increment enabled","Rst064":"Cannot remove auto-increment form field %s it does not currently have an auto-increment.","Rst065":"Cannot add auto-increment to field %s it is already auto-incremented.","Rst066":"Added auto-increment to field %s.","Rst067":"Removed auto-increment from field %s.","Rst068":"You can only specify one local field per foreign key","Rst069":"Database %s deleted successfully","Rst070":"Comment for %s set to %s","Rst071":"Cannot set comment for table %s table doesn't exist.","Rst072":"Cannot set comment for field %s field doesn't exist in table %s","Rst073":"Cannot set comment for field %s in table %s table doesn't exist","Rst074":"Cannot get comment for field %s field doesn't exist in table %s","Rst075":"A working copy of your database could not be created for editing"} );
    /* jshint +W100 */
   
   //gettextCatalog.currentLanguage = "en";
   
}]);