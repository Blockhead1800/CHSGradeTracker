toggleTheme()
updateThemeButton()
// Theme Functions
function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    const btn = document.querySelector('.theme-toggle');
    btn.textContent = theme === 'dark' ? '🌞' : '🌙';
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

// Cookie Functions
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + JSON.stringify(value) + ";" + expires + ";path=/";
}

function getCookie(name) {
    const cookieName = name + "=";
    const cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(cookieName) === 0) {
            return JSON.parse(cookie.substring(cookieName.length));
        }
    }
    return null;
}

// Class Management
class Class {
    constructor(name) {
        this.name = name;
        this.q1pa = [];
        this.q2pa = [];
        this.q3pa = [];
        this.q4pa = [];
        this.q1sa = [];
        this.q2sa = [];
        this.q3sa = [];
        this.q4sa = [];
        this.midterm = null;
        this.finals = null;
        this.q1f = null;
        this.q2f = null;
        this.q3f = null;
        this.q4f = null;
        this.s1f = null;
        this.s2f = null;
        this.final = null;
    }

    restore(data) {
        Object.keys(data).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        });
    }

    addGrade(quarter, type, grade) {
        var g = grade;
        if(isNaN(g)) {g = convertToNum(g)}
        if (g < 0 || g > 12) return;
        this[`q${quarter}${type}`].push(grade);
        this.calculateQuarterGrade(quarter);
        this.calculateSemesters();
    }

    removeGrade(quarter, type, index) {
        this[`q${quarter}${type}`].splice(index, 1);
        this.calculateQuarterGrade(quarter);
        this.calculateSemesters();
    }

    calculateQuarterGrade(quarter) {
        const pa = this[`q${quarter}pa`] || [];
        const sa = this[`q${quarter}sa`] || [];

        const paAvg = pa.length ? pa.reduce((a, b) => a + b, 0) / pa.length : 0;
        const saAvg = sa.length ? sa.reduce((a, b) => a + b, 0) / sa.length : 0;

        if (pa.length > 0 && sa.length > 0) {
            this[`q${quarter}f`] = (paAvg * 0.45 + saAvg * 0.55).toFixed(1);
        } else if (pa.length === 0 && sa.length > 0) {
            this[`q${quarter}f`] = saAvg.toFixed(1);
        } else if (pa.length > 0 && sa.length === 0) {
            this[`q${quarter}f`] = paAvg.toFixed(1);
        }
    }

    setMidterm(grade) {

        if (grade < 1 || grade > 12) return;
        this.midterm = grade;
        this.calculateSemesters();
    }

    setFinalTest(grade) {
        if (grade < 1 || grade > 12) return;
        this.finals = grade;
        this.calculateSemesters();
    }

    calculateSemesters() {
        // Semester 1 Calculation
        if(this.midterm > 0) {
          const s1 = (
              (Number(this.q1f || 0) * 0.4) +
              (Number(this.q2f || 0) * 0.4) +
              (Number(this.midterm || 0) * 0.2)
          ).toFixed(1);
          this.s1f = s1 > 0 ? s1 : null;
        } else {
          const s1 = (
              (Number(this.q1f || 0) * 0.5) +
              (Number(this.q2f || 0) * 0.5)
          ).toFixed(1);
          this.s1f = s1 > 0 ? s1 : null;
        }
        // Semester 2 Calculation
        if(this.final > 0){
          const s2 = (
              (Number(this.q3f || 0) * 0.4) +
              (Number(this.q4f || 0) * 0.4) +
              (Number(this.finals || 0) * 0.2)
          ).toFixed(1);
          this.s2f = s2 > 0 ? s2 : null;
        } else {
          const s2 = (
              (Number(this.q3f || 0) * 0.5) +
              (Number(this.q4f || 0) * 0.5)
          ).toFixed(1);
          this.s2f = s2 > 0 ? s2 : null;
        }
        // Final Grade Calculation
        this.final = [this.s1f, this.s2f].every(v => v) 
            ? ((Number(this.s1f) + Number(this.s2f)) / 2).toFixed(1)
            : null;
    }
}

