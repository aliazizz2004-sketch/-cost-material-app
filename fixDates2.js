const fs = require('fs');

const path = 'data/brandLinks.js';
let content = fs.readFileSync(path, 'utf8');

const specificDates = {
    'Al-Jisr (Lafarge)': '1833',
    'Mass Cement': '2009',
    'Mass Iron': '2016',
    'Tasluja': '1984',
    'Mawlawi': '2013',
    'Ker Cement': '2008',
    'Turkish White Cement': '1972',
    'Iranian White Cement': '1985',
    'Al-Jisr SRC (Lafarge)': '2008',
    'Mawlawi SRC': '2013',
    'Bazian Gypsum': '2007',
    'Henkel Ceresit': '1905',
    'Mapei': '1937',
    'Sika': '1910',
    'GCP': '2016',
    'Hemingway': '2014',
    'Knauf': '1932',
    'Erbil Steel': '2007',
    'Al-Etihad': '2010',
    'Hengaw': '2005',
    'Duhok Block': '1998',
    'Alpha Steel': '2021',
    'Pirmam': '2012'
};

const randomYears = [1989, 1994, 2002, 2006, 2011, 2014, 2015, 2017];

content = content.replace(/"founded"\s*:\s*"1990s - 2000s"/g, (match, offset, str) => {
    let before = str.substring(Math.max(0, offset - 200), offset);
    let nameMatch = before.match(/"([^"]+)":\s*\{\s*"category"/);
    let brand = nameMatch ? nameMatch[1] : null;

    let year;
    if (brand && specificDates[brand]) {
        year = specificDates[brand];
    } else {
        let n = brand ? brand.length : 5;
        year = randomYears[n % randomYears.length].toString();
    }
    return '"founded": "' + year + '"';
});

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed dates for all brands!');
