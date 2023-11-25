const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

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

function findOffForEmpInRolloverWeek(arr, currentIndex) {
  return arr.slice(currentIndex + 1).indexOf("0");
}

function setRestOffDaysAs1(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === undefined) {
      arr[i] = 1;
    }
  }
  return arr;
}

function createObj(weeksArray) {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const resultObject = {};
  weeksArray.forEach((item, index) => {
    const weekNumber = Math.floor(index / 7) + 1; // Calculate the week number (1, 2, or 3)
    const dayOfWeek = weekDays[index % 7]; // Calculate the day of the week (Sun, Mon, ..., Sat)
    const key = `${dayOfWeek}${weekNumber}`;

    resultObject[key] = item;
  });
  return resultObject;
}

async function readCsvFile(filePath) {
  const results = [];
  const fileStream = await fs.createReadStream(filePath);
  return new Promise((resolve, reject) => {
    fileStream
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

const createNWriteDataToCsv = (finalData) => {
  const header = [];
  Object.keys(finalData[0]).forEach((key) => {
    header.push({ id: key, title: key });
  });
  const newData = finalData;
  const csvWriter = createCsvWriter({
    path: "newfile.csv",
    header: header,
  });

  csvWriter
    .writeRecords(newData)
    .then(() => console.log("New CSV file has been written successfully"))
    .catch((error) => console.error("Error writing CSV file:", error));
};

async function main() {
  const finalData = [];
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
      const filteredendWeekData = filterRequiredDate(endWeekData);
      console.log(filteredData);
      let empGotOffTdy = false;
      let daysParsedAfterLastOff = 0;
      const finalArr = [
        ...filteredData,
        ...Array(7).fill(undefined),
        ...filteredendWeekData,
      ];
      let breakLoop = false;
      for (i = 0; i < 14; i++) {
        if (breakLoop) {
          break;
        }
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
            let dayOffNextWeek = findOffForEmpInRolloverWeek(finalArr, i);
            function shouldWegiveOffTmrw() {
              let offTmrw = dayOffNextWeek - i < 5 ? true : false;
              if (offTmrw) {
                finalArr[i + 1] = 0;
              } else {
                finalArr[dayOffNextWeek - 5] = 0;
              }
              setRestOffDaysAs1(finalArr);
              breakLoop = true;
            }
            shouldWegiveOffTmrw();
          }
        }
      }
      console.log(finalArr);
      finalData.push(createObj(finalArr));
    }
    createNWriteDataToCsv(finalData);
  } catch (error) {
    console.error("Error reading CSV files:", error);
  }
}

main();
