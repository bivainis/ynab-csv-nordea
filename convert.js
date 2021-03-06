let fs = require('fs');

const config = {
    inputFile: 'sample-input-nordea.csv',
    outputFile: 'output.csv',
    cashoutCategory: 'cash'
};

fs.readFile(config.inputFile, function (err, data) {
    if (err) {
        return console.error(err);
    }

    let dataStr = data.toString();

    // remove Nordea pay string
    dataStr = dataStr.replace(/Nordea pay(\s|,)/ig, '');

    // store each line as an item in array
    let rowArray = dataStr.split('\n');

    // get rid of items that are empty ('')
    removeEmptyItems(rowArray);

    // remove the first item, which represents
    // the first row in csv, describing its columns
    rowArray.shift();

    rowArray.forEach((val, idx, arr) => {
        // split each row into an array of columns
        // [0] date - 28-09-2016
        // [1] description - Example Payee ExamplDen 27.09 kl. 20.03
        // [2] date - '28-09-2016'
        // [3] outflow/inflow - '-255.33'
        // [4] running balance - '999.99'
        let columnArray = val.split(';');

        // remove kob,
        columnArray[1] = columnArray[1]
            .replace(/k.b,?(\s\.\s)?\s?/, '')
            .replace(',', '.');

        // getting years from transaction date
        let year = columnArray[0].match(/\d{4}/);
        let day = columnArray[0].match(/^\d{2}/);
        let month = columnArray[0].match(/-(\d{2})-/);
        // prevent accessing array element if no value
        month = month ? month[1] : null;

        // getting month and day from description (more accurate)
        let monthAndDay = columnArray[1].match(/Den (\d{2})\.(\d{2})/);

        // if available, set a more accurate date from description
        if (monthAndDay) {
            day = monthAndDay[1];
            month = monthAndDay[2];
        }

        // in case amount is still reserved
        if (/Reserveret/.test(columnArray[0])) {
            // set date to today
            let today = new Date();

            year = today.getFullYear();
            month = today.getMonth() + 1;
            day = new Date().getDate();

            if (day < 10) {
                day = '0' + day;
            }

            if (month < 10) {
                month = '0' + month;
            }
        }

        // remove excessive whitespace
        columnArray[1] = columnArray[1].replace(/\s+/g, ' ');

        let payee = columnArray[1].replace(/Den \d{2}\.\d{2}(.?)+/, '');

        // trim payee
        payee = payee
            .replace(/^(\s|\.|\s)+/g, '')
            .replace(/(\s|\d)+$/g, '');

        // in case of cashout, set the payee to empty string
        if (/udbetaling/.test(columnArray[1])) {
            payee = `Transfer: ${config.cashoutCategory}`;
        } else if (/gebyr/.test(columnArray[1])) {
            payee = 'Nordea';
        } else if (/[A-Z]{3}\s\d+\.\d{2}/.test(columnArray[1])) {
            payee = payee.replace(/EUR \d+\.\d{2}(\s?)+/, '');
        }

        let memo = columnArray[1].replace(/Den \d{2}\.\d{2}/, '');

        let amount = columnArray[3].replace(',', '.');
        let isOutflow = /-\d+/.test(amount);
        let outflow = isOutflow ? amount.replace('-', '') : '';
        let inflow = !isOutflow ? amount : '';

        // expected format: 'Date,Payee,Category,Memo,Outflow,Inflow'
        arr[idx] = `${year}/${month}/${day},${payee},,${memo},${outflow},${inflow}`;
    });

    // add ynab column names
    rowArray.unshift('Date,Payee,Category,Memo,Outflow,Inflow');
console.log(rowArray);
    writeFile(config.outputFile, rowArray.join('\n'));
});

/**
 * Writes a file based on name and data
 * @param fileName
 * @param data
 */
const writeFile = (fileName, data) => {
    fs.writeFile(fileName, data, function (err) {
        if (err) {
            return console.log(err);
        }
    });
};

/**
 * Removes array items that are empty strings
 * @param arr
 */
const removeEmptyItems = (arr) => {
    let idxOfEmptyItem = arr.indexOf('');

    while (idxOfEmptyItem !== -1) {
        arr.splice(idxOfEmptyItem, 1);
        idxOfEmptyItem = arr.indexOf('');
    }
};