function removeCurrentClass() {
  const className = getSelectedClass();
  if (!className || !confirm(`Are you sure you want to delete ${className}?`)) return;

  // Remove from classes array
  classes = classes.filter(c => c !== className);
  
  // Remove from classObjects
  delete classObjects[className];
  
  // Update dropdown
  updateClassDropdown();
  
  // Clear current view if no classes left
  if (classes.length > 0) {
    viewClass(classes[0]);
  } else {
    // Clear all displayed data
    for (let i = 1; i <= 4; i++) {
      document.getElementById(`q${i}f`).textContent = '-';
      document.getElementById(`q${i}pa`).innerHTML = '';
      document.getElementById(`q${i}sa`).innerHTML = '';
    }
    document.getElementById("m").textContent = '-';
    document.getElementById("finals").textContent = '-';
    document.getElementById("s1f").textContent = '-';
    document.getElementById("s2f").textContent = '-';
    document.getElementById("final").textContent = '-';
  }
  
  saveAllData();
}

let classes = [];
const classObjects = {};

// Data Persistence Functions
function saveAllData() {
    const savedData = {
        classes: classes,
        classObjects: {}
    };

    for (const className in classObjects) {
        savedData.classObjects[className] = { ...classObjects[className] };
    }

    setCookie('gradeTrackerData', savedData, 90);
}

function loadAllData() {
    const savedData = getCookie('gradeTrackerData');
    if (savedData) {
        classes = savedData.classes;
        for (const className in savedData.classObjects) {
            const newClass = new Class(className);
            newClass.restore(savedData.classObjects[className]);
            classObjects[className] = newClass;
        }
        updateClassDropdown();
        if (classes.length > 0) viewClass(classes[0]);
    }
}

function updateClassDropdown() {
  const classList = document.getElementById('classList');
  const previousSelection = classList.value;
  
  classList.innerHTML = '';
  classes.forEach(className => {
    const option = document.createElement('option');
    option.value = className;
    option.textContent = className;
    option.selected = (className === previousSelection);
    classList.appendChild(option);
  });
  
  // If previous selection was removed, select first item
  if (!classes.includes(previousSelection) && classes.length > 0) {
    classList.value = classes[0];
  }
}
// UI Functions
function addClass(name) {
    if (!name) return;
    if (classes.includes(name)) {
    alert("Class already exists!");
    return;
    }
    document.getElementById("classInput").value = ""; 
    classes.push(name);
    const newOption = document.createElement("option");
    newOption.value = name;
    newOption.textContent = name;
    document.getElementById("classList").appendChild(newOption);
    classObjects[name] = new Class(name);
    viewClass(name);
    document.getElementById("classList").value = name;
    saveAllData();
}

function viewClass(name) {
    const cls = classObjects[name];
    if (!cls) return;

    for (let i = 1; i <= 4; i++) {
        updateGradeList(`q${i}pa`, cls[`q${i}pa`], i, 'pa');
        updateGradeList(`q${i}sa`, cls[`q${i}sa`], i, 'sa');
        const qGrade = cls[`q${i}f`];
        const qGradeNumber = parseFloat(qGrade);
        const qDisplay = qGrade ? `${qGrade} (${convertToLetter(qGradeNumber)})` : '-';
        document.getElementById(`q${i}f`).textContent = qDisplay;
    }

    const midtermGrade = cls.midterm;
    const midtermDisplay = midtermGrade !== null ? `${midtermGrade} (${convertToLetter(midtermGrade)})` : '-';
    document.getElementById("m").textContent = midtermDisplay;

    const finalsGrade = cls.finals;
    const finalsDisplay = finalsGrade !== null ? `${finalsGrade} (${convertToLetter(finalsGrade)})` : '-';
    document.getElementById("finals").textContent = finalsDisplay;

    const s1fGrade = cls.s1f;
    const s1fDisplay = s1fGrade ? `${s1fGrade} (${convertToLetter(parseFloat(s1fGrade))})` : '-';
    document.getElementById("s1f").textContent = s1fDisplay;

    const s2fGrade = cls.s2f;
    const s2fDisplay = s2fGrade ? `${s2fGrade} (${convertToLetter(parseFloat(s2fGrade))})` : '-';
    document.getElementById("s2f").textContent = s2fDisplay;

    const finalGrade = cls.final;
    const finalDisplay = finalGrade ? `${finalGrade} (${convertToLetter(parseFloat(finalGrade))})` : '-';
    document.getElementById("final").textContent = finalDisplay;
}


