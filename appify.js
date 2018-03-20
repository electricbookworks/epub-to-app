// Gets info about an epub and writes some files.
// Run it from the command line, e.g.:
// node _tools/inspectEpub.js --epub _source/maths12.epub

console.log('Inspecting epub and finding data...');

const epubParser = require('epub-parser');
const jp = require('jsonpath');
const fs = require('fs');
const args = require('yargs').argv;
const replace = require('replace-in-file');

// Get the epub we're parsing from the --epub arg, e.g.:
// node _tools/inspectEpub.js --epub ../_source/potatoes.epub
// Without args it defaults to inspecting ../_source/book.epub
var epubFullPath = '../_source/book.epub';
if (args.epub && args.epub.trim != '') {
    var epubFullPath = args.epub;
};

// The function that gets all the data
// and passes it back to its calling function.
let getData = function(epub, callback) {
    // get all the data in variables
    epubParser.open(epub, function (err, epubData) {
        if(err) return console.log(err);
        var metadata = epubData.raw.json;
        var opf = metadata.opf; // i.e. epubData.raw.json.opf
        var opsRoot = epubData.paths.opsRoot;
        var navMap = epubData.easy.navMapHTML;
        var navHTML = epubData.easy.epub3NavHtml;
        var linearSpine = epubData.easy.linearSpine;
        var navPathFromOPF = jp.query(opf, '$..[?(@.properties == "nav")].href', 1);
        var navPath = opsRoot + navPathFromOPF;
        var navDoc = navPathFromOPF.toString().replace(/.*\//g,'');
        var coverImage = jp.query(opf, '$..[?(@.properties == "cover-image")].href', 1);
        var coverImagePath = opsRoot + coverImage;
        var data = {
            opsRoot: opsRoot,
            navPathFromOPF: navPathFromOPF,
            navPath: navPath,
            navDoc: navDoc,
            coverImagePath: coverImagePath
        };
        callback(data);
    });
}

// Create www/index.html from _templates/index.html
// Copy file and populate links
// Paths relative to root, for some nodey reason.
function createIndex() {

    // Copy file
    console.log('Copying index.html template...');
    fs.createReadStream('_templates/index.html').pipe(fs.createWriteStream('www/index.html'));

    // Replace nav path and cover image path
    getData(epubFullPath, function(data) {
        console.log('Adding paths to nav and cover image...');
        const replaceOptions = {
            files: 'www/index.html',
            from: ['<!--path-to-nav-document-->', '<!--path-to-cover-image-->'],
            to: [data.navPath, data.coverImagePath]
        };
        replace(replaceOptions);
    });

};
createIndex();

// Use replace to add the navigation button
// to all book pages in the app.
function addNavButton() {

    console.log('Adding nav button to pages...');

    // Remove previous additions, in case we're processing the same files again.
    const thingsToStrip = {
        files: 'www/' + opsRoot + '/**/*html',
        from: [/<!--epub-to-app-navigation-->[\s\S]*<!--epub-to-app-navigation-->/gm, /<!--epub-to-app-styles-->[\s\S]*<!--epub-to-app-styles-->/gm],
        to: ''
    };
    replace(thingsToStrip);

    // Get the HTML snippets (ref http://stackabuse.com/read-files-with-node-js/)
    // synchronously so that it's all loaded before we do a find-replace next.
    try {  
        var htmlStylesTemplate = fs.readFileSync('_templates/styles.html', 'utf8');
        var htmlNavButtonTemplate = fs.readFileSync('_templates/navButton.html', 'utf8');
    } catch(e) {
        console.log('Error:', e.stack);
    }

    // Add styles and nav button
    getData(epubFullPath, function(data) {
        const replaceOptions = {
            files: 'www/' + opsRoot + '/**/*html',
            from: ['</head>', '</body>'],
            to: [htmlStylesTemplate + '</head>', htmlNavButtonTemplate + '</body>']
        };
        replace(replaceOptions);

        // Replace nav path in the nav button
        getData(epubFullPath, function(data) {
            const replaceNavPath = {
                files: 'www/' + opsRoot + '/**/*html',
                from: '<!--path-to-nav-document-->',
                to: data.navDoc
            };
            replace(replaceNavPath);
        });

    });

};
addNavButton();

// // Sample functions for seeing data in the console
// getData(epubFullPath, function(data) {
//     console.log('opsRoot: ' + data.opsRoot);
// });
// getData(epubFullPath, function(data) {
//     console.log('coverImagePath: ' + data.coverImagePath);
// });
// getData(epubFullPath, function(data) {
//     console.log('navPath: ' + data.navPath);
// });
// getData(epubFullPath, function(data) {
//     console.log('navDoc: ' + data.navDoc);
// });
