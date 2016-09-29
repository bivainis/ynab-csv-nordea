let fs = require('fs');

fs.readFile('sample-input-nordea.csv', function (err, data) {
  if (err) {
    return console.error(err);
  }

  let dataStr = data.toString();

  // replace commas with dots
  // e.x.: 100,00 becomes 100.00
  dataStr = dataStr.replace(/Nordea pay k.b,/g, '');
  dataStr = dataStr.replace(/Nordea pay k.b /g, '');
  dataStr = dataStr.replace(/,/g, '.');

  // dataStr = extractRealDates(dataStr);
  dataStr = dataStr.replace(/;/g, ',');

  // store each line as an item in array
  let rowArray = dataStr.split('\n');

  // get rid of empty elements
  rowArray.forEach((val, idx) => {
    if (val === '') {
      rowArray.splice(idx, 1);
    }
  });

  // remove the first item, which represents
  // the first row in csv, describing its columns
  rowArray.shift();

  rowArray.forEach((val, idx, arr) => {

    let rowItems = val.split(',');
    let year = rowItems[0].match(/\d{4}/g);

    rowItems.shift();
    rowItems.pop();
    rowItems.splice(1, 1);

    // remove dot from description
    rowItems[0] = rowItems[0].replace(/ \. /g, '');

    let dayMonth = rowItems[0].match(/Den (\d{2}).(\d{2})/);
    let day = dayMonth[1];
    let month = dayMonth[2];
    let payee = rowItems[0].replace(/Den \d{2}.\d{2}/, '');
    let memo = payee;
    let expense = rowItems[1].match(/-(\d+.\d{2})/)[1];
    let inflow = ''; // for now

    arr[idx] = `${year}/${month}/${day},${payee},,${memo},${expense},${inflow}`;
  });

  // add ynab column format
  rowArray.unshift('Date,Payee,Category,Memo,Outflow,Inflow');

  fs.writeFile('output.csv', rowArray.join('\n'), function (err) {
    if (err) {
      return console.log(err);
    }
  });
});