function updateGradeList(elementId, grades, quarter, type) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    grades.forEach((grade, index) => {
        const div = document.createElement('div');
        div.className = 'grade-item';
        div.innerHTML = `${grade} (${convertToLetter(grade)})<span class="remove-btn" onclick="removeGrade(${quarter}, '${type}', ${index})">×</span>`;
        container.appendChild(div);
    });
}

function getSelectedClass() {
    return document.getElementById("classList").value;
}

// Grade Management Functions
function addPA(quarter) {
    const className = getSelectedClass();
    const input = document.getElementById(`q${quarter}paInput`);
    if(isNaN(input.value)) {input.value = convertToNum(input.value)}
    if (!className || !input.value) return;
    classObjects[className].addGrade(quarter, 'pa', Number(input.value));
    input.value = "";
    viewClass(className);
    saveAllData();
}

function addSA(quarter) {
    const className = getSelectedClass();
    const input = document.getElementById(`q${quarter}saInput`);
    if (!className || !input.value) return;
    if(isNaN(input.value)) {input.value = convertToNum(input.value)}
    classObjects[className].addGrade(quarter, 'sa', Number(input.value));
    input.value = "";
    viewClass(className);
    saveAllData();
}

function removeGrade(quarter, type, index) {
    const className = getSelectedClass();
    classObjects[className].removeGrade(quarter, type, index);
    viewClass(className);
    saveAllData();
}

function setMidtermGrade() {
    const className = getSelectedClass();
    const input = document.getElementById("mInput");
    if (!className || !input.value) return;
    if(isNaN(input.value)) {input.value = convertToNum(input.value)}
    classObjects[className].setMidterm(Number(input.value));
    input.value = "";
    viewClass(className);
    saveAllData();
}

function setTestGrade() {
    const className = getSelectedClass();
    const input = document.getElementById("fInput");
    if (!className || !input.value) return;
    if(isNaN(input.value)) {input.value = convertToNum(input.value)}
    classObjects[className].setFinalTest(Number(input.value));
    input.value = "";
    viewClass(className);
    saveAllData();
}

function convertToNum(letter) {
    if(letter == "A+" || letter == "a+") return 12;
    if(letter == "A" || letter == "a") return 11;
    if(letter == "A-" || letter == "a-") return 10;
    if(letter == "B+" || letter == "b+") return 9;
    if(letter == "B" || letter == "b") return 8;
    if(letter == "B-" || letter == "b-") return 7;
    if(letter == "C+" || letter == "c+") return 6;
    if(letter == "C" || letter == "c") return 5;
    if(letter == "C-" || letter == "c-") return 4;
    if(letter == "F+" || letter == "f+") return 3;
    if(letter == "F" || letter == "f") return 2;
    if(letter == "F-" || letter == "f-") return 1;
    return 0;
}

function convertToLetter(num) {
    if(num >= 11.5) return "A+";
    if(num >= 10.5) return "A";
    if(num >= 9.5) return "A-";
    if(num >= 8.5) return "B+";
    if(num >= 7.5) return "B";
    if(num >= 6.5) return "B-";
    if(num >= 5.5) return "C+";
    if(num >= 4.5) return "C";
    if(num >= 3.5) return "C-";
    if(num >= 2.5) return "F+";
    if(num >= 1.5) return "F";
    if(num > 0)return "F-";
    return 0;
}

