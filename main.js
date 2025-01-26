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

  addGrade(quarter, type, grade) {
    if (grade < 1 || grade > 12) return;
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
    const pa = this[`q${quarter}pa`];
    const sa = this[`q${quarter}sa`];
    const paAvg = pa.length ? pa.reduce((a, b) => a + b) / pa.length : 0;
    const saAvg = sa.length ? sa.reduce((a, b) => a + b) / sa.length : 0;
    this[`q${quarter}f`] = (paAvg * 0.45 + saAvg * 0.55).toFixed(1);
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
    // Semester 1: Q1 (40%) + Q2 (40%) + Midterm (20%)
    const s1 = (
      (Number(this.q1f || 0) * 0.4) +
      (Number(this.q2f || 0) * 0.4) +
      (Number(this.midterm || 0) * 0.2)
    ).toFixed(1);
    this.s1f = s1 > 0 ? s1 : null;

    // Semester 2: Q3 (40%) + Q4 (40%) + Final Test (20%)
    const s2 = (
      (Number(this.q3f || 0) * 0.4) +
      (Number(this.q4f || 0) * 0.4) +
      (Number(this.finals || 0) * 0.2)
    ).toFixed(1);
    this.s2f = s2 > 0 ? s2 : null;

    // Final Grade: 50% each semester
    this.final = [this.s1f, this.s2f].every(v => v) 
      ? ((Number(this.s1f) + Number(this.s2f)) / 2).toFixed(1)
      : null;
  }
}

let classes = [];
const classObjects = {};

function addClass(name) {
  if (!name) return;
  classes.push(name);
  const newOption = document.createElement("option");
  newOption.value = name;
  newOption.textContent = name;
  document.getElementById("classList").appendChild(newOption);
  classObjects[name] = new Class(name);
  viewClass(name);
}

function viewClass(name) {
  const cls = classObjects[name];
  if (!cls) return;

  for (let i = 1; i <= 4; i++) {
    updateGradeList(`q${i}pa`, cls[`q${i}pa`], i, 'pa');
    updateGradeList(`q${i}sa`, cls[`q${i}sa`], i, 'sa');
    document.getElementById(`q${i}f`).textContent = cls[`q${i}f`] || '-';
  }

  document.getElementById("m").textContent = cls.midterm || '-';
  document.getElementById("finals").textContent = cls.finals || '-';
  document.getElementById("s1f").textContent = cls.s1f || '-';
  document.getElementById("s2f").textContent = cls.s2f || '-';
  document.getElementById("final").textContent = cls.final || '-';
}

function updateGradeList(elementId, grades, quarter, type) {
  const container = document.getElementById(elementId);
  container.innerHTML = '';
  grades.forEach((grade, index) => {
    const div = document.createElement('div');
    div.className = 'grade-item';
    div.innerHTML = `${grade}<span class="remove-btn" onclick="removeGrade(${quarter}, '${type}', ${index})">×</span>`;
    container.appendChild(div);
  });
}

function getSelectedClass() {
  return document.getElementById("classList").value;
}

function addPA(quarter) {
  const className = getSelectedClass();
  const input = document.getElementById(`q${quarter}paInput`);
  if (!className || !input.value) return;
  classObjects[className].addGrade(quarter, 'pa', Number(input.value));
  input.value = "";
  viewClass(className);
}

function addSA(quarter) {
  const className = getSelectedClass();
  const input = document.getElementById(`q${quarter}saInput`);
  if (!className || !input.value) return;
  classObjects[className].addGrade(quarter, 'sa', Number(input.value));
  input.value = "";
  viewClass(className);
}

function removeGrade(quarter, type, index) {
  const className = getSelectedClass();
  classObjects[className].removeGrade(quarter, type, index);
  viewClass(className);
}

function setMidtermGrade() {
  const className = getSelectedClass();
  const input = document.getElementById("mInput");
  if (!className || !input.value) return;
  classObjects[className].setMidterm(Number(input.value));
  input.value = "";
  viewClass(className);
}

function setTestGrade() {
  const className = getSelectedClass();
  const input = document.getElementById("fInput");
  if (!className || !input.value) return;
  classObjects[className].setFinalTest(Number(input.value));
  input.value = "";
  viewClass(className);
}

// Dark Mode Functions
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

// Initialize App
initializeTheme();
