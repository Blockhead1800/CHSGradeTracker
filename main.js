// =========================
// GLOBAL STATE
// =========================
let classesData = [];
// The index (in classesData) of the currently open class in the grade tracker.
let currentClassIndex = null;

document.addEventListener("DOMContentLoaded", () => {
  updateScheduleTab();
});

// =========================
// THEME & COOKIE FUNCTIONS
// =========================
function scrollToDemo() {
  // Switch to the Classes tab
  showClassesTab();

  // Wait a short time for the classes tab to be visible, then scroll.
  setTimeout(() => {
    const demoVideo = document.getElementById("demoVideo");
    if (demoVideo) {
      demoVideo.scrollIntoView({ behavior: "smooth" });
    }
  }, 300);
}

function toggleTheme() {
  const html = document.documentElement;
  const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '🌞' : '🌙';
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
}

function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + JSON.stringify(value) + ";" + expires + ";path=/";
}

function getCookie(name) {
  const cookieName = name + "=";
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(cookieName) === 0) {
      return JSON.parse(cookie.substring(cookieName.length));
    }
  }
  return null;
}

// =========================
// GRADE TRACKER DATA MODEL
// =========================
class GradeData {
  constructor() {
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
    Object.assign(this, data);
  }
  addGrade(quarter, type, grade) {
    let g = grade;
    if (isNaN(g)) {
      g = convertToNum(g);
    }
    if (g < 0 || g > 12) return;
    this[`q${quarter}${type}`].push(g); // Push the numeric value
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
    if (this.midterm > 0) {
      const s1 = (
        Number(this.q1f || 0) * 0.4 +
        Number(this.q2f || 0) * 0.4 +
        Number(this.midterm || 0) * 0.2
      ).toFixed(1);
      this.s1f = s1 > 0 ? s1 : null;
    } else {
      const s1 = (
        Number(this.q1f || 0) * 0.5 +
        Number(this.q2f || 0) * 0.5
      ).toFixed(1);
      this.s1f = s1 > 0 ? s1 : null;
    }
    // Semester 2 Calculation
    if (this.finals > 0) {
      const s2 = (
        Number(this.q3f || 0) * 0.4 +
        Number(this.q4f || 0) * 0.4 +
        Number(this.finals || 0) * 0.2
      ).toFixed(1);
      this.s2f = s2 > 0 ? s2 : null;
    } else {
      const s2 = (
        Number(this.q3f || 0) * 0.5 +
        Number(this.q4f || 0) * 0.5
      ).toFixed(1);
      this.s2f = s2 > 0 ? s2 : null;
    }
    // Final Course Grade
    this.final = (this.s1f && this.s2f)
      ? ((Number(this.s1f) + Number(this.s2f)) / 2).toFixed(1)
      : null;
  }
}

// =========================
// UTILITY FUNCTIONS FOR GRADES
// =========================
function convertToNum(letter) {
  const l = letter.toUpperCase();
  if (l === "A+") return 12;
  if (l === "A") return 11;
  if (l === "A-") return 10;
  if (l === "B+") return 9;
  if (l === "B") return 8;
  if (l === "B-") return 7;
  if (l === "C+") return 6;
  if (l === "C") return 5;
  if (l === "C-") return 4;
  if (l === "F+") return 3;
  if (l === "F") return 2;
  if (l === "F-") return 1;
  return 0;
}

function convertToLetter(num) {
  if (num >= 11.5) return "A+";
  if (num >= 10.5) return "A";
  if (num >= 9.5) return "A-";
  if (num >= 8.5) return "B+";
  if (num >= 7.5) return "B";
  if (num >= 6.5) return "B-";
  if (num >= 5.5) return "C+";
  if (num >= 4.5) return "C";
  if (num >= 3.5) return "C-";
  if (num >= 2.5) return "F+";
  if (num >= 1.5) return "F";
  if (num > 0) return "F-";
  return "";
}

// =========================
// PERSISTENCE: SAVE & LOAD
// =========================
function saveAllData() {
  const savedData = {
    classesData: classesData,
    currentClassIndex: currentClassIndex
  };
  setCookie('gradeTrackerData', savedData, 90);
}

function loadAllData() {
  const savedData = getCookie('gradeTrackerData');
  if (savedData) {
    classesData = savedData.classesData || [];
    currentClassIndex = savedData.currentClassIndex;

    // Re-establish GradeData methods by re-creating instances
    classesData.forEach(cls => {
      if (!cls.hasOwnProperty('lunch')) {
        cls.lunch = "1"; // Default to 1st lunch
      }
      if (cls.gradeData) {
        const gd = new GradeData();
        gd.restore(cls.gradeData);
        cls.gradeData = gd;
      } else {
        cls.gradeData = new GradeData();
      }
    });

    populateClassDropdown();
    renderClassesPage();
    if (currentClassIndex !== null && classesData[currentClassIndex]) {
      renderGradeTracker();
    }
  }
}

function clearGradeTracker() {
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`q${i}pa`).innerHTML = "";
    document.getElementById(`q${i}sa`).innerHTML = "";
    document.getElementById(`q${i}f`).textContent = "-";
  }
  document.getElementById("m").textContent = "-";
  document.getElementById("finals").textContent = "-";
  document.getElementById("s1f").textContent = "-";
  document.getElementById("s2f").textContent = "-";
  document.getElementById("final").textContent = "-";
}