function parsePastedGrades() {
    const text = document.getElementById('pasteArea').value;
    const className = getSelectedClass();
    if (!className) return;

    // Updated regex to capture quarter numbers
    const gradeRegex = /(\b0?\.?(45|55)\b|\b(45|55)\.?0?\b)[\s\t]+([1-4])[\s\t]+([A-Fa-f][+-]?)/gi;
    let matches;
    let addedCount = 0;

    while ((matches = gradeRegex.exec(text)) !== null) {
        const [_, weight, , , quarter, grade] = matches;
        const numericWeight = parseFloat(weight.replace(/^0?\.?/, ''));
        const numericGrade = convertToNum(grade.toUpperCase());
        const normalizedWeight = numericWeight === 55 ? '0.55' : '0.45';

        if (quarter >= 1 && quarter <= 4) {
            classObjects[className].addGrade(quarter, normalizedWeight === '0.45' ? 'pa' : 'sa', numericGrade);
            addedCount++;
        }
    }

    if (addedCount > 0) {
        viewClass(className);
        saveAllData();
        alert(`Added ${addedCount} grades across quarters!`);
        document.getElementById('pasteArea').value = '';
    } else {
        alert('No valid grades found! Required format: "[weight] [quarter] [grade]"');
    }
}

function scrollToDemo() {
  const demoSection = document.getElementById('demoVideo');
  demoSection.scrollIntoView({ behavior: 'smooth' });
}

// -------------------------
// TAB SWITCHING FUNCTIONS
// -------------------------
function showGradeTab() {
  document.getElementById('gradeTab').style.display = 'block';
  document.getElementById('scheduleTab').style.display = 'none';
}

function showScheduleTab() {
  document.getElementById('gradeTab').style.display = 'none';
  document.getElementById('scheduleTab').style.display = 'block';
  updateScheduleTab();
}

// -------------------------
// SCHEDULE CONFIGURATION
// -------------------------

// The holiday dates (month/day format) to skip (adjust the format to match Date comparisons)

// Global variable to track delay setting ("none", "1hr", or "2hr")

const holidays = [
  "11/04/2024", "11/05/2024", "11/11/2024", "11/28/2024", "11/29/2024",
  "12/11/2024", "12/23/2024", "12/24/2024", "12/25/2024", "12/26/2024",
  "12/27/2024", "12/30/2024", "12/31/2024",
  "01/01/2025", "01/10/2025", "01/20/2025", "01/27/2025", "01/28/2025",
  "01/29/2025", "01/30/2025", "02/17/2025", "02/18/2025", "02/19/2025",
  "04/01/2025", "04/14/2025", "04/15/2025", "04/16/2025", "04/17/2025",
  "04/18/2025", "05/26/2025"
];

// Letter day schedule mappings
const letterDaySchedules = {
  "A": ["A1", "A2", "A3", "A4", "A5"],
  "B": ["A6", "A7", "A1", "A2", "A3"],
  "C": ["A4", "A5", "A6", "A7", "A1"],
  "D": ["A2", "A3", "A4", "A5", "A6"],
  "E": ["A7", "A1", "A2", "A3", "A4"],
  "F": ["A5", "A6", "A7", "A1", "A2"],
  "G": ["A3", "A4", "A5", "A6", "A7"]
};

function formatTimeLeft(ms) {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const secondsStr = seconds < 10 ? "0" + seconds : seconds;
  
  if (hours > 0) {
    return `${hours} hour(s) ${minutes} minute(s) ${secondsStr} second(s)`;
  } else {
    return `${minutes} minute(s) ${secondsStr} second(s)`;
  }
}


// The rotation order starting with D day on 10/31/24
const letterCycle = ["D", "E", "F", "G", "A", "B", "C"];

let currentDelay = "none";

