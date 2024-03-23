const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const filePath1 = "Test2.csv";
const filePath2 = "TestEnd2.csv";

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
  const nextOffIndexInRestOfDaysArr = arr.slice(currentIndex + 1).indexOf("0");
  const correctIndex = currentIndex + nextOffIndexInRestOfDaysArr + 1;
  return correctIndex;
}

function doAFinalVerification(arr, name) {
  const startIndex = 7; // of Transition Week
  const endIndex = 14;

  const subarray = arr.slice(startIndex, endIndex);

  // Count the occurrences of 1 in the subarray using reduce
  const countOfWorkingDays = subarray.reduce(
    (count, value) => count + (value === 1 ? 1 : 0),
    0
  );
  if (countOfWorkingDays > 5)
    console.error(
      `${name}: Number of working days is ${countOfWorkingDays} in transition week`
    );
}

function setRestOffDaysAs1(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === undefined) {
      arr[i] = "1";
    }
  }
  return arr;
}

function createObj(weeksArray, userName) {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const resultObject = { login: userName };
  weeksArray.forEach((item, index) => {
    const weekNumber = Math.floor(index / 7) + 1; // Calculate the week number (1, 2, or 3)
    let weekName;
    switch (weekNumber) {
      case 1:
        weekName = "CW";
        break;
      case 2:
        weekName = "TW";
        break;
      case 3:
        weekName = "RW";
        break;
    }
    const dayOfWeek = weekDays[index % 7]; // Calculate the day of the week (Sun, Mon, ..., Sat)
    const key = `${dayOfWeek}${weekName}`;

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
    .then(() => console.log("New CSV file has been created successfully"))
    .catch((error) => console.error("Error writing CSV file:", error));
};

const generateTotalEmpNoPerDay = (finalData) =>{
  const lastRow = {...finalData[0]} //Cloning first row to update it with sum
  lastRow.login = "Headcount for the day"
  Object.keys(lastRow).forEach((eachDayName) =>{
    if(eachDayName === "login"){
      return
    }
    let headcount4TheDay = 0
    finalData.forEach((eachEmployeeData)=>{
      headcount4TheDay += parseInt(eachEmployeeData[eachDayName])
    })
    lastRow[eachDayName] = headcount4TheDay
  })
  finalData.push(lastRow)
}

async function main() {
  const finalData = [];
  try {
    const [results1, results2] = await Promise.all([
      readCsvFile(filePath1),
      readCsvFile(filePath2),
    ]);
    // console.log(results1);
    // console.log(results2);
    minLengthOfFile = Math.min(results1.length, results2.length);
    for (eachRowIndex = 0; eachRowIndex < minLengthOfFile; eachRowIndex++) {
      console.log("Generating data for employee ", eachRowIndex + 1);
      let data = results1[eachRowIndex];
      let endWeekData = results2[eachRowIndex];
      const filteredData = filterRequiredDate(data);
      const filteredendWeekData = filterRequiredDate(endWeekData);
      // console.log(filteredData);
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
          if (daysParsedAfterLastOff >= 0 && daysParsedAfterLastOff < 5) {
            daysParsedAfterLastOff += 1;
            finalArr[i] = "1";
          } else if (daysParsedAfterLastOff == 5) {
            finalArr[i] = "0";
            daysParsedAfterLastOff = 0;
            empGotOffTdy = true;
            let dayOffNextWeek = findOffForEmpInRolloverWeek(finalArr, i);
            function shouldWegiveOffTmrw() {
              let offTmrw = dayOffNextWeek - (i + 1) <= 5 ? true : false;
              if (offTmrw) {
                finalArr[i + 1] = "0";
              } else {
                finalArr[dayOffNextWeek - 5 - 1] = "0";
              }
              setRestOffDaysAs1(finalArr);
              breakLoop = true;
            }
            shouldWegiveOffTmrw();
          }
        }
      }
      // console.log(finalArr);
      console.log("Validating data generated");
      doAFinalVerification(finalArr, data?.login);
      let finalObj = createObj(finalArr, data?.login);
      finalData.push(finalObj);
    }
    generateTotalEmpNoPerDay(finalData);
    createNWriteDataToCsv(finalData);
  } catch (error) {
    console.error("Error reading CSV files:", error);
  }
}

main();