// =========================
// CLASSES PAGE RENDERING & HANDLERS
// =========================
function renderClassesPage() {
  populateClassDropdown();
  const container = document.getElementById('classesContainer');
  container.innerHTML = "";
  classesData.forEach((cls, index) => {
    const row = document.createElement('div');
    row.className = 'class-row';
    row.style.marginBottom = '10px';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '10px';

    // Name input
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Class Name';
    nameInput.style.flex = '1';
    nameInput.value = cls.name;
    nameInput.addEventListener('change', () => {
      classesData[index].name = nameInput.value.trim();
      renderClassesPage();
      saveAllData();
    });

    // Room input
    const roomInput = document.createElement('input');
    roomInput.type = 'text';
    roomInput.placeholder = 'Room Number';
    roomInput.style.flex = '1';
    roomInput.value = cls.room;
    roomInput.addEventListener('change', () => {
      classesData[index].room = roomInput.value.trim();
      saveAllData();
    });

    // Period Option dropdown
    const periodSelect = document.createElement('select');
    ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'N/A'].forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      periodSelect.appendChild(option);
    });
    periodSelect.value = cls.periodOption;
    periodSelect.addEventListener('change', () => {
      classesData[index].periodOption = periodSelect.value;
      saveAllData();
    });

    const lunchSelect = document.createElement('select');
    ["1", "2", "3", "4"].forEach(num => {
      const option = document.createElement('option');
      option.value = num;
      option.textContent = num + (num === "1" ? "st" : num === "2" ? "nd" : num === "3" ? "rd" : "th") + " Lunch";
      lunchSelect.appendChild(option);
    });
    lunchSelect.value = cls.lunch || "1"; // default to 1 if not set
    lunchSelect.addEventListener('change', () => {
      classesData[index].lunch = lunchSelect.value;
      saveAllData();
      if (document.getElementById('scheduleTab').style.display === 'block') {
        updateScheduleTab();
      }
    });


    // Grades button
    const gradesButton = document.createElement('button');
    gradesButton.textContent = 'Grades';
    gradesButton.addEventListener('click', () => {
      currentClassIndex = index;
      showGradeTab();      // This will repopulate the dropdown.
      renderGradeTracker(); // And then render the grades for the selected class.
      saveAllData();
    });

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '🗑️';
    deleteButton.addEventListener('click', () => {
      if (confirm(`Delete class "${classesData[index].name}"?`)) {
        // Remove the class from the data array.
        classesData.splice(index, 1);

        // If the deleted class is the one being viewed...
        if (currentClassIndex === index) {
          if (classesData.length > 0) {
            // If there is at least one class left, select the first one.
            currentClassIndex = 0;
            renderGradeTracker();
          } else {
            // No classes remain, so clear the tracker.
            currentClassIndex = null;
            clearGradeTracker();
          }
          // Optionally, switch to the classes tab so the user sees the updated list.
          showClassesTab();
        } else if (currentClassIndex > index) {
          // If the deleted class is before the current one, adjust the index.
          currentClassIndex--;
        }

        renderClassesPage();
        saveAllData();
      }
    });

    // Append all elements to the row.
    row.appendChild(nameInput);
    row.appendChild(roomInput);
    row.appendChild(periodSelect);
    row.appendChild(lunchSelect);
    row.appendChild(gradesButton);
    row.appendChild(deleteButton);

    container.appendChild(row);
  });
}

// Updated function name to match the HTML button.
function addNewClass() {
  // Create a new class with blank values and a new GradeData instance.
  classesData.push({
    name: "",
    room: "",
    type: "Full Year Class",
    periodOption: "A1",
    gradeData: new GradeData()
  });
  renderClassesPage();
  saveAllData();
}

// =========================
// GRADE TRACKER RENDERING & HANDLERS
// =========================
function renderGradeTracker() {
  if (currentClassIndex === null || !classesData[currentClassIndex]) return;
  const gradeData = classesData[currentClassIndex].gradeData;
  // For each quarter display, update the corresponding element.
  for (let i = 1; i <= 4; i++) {
    updateGradeList(`q${i}pa`, gradeData[`q${i}pa`], i, 'pa');
    updateGradeList(`q${i}sa`, gradeData[`q${i}sa`], i, 'sa');
    const qGrade = gradeData[`q${i}f`];
    const qDisplay = qGrade ? `${qGrade} (${convertToLetter(parseFloat(qGrade))})` : '-';
    document.getElementById(`q${i}f`).textContent = qDisplay;
  }
  const mDisplay = gradeData.midterm !== null
    ? `${gradeData.midterm} (${convertToLetter(gradeData.midterm)})`
    : '-';
  document.getElementById("m").textContent = mDisplay;

  const fDisplay = gradeData.finals !== null
    ? `${gradeData.finals} (${convertToLetter(gradeData.finals)})`
    : '-';
  document.getElementById("finals").textContent = fDisplay;

  const s1Display = gradeData.s1f ? `${gradeData.s1f} (${convertToLetter(parseFloat(gradeData.s1f))})` : '-';
  document.getElementById("s1f").textContent = s1Display;

  const s2Display = gradeData.s2f ? `${gradeData.s2f} (${convertToLetter(parseFloat(gradeData.s2f))})` : '-';
  document.getElementById("s2f").textContent = s2Display;

  const finalDisplay = gradeData.final ? `${gradeData.final} (${convertToLetter(parseFloat(gradeData.final))})` : '-';
  document.getElementById("final").textContent = finalDisplay;
}

