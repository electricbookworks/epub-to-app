:: Don't show these commands to the user
@echo off
:: Keep variables local, and expand at execution time not parse time
setlocal enabledelayedexpansion
:: Set the title of the window
title Epub to app converter

:setLocation
    :: Remember where we are by assigning a variable to the current directory
    set location=%~dp0

:resetVariables
	set option=
	set updateContentWarningOption=
	set epubFileName=
	set tocncxPath=

:prep
	echo.
	echo Before running this:
	echo - add the epub you're converting to _source
	echo - have the program unzip in your path
	echo   (http://infozip.sourceforge.net/)
	echo.

:options
	echo.
	echo Select a number:
	echo 1  Create content from epub
	echo 2  Build app
	echo 3  Run app
	echo x  Exit
	echo.
	choice /c 123x 
	if errorlevel 4 goto:EOF
	if errorlevel 3 goto runApp
	if errorlevel 2 goto buildApp
	if errorlevel 1 goto updateContent

:updateContent

	echo Updating content...

	:updateContentWarning
		echo --------
		echo WARNING!
		echo --------
		echo This will overwrite all existing app content
		echo with the content from the epub in _source.
		echo It won't overwrite files that are not in the source epub.
		echo (To replace everything, manually empty the www folder first.)
		echo Are you sure?
		choice
		if errorlevel 2 goto options

	:updateContentCountEpubs
		:: If only one epub in source, use it rather than asking for its name
		set /a numberOfFiles=0
		for /f "tokens=* delims= " %%a in ('dir /s /b /a-d "_source\*.epub"') do (
		set /a numberOfFiles+=1
		)
		if %numberOfFiles%==1 (
			for /f "tokens=* delims= " %%F in ('dir /b /a-d "_source\*.epub"') DO (
				set epubFileName=%%F
				)
			)

	:updateContentGetEpubName
		:: Prompt for file name if we haven't guessed it already
		if "%epubFileName%"=="" (
			set /p epubFileName=Enter the filename of the epub you're converting. 
			)
		:: Check if that file exists
		cd "%location%\_source"
		if not exist "%epubFileName%" echo %epubFileName% does not exist, please try again. && goto updateContentCountEpubs
		cd "%location%"

	:updateContentExtractEpub
		:: Quietly unzip the _source epub into www.
		echo Extracting %epubFileName% to the app's www directory...
		unzip -q -u "%location%\_source\%epubFileName%" -d www
		if exist "%location%\www\*.*" (
			echo Epub extracted.
			) else (
				echo Hmm, sorry, no files were extracted.
			)

	:updateContentInspectEpub
		:: Run appify.js to get info about the epub,
		:: create a landing page and add navigation.
		echo Inspecting the source epub and adding navigation to the files...
		node appify.js --epub "_source/%epubFileName%"

	:endUpdateContent
		echo Content updated.
		goto options

:buildApp

	echo Building app...

	if exist platforms\android\* (
		call cordova platform rm android
		)
	if not exist platforms\android\* (
		call cordova platform add android
		)
	call cordova build

	:endBuildApp
		echo App built.
		goto options

:runApp

	echo Running app...

	cordova run --emulator

	:endRunApp
		goto options
