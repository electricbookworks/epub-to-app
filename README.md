# Convert an epub into an app

This turns an epub into a very rudimentary Android app.

## Dependencies

- Currently, Windows (to use the `run.bat` script, though you could hack your way in the command line on any OS)
- Node.js
- Android Studio
- Apache Cordova

## Usage

1. Install the Node dependencies with `npm install`.
2. Edit the templates in `_templates` if necessary.
3. Edit the values in `config.xml`.
4. Put an epub in `_source`.
5. Run `run.bat` and follow the prompts, completing each step in order.

### Manual usage

The `run.bat` script for Windows (the last step above) simply manages the following steps, which you could also do manually:

1. Unzip the epub's contents to the `www` folder. (That is, the `mimetype` file should end up in `www`.)
2. In the root directory, run `node appify.js --epub "_source/yourepub.epub"`, where `yourepub.epub` is the filename of your epub in `_source`.
3. In the root directory, run `cordova build`. (Sometimes you need to run `cordova platform rm android && cordova platform add android` first.)
4. In the root directory, run `cordova run --emulator`. (Assuming you have Android Studio already set up with a default emulator.)

## Caveats

- **Keep text in one directory.** Currently, the book-content files in the source epub must be in the same directory. That is, don't structure your epub so that some content is in subdirectories in the epub package. This is because we automatically insert a relative link to the nav file, and this link assumes that the nav file is in the same directory as the book text.
- **List all content in the nav.** The only way for a user to access a content document is to find it in the navigation. There is no other way to move through the book at this point (there is no pagination, for instance).
- **Use EPUB3.** This won't work on EPUB2 epubs, largely because it looks for a `nav` element, which is an EPUB3 thing.