function updateGradeList(elementId, grades, quarter, type) {
  const container = document.getElementById(elementId);
  container.innerHTML = "";
  grades.forEach((grade, index) => {
    const div = document.createElement('div');
    div.className = 'grade-item';
    div.innerHTML = `${grade} (${convertToLetter(grade)}) <span class="remove-btn" onclick="removeGrade(${quarter}, '${type}', ${index})">×</span>`;
    container.appendChild(div);
  });
}

function addPA(quarter) {
  const input = document.getElementById(`q${quarter}paInput`);
  const val = input.value.trim();
  if (!val) return;
  const num = isNaN(val) ? convertToNum(val) : Number(val);
  classesData[currentClassIndex].gradeData.addGrade(quarter, 'pa', num);
  input.value = "";
  renderGradeTracker();
  saveAllData();
}

function addSA(quarter) {
  const input = document.getElementById(`q${quarter}saInput`);
  const val = input.value.trim();
  if (!val) return;
  const num = isNaN(val) ? convertToNum(val) : Number(val);
  classesData[currentClassIndex].gradeData.addGrade(quarter, 'sa', num);
  input.value = "";
  renderGradeTracker();
  saveAllData();
}

function removeGrade(quarter, type, index) {
  classesData[currentClassIndex].gradeData.removeGrade(quarter, type, index);
  renderGradeTracker();
  saveAllData();
}

function setMidtermGrade() {
  const input = document.getElementById("mInput");
  const val = input.value.trim();
  if (!val) return;
  const num = isNaN(val) ? convertToNum(val) : Number(val);
  classesData[currentClassIndex].gradeData.setMidterm(num);
  input.value = "";
  renderGradeTracker();
  saveAllData();
}

function setTestGrade() {
  const input = document.getElementById("fInput");
  const val = input.value.trim();
  if (!val) return;
  const num = isNaN(val) ? convertToNum(val) : Number(val);
  classesData[currentClassIndex].gradeData.setFinalTest(num);
  input.value = "";
  renderGradeTracker();
  saveAllData();
}

function parsePastedGrades() {
  const text = document.getElementById('pasteArea').value;
  if (!text) return;
  const gradeRegex = /(\b0?\.?(45|55)\b|\b(45|55)\.?0?\b)[\s\t]+([1-4])[\s\t]+([A-Fa-f][+-]?)/gi;
  let matches, addedCount = 0;
  const gradeData = classesData[currentClassIndex].gradeData;
  while ((matches = gradeRegex.exec(text)) !== null) {
    const [_, weight, , , quarter, grade] = matches;
    const numericGrade = convertToNum(grade.toUpperCase());
    // Use weight to decide whether it’s a PA (0.45) or SA (0.55) grade.
    const type = (parseFloat(weight.replace(/^0?\.?/, '')) === 55) ? 'sa' : 'pa';
    gradeData.addGrade(Number(quarter), type, numericGrade);
    addedCount++;
  }
  if (addedCount > 0) {
    renderGradeTracker();
    saveAllData();
    alert(`Added ${addedCount} grade(s)!`);
    document.getElementById('pasteArea').value = '';
  } else {
    alert('No valid grades found! Format: "[weight] [quarter] [grade]"');
  }
}

// =========================
// TAB SWITCHING FUNCTIONS
// =========================
function showClassesTab() {
  document.getElementById('classesTab').style.display = 'block';
  document.getElementById('gradeTab').style.display = 'none';
  document.getElementById('scheduleTab').style.display = 'none';
}

function showGradeTab() {
  // Update the dropdown to reflect the latest classes and currentClassIndex.
  populateClassDropdown();
  // Optionally, if currentClassIndex is still null but there are classes,
  // you might want to auto-select the first one.
  if (currentClassIndex === null && classesData.length > 0) {
    currentClassIndex = 0;
    // Also update the dropdown's value:
    const dropdown = document.getElementById('currentClassList');
    dropdown.value = 0;
  }
  document.getElementById('classesTab').style.display = 'none';
  document.getElementById('gradeTab').style.display = 'block';
  document.getElementById('scheduleTab').style.display = 'none';
}

// -------------------------
// NEW: Populate the Class Dropdown
// -------------------------
function populateClassDropdown() {
  const dropdown = document.getElementById('currentClassList');
  dropdown.innerHTML = "";
  classesData.forEach((cls, index) => {
    const option = document.createElement('option');
    option.value = index;
    // Use the class name if available, otherwise a default name.
    option.textContent = cls.name ? cls.name : `Class ${index + 1}`;
    dropdown.appendChild(option);
  });
  // Set the dropdown to the current class index (if one is set)
  if (currentClassIndex !== null) {
    dropdown.value = currentClassIndex;
  }
}
// -------------------------
// NEW: Function to change the current class via dropdown.
// -------------------------
function viewClass(index) {
  currentClassIndex = parseInt(index);
  // Re-render the grade tracker for the newly selected class.
  renderGradeTracker();
  // (Optionally save the current state if you wish)
  saveAllData();
}

