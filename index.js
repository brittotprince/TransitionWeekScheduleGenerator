const fs = require("fs").promises;
const csv = require("csv-parser");

const filePath1 = "Test.csv";
const filePath2 = "TestEnd.csv";

const results = [];

const filterRequiredDate = (data) => {
  let returnData = [
    data.sun,
    data.mon,
    data.tue,
    data.wed,
    data.thu,
    data.fri,
    data.sat,
  ];
  return returnData;
};

async function readCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

async function main() {
  try {
    const [results1, results2] = await Promise.all([
      readCsvFile(filePath1),
      readCsvFile(filePath2),
    ]);
    console.log(results1);
    console.log(results2);
    minLengthOfFile = Math.min(results1.length, results2.length);
    for (eachRowIndex = 0; eachRowIndex < minLengthOfFile; eachRowIndex++) {
      let data = results1[eachRowIndex];
      let endWeekData = results2[eachRowIndex];
      const filteredData = filterRequiredDate(data);
      console.log(filteredData);
      let empGotOffTdy = false;
      let daysParsedAfterLastOff = 0;
      const finalArr = [...filteredData, ...Array(7).fill(undefined)];
      for (i = 0; i < 14; i++) {
        if (finalArr[i] !== undefined) {
          //Week with Data
          if (finalArr[i] === "0") {
            //Employee got off
            empGotOffTdy = true;
            daysParsedAfterLastOff = 0;
          } else if (finalArr[i] === "1" && empGotOffTdy) {
            //Employee had got off last day -> Counting number of working days
            empGotOffTdy = false;
            daysParsedAfterLastOff += 1;
          } else if (finalArr[i] === "1" && daysParsedAfterLastOff > 0) {
            // Continuing the count of working days
            daysParsedAfterLastOff += 1;
          }
        } else {
          //Without data
          if (daysParsedAfterLastOff > 0 && daysParsedAfterLastOff < 5) {
            daysParsedAfterLastOff += 1;
            finalArr[i] = "1";
          } else if (daysParsedAfterLastOff == 5) {
            finalArr[i] = "0";
            daysParsedAfterLastOff = 0;
            empGotOffTdy = true;
          } else if (daysParsedAfterLastOff === 0 && empGotOffTdy) {
            empGotOffTdy = false;
            finalArr[i] = "1";
            daysParsedAfterLastOff += 1;
          }
        }
      }
      console.log(finalArr);
    }
  } catch (error) {
    console.error("Error reading CSV files:", error);
  }
}
main();