// School period times for Mon, Tue, Thu, Fri
const scheduleMonTueThuFri = [
  { name: "Period 1", start: "07:15", end: "08:15" },
  { name: "Period 2", start: "08:20", end: "09:20" },
  { name: "Flex Block", start: "09:25", end: "09:55" },
  { name: "Period 3", start: "10:00", end: "11:00" },
  { name: "Period 4", start: "11:05", end: "12:40" },
  { name: "Period 5", start: "12:45", end: "13:45" }
];

// Wednesday schedule
const scheduleWed = [
  { name: "Period 1", start: "07:15", end: "08:05" },
  { name: "Period 2", start: "08:10", end: "09:00" },
  { name: "Flex Block", start: "09:05", end: "09:20" },
  { name: "Period 3", start: "09:25", end: "10:15" },
  { name: "Period 4", start: "10:20", end: "11:55" },
  { name: "Period 5", start: "12:00", end: "12:45" }
];

const oneHourDelaySchedule = [
  { name: "Period 1", start: "08:15", end: "09:10" },  // 55 minutes
  { name: "Period 2", start: "09:15", end: "10:10" },  // 55 minutes
  { name: "Period 3", start: "10:15", end: "11:10" },  // 55 minutes
  { name: "Period 4", start: "11:14", end: "12:46" },  // (duration as given)
  { name: "Period 5", start: "12:50", end: "13:45" }   // 55 minutes
];

// Two Hour Delay Schedule (no Flex Block, five periods)
const twoHourDelaySchedule = [
  { name: "Period 1", start: "09:15", end: "09:55" },  // 45 minutes
  { name: "Period 2", start: "09:55", end: "10:40" },  // 45 minutes
  { name: "Period 3", start: "10:45", end: "11:26" },  // 41 minutes
  { name: "Period 4", start: "11:26", end: "13:01" },  // 11:26 - 1:01 (13:01)
  { name: "Period 5", start: "13:05", end: "13:45" }   // 1:05 - 1:45 (40 minutes)
];

// Reference school day: 10/31/2024 is a D day.
const referenceDate = new Date("2024-10-31");

// -------------------------
// SCHEDULE HELPER FUNCTIONS
// -------------------------

// Returns true if the given date (a Date object) is a school day.

function setDelay(delaySetting) {
  currentDelay = delaySetting;
  updateScheduleTab(); // Refresh the schedule display
}

function isSchoolDay(date) {
  // Skip weekends
  const day = date.getDay();
  if (day === 0 || day === 6) return false; // Sunday = 0, Saturday = 6

  // Format the date as MM/DD/YYYY for comparison
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const dayStr = date.getDate().toString().padStart(2, "0");
  const formatted = `${month}/${dayStr}/${date.getFullYear()}`;
  if (holidays.includes(formatted)) return false;

  return true;
}

// Returns the number of school days between referenceDate and the given date.
// (If the given date is before the reference, this function returns a negative number.)
function countSchoolDays(fromDate, toDate) {
  let count = 0;
  let current = new Date(fromDate);
  // Start counting from the next day (i.e. do not count the reference day)
  current.setDate(current.getDate() + 1);
  const increment = fromDate <= toDate ? 1 : -1;
  
  while (increment > 0 ? current <= toDate : current >= toDate) {
    if (isSchoolDay(current)) {
      count += increment;
    }
    current.setDate(current.getDate() + increment);
  }
  return count;
}

// Given a date, return the letter day (a string) based on the rotation.
function getLetterDay(date) {
  if (!isSchoolDay(date)) return "No School";
  // Count school days from the reference (inclusive of the reference date)
  const daysDiff = countSchoolDays(referenceDate, date);
  // The reference day (10/31/24) is index 0 in our letterCycle ("D")
  const index = ((daysDiff % letterCycle.length) + letterCycle.length) % letterCycle.length;
  return letterCycle[index];
}