// -------------------------
// INITIALIZATION
// -------------------------
document.addEventListener("DOMContentLoaded", function () {
  initializeTheme();
  loadAllData();
});

// =========================
// SCHEDULE CODE
// =========================
function showScheduleTab() {
  if (currentClassIndex === null && classesData.length > 0) {
    currentClassIndex = 0;
  }
  document.getElementById('gradeTab').style.display = 'none';
  document.getElementById('classesTab').style.display = 'none';
  document.getElementById('scheduleTab').style.display = 'block';
  // Reset to today when opening the schedule tab.
  selectedDate = new Date();
  updateSelectedDateDisplay();
  updateScheduleTab();
}

let selectedDate = new Date();

// Helper: Returns true if the given date is today.
function isToday(date) {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

// Update the header’s date display.
function updateSelectedDateDisplay() {
  const display = document.getElementById("selectedDateDisplay");
  if (isToday(selectedDate)) {
    display.textContent = "Today";
  } else {
    display.textContent = selectedDate.toLocaleDateString();
  }
}

// Called when the left arrow is clicked.
function previousDay() {
  selectedDate.setDate(selectedDate.getDate() - 1);
  updateSelectedDateDisplay();
  updateScheduleTab();
}

// Called when the right arrow is clicked.
function nextDay() {
  selectedDate.setDate(selectedDate.getDate() + 1);
  updateSelectedDateDisplay();
  updateScheduleTab();
}

// Toggles display of the calendar picker.
function toggleCalendar() {
  const datePicker = document.getElementById("datePicker");
  datePicker.style.display = (datePicker.style.display === "none") ? "block" : "none";
}

// Called when a date is picked from the calendar.
function selectDateFromPicker() {
  const datePicker = document.getElementById("datePicker");
  const value = datePicker.value; // in "YYYY-MM-DD" format
  const parts = value.split("-");
  // Note: Months are 0-indexed in JavaScript Date.
  selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
  updateSelectedDateDisplay();
  updateScheduleTab();
  datePicker.style.display = "none";
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
const referenceDate = new Date(2024, 9, 31, 0, 0, 0, 0);

// -------------------------
// LUNCH SCHEDULES
// -------------------------
const lunchScheduleNormal = [
  { lunch: "1st", start: "11:05", end: "11:25" },
  { lunch: "2nd", start: "11:30", end: "11:50" },
  { lunch: "3rd", start: "11:55", end: "12:15" },
  { lunch: "4th", start: "12:20", end: "12:40" }
];

const lunchScheduleWed = [
  { lunch: "1st", start: "10:20", end: "10:40" },
  { lunch: "2nd", start: "10:45", end: "11:05" },
  { lunch: "3rd", start: "11:10", end: "11:30" },
  { lunch: "4th", start: "11:35", end: "11:55" }
];

const lunchScheduleOneHourDelay = [
  { lunch: "1st", start: "11:14", end: "11:34" },
  { lunch: "2nd", start: "11:38", end: "11:58" },
  { lunch: "3rd", start: "12:02", end: "12:22" },
  { lunch: "4th", start: "12:26", end: "12:46" }
];

const lunchScheduleTwoHourDelay = [
  { lunch: "1st", start: "11:30", end: "11:50" },
  { lunch: "2nd", start: "11:54", end: "12:14" },
  { lunch: "3rd", start: "12:17", end: "12:37" },
  { lunch: "4th", start: "12:41", end: "1:01" }
];

// Returns the appropriate lunch schedule array for the given date,
// based on the currentDelay setting and (if no delay) whether it’s Wednesday.
function getLunchSchedule(date) {
  if (currentDelay === "1hr") {
    return lunchScheduleOneHourDelay;
  } else if (currentDelay === "2hr") {
    return lunchScheduleTwoHourDelay;
  } else {
    // Normal schedule (no delay)
    return (date.getDay() === 3) ? lunchScheduleWed : lunchScheduleNormal;
  }
}


// -------------------------
// SCHEDULE HELPER FUNCTIONS
// -------------------------


// Returns true if the given date (a Date object) is a school day.


function setDelay(delaySetting) {
  currentDelay = delaySetting;
  updateScheduleTab(); // Refresh the schedule display
}

function getClassNameByPeriod(letter) {
  for (let cls of classesData) {
    if (cls.periodOption === letter) {
      return cls.name + (cls.room ? ", " + cls.room : "");
    }
  }
  return letter;
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
    const nextStart = timeStringToDate(date, schedule[i + 1].start);
    if (now > endTime && now < nextStart) {
      // Found a gap between schedule[i] and schedule[i+1].
      let prevLetter = "";
      let nextLetter = "";
      const letterDay = getLetterDay(date);

      if (currentDelay !== "none") {
        // For delay schedules, mapping is direct.
        prevLetter = letterDaySchedules[letterDay][i];
        nextLetter = letterDaySchedules[letterDay][i + 1];
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
        if (schedule[i + 1].name === "Flex Block") {
          // If the later period is Flex Block, use period 3 instead.
          effectiveNextIndex = mapping[3];
        } else {
          effectiveNextIndex = mapping[i + 1] !== undefined ? mapping[i + 1] : null;
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
        nextPeriod: schedule[i + 1],
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
  // Use the selectedDate rather than always today.
  const selected = new Date(selectedDate);
  const letterDay = getLetterDay(selected);
  const schedule = getDailySchedule(selected);

  // Get display elements
  const letterDayDisplay = document.getElementById("letterDayDisplay");
  const scheduleTypeDisplay = document.getElementById("scheduleTypeDisplay");
  const currentPeriodDisplay = document.getElementById("currentPeriodDisplay");
  const timeRemainingDisplay = document.getElementById("timeRemainingDisplay");
  const dayRemainingDisplay = document.getElementById("dayRemainingDisplay");
  const nextPeriodDisplay = document.getElementById("nextPeriodDisplay");
  const lunchDisplay = document.getElementById("lunchDisplay");

  // Clear previous content
  letterDayDisplay.textContent = "";
  scheduleTypeDisplay.textContent = "";
  currentPeriodDisplay.textContent = "";
  timeRemainingDisplay.textContent = "";
  dayRemainingDisplay.textContent = "";
  nextPeriodDisplay.textContent = "";
  lunchDisplay.textContent = "";

  if (!schedule) {
    letterDayDisplay.textContent = "No school on " + selected.toLocaleDateString() + ".";
    return;
  }

  const firstPeriodStart = timeStringToDate(selected, schedule[0].start);
  const firstLetter = letterDaySchedules[letterDay][0];
  const firstClassName = getClassNameByPeriod(firstLetter);
  const now = new Date();
  if(now > firstPeriodStart) {
    letterDayDisplay.textContent = "Letter Day: " + letterDay;
  } else {
    letterDayDisplay.textContent = "Letter Day: " + letterDay + ", First Period Class: " + firstLetter + " (" + firstClassName + ")";
  }
  let scheduleTypeText = "Normal Schedule";
  if (currentDelay === "1hr") {
    scheduleTypeText = "One Hour Delay";
  } else if (currentDelay === "2hr") {
    scheduleTypeText = "Two Hour Delay";
  }
  scheduleTypeDisplay.textContent = "Schedule Type: " + scheduleTypeText;

  // If the selected day is today, show live info with countdown timers…
  if (isToday(selected)) {
    const periodInfo = getCurrentPeriodInfo(selected); // Note: getCurrentPeriodInfo uses new Date() for "now"
    if (periodInfo && periodInfo.currentPeriod) {
      // Display current period (or Flex Block if that’s the current period)
      if (periodInfo.currentPeriod.name.toLowerCase() === "flex block") {
        currentPeriodDisplay.textContent = "Flex Block";
      } else {
        let currentLetter = "";
        if (currentDelay === "none") {
          // For normal schedule, adjust for Flex Block (if needed)
          const mapping = { 0: 0, 1: 1, 3: 2, 4: 3, 5: 4 };
          currentLetter = mapping.hasOwnProperty(periodInfo.currentPeriod.index)
            ? letterDaySchedules[letterDay][mapping[periodInfo.currentPeriod.index]]
            : letterDaySchedules[letterDay][periodInfo.currentPeriod.index];
        } else {
          currentLetter = letterDaySchedules[letterDay][periodInfo.currentPeriod.index];
        }
        const currentClassName = getClassNameByPeriod(currentLetter);
        currentPeriodDisplay.textContent = "Current Period: " +
          periodInfo.currentPeriod.name +
          " – Class: " + currentLetter + " (" + currentClassName + ")";
      }

      timeRemainingDisplay.textContent = "Time remaining in period: " +
        formatTimeLeft(periodInfo.timeLeftInPeriodMs);
      dayRemainingDisplay.textContent = "Time remaining in school day: " +
        formatTimeLeft(periodInfo.timeLeftInDayMs);

      // NEXT PERIOD INFO
      // Instead of skipping Flex Block, check if the very next period is Flex Block.
      let nextIndex = periodInfo.currentPeriod.index + 1;
      if (schedule[nextIndex]) {
        const nextPeriod = schedule[nextIndex];
        if (nextPeriod.name.toLowerCase() === "flex block") {
          nextPeriodDisplay.textContent = "Next Period: Flex Block";
        } else {
          let nextLetter = "";
          if (currentDelay === "none") {
            const mapping = { 0: 0, 1: 1, 3: 2, 4: 3, 5: 4 };
            nextLetter = mapping.hasOwnProperty(nextIndex)
              ? letterDaySchedules[letterDay][mapping[nextIndex]]
              : letterDaySchedules[letterDay][nextIndex];
          } else {
            nextLetter = letterDaySchedules[letterDay][nextIndex];
          }
          const nextClassName = getClassNameByPeriod(nextLetter);
          nextPeriodDisplay.textContent = "Next Period: " +
            nextPeriod.name +
            " – Class: " + nextLetter + " (" + nextClassName + ")";
        }
      } else {
        nextPeriodDisplay.textContent = "No Next Period Right Now!";
      }
    } else {
      // Transition period branch
const transitionInfo = getTransitionInfo(selected);
if (transitionInfo) {
  const now = new Date();
  let upcomingPeriod = null;
  for (let i = 0; i < schedule.length; i++) {
    // Use >= so that a period starting "now" is caught.
    const periodStart = timeStringToDate(selected, schedule[i].start);
    if (periodStart >= now) {
      upcomingPeriod = schedule[i];
      break;
    }
  }
  if (upcomingPeriod && upcomingPeriod.name.toLowerCase() === "flex block") {
    currentPeriodDisplay.textContent = "Transitioning to Flex Block";
    nextPeriodDisplay.textContent = "Next Period: Flex Block";
  } else {
    currentPeriodDisplay.textContent = "Transitioning from " +
      transitionInfo.prevLetter + "(" + getClassNameByPeriod(transitionInfo.prevLetter) + ") to " +
      transitionInfo.nextLetter + "(" + getClassNameByPeriod(transitionInfo.nextLetter) + ")";
    if (upcomingPeriod) {
      let nextLetter = "";
      const nextIndex = schedule.indexOf(upcomingPeriod);
      if (currentDelay === "none") {
        const mapping = { 0: 0, 1: 1, 3: 2, 4: 3, 5: 4 };
        nextLetter = mapping.hasOwnProperty(nextIndex)
          ? letterDaySchedules[letterDay][mapping[nextIndex]]
          : letterDaySchedules[letterDay][nextIndex];
      } else {
        nextLetter = letterDaySchedules[letterDay][nextIndex];
      }
      const nextClassName = getClassNameByPeriod(nextLetter);
      nextPeriodDisplay.textContent = "Next Period: " +
        upcomingPeriod.name +
        " – Class: " + nextLetter + " (" + nextClassName + ")";
    } else {
      nextPeriodDisplay.textContent = "No Next Period Right Now!";
    }
  }
  timeRemainingDisplay.textContent = "Time until next period: " +
    formatTimeLeft(transitionInfo.timeUntilNextMs);
} else {
  currentPeriodDisplay.textContent = "No class is currently in session.";
}
    }
  } else {
    // For a day other than today, display a static list of periods (no countdowns)
    let scheduleHTML = "";
    schedule.forEach((period, i) => {
      // If normal schedule and this is the Flex Block, simply show its name and times.
      if (currentDelay === "none" && period.name.toLowerCase() === "flex block") {
        scheduleHTML += `<strong>${period.name}</strong> (${period.start} - ${period.end})<br>`;
      } else {
        let periodLetter = "";
        if (currentDelay === "none") {
          const mapping = { 0: 0, 1: 1, 3: 2, 4: 3, 5: 4 };
          if (mapping.hasOwnProperty(i)) {
            periodLetter = letterDaySchedules[letterDay][mapping[i]];
          } else {
            periodLetter = letterDaySchedules[letterDay][i];
          }
        } else {
          periodLetter = letterDaySchedules[letterDay][i];
        }
        const className = getClassNameByPeriod(periodLetter);
        scheduleHTML += `<strong>${period.name}</strong> (${period.start} - ${period.end}) – Class: ${periodLetter} (${className})<br>`;
      }
    });
    currentPeriodDisplay.innerHTML = scheduleHTML;
    timeRemainingDisplay.textContent = "";
    dayRemainingDisplay.textContent = "";
    nextPeriodDisplay.textContent = "";
  }

  // -----------------
  // LUNCH INFO
  // -----------------
  // Determine which lunch period applies based on letter day
  let lunchA = "";
  if (letterDay == 'A') {
    lunchA = "A4";
  } else if (letterDay == 'B') {
    lunchA = "A2";
  } else if (letterDay == 'C') {
    lunchA = "A7";
  } else if (letterDay == 'D') {
    lunchA = "A5";
  } else if (letterDay == 'E') {
    lunchA = "A3";
  } else if (letterDay == 'F') {
    lunchA = "A1";
  } else if (letterDay == 'G') {
    lunchA = "A6";
  }
  let indexT = -1;
  for (let i = 0; i < classesData.length; i++) {
    if (classesData[i].periodOption === lunchA) {
      indexT = i;
      break;
    }
  }
  let activeClass = classesData[indexT];

  const lunchScheduleArr = getLunchSchedule(selected);
  if (activeClass && activeClass.lunch) {
    const lunchSelection = parseInt(activeClass.lunch); // expected to be 1, 2, 3, or 4
    if (lunchSelection >= 1 && lunchSelection <= lunchScheduleArr.length) {
      const lunchInfo = lunchScheduleArr[lunchSelection - 1];
      if (isToday(selected)) {
        // For today, include countdown info
        const lunchStart = timeStringToDate(selected, lunchInfo.start);
        const timeUntilLunchMs = lunchStart - new Date();
        const formattedTimeUntilLunch = formatTimeLeft(timeUntilLunchMs);
        if (formattedTimeUntilLunch !== "0 minute(s) 00 second(s)") {
          lunchDisplay.innerHTML = "You have " + lunchInfo.lunch +
            " lunch at " + lunchInfo.start + " - " + lunchInfo.end +
            ". " + formattedTimeUntilLunch + " until lunch.";
        }
      } else {
        // For a non-today day, just display the lunch time range.
        lunchDisplay.innerHTML = "Lunch: " + lunchInfo.lunch + " lunch at " +
          lunchInfo.start + " - " + lunchInfo.end;
      }
    }
  } else { 
    lunchDisplay.textContent = "";
  }
}


// (Optional) Refresh the schedule info every minute.
setInterval(function () {
  if (document.getElementById("scheduleTab").style.display !== "none") {
    updateScheduleTab();
  }
}, 1000);

document.addEventListener("DOMContentLoaded", function () {
  // Monitor the paste area.
  const pasteArea = document.getElementById("pasteArea");
  pasteArea.addEventListener("input", function () {
    if (pasteArea.value.trim().toLowerCase() === "tetris") {
      pasteArea.value = ""; // clear the input
      showTetrisOverlay();
    }
  });
});

function showTetrisOverlay() {
  // Check if the overlay exists (even if hidden) and show it.
  let overlay = document.getElementById("tetrisOverlay");
  if (overlay) {
    overlay.style.display = "flex";
  } else {
    // Create the overlay if it doesn't exist.
    overlay = document.createElement("div");
    overlay.id = "tetrisOverlay";
    overlay.innerHTML = `
      <div id="tetrisContainer" style="background: #222; padding: 20px; border-radius: 8px;">
        <canvas id="tetrisCanvas" width="300" height="600" style="background: #000; display: block; margin: 0 auto;"></canvas>
        <div id="scoreDisplay" style="color: white; text-align: center; margin-top: 10px;">Score: 0</div>
        <div id="highScoreDisplay" style="color: white; text-align: center; margin-bottom: 10px;">High Score: 0</div>
        <button id="closeTetrisBtn" style="display: block; margin: 0 auto;">Close</button>
      </div>
    `;
    // Style the overlay to cover the entire window.
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "1000"
    });
    document.body.appendChild(overlay);
  }

  // Start the Tetris game.
  const canvas = document.getElementById("tetrisCanvas");
  const game = new TetrisGame(canvas);
  // Expose game instance globally for beforeunload event.
  window.currentTetrisGame = game;
  // Initialize lastTime to avoid a huge delta in the first frame.
  game.lastTime = performance.now();
  game.update(game.lastTime);

  // Close button: cancel the game loop, save the score, and hide the overlay.
  document.getElementById("closeTetrisBtn").addEventListener("click", function () {
    cancelAnimationFrame(game.animationFrameId);
    document.removeEventListener("keydown", game.keyHandler);
    // Save high score if the current score is greater.
    if (game.score > game.highScore) {
      localStorage.setItem("tetrisHighScore", game.score);
    }
    overlay.style.display = "none";
  });
}

/* ================================
   Tetris Game Implementation
   ================================ */

// Board and block settings.
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // each block is 30x30 pixels

// Tetromino colors (index 0 is unused).
const COLORS = [
  null,
  'cyan',    // I
  'yellow',  // O
  'purple',  // T
  'green',   // S
  'red',     // Z
  'blue',    // J
  'orange'   // L
];

// Tetromino shapes. (Index 0 is unused.)
const SHAPES = [
  [],
  [   // I
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  [   // O
    [2, 2],
    [2, 2]
  ],
  [   // T
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0]
  ],
  [   // S
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0]
  ],
  [   // Z
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0]
  ],
  [   // J
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0]
  ],
  [   // L
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0]
  ]
];

