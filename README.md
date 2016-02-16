# ords-ui

The user interface for the Online Research Database Service (ORDS)

## Localisation

You can localise ORDS in two ways:

1. Editing the HTML views
2. Editing the language file

## Editing Views

All HTML for the UI is contained within .html files; these can be found in:

    /views
    /project/views
    /database/views
    (etc)

HTML files are also used for reusable parts of the UI such as forms; these are found 
in 

    /components

## Editing the default language file

Apart from the HTML files, the only other source of on-screen text are messages returned by scripts; these
are all defined within the *language file*.

The source language file can be found at:

    /translations/en.po
    
This can be edited either using a text editor or a dedicated language file editor such as PoEdit.

The language file needs to be converted into JavaScript (en.js) to be used in the UI. 

The simplest way to do this is to upload it to https://localise.biz/free/converter. Select JavaScript > Angular.getText to convert
it for use in ORDS. (Note, we expect the default locale to be "en" - the converter may change this to "en-GB".)

## Translating ORDS

ORDS uses angular-gettext for localisation. See the documentation here:

https://angular-gettext.rocketeer.be/dev-guide/getting-started/

Note that currently only script-generated text is translated; however all interface text within HTML views can also be marked for translation.

## Customising the appearance of ORDS

Most of the appearance of ORDS is governed by the CSS files in

    /style/



