const fs = require("fs-extra");
const path = require("path");
let sass = require("sass");
let markdown = require("markdown").markdown;

const config = require("../config.json");

let siteData = []

// go through all files in markdown folder and create structure based on filenames
fs.readdir(config.dirMarkdown, (err, files) => {
  let filesAmount = files.length

  files.forEach((file, i) => {
    // each file
    fs.readFile(config.dirMarkdown + '/' + file, 'utf-8', function(error, source) {


      let fileExtention = file.substr(file.length - 3)

      if (fileExtention == '.md') { // if is markdown page
        let pageObj = {}
        // filename handling
        pageObj.language = file.substr(0, 2)
        let level1 = file.substr(3, 2)
        let level2 = file.substr(6, 2)
        let order = '1' + level1 + level2;
        pageObj.page_order = parseInt(order)
        if (level2 != '00') {
          pageObj.page_level = 2
        } else {
          pageObj.page_level = 1
        }
        pageObj.name = file.substr(9)

        // level



        // content of the file
        var contentArr = source.split('\n');

        // each line
        let status = '';
        let text = '';
        contentArr.forEach((mdFileRow, j) => {

          switch (status) {
            // catch first ---
            case '':
              if (mdFileRow == '---') {
                status = 'inMeta'
              } else {
                status = 'inTxt'
                text += mdFileRow + '\n';
              }
              break;

              // metadata
            case 'inMeta':
              // catch last ---
              if (mdFileRow == '---') {
                status = 'inTxt'
              } else { // store metdata
                pageObj[strToObject(mdFileRow).key] = strToObject(mdFileRow).vall
              }
              break;


              // txt
            case 'inTxt':
              text += mdFileRow + '\n';
              if ((contentArr.length - 1) == j) {
                text = markdown.toHTML(text)
                text = text.replaceAll('\n', ' ')
                pageObj.htmlContent = text
              }
              break;



          }
        }) // trough lines

        siteData.push(pageObj)

      }

      // reorder + create files
      if (filesAmount == i + 1) {
        siteData = sortByKey(siteData, 'page_order')
        siteData = validateData(siteData)
        createFile('data/site.json', JSON.stringify(siteData));
      }


    });
  })

})


function validateData(siteDataIm) {
  siteDataIm.forEach((siteItem, i) => {
    config.defaults.forEach((defItem, j) => {
      if (siteItem[defItem.name] === undefined) {
        siteData[i][defItem.name] = defItem.val
      }
    });
    // fileName
    let filename = siteData[i].title
    filename = filename.replaceAll(' ','-')
    filename = filename.replaceAll('&','')
    if (siteData[i].page_order == 10000) {
      siteData[i].file_name = 'index.html'
    } else {
      siteData[i].file_name = filename.toLowerCase()+'.html'
    }
  });
  return siteDataIm;
}




function strToObject(str) {
  let keyVals = str.split(': ');
  return {
    key: keyVals[0],
    vall: keyVals[1]
  }
}


// create new files
function createFile(fileName, content) {
  fs.writeFile(fileName, content, function(err) {
    if (err) throw err;
  });
}


function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key];
    var y = b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}