// TetrisGame "class" definition.
function TetrisGame(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext("2d");
  this.board = this.createBoard();
  this.score = 0;
  // Load high score from localStorage (or start at 0).
  this.highScore = parseInt(localStorage.getItem("tetrisHighScore") || "0", 10);
  this.gameOver = false;
  this.dropCounter = 0;
  this.dropInterval = 500; // drop every 500ms (adjust if needed)
  this.lastTime = 0;
  // Spawn the first piece.
  this.currentPiece = this.createPiece();

  // Bind key events for controlling the game.
  this.keyHandler = this.handleKey.bind(this);
  document.addEventListener("keydown", this.keyHandler);
}

TetrisGame.prototype.createBoard = function () {
  const board = [];
  for (let y = 0; y < ROWS; y++) {
    board[y] = new Array(COLS).fill(0);
  }
  return board;
};

TetrisGame.prototype.createPiece = function () {
  const type = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
  const shape = SHAPES[type];
  return {
    matrix: shape,
    // Center the piece horizontally.
    x: Math.floor((COLS - shape[0].length) / 2),
    // Start the piece so that it is entirely above the board.
    y: -shape.length
  };
};

TetrisGame.prototype.drawMatrix = function (matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        this.ctx.fillStyle = COLORS[value];
        this.ctx.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        this.ctx.strokeStyle = 'black';
        this.ctx.strokeRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    });
  });
};