// Returns the schedule (array of period objects) for the given date.
// (If it’s not a school day, returns null.)
function getDailySchedule(date) {
  if (!isSchoolDay(date)) return null;
  
  // If a delay is set, use the alternative schedule arrays.
  if (currentDelay === "1hr") {
    return oneHourDelaySchedule;
  } else if (currentDelay === "2hr") {
    return twoHourDelaySchedule;
  } else {
    // Otherwise, return the normal schedule.
    // (For Wednesday, use scheduleWed; otherwise scheduleMonTueThuFri.)
    return (date.getDay() === 3) ? scheduleWed : scheduleMonTueThuFri;
  }
}

// Converts a time string "HH:MM" into a Date object for the provided date.
function timeStringToDate(date, timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// Given the current time and a daily schedule, determine the current period (if any).
// Returns an object with period info and time remaining (in minutes) for the current period and day.
function getCurrentPeriodInfo(date) {
  const schedule = getDailySchedule(date);
  if (!schedule) return null;

  const now = new Date();
  let currentPeriod = null;
  let timeLeftInPeriodMs = 0;
  
  for (let i = 0; i < schedule.length; i++) {
    const period = schedule[i];
    const startTime = timeStringToDate(date, period.start);
    const endTime = timeStringToDate(date, period.end);
    if (now >= startTime && now <= endTime) {
      currentPeriod = {
        index: i,
        name: period.name,
        start: startTime,
        end: endTime
      };
      timeLeftInPeriodMs = endTime - now;
      break;
    }
  }
  
  const lastPeriod = schedule[schedule.length - 1];
  const lastPeriodEnd = timeStringToDate(date, lastPeriod.end);
  const timeLeftInDayMs = now < lastPeriodEnd ? (lastPeriodEnd - now) : 0;

  return {
    currentPeriod,
    timeLeftInPeriodMs,
    timeLeftInDayMs
  };
}

function getTransitionInfo(date) {
  const schedule = getDailySchedule(date);
  if (!schedule) return null;
  const now = new Date();
  
  // Loop over each adjacent pair in the schedule.
  for (let i = 0; i < schedule.length - 1; i++) {
    const endTime = timeStringToDate(date, schedule[i].end);
    const nextStart = timeStringToDate(date, schedule[i+1].start);
    if (now > endTime && now < nextStart) {
      // Found a gap between schedule[i] and schedule[i+1].
      let prevLetter = "";
      let nextLetter = "";
      const letterDay = getLetterDay(date);
      
      if (currentDelay !== "none") {
        // For delay schedules, mapping is direct.
        prevLetter = letterDaySchedules[letterDay][i];
        nextLetter = letterDaySchedules[letterDay][i+1];
      } else {
        // For the normal schedule, we want to ignore the Flex Block.
        // Define a mapping from schedule indices to letter day indices.
        const mapping = { 0: 0, 1: 1, 3: 2, 4: 3, 5: 4 };
        // Determine effective indices:
        // If the gap is adjacent to the Flex Block, adjust:
        // Example: gap between period 2 (index 1) and Flex Block (index 2) or between Flex Block (index 2) and period 3 (index 3).
        let effectivePrevIndex, effectiveNextIndex;
        if (schedule[i].name === "Flex Block") {
          // If the earlier period is Flex Block, use period 2 instead.
          effectivePrevIndex = mapping[1];
        } else {
          effectivePrevIndex = mapping[i] !== undefined ? mapping[i] : null;
        }
        if (schedule[i+1].name === "Flex Block") {
          // If the later period is Flex Block, use period 3 instead.
          effectiveNextIndex = mapping[3];
        } else {
          effectiveNextIndex = mapping[i+1] !== undefined ? mapping[i+1] : null;
        }
        if (effectivePrevIndex !== null) {
          prevLetter = letterDaySchedules[letterDay][effectivePrevIndex];
        }
        if (effectiveNextIndex !== null) {
          nextLetter = letterDaySchedules[letterDay][effectiveNextIndex];
        }
      }
      
      return {
        gap: true,
        prevPeriod: schedule[i],
        nextPeriod: schedule[i+1],
        prevLetter: prevLetter,
        nextLetter: nextLetter,
        timeUntilNextMs: nextStart - now
      };
    }
  }
  return null;
}

// -------------------------
// UPDATE SCHEDULE TAB UI
// -------------------------

function updateScheduleTab() {
  const now = new Date();
  const letterDay = getLetterDay(now);
  const schedule = getDailySchedule(now);
  
  const letterDayDisplay = document.getElementById("letterDayDisplay");
  const scheduleTypeDisplay = document.getElementById("scheduleTypeDisplay");
  const currentPeriodDisplay = document.getElementById("currentPeriodDisplay");
  const timeRemainingDisplay = document.getElementById("timeRemainingDisplay");
  const dayRemainingDisplay = document.getElementById("dayRemainingDisplay");
  
  if (!schedule) {
    letterDayDisplay.textContent = "No school today.";
    currentPeriodDisplay.textContent = "";
    timeRemainingDisplay.textContent = "";
    dayRemainingDisplay.textContent = "";
    scheduleTypeDisplay.textContent = "";
    return;
  }
  
  letterDayDisplay.textContent = "Letter Day: " + letterDay;
  
  let scheduleTypeText = "Normal Schedule";
  if (currentDelay === "1hr") {
    scheduleTypeText = "One Hour Delay";
  } else if (currentDelay === "2hr") {
    scheduleTypeText = "Two Hour Delay";
  }
  scheduleTypeDisplay.textContent = "Schedule Type: " + scheduleTypeText;
  
  const periodInfo = getCurrentPeriodInfo(now);
  
  if (periodInfo && periodInfo.currentPeriod) {
    // We are inside a period.
    let className = "";
    if (currentDelay === "none") {
      // For normal schedules, adjust for Flex Block.
      if (periodInfo.currentPeriod.index === 2) {
        className = "Flex Block (no class)";
      } else {
        // Use a mapping: schedule index 0 → letter day index 0, 1 → index 1, 3 → index 2, 4 → index 3, 5 → index 4.
        const mapping = {0: 0, 1: 1, 3: 2, 4: 3, 5: 4};
        const effectiveIndex = mapping[periodInfo.currentPeriod.index];
        className = letterDaySchedules[letterDay][effectiveIndex];
      }
    } else {
      // For delay schedules, mapping is direct.
      className = letterDaySchedules[letterDay][periodInfo.currentPeriod.index];
    }
    
    currentPeriodDisplay.textContent = "Current Period: " +
      periodInfo.currentPeriod.name +
      (className ? " – Class: " + className : "");
    timeRemainingDisplay.textContent = "Time remaining in period: " +
      formatTimeLeft(periodInfo.timeLeftInPeriodMs);
    dayRemainingDisplay.textContent = "Time remaining in school day: " +
      formatTimeLeft(periodInfo.timeLeftInDayMs);
      
  } else {
    // No period is active. Check if we are in a gap between periods.
    const transitionInfo = getTransitionInfo(now);
    if (transitionInfo) {
      currentPeriodDisplay.textContent = "Class transitioning time from " +
        transitionInfo.prevLetter + " to " + transitionInfo.nextLetter;
      timeRemainingDisplay.textContent = "Time until next period: " +
        formatTimeLeft(transitionInfo.timeUntilNextMs);
      // Optionally, you might clear the "day remaining" message or show the full day countdown.
      dayRemainingDisplay.textContent = "";
    } else {
      currentPeriodDisplay.textContent = "No class is currently in session.";
      timeRemainingDisplay.textContent = "";
      dayRemainingDisplay.textContent = "";
    }
  }
}

// (Optional) Refresh the schedule info every minute.
setInterval(function(){
  if(document.getElementById("scheduleTab").style.display !== "none"){
    updateScheduleTab();
  }
}, 1000);


// Initialize App
initializeTheme();
loadAllData();