TetrisGame.prototype.drawBoard = function () {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (this.board[y][x] !== 0) {
        this.ctx.fillStyle = COLORS[this.board[y][x]];
        this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        this.ctx.strokeStyle = 'black';
        this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      } else {
        // Draw empty cell.
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
};

TetrisGame.prototype.mergePiece = function (piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0 && (y + piece.y) >= 0) {
        this.board[y + piece.y][x + piece.x] = value;
      }
    });
  });
};

TetrisGame.prototype.rotateMatrix = function (matrix) {
  const N = matrix.length;
  const result = [];
  for (let x = 0; x < N; x++) {
    result[x] = [];
    for (let y = 0; y < N; y++) {
      result[x][y] = matrix[N - 1 - y][x];
    }
  }
  return result;
};

TetrisGame.prototype.collide = function (board, piece) {
  const m = piece.matrix;
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (m[y][x] !== 0) {
        const boardY = y + piece.y;
        const boardX = x + piece.x;
        // Skip cells that are above the board.
        if (boardY < 0) continue;
        if (boardY >= ROWS || boardX < 0 || boardX >= COLS || board[boardY][boardX] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
};

TetrisGame.prototype.clearLines = function () {
  for (let y = ROWS - 1; y >= 0; y--) {
    if (this.board[y].every(val => val !== 0)) {
      this.board.splice(y, 1);
      this.board.unshift(new Array(COLS).fill(0));
      this.score += 10; // 10 points per cleared line.
      y++; // Re-check this row index after shifting.
    }
  }
};

// Check if any cell in the top row is occupied.
TetrisGame.prototype.checkGameOver = function () {
  return this.board[0].some(cell => cell !== 0);
};

TetrisGame.prototype.endGame = function () {
  cancelAnimationFrame(this.animationFrameId);
  document.removeEventListener("keydown", this.keyHandler);
  // Delay the confirm to ensure the animation loop is fully stopped.
  setTimeout(() => {
    if (confirm("Game Over! Click OK to restart.")) {
      if (this.score > this.highScore) {
        localStorage.setItem("tetrisHighScore", this.score);
        this.highScore = this.score;
      }
      this.resetGame();
      this.lastTime = performance.now();
      // Rebind the key handler since we removed it on game over.
      document.addEventListener("keydown", this.keyHandler);
      this.update();
    }
  }, 0);
};

TetrisGame.prototype.drop = function () {
  this.currentPiece.y++;
  if (this.collide(this.board, this.currentPiece)) {
    this.currentPiece.y--;
    this.mergePiece(this.currentPiece);
    this.clearLines();
    
    // Check if any blocks have reached the top.
    if (this.checkGameOver()) {
      this.endGame();
      return;
    }
    
    // Spawn a new piece.
    this.currentPiece = this.createPiece();
    if (this.collide(this.board, this.currentPiece)) {
      this.endGame();
      return;
    }
  }
  this.dropCounter = 0;
};

TetrisGame.prototype.resetGame = function () {
  this.board = this.createBoard();
  this.score = 0;
  this.dropCounter = 0;
  this.lastTime = performance.now();
  this.currentPiece = this.createPiece();
};

TetrisGame.prototype.handleKey = function (event) {
  if (this.gameOver) return;
  if (event.keyCode === 37) { // Left arrow.
    this.currentPiece.x--;
    if (this.collide(this.board, this.currentPiece)) {
      this.currentPiece.x++;
    }
  } else if (event.keyCode === 39) { // Right arrow.
    this.currentPiece.x++;
    if (this.collide(this.board, this.currentPiece)) {
      this.currentPiece.x--;
    }
  } else if (event.keyCode === 40) { // Down arrow (fast drop).
    this.drop();
  } else if (event.keyCode === 38) { // Up arrow (rotate).
    const oldMatrix = this.currentPiece.matrix;
    this.currentPiece.matrix = this.rotateMatrix(this.currentPiece.matrix);
    if (this.collide(this.board, this.currentPiece)) {
      // Revert rotation if collision occurs.
      this.currentPiece.matrix = oldMatrix;
    }
  }
};

TetrisGame.prototype.update = function (time = 0) {
  const deltaTime = time - this.lastTime;
  this.lastTime = time;
  this.dropCounter += deltaTime;
  if (this.dropCounter > this.dropInterval) {
    this.drop();
  }
  this.draw();
  // Update score displays in the overlay.
  document.getElementById("scoreDisplay").textContent = "Score: " + this.score;
  document.getElementById("highScoreDisplay").textContent = "High Score: " + Math.max(this.score, this.highScore);
  // Continue the game loop.
  this.animationFrameId = requestAnimationFrame(this.update.bind(this));
};

TetrisGame.prototype.draw = function () {
  // Clear the canvas.
  this.ctx.fillStyle = "#000";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  // Draw the locked board.
  this.drawBoard();
  // Draw the falling piece.
  this.drawMatrix(this.currentPiece.matrix, { x: this.currentPiece.x, y: this.currentPiece.y });
};

// Optional: Save the game state when the window is closed.
window.addEventListener("beforeunload", function () {
  if (window.currentTetrisGame) {
    if (window.currentTetrisGame.score > window.currentTetrisGame.highScore) {
      localStorage.setItem("tetrisHighScore", window.currentTetrisGame.score);
    }
  }
});


// =========================
// INITIALIZATION
// =========================
initializeTheme();
loadAllData();
